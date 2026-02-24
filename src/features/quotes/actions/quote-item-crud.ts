'use server';

/**
 * 报价单行项目 CRUD 操作
 * 包含：创建行项目、更新行项目、删除行项目、排序行项目
 */

import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { db } from '@/shared/api/db';
import { quotes, quoteItems } from '@/shared/api/schema/quotes';
import { products } from '@/shared/api/schema/catalogs';
import { eq, and } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';
import { QuoteConfigService } from '@/services/quote-config.service';
import {
  createQuoteItemSchema,
  updateQuoteItemSchema,
  deleteQuoteItemSchema,
  reorderQuoteItemsSchema,
} from './schema';
import { updateQuoteTotal } from './shared-helpers';
import { StrategyFactory } from '../calc-strategies/strategy-factory';
import { AccessoryLinkageService } from '../services/accessory-linkage.service';
import { AuditService } from '@/shared/lib/audit-service';
import { SizeValidator } from '@/shared/lib/validators';
import { logger } from '@/shared/lib/logger';
import Decimal from 'decimal.js';

// --- 内部辅助函数 ---
const calculateSubtotal = (price: number, quantity: number, processFee: number = 0) => {
  return Number(new Decimal(price).mul(quantity).add(processFee).toFixed(2));
};

// ─── 创建行项目 ─────────────────────────────────

/**
 * 客户端调用：创建报价单行项目 (Create Quote Item)
 * 支持产品自动填充（ unitPrice, specs ）、损耗逻辑计算、尺寸合理性校验，
 * 以及自动配件联动（ Accessory Linkage ）。
 * 
 * @param params 行项目请求参数，包括所属报价单、产品、尺寸等
 * @returns 创建的行项目记录（可能包含警告信息及计算明细）
 */
export async function createQuoteItem(params: z.infer<typeof createQuoteItemSchema>) {
  return createQuoteItemActionInternal(params);
}

/**
 * 内部服务器操作：创建报价单行项目
 * @param data 行项目请求参数，包括所属报价单、产品、尺寸等
 * @param context 执行上下文，包含用户会话信息
 * @returns 创建的行项目记录（可能包含警告信息和计算详细数据）
 * @throws 缺少租户或无权操作时抛出错误
 */
