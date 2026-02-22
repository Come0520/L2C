'use server';

import { db } from '@/shared/api/db';
import { inventory, inventoryLogs, warehouses, products } from '@/shared/api/schema';
import { eq, and, inArray, desc, count } from 'drizzle-orm';
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
    page: z.number().min(1).default(1),
    pageSize: z.number().min(10).max(100).default(20),
});

// --- Actions ---

const adjustInventoryActionInternal = createSafeAction(adjustInventorySchema, async (data, { session }) => {
    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.STOCK_MANAGE);
        console.warn('[supply-chain] 调整库存:', { warehouseId: data.warehouseId, productId: data.productId, tenantId: session.user.tenantId });

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

            const product = await tx.query.products.findFirst({
                where: and(eq(products.id, data.productId), eq(products.tenantId, session.user.tenantId)),
                columns: { purchasePrice: true }
            });

            await tx.insert(inventoryLogs).values({
                tenantId: session.user.tenantId,
                warehouseId: data.warehouseId,
                productId: data.productId,
                type: 'ADJUST',
                quantity: data.quantity,
                balanceAfter: newQty,
                costPrice: product?.purchasePrice || '0', // 记录当前成本
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
    } catch (error) {
        console.error('[supply-chain] 调整库存失败:', error);
        throw error;
    }
});

/**
 * 调整库存数量
 * 
 * @description 手动增加或减少特定仓库中产品的库存量。包含仓库归属校验、变动日志记录及审计日志。
 * @param params 包含以下属性的对象：
 * - `warehouseId` (string): 仓库 ID
 * - `productId` (string): 产品 ID
 * - `quantity` (number): 调整数量（正数为增加，负数为减少）
 * - `reason` (string, optional): 调整原因
 * @returns {Promise<{success: boolean}>} 返回执行结果状态
 * @throws {Error} 未授权、仓库不存在或库存不足时抛出异常
 */
export async function adjustInventory(params: z.infer<typeof adjustInventorySchema>) {
    console.warn('[supply-chain] adjustInventory 开始执行:', {
        warehouseId: params.warehouseId,
        productId: params.productId,
        quantity: params.quantity
    });
    try {
        const result = await adjustInventoryActionInternal(params);
        console.warn('[supply-chain] adjustInventory 执行成功');
        return result;
    } catch (error) {
        console.error('[supply-chain] adjustInventory 执行失败:', error);
        throw error;
    }
}

const transferInventoryActionInternal = createSafeAction(transferInventorySchema, async (data, { session }) => {
    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.STOCK_MANAGE);
        console.warn('[supply-chain] 调拨库存:', { fromWarehouseId: data.fromWarehouseId, toWarehouseId: data.toWarehouseId, tenantId: session.user.tenantId });

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

                const product = await tx.query.products.findFirst({
                    where: and(eq(products.id, item.productId), eq(products.tenantId, session.user.tenantId)),
                    columns: { purchasePrice: true }
                });

                await tx.insert(inventoryLogs).values({
                    tenantId: session.user.tenantId,
                    warehouseId: data.fromWarehouseId,
                    productId: item.productId,
                    type: 'TRANSFER',
                    quantity: -item.quantity,
                    balanceAfter: newSourceQty,
                    costPrice: product?.purchasePrice || '0',
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
                    costPrice: product?.purchasePrice || '0',
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
    } catch (error) {
        console.error('[supply-chain] 调拨库存失败:', error);
        throw error;
    }
});

/**
 * 跨仓库调拨库存
 * 
 * @description 在两个仓库之间转移产品。通过数据库事务确保源仓库扣减、目标仓库增加及变动日志的一致性。
 * @param params 包含以下属性的对象：
 * - `fromWarehouseId` (string): 出库仓库 ID
 * - `toWarehouseId` (string): 入库仓库 ID
 * - `items` (array): 包含 productId 和 quantity 的产品清单
 * - `reason` (string, optional): 调拨原因
 * @returns {Promise<{success: boolean}>} 返回执行结果状态
 * @throws {Error} 未授权、仓库不存在或任一产品库存不足时抛出异常
 */
