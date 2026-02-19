'use server';

import { db } from '@/shared/api/db';
import { inventory, inventoryLogs, warehouses, products } from '@/shared/api/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
import { SUPPLY_CHAIN_PATHS } from '../constants';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { AuditService } from '@/shared/lib/audit-service';

// --- Schemas ---

const adjustInventorySchema = z.object({
    warehouseId: z.string(),
    productId: z.string(),
    quantity: z.number().int(), // Adjustment amount (positive or negative)
    reason: z.string().optional(),
});

const transferInventorySchema = z.object({
    fromWarehouseId: z.string(),
    toWarehouseId: z.string(),
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
    })),
    reason: z.string().optional(),
});

const getInventorySchema = z.object({
    warehouseId: z.string().optional(),
    productIds: z.array(z.string()).optional(),
});

// --- Actions ---

const adjustInventoryActionInternal = createSafeAction(adjustInventorySchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.STOCK_MANAGE);

    // 校验仓库是否属于当前租户
    const warehouse = await db.query.warehouses.findFirst({
        where: and(
            eq(warehouses.id, data.warehouseId),
            eq(warehouses.tenantId, session.user.tenantId)
        ),
    });
    if (!warehouse) {
        throw new Error('仓库不存在或无权访问');
    }

    return await db.transaction(async (tx) => {
        const currentStock = await tx.query.inventory.findFirst({
            where: and(
                eq(inventory.warehouseId, data.warehouseId),
                eq(inventory.productId, data.productId)
            ),
        });

        const currentQty = currentStock?.quantity || 0;
        const newQty = currentQty + data.quantity;

        if (newQty < 0) {
            throw new Error('库存不足，无法进行扣减');
        }

        if (currentStock) {
            await tx.update(inventory)
                .set({ quantity: newQty, updatedAt: new Date() })
                .where(eq(inventory.id, currentStock.id));
        } else {
            await tx.insert(inventory).values({
                tenantId: session.user.tenantId,
                warehouseId: data.warehouseId,
                productId: data.productId,
                quantity: newQty,
            });
        }

        await tx.insert(inventoryLogs).values({
            tenantId: session.user.tenantId,
            warehouseId: data.warehouseId,
            productId: data.productId,
            type: 'ADJUST',
            quantity: data.quantity,
            balanceAfter: newQty,
            reason: data.reason || 'Manual Adjustment',
            operatorId: session.user.id,
            description: `手动调整: ${data.quantity > 0 ? '+' : ''}${data.quantity}`,
        });

        revalidatePath(SUPPLY_CHAIN_PATHS.INVENTORY);

        // 添加审计日志
        await AuditService.recordFromSession(session, 'inventory', currentStock?.id || 'new', 'UPDATE', {
            old: { quantity: currentQty },
            new: { quantity: newQty },
            changed: {
                quantity: data.quantity,
                reason: data.reason,
                type: 'ADJUST'
            }
        }, tx);
        return { success: true };
    });
});

/**
 * 调整库存数量
 * 
 * @description 手动增加或减少特定仓库中产品的库存量。记录库存变动日志和审计日志。
 * @param params 包含仓库 ID、产品 ID、调整数量及原因
 */
export async function adjustInventory(params: z.infer<typeof adjustInventorySchema>) {
    return adjustInventoryActionInternal(params);
}

