'use server';

import { db } from '@/shared/api/db';
import {
    orders,
    purchaseOrderItems,
    measureTasks,
    inventoryLogs,
    products,
    channelCommissions,
    quoteItems,
    installTasks
} from '@/shared/api/schema';
import { eq, inArray, and, sql } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { PERMISSIONS } from '@/shared/config/permissions';
import { Decimal } from 'decimal.js';
import { AuditService } from '@/shared/services/audit-service';

/**
 * 获取订单利润数据的请求参数验证 Schema
 */
const getOrderProfitSchema = z.object({
    orderId: z.string().describe('需要进行利润分析分析和测算的系统对应订单主键 ID (order UUID)')
});

const getOrderProfitabilityInternal = createSafeAction(getOrderProfitSchema, async ({ orderId }, { session }) => {
    // 权限检查 (Permission check)
    await checkPermission(session, PERMISSIONS.FINANCE.VIEW);
    const tenantId = session.user.tenantId;

    // 1. 获取订单与营收 (Fetch Order and Revenue)
    const order = await db.query.orders.findFirst({
        where: and(
            eq(orders.id, orderId),
            eq(orders.tenantId, tenantId)
        ),
        columns: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            leadId: true,
            orderNo: true
        },
        with: {
            quote: true
        }
    });

    if (!order) return { success: false, error: '订单不存在或无权限访问' };

    const revenue = new Decimal(order.totalAmount || '0');

    // 2. 库存成本估算 (Inventory Cost Estimation)
    // 策略：通过库存流水关联订单，并按当前采购价估算（若流水中无历史成本记录）
    /**
     * @note 业务演进说明 [F-13]
     * 长期高阶方案建议在 `inventory_logs` 写入阶段直接固化当时的实际出库成本，
     * 以防止物资采购单价波动导致历史利润测算不精确。当前版本采用产品基准价估算。
     */
    const inventoryCostResult = await db
        .select({
            totalCost: sql<string>`sum(ABS(${inventoryLogs.quantity}) * ${products.purchasePrice})`
        })
        .from(inventoryLogs)
        .innerJoin(products, eq(inventoryLogs.productId, products.id))
        .where(and(
            eq(inventoryLogs.referenceId, orderId),
            eq(inventoryLogs.referenceType, 'ORDER'),
            eq(inventoryLogs.tenantId, tenantId),
            eq(inventoryLogs.type, 'OUT')
        ));

    const inventoryCost = new Decimal(inventoryCostResult[0]?.totalCost || '0');

    // 3. 直接材料成本 (非库存品) - 采购单项 (Direct Material Cost - PO Items)
    let directMaterialCost = new Decimal(0);
    const quoteId = order.quote?.id;

    if (quoteId) {
        // 获取该报价下所有非库存商品项
        const quoteItemList = await db.query.quoteItems.findMany({
            where: and(
                eq(quoteItems.quoteId, quoteId),
                eq(quoteItems.tenantId, tenantId)
            ),
            with: {
                product: {
                    columns: { isStockable: true }
                }
            }
        });

        const nonStockItemIds = quoteItemList
            .filter(i => i.product && !i.product.isStockable)
            .map(i => i.id);

        if (nonStockItemIds.length > 0) {
            const poItems = await db.query.purchaseOrderItems.findMany({
                where: and(
                    eq(purchaseOrderItems.tenantId, tenantId),
                    inArray(purchaseOrderItems.quoteItemId, nonStockItemIds)
                ),
                with: {
                    po: {
                        columns: { status: true }
                    }
                }
            });

            // 汇总有效采购单的成本
            for (const pi of poItems) {
                if (pi.po && pi.po.status !== 'CANCELLED') {
                    directMaterialCost = directMaterialCost.plus(new Decimal(pi.subtotal || '0'));
                }
            }
        }
    }

    // 4. 加工与安装劳务成本 (Labor Cost)
    // 4.1 安装任务成本
    const iTasks = await db.query.installTasks.findMany({
        where: and(
            eq(installTasks.orderId, orderId),
            eq(installTasks.tenantId, tenantId)
        ),
        columns: {
            laborFee: true,
            actualLaborFee: true
        }
    });

    const installCost = iTasks.reduce((sum, t) => {
        const fee = new Decimal(t.actualLaborFee ?? t.laborFee ?? 0);
        return sum.plus(fee);
    }, new Decimal(0));

    // 4.2 量尺任务成本
    let measureCost = new Decimal(0);
    if (order.leadId) {
        const mTasks = await db.query.measureTasks.findMany({
            where: and(
                eq(measureTasks.leadId, order.leadId),
                eq(measureTasks.tenantId, tenantId)
            ),
            columns: {
                laborFee: true,
                actualLaborFee: true
            }
        });

        const mCost = mTasks.reduce((sum, t) => {
            const fee = new Decimal(t.actualLaborFee ?? t.laborFee ?? 0);
            return sum.plus(fee);
        }, new Decimal(0));
        measureCost = mCost;
    }

    // 5. 佣金成本 (Commission Cost)
    // 聚合该订单下所有已结算或待结算的渠道佣金记录
    const commissionResult = await db
        .select({
            totalAmount: sql<string>`sum(${channelCommissions.amount})`
        })
        .from(channelCommissions)
        .where(and(
            eq(channelCommissions.orderId, orderId),
            eq(channelCommissions.tenantId, tenantId),
            inArray(channelCommissions.status, ['PENDING', 'SETTLED', 'PAID'])
        ));

    const commissionCost = new Decimal(commissionResult[0]?.totalAmount || '0');

    const totalCost = inventoryCost.plus(directMaterialCost).plus(installCost).plus(measureCost).plus(commissionCost);
    const grossMargin = revenue.minus(totalCost);
    const marginRate = revenue.gt(0)
        ? grossMargin.div(revenue).toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber()
        : 0;

    // 记录审计日志 F-32
    await AuditService.log(db, {
        tenantId,
        userId: session.user.id!,
        action: 'VIEW', // 分析属于查看类，但记录审计以备查核
        tableName: 'orders',
        recordId: orderId,
        details: {
            type: 'PROFIT_ANALYSIS',
            orderNo: order.orderNo,
            revenue: revenue.toFixed(2, Decimal.ROUND_HALF_UP),
            totalCost: totalCost.toFixed(2, Decimal.ROUND_HALF_UP),
            grossMargin: grossMargin.toFixed(2, Decimal.ROUND_HALF_UP)
        }
    });

    return {
        success: true,
        data: {
            revenue: revenue.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
            costs: {
                inventory: inventoryCost.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
                directMaterial: directMaterialCost.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
                install: installCost.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
                measure: measureCost.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
                commission: commissionCost.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
                total: totalCost.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber()
            },
            grossMargin: grossMargin.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
            marginRate
        }
    };
});

/**
 * 获取并在系统中动态核算某一特定订单的整体盈利状况。
 * 本方法会综合库存材料、非库存材料采买、安装费用、服务量测等费用评估总毛利率。
 * 
 * @param params `{ orderId: string }`
 * @returns Object 包含总计营收、详细成本清单、以及总毛利额和当前利润比。
 */
export async function getOrderProfitability(params: z.infer<typeof getOrderProfitSchema>) {
    return getOrderProfitabilityInternal(params);
}
