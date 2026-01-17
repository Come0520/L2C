'use server';

import { db } from "@/shared/api/db";
import {
    workOrders,
    workOrderItems,
    suppliers,
    orders,
    orderItems,
    products
} from "@/shared/api/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/shared/lib/auth";

export async function createProcessingOrder(data: any) { return { success: true }; }
export async function updateProcessingOrder(id: string, data: any) { return { success: true }; }

export async function getProcessingOrderById({ id }: { id: string }) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const result = await db.select({
        wo: workOrders,
        supplier: suppliers,
        order: orders
    })
        .from(workOrders)
        .leftJoin(suppliers, eq(workOrders.supplierId, suppliers.id))
        .leftJoin(orders, eq(workOrders.orderId, orders.id))
        .where(and(
            eq(workOrders.id, id),
            eq(workOrders.tenantId, session.user.tenantId)
        ));

    const record = result[0];
    if (!record) return { success: false, error: 'Processing order not found' };

    const { wo, supplier, order } = record;

    // Fetch Items
    const items = await db.select({
        woItem: workOrderItems,
        orderItem: orderItems,
        product: products
    })
        .from(workOrderItems)
        .leftJoin(orderItems, eq(workOrderItems.orderItemId, orderItems.id))
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(workOrderItems.woId, wo.id));

    // Map content
    // Note: page expects: poNo, status, processorName, order.orderNo, items with productName, sku, quantity, unitFee
    const mapped = {
        id: wo.id,
        poNo: wo.woNo,
        status: wo.status,
        processorName: supplier?.name || 'Unknown',
        order: {
            orderNo: order?.orderNo || 'Unknown'
        },
        items: items.map(i => ({
            id: i.woItem.id,
            productName: i.orderItem?.productName || 'Unknown Product',
            sku: i.product?.sku || '-',
            quantity: i.orderItem?.quantity || 1, // fallback
            unitFee: 0, // Mock
        })),
        estimatedFee: 0,
        actualFee: 0,
        remark: wo.remark
    };

    return { success: true, data: mapped };
}
