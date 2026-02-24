'use server';

import { db } from '@/shared/api/db';
import { productSuppliers, suppliers } from '@/shared/api/schema';
import { eq, and, ne } from 'drizzle-orm';
import { AuditService } from '@/shared/services/audit-service';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Zod Schemas
 */
const addProductSupplierSchema = z.object({
    productId: z.string().uuid(),
    supplierId: z.string().uuid(),
    purchasePrice: z.coerce.number().min(0).default(0),
    leadTimeDays: z.coerce.number().int().min(0).default(7),
    isDefault: z.boolean().default(false),
});

const updateProductSupplierSchema = z.object({
    id: z.string().uuid(),
    purchasePrice: z.coerce.number().min(0).optional(),
    leadTimeDays: z.coerce.number().int().min(0).optional(),
    isDefault: z.boolean().optional(),
});

const removeProductSupplierSchema = z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(), // Needed for revalidation context
});

const getProductSuppliersSchema = z.object({
    productId: z.string().uuid(),
});

/**
 * 查询产品的关联供应商列表
 *
 * @description 通过 `leftJoin` 关联 `suppliers` 表获取供应商名称等信息。
 *   已包含租户隔离条件。
 *
 * @param params - 包含 `productId` 的查询参数
 * @returns 供应商关联记录数组（含供应商名称、采购价、货期、默认状态）
 */
const getProductSuppliersActionInternal = createSafeAction(getProductSuppliersSchema, async ({ productId }, { session }) => {
    // Permission check: View products or supply chain
    // if (!session?.user) throw new Error('Unauthorized'); 

    const result = await db
        .select({
            id: productSuppliers.id,
            supplierId: productSuppliers.supplierId,
            supplierName: suppliers.name,
            purchasePrice: productSuppliers.purchasePrice,
            leadTimeDays: productSuppliers.leadTimeDays,
            isDefault: productSuppliers.isDefault,
        })
        .from(productSuppliers)
        .leftJoin(suppliers, eq(productSuppliers.supplierId, suppliers.id))
        .where(
            and(
                eq(productSuppliers.tenantId, session.user.tenantId),
                eq(productSuppliers.productId, productId)
            )
        );

    return result;
});

export async function getProductSuppliers(params: z.infer<typeof getProductSuppliersSchema>) {
    return getProductSuppliersActionInternal(params);
}

/**
 * 添加供应商关联
 *
 * @description 将供应商与产品进行关联，若设置为默认供应商，
 *   则先取消该产品其他供应商的默认状态。
 *   操作后写入审计日志。
 *
 * @param data - 包含 `productId`、`supplierId`、`purchasePrice`、`leadTimeDays`、`isDefault`
 * @returns `{ success: true }`
 * @throws 当供应商已关联此产品时抛出 `该供应商已关联此产品` 错误
 * @throws 当用户缺少 `PRODUCTS.MANAGE` 权限时抛出权限异常
 */
const addProductSupplierActionInternal = createSafeAction(addProductSupplierSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    // Check if relation already exists
    const existing = await db.query.productSuppliers.findFirst({
        where: and(
            eq(productSuppliers.tenantId, session.user.tenantId),
            eq(productSuppliers.productId, data.productId),
            eq(productSuppliers.supplierId, data.supplierId)
        )
    });

    if (existing) {
        throw new Error('该供应商已关联此产品');
    }

    // If new one is default, unset other defaults
    if (data.isDefault) {
        await db.update(productSuppliers)
            .set({ isDefault: false })
            .where(
                and(
                    eq(productSuppliers.tenantId, session.user.tenantId),
                    eq(productSuppliers.productId, data.productId)
                )
            );
    }

    await db.insert(productSuppliers).values({
        tenantId: session.user.tenantId,
        productId: data.productId,
        supplierId: data.supplierId,
        purchasePrice: data.purchasePrice.toString(),
        leadTimeDays: data.leadTimeDays,
        isDefault: data.isDefault,
    });

    await AuditService.log(db, {
        tenantId: session.user.tenantId,
        userId: session.user.id!,
        tableName: 'product_suppliers',
        recordId: `${data.productId}-${data.supplierId}`,
        action: 'CREATE',
        newValues: data
    });

    revalidatePath(`/supply-chain/products`);
    return { success: true };
});

