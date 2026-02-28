'use server';

import { z } from 'zod';
import { db } from '@/shared/api/db';
import { products } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath } from 'next/cache';
import { AuditService } from '@/shared/services/audit-service';
import {
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  activateProductSchema,
} from '../schema';

/**
 * 创建产品
 *
 * @description 校验 SKU 在当前租户下的唯一性后插入新产品记录，
 *   同时写入审计日志并刷新产品列表缓存路径。
 *
 * @param data - 符合 `createProductSchema` 的完整产品数据
 * @returns 包含新创建产品 ID 的对象 `{ id: string }`
 * @throws 当 SKU 已存在时抛出 `SKU 已存在` 错误
 * @throws 当用户缺少 `PRODUCTS.MANAGE` 权限时抛出权限异常
 */
const createProductActionInternal = createSafeAction(
  createProductSchema,
  async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    // 检查 SKU 唯一性
    const existing = await db.query.products.findFirst({
      where: and(eq(products.tenantId, session.user!.tenantId), eq(products.sku, data.sku)),
    });

    if (existing) {
      throw new Error('SKU 已存在');
    }

    const [product] = await db
      .insert(products)
      .values({
        tenantId: session.user!.tenantId,
        sku: data.sku,
        name: data.name,
        category: data.category,
        productType: data.productType,
        unit: data.unit,

        // 价格维度
        purchasePrice: data.purchasePrice.toString(),
        logisticsCost: data.logisticsCost.toString(),
        processingCost: data.processingCost.toString(),
        lossRate: data.lossRate.toString(),
        retailPrice: data.retailPrice.toString(),
        // [Refactor] 移除渠道相关字段
        // channelPriceMode: data.channelPriceMode,
        // channelPrice: data.channelPrice.toString(),
        // channelDiscountRate: data.channelDiscountRate.toString(),
        floorPrice: data.floorPrice.toString(),

        isToBEnabled: data.isToBEnabled,
        isToCEnabled: data.isToCEnabled,
        defaultSupplierId: data.defaultSupplierId,
        isStockable: data.isStockable,
        specs: data.attributes || {},
        description: data.description,
        createdBy: session.user!.id,
      })
      .returning();

    await AuditService.log(db, {
      tenantId: session.user!.tenantId,
      userId: session.user!.id!,
      tableName: 'products',
      recordId: product.id,
      action: 'CREATE',
      newValues: product,
    });

    revalidatePath('/supply-chain/products');
    return { id: product.id };
  }
);

export async function createProduct(params: z.infer<typeof createProductSchema>) {
  return createProductActionInternal(params);
}

/**
 * 更新产品
 *
 * @description 根据产品 ID 与租户 ID 定位目标记录并执行局部更新，
 *   同时写入审计日志（含新旧值）并刷新缓存。
 *
 * @param data - 符合 `updateProductSchema` 的部分更新数据（必含 id）
 * @returns 包含更新后产品 ID 的对象 `{ id: string }`
 * @throws 当产品未找到时抛出 `更新失败，产品未找到` 错误
 * @throws 当用户缺少 `PRODUCTS.MANAGE` 权限时抛出权限异常
 */
const updateProductActionInternal = createSafeAction(
  updateProductSchema,
  async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    const { id, ...updates } = data;

    const [product] = await db
      .update(products)
      .set({
        name: updates.name,
        sku: updates.sku,
        category: updates.category,
        productType: updates.productType,
        unit: updates.unit,

        // 价格与逻辑字段
        purchasePrice: updates.purchasePrice?.toString(),
        logisticsCost: updates.logisticsCost?.toString(),
        processingCost: updates.processingCost?.toString(),
        lossRate: updates.lossRate?.toString(),
        retailPrice: updates.retailPrice?.toString(),
        // [Refactor] 移除渠道相关字段
        // channelPriceMode: updates.channelPriceMode,
        // channelPrice: updates.channelPrice?.toString(),
        // channelDiscountRate: updates.channelDiscountRate?.toString(),
        floorPrice: updates.floorPrice?.toString(),

        isToBEnabled: updates.isToBEnabled,
        isToCEnabled: updates.isToCEnabled,
        defaultSupplierId: updates.defaultSupplierId,
        isStockable: updates.isStockable,
        specs: updates.attributes,
        description: updates.description,
        updatedAt: new Date(),
      })
      .where(and(eq(products.id, id), eq(products.tenantId, session.user.tenantId)))
      .returning();

    if (!product) throw new Error('更新失败，产品未找到');

    await AuditService.log(db, {
      tenantId: session.user!.tenantId,
      userId: session.user!.id!,
      tableName: 'products',
      recordId: id,
      action: 'UPDATE',
      newValues: product,
      oldValues: { id },
    });

    revalidatePath('/supply-chain/products');
    return { id: product.id };
  }
);

export async function updateProduct(params: z.infer<typeof updateProductSchema>) {
  return updateProductActionInternal(params);
}