const transferInventoryActionInternal = createSafeAction(transferInventorySchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.STOCK_MANAGE);

    // 校验源仓库和目标仓库是否属于当前租户
    const [sourceWarehouse, targetWarehouse] = await Promise.all([
        db.query.warehouses.findFirst({
            where: and(
                eq(warehouses.id, data.fromWarehouseId),
                eq(warehouses.tenantId, session.user.tenantId)
            ),
        }),
        db.query.warehouses.findFirst({
            where: and(
                eq(warehouses.id, data.toWarehouseId),
                eq(warehouses.tenantId, session.user.tenantId)
            ),
        }),
    ]);
    if (!sourceWarehouse) {
        throw new Error('源仓库不存在或无权访问');
    }
    if (!targetWarehouse) {
        throw new Error('目标仓库不存在或无权访问');
    }

    return await db.transaction(async (tx) => {
        for (const item of data.items) {
            const sourceStock = await tx.query.inventory.findFirst({
                where: and(
                    eq(inventory.warehouseId, data.fromWarehouseId),
                    eq(inventory.productId, item.productId)
                ),
            });

            if (!sourceStock || sourceStock.quantity < item.quantity) {
                throw new Error(`源仓库产品 ${item.productId} 库存不足`);
            }

            const newSourceQty = sourceStock.quantity - item.quantity;
            await tx.update(inventory)
                .set({ quantity: newSourceQty, updatedAt: new Date() })
                .where(eq(inventory.id, sourceStock.id));

            await tx.insert(inventoryLogs).values({
                tenantId: session.user.tenantId,
                warehouseId: data.fromWarehouseId,
                productId: item.productId,
                type: 'TRANSFER',
                quantity: -item.quantity,
                balanceAfter: newSourceQty,
                reason: data.reason,
                description: `调拨出库 -> Warehouse ${data.toWarehouseId}`,
                operatorId: session.user.id,
            });

            const targetStock = await tx.query.inventory.findFirst({
                where: and(
                    eq(inventory.warehouseId, data.toWarehouseId),
                    eq(inventory.productId, item.productId)
                ),
            });

            const currentTargetQty = targetStock?.quantity || 0;
            const newTargetQty = currentTargetQty + item.quantity;

            if (targetStock) {
                await tx.update(inventory)
                    .set({ quantity: newTargetQty, updatedAt: new Date() })
                    .where(eq(inventory.id, targetStock.id));
            } else {
                await tx.insert(inventory).values({
                    tenantId: session.user.tenantId,
                    warehouseId: data.toWarehouseId,
                    productId: item.productId,
                    quantity: newTargetQty,
                });
            }

            await tx.insert(inventoryLogs).values({
                tenantId: session.user.tenantId,
                warehouseId: data.toWarehouseId,
                productId: item.productId,
                type: 'TRANSFER',
                quantity: item.quantity,
                balanceAfter: newTargetQty,
                reason: data.reason,
                description: `调拨入库 <- Warehouse ${data.fromWarehouseId}`,
                operatorId: session.user.id,
            });
        }

        revalidatePath(SUPPLY_CHAIN_PATHS.INVENTORY);

        // 添加审计日志 (调拨汇总日志)
        await AuditService.recordFromSession(session, 'inventory', 'multiple', 'UPDATE', {
            new: {
                fromWarehouseId: data.fromWarehouseId,
                toWarehouseId: data.toWarehouseId,
                itemCount: data.items.length,
                reason: data.reason
            }
        }, tx);
        return { success: true };
    });
});

/**
 * 跨仓库调拨库存
 * 
 * @description 在两个仓库之间转移产品。在一个事务内处理源仓库扣减、目标仓库增加及变动日志记录。
 * @param params 包含源/目标仓库 ID 及调拨产品清单
 */
export async function transferInventory(params: z.infer<typeof transferInventorySchema>) {
    return transferInventoryActionInternal(params);
}

const getInventoryLevelsActionInternal = createSafeAction(getInventorySchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);

    const filters = [eq(inventory.tenantId, session.user.tenantId)];
    if (data.warehouseId) {
        filters.push(eq(inventory.warehouseId, data.warehouseId));
    }
    if (data.productIds && data.productIds.length > 0) {
        filters.push(inArray(inventory.productId, data.productIds));
    }

    const results = await db.select({
        id: inventory.id,
        warehouseId: inventory.warehouseId,
        warehouseName: warehouses.name,
        productId: inventory.productId,
        productName: products.name,
        quantity: inventory.quantity,
        updatedAt: inventory.updatedAt,
    })
        .from(inventory)
        .leftJoin(warehouses, eq(inventory.warehouseId, warehouses.id))
        .leftJoin(products, eq(inventory.productId, products.id))
        .where(and(...filters));

    return results;
});

/**
 * 获取库存水平列表
 * 
 * @description 根据仓库和产品 ID 过滤查询当前库存余量。
 * @param params 过滤条件（可选仓库 ID 和产品 ID 数组）
 */
export async function getInventoryLevels(params: z.infer<typeof getInventorySchema>) {
    return getInventoryLevelsActionInternal(params);
}

// ============================================================
// [Supply-04] 库存预警机制
// ============================================================

const checkInventoryAlertsSchema = z.object({
    warehouseId: z.string().optional(),
    alertThreshold: z.number().min(0).default(10), // 默认预警阈值
});