export async function addProductSupplier(params: z.infer<typeof addProductSupplierSchema>) {
    return addProductSupplierActionInternal(params);
}

/**
 * 更新供应商关联信息 (价格, 货期, 默认状态)
 *
 * @description 支持部分更新，若将当前供应商设为默认，
 *   会自动取消同产品下其他供应商的默认标志。
 *   已包含租户隔离校验 (P0 级安全修复)。
 *
 * @param data - 包含 `id` 及可选的 `purchasePrice`、`leadTimeDays`、`isDefault`
 * @returns `{ success: true }`
 * @throws 当关联记录不存在或无权访问时抛出 `关联记录不存在或无权访问`
 * @throws 当用户缺少 `PRODUCTS.MANAGE` 权限时抛出权限异常
 */
const updateProductSupplierActionInternal = createSafeAction(updateProductSupplierSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    // P0 修复：查询时添加租户验证
    const current = await db.query.productSuppliers.findFirst({
        where: and(
            eq(productSuppliers.id, data.id),
            eq(productSuppliers.tenantId, session.user.tenantId)
        )
    });

    if (!current) throw new Error('关联记录不存在或无权访问');

    // Handle default toggle logic
    if (data.isDefault) {
        await db.update(productSuppliers)
            .set({ isDefault: false })
            .where(
                and(
                    eq(productSuppliers.tenantId, session.user.tenantId),
                    eq(productSuppliers.productId, current.productId),
                    ne(productSuppliers.id, data.id)
                )
            );
    }

    await db.update(productSuppliers)
        .set({
            ...(data.purchasePrice !== undefined ? { purchasePrice: data.purchasePrice.toString() } : {}),
            ...(data.leadTimeDays !== undefined ? { leadTimeDays: data.leadTimeDays } : {}),
            ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
        })
        .where(and(
            eq(productSuppliers.id, data.id),
            eq(productSuppliers.tenantId, session.user.tenantId)  // P0 修复：租户隔离
        ));

    await AuditService.log(db, {
        tenantId: session.user.tenantId,
        userId: session.user.id!,
        tableName: 'product_suppliers',
        recordId: data.id,
        action: 'UPDATE',
        oldValues: current,
        newValues: data
    });

    revalidatePath(`/supply-chain/products`);
    return { success: true };
});

export async function updateProductSupplier(params: z.infer<typeof updateProductSupplierSchema>) {
    return updateProductSupplierActionInternal(params);
}

/**
 * 移除供应商关联
 *
 * @description 硬删除产品与供应商的关联记录，
 *   已包含租户隔离条件。
 *
 * @param params - 包含 `id`（关联记录 ID）和 `productId`
 * @returns `{ success: true }`
 * @throws 当用户缺少 `PRODUCTS.MANAGE` 权限时抛出权限异常
 */
const removeProductSupplierActionInternal = createSafeAction(removeProductSupplierSchema, async ({ id }, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    await db.delete(productSuppliers)
        .where(
            and(
                eq(productSuppliers.tenantId, session.user.tenantId),
                eq(productSuppliers.id, id)
            )
        );

    await AuditService.log(db, {
        tenantId: session.user.tenantId,
        userId: session.user.id!,
        tableName: 'product_suppliers',
        recordId: id,
        action: 'DELETE',
        oldValues: { id }
    });

    revalidatePath(`/supply-chain/products`);
    return { success: true };
});

export async function removeProductSupplier(params: z.infer<typeof removeProductSupplierSchema>) {
    return removeProductSupplierActionInternal(params);
}

// ============================================================
// [Product-03] 产品供应商关联增强
// ============================================================

const compareSupplierPricesSchema = z.object({
    productId: z.string().uuid(),
});

