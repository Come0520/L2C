'use server';

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
export const createProduct = createSafeAction(createProductSchema, async (data, { session }) => {
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
        channelPriceMode: data.channelPriceMode,
        channelPrice: data.channelPrice.toString(),
        channelDiscountRate: data.channelDiscountRate.toString(),
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

/**
 * 更新产品
 */
export const updateProduct = createSafeAction(updateProductSchema, async (data, { session }) => {
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
            channelPriceMode: updates.channelPriceMode,
            channelPrice: updates.channelPrice?.toString(),
            channelDiscountRate: updates.channelDiscountRate?.toString(),
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

/**
 * 删除产品
 */
export const deleteProduct = createSafeAction(deleteProductSchema, async ({ id }, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    await db.delete(products)
        .where(and(
            eq(products.id, id),
            eq(products.tenantId, session.user.tenantId)
        ));

    revalidatePath('/supply-chain/products');
    return { success: true };
});

/**
 * 上架/下架产品
 */
export const activateProduct = createSafeAction(activateProductSchema, async ({ id, isActive }, { session }) => {
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
