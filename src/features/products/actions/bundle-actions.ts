'use server';
import { logger } from "@/shared/lib/logger";

/**
 * 组合商品 (Bundle) Server Actions
 * 
 * 提供组合商品的 CRUD 操作和明细管理功能
 */

import { db } from '@/shared/api/db';
import { productBundles, productBundleItems } from '@/shared/api/schema/supply-chain';
import { products } from '@/shared/api/schema/catalogs';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { z } from 'zod';
import { AuditService } from '@/shared/services/audit-service';

// 辅助函数：获取 tenantId
async function getTenantIdFromSession() {
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('未授权');
    }
    return session.user.tenantId;
}

// =============================================
// Schema 定义
// =============================================

const createBundleSchema = z.object({
    bundleSku: z.string().min(1, '组合商品编码不能为空'),
    name: z.string().min(1, '组合商品名称不能为空'),
    category: z.string().optional(),
    retailPrice: z.string().or(z.number()).optional(),
    channelPrice: z.string().or(z.number()).optional(),
});

const updateBundleSchema = createBundleSchema.partial();

const bundleItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.string().or(z.number()),
    unit: z.string().optional(),
});

// =============================================
// 组合商品 CRUD
// =============================================

/**
 * 获取组合商品列表（内部缓存 wrapper）
 *
 * @description 使用 unstable_cache 按 tenantId 缓存，tag: packages / packages-{tenantId}
 * 套餐列表数据稳定，适合缓存。修改时通过 revalidateTag 失效。
 */
const getCachedBundles = (tenantId: string) =>
    unstable_cache(
        async () => {
            return db
                .select()
                .from(productBundles)
                .where(eq(productBundles.tenantId, tenantId))
                .orderBy(desc(productBundles.createdAt));
        },
        [`packages-${tenantId}`],
        { tags: ['packages', `packages-${tenantId}`] }
    );

/**
 * 获取组合商品列表
 *
 * @description 已使用 unstable_cache 缓存，tag: packages / packages-{tenantId}
 */
export async function getBundles() {
    try {
        const tenantId = await getTenantIdFromSession();
        if (!tenantId) return { success: false, error: '未授权' };

        const data = await getCachedBundles(tenantId)();
        return { success: true, data };
    } catch (error) {
        logger.error('获取组合商品列表失败:', error);
        return { success: false, error: '获取组合商品列表失败' };
    }
}

/**
 * 获取组合商品详情
 */
export async function getBundleById(id: string) {
    try {
        const tenantId = await getTenantIdFromSession();
        if (!tenantId) return { success: false, error: '未授权' };

        const [data] = await db
            .select()
            .from(productBundles)
            .where(and(
                eq(productBundles.id, id),
                eq(productBundles.tenantId, tenantId)
            ));

        if (!data) return { success: false, error: '组合商品不存在' };

        // P1 修复：获取组合商品明细（加租户验证）
        const items = await db
            .select({
                id: productBundleItems.id,
                productId: productBundleItems.productId,
                quantity: productBundleItems.quantity,
                unit: productBundleItems.unit,
                product: {
                    id: products.id,
                    sku: products.sku,
                    name: products.name,
                    retailPrice: products.retailPrice,
                }
            })
            .from(productBundleItems)
            .leftJoin(products, eq(productBundleItems.productId, products.id))
            .where(and(
                eq(productBundleItems.bundleId, id),
                eq(productBundleItems.tenantId, tenantId)
            ));

        return { success: true, data: { ...data, items } };
    } catch (error) {
        logger.error('获取组合商品详情失败:', error);
        return { success: false, error: '获取组合商品详情失败' };
    }
}

/**
 * 创建组合商品
 */
export async function createBundle(input: z.infer<typeof createBundleSchema>) {
    try {
        const tenantId = await getTenantIdFromSession();
        if (!tenantId) return { success: false, error: '未授权' };

        const validated = createBundleSchema.parse(input);

        const [created] = await db
            .insert(productBundles)
            .values({
                tenantId,
                bundleSku: validated.bundleSku,
                name: validated.name,
                category: validated.category,
                retailPrice: validated.retailPrice ? String(validated.retailPrice) : '0',
                channelPrice: validated.channelPrice ? String(validated.channelPrice) : '0',
            })
            .returning();

        const session = await auth();
        await AuditService.log(db, {
            tenantId,
            userId: session?.user?.id || 'system',
            tableName: 'product_bundles',
            recordId: created.id,
            action: 'CREATE',
            newValues: created
        });

        revalidateTag('packages', 'default');
        revalidateTag(`packages-${tenantId}`, 'default');
        revalidatePath('/products/bundles');
        return { success: true, data: created };
    } catch (error) {
        logger.error('创建组合商品失败:', error);
        return { success: false, error: '创建组合商品失败' };
    }
}

/**
 * 更新组合商品
 */