const checkInventoryAlertsActionInternal = createSafeAction(checkInventoryAlertsSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);

    const baseFilters = [eq(inventory.tenantId, session.user.tenantId)];
    if (data.warehouseId) {
        baseFilters.push(eq(inventory.warehouseId, data.warehouseId));
    }

    const allInventory = await db.select({
        id: inventory.id,
        warehouseId: inventory.warehouseId,
        warehouseName: warehouses.name,
        productId: inventory.productId,
        productName: products.name,
        productCategory: products.category,
        quantity: inventory.quantity,
        minStock: inventory.minStock,
    })
        .from(inventory)
        .leftJoin(warehouses, eq(inventory.warehouseId, warehouses.id))
        .leftJoin(products, eq(inventory.productId, products.id))
        .where(and(...baseFilters));

    const alerts: {
        level: 'CRITICAL' | 'WARNING' | 'OK';
        item: typeof allInventory[number];
        shortage: number;
    }[] = [];

    for (const item of allInventory) {
        const qty = item.quantity || 0;
        const minStock = item.minStock || data.alertThreshold;

        if (qty === 0) {
            alerts.push({ level: 'CRITICAL', item, shortage: minStock });
        } else if (qty < minStock * 0.5) {
            alerts.push({ level: 'CRITICAL', item, shortage: minStock - qty });
        } else if (qty < minStock) {
            alerts.push({ level: 'WARNING', item, shortage: minStock - qty });
        }
    }

    alerts.sort((a, b) => {
        const order = { CRITICAL: 0, WARNING: 1, OK: 2 };
        return order[a.level] - order[b.level];
    });

    return {
        success: true,
        summary: {
            total: allInventory.length,
            criticalCount: alerts.filter(a => a.level === 'CRITICAL').length,
            warningCount: alerts.filter(a => a.level === 'WARNING').length,
        },
        alerts: alerts.slice(0, 50),
    };
});

/**
 * 执行库存预警检查
 * 
 * @description 检查库存数量是否低于安全库存 (minStock)，并返回预警列表。支持 CRITICAL 和 WARNING 级别。
 * @param params 过滤目标仓库及默认预警阈值
 */
export async function checkInventoryAlerts(params: z.infer<typeof checkInventoryAlertsSchema>) {
    return checkInventoryAlertsActionInternal(params);
}

const setminStockSchema = z.object({
    productId: z.string(),
    warehouseId: z.string(),
    minStock: z.number().min(0),
});

const setminStockActionInternal = createSafeAction(setminStockSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.STOCK_MANAGE);

    const existing = await db.query.inventory.findFirst({
        where: and(
            eq(inventory.tenantId, session.user.tenantId),
            eq(inventory.warehouseId, data.warehouseId),
            eq(inventory.productId, data.productId)
        ),
    });

    if (existing) {
        await db.update(inventory)
            .set({ minStock: data.minStock, updatedAt: new Date() })
            .where(eq(inventory.id, existing.id));
    } else {
        await db.insert(inventory).values({
            tenantId: session.user.tenantId,
            warehouseId: data.warehouseId,
            productId: data.productId,
            quantity: 0,
            minStock: data.minStock,
        });
    }

    revalidatePath(SUPPLY_CHAIN_PATHS.INVENTORY);

    // 添加审计日志
    await AuditService.recordFromSession(session, 'inventory', existing?.id || 'new', 'UPDATE', {
        old: { minStock: existing?.minStock },
        new: { minStock: data.minStock }
    });

    return { success: true, message: `安全库存已设置为 ${data.minStock}` };
});

/**
 * 设置产品在特定仓库的安全库存阈值
 * 
 * @description 更新或插入库存记录中的 minStock 字段。
 * @param params 产品、仓库及目标阈值
 */
export async function setminStock(params: z.infer<typeof setminStockSchema>) {
    return setminStockActionInternal(params);
}

/**
 * 获取补货建议清单
 * 
 * @description 基于库存预警结果，计算建议补货量（缺口 + 缓冲）。
 * @param warehouseId 可选仓库过滤
 */
export async function getRestockSuggestions(warehouseId?: string) {
    const res = await checkInventoryAlerts({
        warehouseId,
        alertThreshold: 10
    });

    const data = res?.data;
    if (!data) return [];

    // 只返回需要补货的（预警状态）
    return data.alerts
        .filter(a => a.level !== 'OK')
        .map(a => ({
            productId: a.item.productId,
            productName: a.item.productName,
            warehouseId: a.item.warehouseId,
            warehouseName: a.item.warehouseName,
            currentStock: a.item.quantity,
            minStock: a.item.minStock,
            suggestedRestock: a.shortage + 5, // 建议补货量 = 缺货量 + 缓冲
            level: a.level,
        }));
}



/**
 * 获取当前租户的所有仓库列表
 * 
 * @description 按默认仓库和创建时间排序。
 */
export async function getWarehouses() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权', data: [] };

    const result = await db.query.warehouses.findMany({
        where: eq(warehouses.tenantId, session!.user.tenantId),
        orderBy: [desc(warehouses.isDefault), desc(warehouses.createdAt)],
    });

    return { success: true, data: result };
}
