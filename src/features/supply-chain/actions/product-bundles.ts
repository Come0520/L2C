'use server';

import { db } from '@/shared/api/db';
import { productBundles, productBundleItems } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath } from 'next/cache';
import { createProductBundleSchema, updateProductBundleSchema } from '../schemas';
import { z } from 'zod';
import { SUPPLY_CHAIN_PATHS } from "../constants";
import { AuditService } from '@/shared/lib/audit-service';

/**
 * 产品套件 (Product Bundle) 领域 Actions
 * 
 * @description 处理套件及其明细项的增删改查逻辑，包含租户隔离和审计日志。
 * 套件允许将多个标准产品组合起来进行销售和定价。
 */

const createProductBundleActionInternal = createSafeAction(createProductBundleSchema, async (data, { session }) => {
    console.warn('[supply-chain] createProductBundle 开始执行:', { bundleSku: data.bundleSku, name: data.name });
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    const existing = await db.query.productBundles.findFirst({
        where: and(
            eq(productBundles.tenantId, session.user.tenantId),
            eq(productBundles.bundleSku, data.bundleSku)
        )
    });

    if (existing) {
        throw new Error('套件 SKU 已存在');
    }

    return await db.transaction(async (tx) => {
        const [bundle] = await tx.insert(productBundles).values({
            tenantId: session.user.tenantId,
            bundleSku: data.bundleSku,
            name: data.name,
            category: data.category,
            retailPrice: data.retailPrice.toString(),
            channelPrice: data.channelPrice.toString(),
        }).returning();

        if (data.items && data.items.length > 0) {
            await tx.insert(productBundleItems).values(
                data.items.map(item => ({
                    tenantId: session.user.tenantId,
                    bundleId: bundle.id,
                    productId: item.productId,
                    quantity: item.quantity.toString(),
                    unit: item.unit,
                }))
            );
        }

        // 记录审计日志
        await AuditService.recordFromSession(session, 'productBundles', bundle.id, 'CREATE', {
            new: {
                bundleSku: data.bundleSku,
                name: data.name,
                itemCount: data.items?.length || 0
            }
        }, tx);

        revalidatePath(SUPPLY_CHAIN_PATHS.PRODUCT_BUNDLES);
        return { id: bundle.id };
    });
});

/**
 * 创建新的产品套件 (Product Bundle)
 * 
 * @description 开启事务同时创建套件主表和关联的产品明细子表，包含 SKU 唯一性校验和审计日志记录。
 * @param params 符合 createProductBundleSchema 的输入数据
 * @returns {Promise<ActionState<{id: string}>>} 创建成功后返回套件 ID
 */
export async function createProductBundle(params: Parameters<typeof createProductBundleActionInternal>[0]) {
    return createProductBundleActionInternal(params);
}

const updateProductBundleActionInternal = createSafeAction(updateProductBundleSchema, async (data, { session }) => {
    console.warn('[supply-chain] updateProductBundle 开始执行:', { id: data.id });
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    const { id, items, ...updates } = data;

    return await db.transaction(async (tx) => {
        const [bundle] = await tx.update(productBundles)
            .set({
                ...updates,
                retailPrice: updates.retailPrice?.toString(),
                channelPrice: updates.channelPrice?.toString(),
                updatedAt: new Date(),
            })
            .where(and(
                eq(productBundles.id, id),
                eq(productBundles.tenantId, session.user.tenantId)
            ))
            .returning();

        if (!bundle) {
            throw new Error('套件不存在');
        }

        if (items) {
            await tx.delete(productBundleItems)
                .where(eq(productBundleItems.bundleId, id));

            if (items.length > 0) {
                await tx.insert(productBundleItems).values(
                    items.map(item => ({
                        tenantId: session.user.tenantId,
                        bundleId: bundle.id,
                        productId: item.productId,
                        quantity: item.quantity.toString(),
                        unit: item.unit,
                    }))
                );
            }
        }

        // 记录审计日志
        await AuditService.recordFromSession(session, 'productBundles', id, 'UPDATE', {
            new: updates,
            changed: {
                itemsUpdated: !!items
            }
        }, tx);

        revalidatePath(SUPPLY_CHAIN_PATHS.PRODUCT_BUNDLES);
        return { id: bundle.id };
    });
});

/**
 * 更新现有的产品套件
 * 
 * @description 支持更新套件基础信息及重新同步产品明细清单。采用先删后增的方式更新子表。
 * @param params 符合 updateProductBundleSchema 的输入数据，包含套件 ID
 * @returns {Promise<ActionState<{id: string}>>} 更新成功后返回套件 ID
 */
export async function updateProductBundle(params: Parameters<typeof updateProductBundleActionInternal>[0]) {
    return updateProductBundleActionInternal(params);
}

const deleteProductBundleSchema = z.object({
    id: z.string()
});

const deleteProductBundleActionInternal = createSafeAction(deleteProductBundleSchema, async ({ id }, { session }) => {
    console.warn('[supply-chain] deleteProductBundle 开始执行:', { id });
    // [CQ-02] fix: 使用独立的 delete schema
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    await db.transaction(async (tx) => {
        // [CQ-03] fix: 子表删除添加租户隔离 (防御性编程)
        await tx.delete(productBundleItems)
            .where(and(
                eq(productBundleItems.bundleId, id),
                eq(productBundleItems.tenantId, session.user.tenantId)
            ));

        await tx.delete(productBundles)
            .where(and(
                eq(productBundles.id, id),
                eq(productBundles.tenantId, session.user.tenantId)
            ));

        // 记录审计日志
        await AuditService.recordFromSession(session, 'productBundles', id, 'DELETE', undefined, tx);
    });

    console.warn('[supply-chain] deleteProductBundle 执行成功:', { id });
    revalidatePath(SUPPLY_CHAIN_PATHS.PRODUCT_BUNDLES);
    return { success: true };
});

/**
 * 删除产品套件
 * 
 * @description 级联删除套件及其所有产品明细，包含租户隔离校验。
 * @param params 包含待删除套件 ID 的对象
 * @returns {Promise<ActionState<{success: true}>>}
 */
export async function deleteProductBundle(params: z.infer<typeof deleteProductBundleSchema>) {
    return deleteProductBundleActionInternal(params);
}