/**
 * 比较产品的多个供应商价格
 *
 * @description 返回价格排序、价差分析、推荐供应商等综合比价信息。
 *   推荐策略：最低价且货期合理（≤ 平均货期）。
 *
 * @param params - 包含 `productId`
 * @returns `{ suppliers[], comparison }` 比价结果对象
 */
const compareSupplierPricesActionInternal = createSafeAction(compareSupplierPricesSchema, async ({ productId }, { session }) => {
    const result = await db
        .select({
            id: productSuppliers.id,
            supplierId: productSuppliers.supplierId,
            supplierName: suppliers.name,
            purchasePrice: productSuppliers.purchasePrice,
            leadTimeDays: productSuppliers.leadTimeDays,
            isDefault: productSuppliers.isDefault,
        })
        .from(productSuppliers)
        .leftJoin(suppliers, eq(productSuppliers.supplierId, suppliers.id))
        .where(
            and(
                eq(productSuppliers.tenantId, session.user.tenantId),
                eq(productSuppliers.productId, productId)
            )
        );

    if (result.length === 0) {
        return { suppliers: [], comparison: null };
    }

    // 按价格排序
    const sortedByPrice = [...result].sort((a, b) => {
        const priceA = parseFloat(a.purchasePrice || '0');
        const priceB = parseFloat(b.purchasePrice || '0');
        return priceA - priceB;
    });

    // 按货期排序
    const sortedByLeadTime = [...result].sort((a, b) => {
        return (a.leadTimeDays || 0) - (b.leadTimeDays || 0);
    });

    const prices = sortedByPrice.map(s => parseFloat(s.purchasePrice || '0'));
    const lowestPrice = prices[0];
    const highestPrice = prices[prices.length - 1];
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;

    // 找出当前默认供应商
    const currentDefault = result.find(s => s.isDefault);

    // 推荐供应商：最低价且货期合理（<= 平均货期）
    const avgLeadTime = result.reduce((a, b) => a + (b.leadTimeDays || 0), 0) / result.length;
    const recommended = sortedByPrice.find(s => (s.leadTimeDays || 0) <= avgLeadTime) || sortedByPrice[0];

    return {
        suppliers: result.map(s => ({
            ...s,
            purchasePrice: parseFloat(s.purchasePrice || '0'),
            priceRank: sortedByPrice.findIndex(sp => sp.id === s.id) + 1,
            leadTimeRank: sortedByLeadTime.findIndex(sp => sp.id === s.id) + 1,
        })),
        comparison: {
            lowestPrice,
            highestPrice,
            avgPrice: Math.round(avgPrice * 100) / 100,
            priceDiff: Math.round((highestPrice - lowestPrice) * 100) / 100,
            priceDiffPercent: lowestPrice > 0 ? Math.round(((highestPrice - lowestPrice) / lowestPrice) * 10000) / 100 : 0,
            currentDefaultId: currentDefault?.id || null,
            currentDefaultName: currentDefault?.supplierName || null,
            recommendedId: recommended.id,
            recommendedName: recommended.supplierName,
            shouldSwitch: currentDefault?.id !== recommended.id,
        }
    };
});

export async function compareSupplierPrices(params: z.infer<typeof compareSupplierPricesSchema>) {
    return compareSupplierPricesActionInternal(params);
}

const autoSwitchDefaultSupplierSchema = z.object({
    productId: z.string().uuid(),
    strategy: z.enum(['LOWEST_PRICE', 'SHORTEST_LEAD_TIME', 'BALANCED']).default('BALANCED'),
});

/**
 * 自动切换到最优供应商
 *
 * @description 支持三种策略：
 *   - `LOWEST_PRICE`: 纯价格最低优先
 *   - `SHORTEST_LEAD_TIME`: 纯货期最短优先
 *   - `BALANCED`: 价格 60% + 货期 40% 加权综合评分
 *   切换后写入审计日志，记录策略与结果。
 *
 * @param params - 包含 `productId` 和 `strategy`
 * @returns `{ success, newDefaultId, newDefaultName, strategy }`
 * @throws 当该产品没有关联供应商时抛出 `该产品没有关联供应商`
 * @throws 当用户缺少 `PRODUCTS.MANAGE` 权限时抛出权限异常
 */
