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
import { revalidatePath } from 'next/cache';
import { QuoteConfigService } from '@/services/quote-config.service';
import {
  createQuoteItemSchema,
  updateQuoteItemSchema,
  deleteQuoteItemSchema,
  reorderQuoteItemsSchema,
} from './schema';
import { calculateSubtotal, updateQuoteTotal } from './shared-helpers';
import {
  CurtainCalculator,
  WallpaperCalculator,
  type CurtainFormula,
  type WallpaperFormula,
} from '../logic/calculator';
import { SizeValidator } from '../logic/size-validator';
import { AccessoryLinkageService } from '../services/accessory-linkage.service';

// ─── 创建行项目 ─────────────────────────────────

const createQuoteItemActionInternal = createSafeAction(
  createQuoteItemSchema,
  async (data, context) => {
    const tenantId = context.session.user.tenantId;
    if (!tenantId) throw new Error('未授权访问：缺少租户信息');

    // 安全检查：验证关联报价单归属
    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, data.quoteId), eq(quotes.tenantId, tenantId)),
      columns: { id: true, tenantId: true, createdBy: true },
    });
    if (!quote) throw new Error('报价单不存在或无权操作');

    let quantity = data.quantity;
    let warnings: string[] = [];
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

    // 计算逻辑
    if (data.category === 'CURTAIN' && data.width && data.height) {
      const calcParams = {
        measuredWidth: data.width,
        measuredHeight: data.height,
        foldRatio: data.foldRatio || presetLoss.curtain.defaultFoldRatio || 2,
        fabricWidth: (attributes.fabricWidth as number) || 280,
        formula: ((attributes.formula as string) || 'FIXED_HEIGHT') as CurtainFormula,
        sideLoss: (attributes.sideLoss as number) ?? presetLoss.curtain.sideLoss,
        bottomLoss: (attributes.bottomLoss as number) ?? presetLoss.curtain.bottomLoss,
        headerLoss: (attributes.headerLoss as number) ?? presetLoss.curtain.headerLoss,
      };
      const result = CurtainCalculator.calculate(calcParams);
      quantity = result.quantity;
      if (result.warnings.length) warnings = result.warnings;

      // 存储超高预警标志和替代方案
      if (result.heightOverflow && result.alternatives) {
        attributes._heightOverflow = true;
        attributes._alternatives = result.alternatives;
      }
    } else if (
      (data.category === 'WALLPAPER' || data.category === 'WALLCLOTH') &&
      data.width &&
      data.height
    ) {
      const calcParams = {
        measuredWidth: data.width,
        measuredHeight: data.height,
        productWidth:
          (attributes.fabricWidth as number) || (data.category === 'WALLPAPER' ? 53 : 280),
        rollLength: (attributes.rollLength as number) || 1000,
        patternRepeat: (attributes.patternRepeat as number) || 0,
        formula: (data.category === 'WALLPAPER' ? 'WALLPAPER' : 'WALLCLOTH') as WallpaperFormula,
        widthLoss: (attributes.widthLoss as number) ?? presetLoss.wallpaper.widthLoss,
        cutLoss: (attributes.cutLoss as number) ?? presetLoss.wallpaper.cutLoss,
      };
      const result = WallpaperCalculator.calculate(calcParams);
      quantity = result.quantity;
      if (result.warnings.length) warnings = result.warnings;
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

    await updateQuoteTotal(data.quoteId);

    // 自动配件联动
    if (newItem && (data.category === 'CURTAIN' || data.category === 'WALLPAPER')) {
      const recommendations = await AccessoryLinkageService.getRecommendedAccessories({
        category: data.category,
        width: Number(data.width || 0),
        height: Number(data.height || 0),
      });

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
    }

    revalidatePath(`/quotes/${data.quoteId}`);
    return newItem;
  }
);

export async function createQuoteItem(params: z.infer<typeof createQuoteItemSchema>) {
  return createQuoteItemActionInternal(params);
}

// ─── 更新行项目 ─────────────────────────────────

