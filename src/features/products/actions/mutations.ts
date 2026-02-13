'use server';

import { z } from 'zod';
import { db } from '@/shared/api/db';
import { products } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath } from 'next/cache';
import {
    createProductSchema,
    updateProductSchema,
    deleteProductSchema,
    activateProductSchema
} from '../schema';

/**
 * 创建产品
 */
const createProductActionInternal = createSafeAction(createProductSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    // 检查 SKU 唯一性
    const existing = await db.query.products.findFirst({
        where: and(
            eq(products.tenantId, session.user!.tenantId),
            eq(products.sku, data.sku)
        )
    });

    if (existing) {
        throw new Error('SKU 已存在');
    }

    const [product] = await db.insert(products).values({
        tenantId: session.user!.tenantId,
        sku: data.sku,
        name: data.name,
        category: data.category,
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
    }).returning();

    revalidatePath('/supply-chain/products');
    return { id: product.id };
});

export async function createProduct(params: z.infer<typeof createProductSchema>) {
    return createProductActionInternal(params);
}

/**
 * 更新产品
 */
const updateProductActionInternal = createSafeAction(updateProductSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    const { id, ...updates } = data;

    const [product] = await db.update(products)
        .set({
            name: updates.name,
            sku: updates.sku,
            category: updates.category,
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
        .where(and(
            eq(products.id, id),
            eq(products.tenantId, session.user.tenantId)
        ))
        .returning();

    if (!product) throw new Error('更新失败，产品未找到');

    revalidatePath('/supply-chain/products');
    return { id: product.id };
});

export async function updateProduct(params: z.infer<typeof updateProductSchema>) {
    return updateProductActionInternal(params);
}

/**
 * 删除产品
 */
const deleteProductActionInternal = createSafeAction(deleteProductSchema, async ({ id }, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    await db.delete(products)
        .where(and(
            eq(products.id, id),
            eq(products.tenantId, session.user.tenantId)
        ));

    revalidatePath('/supply-chain/products');
    return { success: true };
});

export async function deleteProduct(params: z.infer<typeof deleteProductSchema>) {
    return deleteProductActionInternal(params);
}

/**
 * 上架/下架产品
 */
const activateProductActionInternal = createSafeAction(activateProductSchema, async ({ id, isActive }, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    await db.update(products)
        .set({ isActive, updatedAt: new Date() })
        .where(and(
            eq(products.id, id),
            eq(products.tenantId, session.user.tenantId)
        ));

    revalidatePath('/supply-chain/products');
    return { success: true };
});

export async function activateProduct(params: z.infer<typeof activateProductSchema>) {
    return activateProductActionInternal(params);
}

/**
 * 批量创建产品
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
                    where: and(
                        eq(products.tenantId, tenantId),
                        eq(products.sku, data.sku)
                    )
                });

                if (existing) {
                    throw new Error(`SKU "${data.sku}" 已存在`);
                }

                await db.insert(products).values({
                    tenantId,
                    sku: data.sku,
                    name: data.name,
                    category: data.category,
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
                    specs: data.attributes || {},
                    description: data.description,
                    createdBy: userId,
                });

                results.successCount++;
            } catch (error: unknown) {
                results.errorCount++;
                results.errors.push({
                    row: i + 1,
                    sku: data.sku,
                    error: error instanceof Error ? error.message : '未知错误'
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