const autoSwitchDefaultSupplierActionInternal = createSafeAction(autoSwitchDefaultSupplierSchema, async ({ productId, strategy }, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    const supplierList = await db
        .select({
            id: productSuppliers.id,
            supplierId: productSuppliers.supplierId,
            supplierName: suppliers.name,
            purchasePrice: productSuppliers.purchasePrice,
            leadTimeDays: productSuppliers.leadTimeDays,
            isDefault: productSuppliers.isDefault,
        })
        .from(productSuppliers)
        .leftJoin(suppliers, eq(productSuppliers.supplierId, suppliers.id))
        .where(
            and(
                eq(productSuppliers.tenantId, session.user.tenantId),
                eq(productSuppliers.productId, productId)
            )
        );

    if (supplierList.length === 0) {
        throw new Error('该产品没有关联供应商');
    }

    let bestSupplier;

    switch (strategy) {
        case 'LOWEST_PRICE':
            bestSupplier = supplierList.reduce((best, curr) => {
                const bestPrice = parseFloat(best.purchasePrice || '999999');
                const currPrice = parseFloat(curr.purchasePrice || '999999');
                return currPrice < bestPrice ? curr : best;
            });
            break;

        case 'SHORTEST_LEAD_TIME':
            bestSupplier = supplierList.reduce((best, curr) => {
                return (curr.leadTimeDays || 999) < (best.leadTimeDays || 999) ? curr : best;
            });
            break;

        case 'BALANCED':
        default:
            // 综合评分：价格权重 60%，货期权重 40%
            const prices = supplierList.map(s => parseFloat(s.purchasePrice || '0'));
            const leadTimes = supplierList.map(s => s.leadTimeDays || 0);
            const maxPrice = Math.max(...prices);
            const maxLeadTime = Math.max(...leadTimes);

            bestSupplier = supplierList.reduce((best, curr) => {
                const currPrice = parseFloat(curr.purchasePrice || '0');
                const currLeadTime = curr.leadTimeDays || 0;
                const bestPrice = parseFloat(best.purchasePrice || '0');
                const bestLeadTime = best.leadTimeDays || 0;

                // 归一化后加权评分（越低越好）
                const currScore = (maxPrice > 0 ? currPrice / maxPrice * 0.6 : 0) +
                    (maxLeadTime > 0 ? currLeadTime / maxLeadTime * 0.4 : 0);
                const bestScore = (maxPrice > 0 ? bestPrice / maxPrice * 0.6 : 0) +
                    (maxLeadTime > 0 ? bestLeadTime / maxLeadTime * 0.4 : 0);

                return currScore < bestScore ? curr : best;
            });
            break;
    }

    // 取消所有默认状态
    await db.update(productSuppliers)
        .set({ isDefault: false })
        .where(
            and(
                eq(productSuppliers.tenantId, session.user.tenantId),
                eq(productSuppliers.productId, productId)
            )
        );

    // 设置新的默认供应商
    await db.update(productSuppliers)
        .set({ isDefault: true })
        .where(eq(productSuppliers.id, bestSupplier.id));

    await AuditService.log(db, {
        tenantId: session.user.tenantId,
        userId: session.user.id!,
        tableName: 'product_suppliers',
        recordId: bestSupplier.id,
        action: 'UPDATE',
        oldValues: { isDefault: false },
        newValues: { isDefault: true },
        details: { action: 'AUTO_SWITCH_DEFAULT', strategy, productId }
    });

    revalidatePath(`/supply-chain/products`);

    return {
        success: true,
        newDefaultId: bestSupplier.id,
        newDefaultName: bestSupplier.supplierName,
        strategy,
    };
});

export async function autoSwitchDefaultSupplier(params: z.infer<typeof autoSwitchDefaultSupplierSchema>) {
    return autoSwitchDefaultSupplierActionInternal(params);
}