/**
 * 删除产品
 *
 * @description 根据产品 ID 与租户 ID 执行硬删除操作，
 *   同时写入审计日志并刷新缓存。
 *
 * @param params - 包含产品 `id` 的删除参数
 * @returns `{ success: true }`
 * @throws 当用户缺少 `PRODUCTS.MANAGE` 权限时抛出权限异常
 */
const deleteProductActionInternal = createSafeAction(
  deleteProductSchema,
  async ({ id }, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    await db
      .delete(products)
      .where(and(eq(products.id, id), eq(products.tenantId, session.user.tenantId)));

    await AuditService.log(db, {
      tenantId: session.user!.tenantId,
      userId: session.user!.id!,
      tableName: 'products',
      recordId: id,
      action: 'DELETE',
      oldValues: { id },
    });

    revalidatePath('/supply-chain/products');
    return { success: true };
  }
);

export async function deleteProduct(params: z.infer<typeof deleteProductSchema>) {
  return deleteProductActionInternal(params);
}

/**
 * 上架/下架产品
 *
 * @description 切换产品的 `isActive` 状态（上架/下架），
 *   审计日志中会记录具体的操作类型 (ACTIVATE / DEACTIVATE)。
 *
 * @param params - 包含产品 `id` 和目标 `isActive` 布尔值
 * @returns `{ success: true }`
 * @throws 当用户缺少 `PRODUCTS.MANAGE` 权限时抛出权限异常
 */
const activateProductActionInternal = createSafeAction(
  activateProductSchema,
  async ({ id, isActive }, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    await db
      .update(products)
      .set({ isActive, updatedAt: new Date() })
      .where(and(eq(products.id, id), eq(products.tenantId, session.user.tenantId)));

    await AuditService.log(db, {
      tenantId: session.user!.tenantId,
      userId: session.user!.id!,
      tableName: 'products',
      recordId: id,
      action: 'UPDATE',
      newValues: { isActive },
      details: { action: isActive ? 'ACTIVATE' : 'DEACTIVATE' },
    });

    revalidatePath('/supply-chain/products');
    return { success: true };
  }
);

export async function activateProduct(params: z.infer<typeof activateProductSchema>) {
  return activateProductActionInternal(params);
}

/**
 * 批量创建产品
 *
 * @description 接收产品数组，逐条执行 SKU 唯一性校验与插入操作。
 *   每条成功均写入审计日志，失败则归集到错误列表中。
 *   适用于 Excel 批量导入场景。
 *
 * @param items - `createProductSchema` 数组
 * @returns `{ successCount, errorCount, errors[] }` 汇总对象
 * @throws 当用户缺少 `PRODUCTS.MANAGE` 权限时抛出权限异常
 */
const batchCreateProductsSchema = z.array(createProductSchema);

const batchCreateProductsActionInternal = createSafeAction(
  batchCreateProductsSchema,
  async (items, { session }) => {
    // ... (implementation same as before)
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);
    const tenantId = session.user!.tenantId;
    const userId = session.user!.id;

    const results = {
      successCount: 0,
      errorCount: 0,
      errors: [] as { row: number; sku: string; error: string }[],
    };

    // 逐条处理以便精确定位错误，但可以使用事务优化或预检查 SKU
    for (let i = 0; i < items.length; i++) {
      const data = items[i];
      try {
        // 检查 SKU 唯一性
        const existing = await db.query.products.findFirst({
          where: and(eq(products.tenantId, tenantId), eq(products.sku, data.sku)),
        });

        if (existing) {
          throw new Error(`SKU "${data.sku}" 已存在`);
        }

        const batchProduct = await db
          .insert(products)
          .values({
            tenantId,
            sku: data.sku,
            name: data.name,
            category: data.category,
            productType: data.productType,
            unit: data.unit,
            purchasePrice: data.purchasePrice.toString(),
            logisticsCost: data.logisticsCost.toString(),
            processingCost: data.processingCost.toString(),
            lossRate: data.lossRate.toString(),
            retailPrice: data.retailPrice.toString(),
            // [Refactor] 移除渠道相关字段
            // channelPriceMode: data.channelPriceMode,
            // channelPrice: data.channelPrice.toString(),
            // channelDiscountRate: data.channelDiscountRate.toString(),
            floorPrice: data.floorPrice.toString(),
            isToBEnabled: data.isToBEnabled,
            isToCEnabled: data.isToCEnabled,
            defaultSupplierId: data.defaultSupplierId,
            isStockable: data.isStockable,
            description: data.description,
            createdBy: userId,
          })
          .returning();

        await AuditService.log(db, {
          tenantId,
          userId,
          tableName: 'products',
          recordId: batchProduct[0].id,
          action: 'CREATE',
          newValues: batchProduct[0],
        });

        results.successCount++;
      } catch (error: unknown) {
        results.errorCount++;
        results.errors.push({
          row: i + 1,
          sku: data.sku,
          error: error instanceof Error ? error.message : '未知错误',
        });
      }
    }

    revalidatePath('/supply-chain/products');
    return results;
  }
);

export async function batchCreateProducts(params: z.infer<typeof batchCreateProductsSchema>) {
  return batchCreateProductsActionInternal(params);
}