export async function transferInventory(params: z.infer<typeof transferInventorySchema>) {
    console.warn('[supply-chain] transferInventory 开始执行:', {
        from: params.fromWarehouseId,
        to: params.toWarehouseId,
        itemCount: params.items.length
    });
    try {
        const result = await transferInventoryActionInternal(params);
        console.warn('[supply-chain] transferInventory 执行成功');
        return result;
    } catch (error) {
        console.error('[supply-chain] transferInventory 执行失败:', error);
        throw error;
    }
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

    const offset = (data.page - 1) * data.pageSize;

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
        .where(and(...filters))
        .limit(data.pageSize)
        .offset(offset)
        .orderBy(desc(inventory.updatedAt));

    const [{ total }] = await db
        .select({ total: count() })
        .from(inventory)
        .where(and(...filters));

    return {
        data: results,
        pagination: {
            page: data.page,
            pageSize: data.pageSize,
            total,
            totalPages: Math.ceil(total / data.pageSize)
        }
    };
});

/**
 * 获取库存水平列表
 * 
 * @description 结合产品和仓库名称，分页查询当前租户下的库存余量。支持按仓库和产品 ID 进行过滤。
 * @param params 包含以下属性的对象：
 * - `warehouseId` (string, optional): 仓库 ID 过滤
 * - `productIds` (string[], optional): 产品 ID 数组过滤
 * - `page` (number): 页码
 * - `pageSize` (number): 每页条数
 * @returns {Promise<{data: any[], pagination: any}>} 返回包含库存数据和分页信息的 Promise
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
 * @description 对比当前库存与安全库存 (minStock) 阈值。
 * 分为 CRITICAL (缺货或低于 50% minStock) 和 WARNING (低于 minStock) 两个级别。
 * @param params 包含以下属性的对象：
 * - `warehouseId` (string, optional): 仓库 ID 过滤
 * - `alertThreshold` (number): 缺省安全库存阈值
 * @returns {Promise<{success: boolean, summary: any, alerts: any[]}>} 返回预警汇总和明细列表
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
    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.STOCK_MANAGE);
        console.warn('[supply-chain] 设置安全库存:', { warehouseId: data.warehouseId, productId: data.productId, minStock: data.minStock, tenantId: session.user.tenantId });

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
    } catch (error) {
        console.error('[supply-chain] 设置安全库存失败:', error);
        throw error;
    }
});

/**
 * 设置产品在特定仓库的安全库存阈值
 * 
 * @description 更新或初始化库存记录中的最低库存余量设定。触发审计记录并更新页面缓存。
 * @param params 包含以下属性的对象：
 * - `productId` (string): 产品 ID
 * - `warehouseId` (string): 仓库 ID
 * - `minStock` (number): 目标安全库存数值
 * @returns {Promise<{success: boolean, message: string}>} 返回包含提示消息的执行结果
 * @throws {Error} 无供应链管理权限或数据库更新失败时抛出异常
 */
export async function setminStock(params: z.infer<typeof setminStockSchema>) {
    console.warn('[supply-chain] setminStock 开始执行:', {
        productId: params.productId,
        warehouseId: params.warehouseId,
        minStock: params.minStock
    });
    try {
        const result = await setminStockActionInternal(params);
        console.warn('[supply-chain] setminStock 执行成功');
        return result;
    } catch (error) {
        console.error('[supply-chain] setminStock 执行失败:', error);
        throw error;
    }
}

/**
 * 获取补货建议清单
 * 
 * @description 基于库存预警结果，计算建议补货量（缺口 + 缓冲）。
 * @param warehouseId 可选仓库过滤
 * @returns 补货建议列表
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