const createQuoteItemActionInternal = createSafeAction(
  createQuoteItemSchema,
  async (data, context) => {
    const tenantId = context.session.user.tenantId;
    if (!tenantId) {
      logger.error('未授权访问：缺少租户信息');
      throw new Error('未授权访问：缺少租户信息');
    }
    logger.info('[quotes] 开始创建行项目', { quoteId: data.quoteId, productName: data.productName, category: data.category });

    // 安全检查：验证关联报价单归属
    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, data.quoteId), eq(quotes.tenantId, tenantId)),
      columns: { id: true, tenantId: true, createdBy: true },
    });
    if (!quote) {
      logger.warn('报价单不存在或无权操作', { quoteId: data.quoteId, tenantId });
      throw new Error('报价单不存在或无权操作');
    }

    let quantity = data.quantity;
    const warnings: string[] = [];
    let currentUnitPrice = data.unitPrice;
    let currentProductName = data.productName;
    const attributes = { ...((data.attributes as Record<string, unknown>) || {}) };

    // 产品自动填充逻辑
    if (data.productId) {
      const product = await db.query.products.findFirst({
        where: eq(products.id, data.productId),
      });

      if (product) {
        // 尝试在产品库中查找默认配件产品
        if (product.unitPrice && !data.unitPrice) currentUnitPrice = Number(product.unitPrice);
        if (!data.productName) currentProductName = product.name;

        // 从产品规格中填充属性
        const specs = (product.specs as Record<string, unknown>) || {};
        const mutableAttrs = attributes as Record<string, unknown>;
        if (specs.fabricWidth && mutableAttrs.fabricWidth === undefined)
          mutableAttrs.fabricWidth = specs.fabricWidth;
        if (specs.rollLength && mutableAttrs.rollLength === undefined)
          mutableAttrs.rollLength = specs.rollLength;
        if (specs.patternRepeat && mutableAttrs.patternRepeat === undefined)
          mutableAttrs.patternRepeat = specs.patternRepeat;
        if (specs.material && mutableAttrs.material === undefined)
          mutableAttrs.material = specs.material;
      }
    }

    // 获取损耗配置
    const config = await QuoteConfigService.getMergedConfig(
      quote.tenantId,
      quote.createdBy || '00000000-0000-0000-0000-000000000000'
    );
    const { presetLoss } = config;

    // P1-R6-01: Migrated to StrategyFactory for unified calculation logic
    if (data.width && data.height && (data.category === 'CURTAIN' || data.category === 'WALLPAPER' || data.category === 'WALLCLOTH')) {
      // Common setup
      const strategy = StrategyFactory.getStrategy(data.category);
      const fabricWidthCm = (attributes.fabricWidth as number) || (data.category === 'CURTAIN' ? 280 : 53);

      const calcParams: Record<string, unknown> = {
        measuredWidth: Number(data.width),
        measuredHeight: Number(data.height),
        unitPrice: currentUnitPrice,
        fabricWidth: fabricWidthCm / 100, // Convert cm to m for Strategy
        // Curtain specifics
        foldRatio: Number(data.foldRatio || presetLoss.curtain.defaultFoldRatio || 2),
        fabricType: attributes.formula || 'FIXED_HEIGHT',
        headerType: attributes.headerType || 'WRAPPED',
        openingType: attributes.openingType || 'DOUBLE',
        sideLoss: (attributes.sideLoss as number) ?? presetLoss.curtain.sideLoss,
        bottomLoss: (attributes.bottomLoss as number) ?? presetLoss.curtain.bottomLoss,
        headerLoss: (attributes.headerLoss as number) ?? presetLoss.curtain.headerLoss,
        // Wallpaper specifics
        rollLength: (attributes.rollLength as number) || 10,
        patternRepeat: (attributes.patternRepeat as number) || 0,
        widthLoss: (attributes.widthLoss as number) ?? presetLoss.wallpaper.widthLoss,
        cutLoss: (attributes.cutLoss as number) ?? presetLoss.wallpaper.cutLoss,
        calcType: data.category // For WallpaperStrategy (WALLPAPER vs WALLCLOTH)
      };

      const result = strategy.calculate(calcParams);
      quantity = result.usage;

      // Handle details and warnings
      if (result.details) {
        attributes.calcResult = result.details;
        if (result.details?.warning) {
          warnings.push(String(result.details.warning));
        }
      }
    }

    // 尺寸合理性校验
    if (data.width && data.height) {
      const sizeValidation = SizeValidator.validate(data.width, data.height);
      if (sizeValidation.messages.length > 0) {
        warnings.push(...sizeValidation.messages);
      }
    }

    // 存储预警信息
    const finalAttributes =
      warnings.length > 0 ? { ...attributes, _warnings: warnings } : attributes;

    const [newItem] = await db
      .insert(quoteItems)
      .values({
        ...data,
        productName: currentProductName,
        unitPrice: currentUnitPrice.toString(),
        quantity: quantity.toString(),
        subtotal: calculateSubtotal(currentUnitPrice, quantity, data.processFee || 0).toString(),
        width: data.width?.toString(),
        height: data.height?.toString(),
        foldRatio: data.foldRatio?.toString(),
        processFee: data.processFee?.toString(),
        attributes: finalAttributes,
        tenantId,
      })
      .returning();

    await updateQuoteTotal(data.quoteId, context.session.user.tenantId);

    // 自动配件联动
    if (newItem && (data.category === 'CURTAIN' || data.category === 'WALLPAPER')) {
      const recommendations = await AccessoryLinkageService.getRecommendedAccessories({
        category: data.category,
        width: Number(data.width || 0),
        height: Number(data.height || 0),
      }, tenantId);

      for (const rec of recommendations) {
        const recPrice = rec.unitPrice ?? 0;
        await db.insert(quoteItems).values({
          quoteId: data.quoteId,
          roomId: data.roomId,
          tenantId,
          category: rec.category,
          productId: rec.productId,
          productName: rec.productName,
          unitPrice: recPrice.toString(),
          quantity: rec.quantity.toString(),
          subtotal: (recPrice * rec.quantity).toString(),
          attributes: { _isAutoRecommended: true, remark: rec.remark },
        });
      }
      // 配件插入后重新计算总额（确保配件金额包含在内）
      await updateQuoteTotal(data.quoteId, tenantId);
    }

    // 审计日志：记录行项目创建
    await AuditService.recordFromSession(context.session, 'quoteItems', newItem.id, 'CREATE', {
      new: { quoteId: data.quoteId, category: data.category, productName: currentProductName, quantity },
    });

    revalidatePath(`/quotes/${data.quoteId}`);
    revalidateTag('quotes', 'default');
    logger.info('[quotes] 行项目创建成功', { itemId: newItem.id, quoteId: data.quoteId });
    return newItem;
  }
);


