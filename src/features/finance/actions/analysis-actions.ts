'use server';

import { db } from '@/shared/api/db';
import {
    orders,

    purchaseOrderItems,
    installTasks,
    quoteItems
} from '@/shared/api/schema';
import { eq, inArray } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { PERMISSIONS } from '@/shared/config/permissions';

const getOrderProfitSchema = z.object({
    orderId: z.string()
});

export const getOrderProfitability = createSafeAction(getOrderProfitSchema, async ({ orderId }, { session }) => {
    // Ensure permission
    await checkPermission(session, PERMISSIONS.FINANCE.VIEW);

    // 1. Fetch Order and Revenue
    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            leadId: true,
            orderNo: true
        },
        with: {
            quote: true // Assuming 1:1 relation or find via quote.orderId
        }
    });

    if (!order) return { success: false, error: 'Order not found' };

    const revenue = Number(order.totalAmount || 0);

    // 2. Inventory Cost (FIFO) - Stock Items
    // Sum cost from inventory_usage_logs
    // const inventoryCostResult = await db
    //     .select({ total: sql<number>`sum(${inventoryUsageLogs.cost})` })
    //     .from(inventoryUsageLogs)
    //     .where(eq(inventoryUsageLogs.orderId, orderId));

    const inventoryCost = 0; // Number(inventoryCostResult[0]?.total || 0);

    // 3. Direct Material Cost (Non-Stock) - PO Items
    // Strategy: Find all quote items for this order that are potentially non-stock
    let directMaterialCost = 0;

    // Resolve Quote Items
    const quoteId = order.quote?.id;
    const nonStockItemIds: string[] = [];

    if (quoteId) {
        const quoteItemList = await db.query.quoteItems.findMany({
            where: eq(quoteItems.quoteId, quoteId),
            with: {
                product: {
                    columns: { isStockable: true }
                }
            }
        });

        nonStockItemIds.push(...quoteItemList
            .filter(i => i.product && !i.product.isStockable)
            .map(i => i.id)
        );
    }

    if (nonStockItemIds.length > 0) {
        const poItems = await db.query.purchaseOrderItems.findMany({
            where: inArray(purchaseOrderItems.quoteItemId, nonStockItemIds),
            with: {
                po: {
                    columns: { status: true }
                }
            }
        });

        // Sum valid PO items
        for (const pi of poItems) {
            if (pi.po && pi.po.status !== 'CANCELLED') {
                directMaterialCost += Number(pi.subtotal);
            }
        }
    }

    // 4. Labor Cost
    // 4.1 Install Tasks
    const iTasks = await db.query.installTasks.findMany({
        where: eq(installTasks.orderId, orderId)
    });

    // Use actualLaborFee if available, else laborFee (estimated), else 0
    const installCost = iTasks.reduce((sum, t) => {
        const fee = Number(t.actualLaborFee ?? t.laborFee ?? 0);
        return sum + fee;
    }, 0);

    // 4.2 Measure Tasks
    // Note: Measure tasks are linked to Lead, not Order directly.
    // Also, Schema currently lacks 'laborFee' for measure tasks. 
    // We will attempt to fetch but assume 0 if field missing (type safety handled by ignoring if not in type).
    const measureCost = 0;
    // measureCost placeholder until schema updated. 

    const totalCost = inventoryCost + directMaterialCost + installCost + measureCost;
    const grossMargin = revenue - totalCost;
    const marginRate = revenue > 0 ? grossMargin / revenue : 0;

    return {
        success: true,
        data: {
            revenue,
            costs: {
                inventory: inventoryCost,
                directMaterial: directMaterialCost,
                install: installCost,
                measure: measureCost,
                total: totalCost
            },
            grossMargin,
            marginRate
        }
    };
});