export async function updateBundle(id: string, input: z.infer<typeof updateBundleSchema>) {
    try {
        const tenantId = await getTenantIdFromSession();
        if (!tenantId) return { success: false, error: '未授权' };

        const validated = updateBundleSchema.parse(input);

        const updateData: Record<string, unknown> = {};
        if (validated.bundleSku) updateData.bundleSku = validated.bundleSku;
        if (validated.name) updateData.name = validated.name;
        if (validated.category !== undefined) updateData.category = validated.category;
        if (validated.retailPrice) updateData.retailPrice = String(validated.retailPrice);
        if (validated.channelPrice) updateData.channelPrice = String(validated.channelPrice);

        const [updated] = await db
            .update(productBundles)
            .set({ ...updateData, updatedAt: new Date() })
            .where(and(
                eq(productBundles.id, id),
                eq(productBundles.tenantId, tenantId)
            ))
            .returning();

        const session = await auth();
        await AuditService.log(db, {
            tenantId,
            userId: session?.user?.id || 'system',
            tableName: 'product_bundles',
            recordId: updated.id,
            action: 'UPDATE',
            newValues: updateData,
            oldValues: { id }
        });

        revalidateTag('packages', 'default');
        revalidateTag(`packages-${tenantId}`, 'default');
        revalidatePath('/products/bundles');
        return { success: true, data: updated };
    } catch (error) {
        logger.error('更新组合商品失败:', error);
        return { success: false, error: '更新组合商品失败' };
    }
}

/**
 * 删除组合商品
 */
export async function deleteBundle(id: string) {
    try {
        const tenantId = await getTenantIdFromSession();
        if (!tenantId) return { success: false, error: '未授权' };

        // P0 修复：先删除关联的明细（加租户验证）
        await db
            .delete(productBundleItems)
            .where(and(
                eq(productBundleItems.bundleId, id),
                eq(productBundleItems.tenantId, tenantId)
            ));

        // 再删除组合商品
        await db
            .delete(productBundles)
            .where(and(
                eq(productBundles.id, id),
                eq(productBundles.tenantId, tenantId)
            ));

        const session = await auth();
        await AuditService.log(db, {
            tenantId,
            userId: session?.user?.id || 'system',
            tableName: 'product_bundles',
            recordId: id,
            action: 'DELETE',
            oldValues: { id }
        });

        revalidateTag('packages', 'default');
        revalidateTag(`packages-${tenantId}`, 'default');
        revalidatePath('/products/bundles');
        return { success: true };
    } catch (error) {
        logger.error('删除组合商品失败:', error);
        return { success: false, error: '删除组合商品失败' };
    }
}

// =============================================
// 组合商品明细管理
// =============================================

/**
 * 更新组合商品明细（批量替换）
 */
export async function updateBundleItems(bundleId: string, items: z.infer<typeof bundleItemSchema>[]) {
    try {
        const tenantId = await getTenantIdFromSession();
        if (!tenantId) return { success: false, error: '未授权' };

        // 验证所有项
        const validatedItems = items.map(item => bundleItemSchema.parse(item));

        // 删除现有明细
        await db
            .delete(productBundleItems)
            .where(eq(productBundleItems.bundleId, bundleId));

        // 插入新明细
        if (validatedItems.length > 0) {
            await db.insert(productBundleItems).values(
                validatedItems.map(item => ({
                    tenantId,
                    bundleId,
                    productId: item.productId,
                    quantity: String(item.quantity),
                    unit: item.unit,
                }))
            );
        }

        const session = await auth();
        await AuditService.log(db, {
            tenantId,
            userId: session?.user?.id || 'system',
            tableName: 'product_bundle_items',
            recordId: bundleId,
            action: 'UPDATE',
            details: { action: 'UPDATE_ITEMS', itemCount: validatedItems.length }
        });

        revalidatePath('/products/bundles');
        return { success: true };
    } catch (error) {
        logger.error('更新组合商品明细失败:', error);
        return { success: false, error: '更新组合商品明细失败' };
    }
}

/**
 * 计算组合商品成本和建议售价
 */
export async function calculateBundleCost(bundleId: string) {
    try {
        const tenantId = await getTenantIdFromSession();
        if (!tenantId) return { success: false, error: '未授权' };

        // P1 修复：获取组合商品明细（加租户验证）
        const items = await db
            .select({
                quantity: productBundleItems.quantity,
                purchasePrice: products.purchasePrice,
                retailPrice: products.retailPrice,
                channelPrice: products.channelPrice,
            })
            .from(productBundleItems)
            .leftJoin(products, eq(productBundleItems.productId, products.id))
            .where(and(
                eq(productBundleItems.bundleId, bundleId),
                eq(productBundleItems.tenantId, tenantId)
            ));

        let totalCost = 0;
        let totalRetail = 0;
        let totalChannel = 0;

        for (const item of items) {
            const qty = parseFloat(item.quantity || '0');
            totalCost += qty * parseFloat(item.purchasePrice || '0');
            totalRetail += qty * parseFloat(item.retailPrice || '0');
            totalChannel += qty * parseFloat(item.channelPrice || '0');
        }

        return {
            success: true,
            data: {
                totalCost,
                suggestedRetailPrice: totalRetail,
                suggestedChannelPrice: totalChannel,
            }
        };
    } catch (error) {
        logger.error('计算组合商品成本失败:', error);
        return { success: false, error: '计算组合商品成本失败' };
    }
}