// ─── 更新行项目 ─────────────────────────────────

/**
 * 客户端调用：更新报价单行项目 (Update Quote Item)
 * 核心逻辑：
 * 1. 重新执行产品数据自动同步。
 * 2. 依据最新的计算策略（Curtain/Wallpaper）重新计算用量。
 * 3. 校验尺寸合理性并更新关联报价单总额。
 * 
 * @param params - 包含行项目 ID 及更新字段的对象
 * @returns 成功状态
 */
export async function updateQuoteItemAction(params: z.infer<typeof updateQuoteItemSchema>) {
  return updateQuoteItem(params);
}
/**
 * 更新报价单行项目，重新执行计算逻辑并自动维护关联属性
 * @param data 包含要更新属性的对象（含行项目ID）
 * @param context 执行上下文，用于安全检查和审计日志
 * @returns 包含成功状态的响应
 */
export const updateQuoteItem = createSafeAction(updateQuoteItemSchema, async (data, context) => {
  const userTenantId = context.session.user.tenantId;
  if (!userTenantId) {
    logger.error('未授权访问：缺少租户信息');
    throw new Error('未授权访问：缺少租户信息');
  }
  logger.info('[quotes] 开始更新行项目', { itemId: data.id });

  const { id, productId, productName: productNameFromUI, ...updateData } = data;

  // 安全检查：校验明细项归属
  const existing = await db.query.quoteItems.findFirst({
    where: and(eq(quoteItems.id, id), eq(quoteItems.tenantId, userTenantId)),
  });

  if (!existing) {
    logger.warn('行项目不存在或无权操作', { itemId: id, tenantId: userTenantId });
    throw new Error('行项目不存在或无权操作');
  }

  // 从现有项目初始化变量
  const category = existing.category;
  const width = updateData.width ?? Number(existing.width);
  const height = updateData.height ?? Number(existing.height);
  const foldRatio = updateData.foldRatio ?? Number(existing.foldRatio) ?? 2;
  const attributes = { ...((existing.attributes as Record<string, unknown>) || {}) };
  let unitPrice = Number(existing.unitPrice);
  let productName = existing.productName;

  let quantity = updateData.quantity ?? Number(existing.quantity);
  const warnings: string[] = [];

  // 产品自动填充逻辑
  const currentProductId = productId ?? existing.productId;
  if (currentProductId) {
    const product = await db.query.products.findFirst({
      where: eq(products.id, currentProductId),
    });

    if (product) {
      if (updateData.unitPrice === undefined && product.unitPrice)
        unitPrice = Number(product.unitPrice);
      if (productNameFromUI === undefined) productName = product.name;

      const specs = (product.specs as Record<string, unknown>) || {};
      const updateAttrs = (updateData.attributes as Record<string, unknown>) || {};

      const mutableAttrs = attributes as Record<string, unknown>;
      if (
        specs.fabricWidth &&
        mutableAttrs.fabricWidth === undefined &&
        updateAttrs.fabricWidth === undefined
      )
        mutableAttrs.fabricWidth = specs.fabricWidth;
      if (
        specs.rollLength &&
        mutableAttrs.rollLength === undefined &&
        updateAttrs.rollLength === undefined
      )
        mutableAttrs.rollLength = specs.rollLength;
      if (
        specs.patternRepeat &&
        mutableAttrs.patternRepeat === undefined &&
        updateAttrs.patternRepeat === undefined
      )
        mutableAttrs.patternRepeat = specs.patternRepeat;
      if (
        specs.material &&
        mutableAttrs.material === undefined &&
        updateAttrs.material === undefined
      )
        mutableAttrs.material = specs.material;
    }
  }

  // 合并属性（显式覆盖优先）
  const mergedAttributes = {
    ...attributes,
    ...((updateData.attributes as Record<string, unknown>) || {}),
  };

  // 获取损耗配置
  const quote = await db.query.quotes.findFirst({
    where: eq(quotes.id, existing.quoteId),
    columns: { tenantId: true, createdBy: true },
  });
  const config = await QuoteConfigService.getMergedConfig(
    quote?.tenantId || '00000000-0000-0000-0000-000000000000',
    quote?.createdBy || '00000000-0000-0000-0000-000000000000'
  );
  const { presetLoss } = config;

  const finalUnitPrice = updateData.unitPrice !== undefined ? updateData.unitPrice : unitPrice;

  // P1-R6-01: Migrated to StrategyFactory for unified calculation logic
  if (width && height && (category === 'CURTAIN' || category === 'WALLPAPER' || category === 'WALLCLOTH')) {
    const strategy = StrategyFactory.getStrategy(category);
    const fabricWidthCm = (mergedAttributes.fabricWidth as number) || (category === 'CURTAIN' ? 280 : 53);

    const calcParams: Record<string, unknown> = {
      measuredWidth: Number(width),
      measuredHeight: Number(height),
      unitPrice: Number(finalUnitPrice),
      fabricWidth: fabricWidthCm / 100, // Convert cm to m
      // Curtain specifics
      foldRatio: Number(foldRatio),
      fabricType: mergedAttributes.formula || 'FIXED_HEIGHT',
      headerType: mergedAttributes.headerType || 'WRAPPED',
      openingType: mergedAttributes.openingType || 'DOUBLE',
      sideLoss: (mergedAttributes.sideLoss as number) ?? presetLoss.curtain.sideLoss,
      bottomLoss: (mergedAttributes.bottomLoss as number) ?? presetLoss.curtain.bottomLoss,
      headerLoss: (mergedAttributes.headerLoss as number) ?? presetLoss.curtain.headerLoss,
      // Wallpaper specifics
      rollLength: (mergedAttributes.rollLength as number) || 10,
      patternRepeat: (mergedAttributes.patternRepeat as number) || 0,
      widthLoss: (mergedAttributes.widthLoss as number) ?? presetLoss.wallpaper.widthLoss,
      cutLoss: (mergedAttributes.cutLoss as number) ?? presetLoss.wallpaper.cutLoss,
      calcType: category
    };

    const result = strategy.calculate(calcParams);
    quantity = result.usage;

    if (result.details) {
      (mergedAttributes as Record<string, unknown>).calcResult = result.details;
      if (result.details?.warning) {
        warnings.push(String(result.details.warning));
      }
    }
  }
  const fee = updateData.processFee ?? Number(existing.processFee || 0);
  const subtotal = calculateSubtotal(finalUnitPrice, quantity, fee);

  // 尺寸合理性校验
  if (width && height) {
    const sizeValidation = SizeValidator.validate(width, height);
    if (sizeValidation.messages.length > 0) {
      warnings.push(...sizeValidation.messages);
    }
  }

  const finalAttributes =
    warnings.length > 0 ? { ...mergedAttributes, _warnings: warnings } : mergedAttributes;

  await db
    .update(quoteItems)
    .set({
      ...updateData,
      productId: productId ?? existing.productId,
      productName: productNameFromUI ?? productName,
      unitPrice: finalUnitPrice.toString(),
      quantity: quantity.toString(),
      width: width.toString(),
      height: height.toString(),
      foldRatio: foldRatio.toString(),
      processFee: fee.toString(),
      subtotal: subtotal.toString(),
      attributes: finalAttributes,
    })
    .where(and(eq(quoteItems.id, id), eq(quoteItems.tenantId, userTenantId)));

  await updateQuoteTotal(existing.quoteId, userTenantId);

  // 审计日志：记录行项目更新
  await AuditService.recordFromSession(context.session, 'quoteItems', id, 'UPDATE', {
    old: { unitPrice: existing.unitPrice, quantity: existing.quantity },
    new: { unitPrice: finalUnitPrice.toString(), quantity: quantity.toString() },
  });

  revalidatePath(`/quotes/${existing.quoteId}`);
  revalidateTag('quotes', 'default');
  return { success: true };
});