export const updateQuoteItem = createSafeAction(updateQuoteItemSchema, async (data, context) => {
  const userTenantId = context.session.user.tenantId;
  if (!userTenantId) throw new Error('未授权访问：缺少租户信息');

  const { id, productId, productName: productNameFromUI, ...updateData } = data;

  // 安全检查：校验明细项归属
  const existing = await db.query.quoteItems.findFirst({
    where: and(eq(quoteItems.id, id), eq(quoteItems.tenantId, userTenantId)),
  });

  if (!existing) throw new Error('行项目不存在或无权操作');

  // 从现有项目初始化变量
  const category = existing.category;
  const width = updateData.width ?? Number(existing.width);
  const height = updateData.height ?? Number(existing.height);
  const foldRatio = updateData.foldRatio ?? Number(existing.foldRatio) ?? 2;
  const attributes = { ...((existing.attributes as Record<string, unknown>) || {}) };
  let unitPrice = Number(existing.unitPrice);
  let productName = existing.productName;

  let quantity = updateData.quantity ?? Number(existing.quantity);
  let warnings: string[] = [];

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

  // 尺寸变化时触发重新计算
  if (category === 'CURTAIN' && width && height) {
    const calcParams = {
      measuredWidth: width,
      measuredHeight: height,
      foldRatio: foldRatio,
      fabricWidth: (mergedAttributes.fabricWidth as number) || 280,
      formula: ((mergedAttributes.formula as string) || 'FIXED_HEIGHT') as CurtainFormula,
      sideLoss: (mergedAttributes.sideLoss as number) ?? presetLoss.curtain.sideLoss,
      bottomLoss: (mergedAttributes.bottomLoss as number) ?? presetLoss.curtain.bottomLoss,
      headerLoss: (mergedAttributes.headerLoss as number) ?? presetLoss.curtain.headerLoss,
    };
    const result = CurtainCalculator.calculate(calcParams);
    quantity = result.quantity;
    if (result.warnings.length) warnings = result.warnings;
  } else if ((category === 'WALLPAPER' || category === 'WALLCLOTH') && width && height) {
    const calcParams = {
      measuredWidth: width,
      measuredHeight: height,
      productWidth:
        (mergedAttributes.fabricWidth as number) || (category === 'WALLPAPER' ? 53 : 280),
      rollLength: (mergedAttributes.rollLength as number) || 1000,
      patternRepeat: (mergedAttributes.patternRepeat as number) || 0,
      formula: (category === 'WALLPAPER' ? 'WALLPAPER' : 'WALLCLOTH') as WallpaperFormula,
      widthLoss: (mergedAttributes.widthLoss as number) ?? presetLoss.wallpaper.widthLoss,
      cutLoss: (mergedAttributes.cutLoss as number) ?? presetLoss.wallpaper.cutLoss,
    };
    const result = WallpaperCalculator.calculate(calcParams);
    quantity = result.quantity;
    if (result.warnings.length) warnings = result.warnings;
  }

  const finalUnitPrice = updateData.unitPrice !== undefined ? updateData.unitPrice : unitPrice;
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
    .where(eq(quoteItems.id, id));

  await updateQuoteTotal(existing.quoteId);

  revalidatePath(`/quotes/${existing.quoteId}`);
  return { success: true };
});

// ─── 删除行项目 ─────────────────────────────────

export const deleteQuoteItem = createSafeAction(deleteQuoteItemSchema, async (data, context) => {
  const userTenantId = context.session.user.tenantId;

  // 安全检查：验证行项目属于当前租户
  const existing = await db.query.quoteItems.findFirst({
    where: and(eq(quoteItems.id, data.id), eq(quoteItems.tenantId, userTenantId)),
  });
  if (!existing) return { success: false, error: '行项目不存在或无权操作' };

  await db
    .delete(quoteItems)
    .where(and(eq(quoteItems.id, data.id), eq(quoteItems.tenantId, userTenantId)));
  await updateQuoteTotal(existing.quoteId);

  revalidatePath(`/quotes/${existing.quoteId}`);
  return { success: true };
});

// ─── 排序行项目 ─────────────────────────────────

export const reorderQuoteItems = createSafeAction(
  reorderQuoteItemsSchema,
  async (data, context) => {
    const userTenantId = context.session.user.tenantId;
    if (!userTenantId) throw new Error('未授权访问：缺少租户信息');

    // 安全检查：验证报价单归属
    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, data.quoteId), eq(quotes.tenantId, userTenantId)),
      columns: { id: true },
    });
    if (!quote) throw new Error('报价单不存在或无权操作');

    // 批量更新排序
    await db.transaction(async (tx) => {
      for (const item of data.items) {
        await tx
          .update(quoteItems)
          .set({ sortOrder: item.sortOrder })
          .where(and(eq(quoteItems.id, item.id), eq(quoteItems.tenantId, userTenantId)));
      }
    });

    revalidatePath(`/quotes/${data.quoteId}`);
    return { success: true };
  }
);