// ─── 删除行项目 ─────────────────────────────────

/**
 * 客户端调用：删除报价单行项目 (Delete Quote Item)
 * 包含：行项目归属校验、物理删除（及总额自动更新）、审计日志记录。
 * 
 * @param params - 包含行项目 ID 的对象
 * @returns 成功状态
 */
export async function deleteQuoteItemAction(params: z.infer<typeof deleteQuoteItemSchema>) {
  return deleteQuoteItem(params);
}
/**
 * 软删除指定的报价单行项目，并更新所属报价单的总金额
 * @param data 包含行项目ID的对象
 * @param context 执行上下文，用于安全检查和审计日志
 * @returns 包含成功状态的响应
 */
export const deleteQuoteItem = createSafeAction(deleteQuoteItemSchema, async (data, context) => {
  const userTenantId = context.session.user.tenantId;
  logger.info('[quotes] 开始删除行项目', { itemId: data.id });

  // 安全检查：验证行项目属于当前租户
  const existing = await db.query.quoteItems.findFirst({
    where: and(eq(quoteItems.id, data.id), eq(quoteItems.tenantId, userTenantId)),
  });
  if (!existing) {
    logger.warn('行项目不存在或无权操作', { itemId: data.id, tenantId: userTenantId });
    return { success: false, error: '行项目不存在或无权操作' };
  }

  // 审计日志：记录行项目删除（删除前记录）
  await AuditService.recordFromSession(context.session, 'quoteItems', data.id, 'DELETE', {
    old: { quoteId: existing.quoteId, productName: existing.productName, quantity: existing.quantity },
  });

  await db
    .delete(quoteItems)
    .where(and(eq(quoteItems.id, data.id), eq(quoteItems.tenantId, userTenantId)));
  await updateQuoteTotal(existing.quoteId, userTenantId);

  revalidatePath(`/quotes/${existing.quoteId}`);
  revalidateTag('quotes', 'default');
  return { success: true };
});

// ─── 排序行项目 ─────────────────────────────────

/**
 * 客户端调用：对报价单内的行项目进行批量排序 (Reorder Items)
 * 逻辑：在数据库事务中批量更新 `sortOrder` 字段。
 * 
 * @param params - 包含报价单 ID 及重新排序的项目列表
 * @returns 操作结果
 */
export async function reorderQuoteItemsAction(params: z.infer<typeof reorderQuoteItemsSchema>) {
  return reorderQuoteItems(params);
}
/**
 * 批量更新行项目的显示顺位信息
 * @param data 包含报价单ID及需重新排序的行项目ID和新排序号的列表
 * @param context 执行上下文，用于安全检查
 * @returns 包含成功状态的响应
 */
export const reorderQuoteItems = createSafeAction(
  reorderQuoteItemsSchema,
  async (data, context) => {
    const userTenantId = context.session.user.tenantId;
    if (!userTenantId) {
      logger.error('未授权访问：缺少租户信息');
      throw new Error('未授权访问：缺少租户信息');
    }
    logger.info('[quotes] 开始对行项目排序', { quoteId: data.quoteId, itemCount: data.items.length });

    // 安全检查：验证报价单归属
    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, data.quoteId), eq(quotes.tenantId, userTenantId)),
      columns: { id: true },
    });
    if (!quote) {
      logger.warn('报价单不存在或无权操作', { quoteId: data.quoteId, tenantId: userTenantId });
      throw new Error('报价单不存在或无权操作');
    }

    // 批量更新排序
    await db.transaction(async (tx) => {
      for (const item of data.items) {
        await tx
          .update(quoteItems)
          .set({ sortOrder: item.sortOrder })
          .where(and(eq(quoteItems.id, item.id), eq(quoteItems.tenantId, userTenantId)));
      }
    });

    // 审计日志：记录行项目重新排序
    await AuditService.recordFromSession(context.session, 'quotes', data.quoteId, 'UPDATE', {
      new: { action: 'REORDER_ITEMS', itemCount: data.items.length },
    });

    revalidatePath(`/quotes/${data.quoteId}`);
    revalidateTag('quotes', 'default');
    logger.info('[quotes] 行项目排序完成', { quoteId: data.quoteId });
    return { success: true };
  }
);
