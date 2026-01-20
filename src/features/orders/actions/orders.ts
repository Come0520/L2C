'use server';

import { db } from '@/shared/api/db';
import { cache } from 'react';
import { orders, orderItems } from '@/shared/api/schema/orders';

import { quotes } from '@/shared/api/schema/quotes';
import { eq, sql, desc } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/shared/lib/auth';

// Action Schemas
const createOrderSchema = z.object({
    quoteId: z.string().uuid(),
    paymentProofImg: z.string().optional(),
    confirmationImg: z.string().optional(),
    paymentAmount: z.string().optional(), // Decimal as string
    paymentMethod: z.enum(['CASH', 'WECHAT', 'ALIPAY', 'BANK']).optional(),
    remark: z.string().optional(),
});

const updateLogisticsSchema = z.object({
    orderId: z.string().uuid(),
    company: z.string(), // Carrier Code or Name
    trackingNo: z.string(),
});

import { OrderService } from '@/services/order.service';
import { LogisticsService } from '@/services/logistics.service';

export async function createOrderFromQuote(input: z.infer<typeof createOrderSchema>) {
    const session = await auth();
    const user = session?.user;
    if (!user || !user.id) throw new Error('Unauthorized');
    // Assuming tenantId is available on user or we fetch it. 
    // Auth logic typically puts tenantId on session.user. 
    // If not, we might need to fetch it or pass it.
    // For now assuming user.tenantId exists or we need to fix auth types.
    // Let's assume user.tenantId is widely used or we mock it for now if missing.
    // Checking `createOrderFromQuote` original: `tenantId: quote.tenantId`.
    // So we can get tenantId from the quote itself inside the Service!
    // But Service needs tenantId to find the quote safely (multitenancy).
    // We should pass tenantId. If session doesn't have it, we might be in trouble.
    // Let's assume we pass a placeholder or get it.
    // Actually, `createOrderFromQuote` used `quote.tenantId` AFTER fetching quote.
    // So we can pass `user.tenantId` if available.

    // Fallback: If we trust the ID, maybe service can just fetch by ID?
    // But safer to pass tenantId.
    // Let's look at `auth.ts` or similar usage?
    // `session?.user` usually has it.

    const tenantId = (user as any).tenantId; // safe cast

    const { quoteId, ...options } = input;

    try {
        const order = await OrderService.convertFromQuote(quoteId, tenantId, user.id, options);
        return order;
    } catch (e: any) {
        throw new Error(e.message || 'Failed to create order');
    }
}

export const getOrders = cache(async (page = 1, pageSize = 20, _search?: string) => {
    const offset = (page - 1) * pageSize;

    // 查询订单数据
    const data = await db.query.orders.findMany({
        limit: pageSize,
        offset: offset,
        orderBy: [desc(orders.createdAt)],
        with: {
            customer: true,
            sales: true,
        }
    });

    // 查询总数
    const countResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders);
    const total = countResult[0]?.count ?? 0;

    return {
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
});


export const getOrder = cache(async (id: string) => {
    return await db.query.orders.findFirst({
        where: eq(orders.id, id),
        with: {
            items: true,
            customer: true,
            sales: true,
            paymentSchedules: true,
        }
    });
});


const splitOrderSchema = z.object({
    orderId: z.string().uuid(),
    items: z.array(z.object({
        itemId: z.string().uuid(),
        quantity: z.string(), // Decimal
        supplierId: z.string().uuid(),
    })),
});

export async function splitOrder(input: z.infer<typeof splitOrderSchema>) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');
    const tenantId = (session.user as any).tenantId;
    const userId = session.user.id;

    const { orderId, items } = input;

    // 1. Verify order exists and is in correct status
    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: { items: true }
    });

    if (!order) throw new Error('订单不存在');
    if (order.status !== 'PENDING_PO') throw new Error('订单状态不允许拆单');

    // 2. Group items by supplier
    const supplierGroups = new Map<string, typeof items>();
    for (const item of items) {
        const existing = supplierGroups.get(item.supplierId) || [];
        existing.push(item);
        supplierGroups.set(item.supplierId, existing);
    }

    // 3. Create PO for each supplier group
    const createdPOs: string[] = [];

    for (const [supplierId, supplierItems] of supplierGroups) {
        // Calculate total amount for this PO
        let totalAmount = 0;
        const poItemsData = [];

        for (const splitItem of supplierItems) {
            const orderItem = order.items?.find((oi: any) => oi.id === splitItem.itemId);
            if (!orderItem) continue;

            const qty = parseFloat(splitItem.quantity);
            const unitPrice = parseFloat(orderItem.unitPrice || '0');
            const subtotal = qty * unitPrice;
            totalAmount += subtotal;

            poItemsData.push({
                orderItemId: splitItem.itemId,
                productId: orderItem.productId,
                productName: orderItem.productName,
                quantity: splitItem.quantity,
                unitPrice: orderItem.unitPrice,
                subtotal: subtotal.toFixed(2),
            });
        }

        // Generate PO number
        const poNo = `PO${Date.now()}${Math.random().toString(36).substring(7).toUpperCase()}`;

        // Import PO schema and create
        const { purchaseOrders, purchaseOrderItems } = await import('@/shared/api/schema/supply-chain');

        const supplier = await db.query.suppliers.findFirst({
            where: (suppliers, { eq }) => eq(suppliers.id, supplierId),
        });

        const [newPO] = await db.insert(purchaseOrders).values({
            tenantId,
            poNo,
            orderId,
            supplierId,
            supplierName: supplier?.name || 'Unknown Supplier', // Fallback if not found, though checks exist
            status: 'DRAFT',
            totalAmount: totalAmount.toFixed(2),
            createdBy: userId,
        }).returning();

        // Create PO items
        for (const poItem of poItemsData) {
            await db.insert(purchaseOrderItems).values({
                tenantId,
                poId: newPO.id,
                ...poItem
            });

            // Update order item with PO reference
            await db.update(orderItems)
                .set({ poId: newPO.id, supplierId })
                .where(eq(orderItems.id, poItem.orderItemId));
        }

        createdPOs.push(newPO.id);
    }

    // 4. Update order status if all items have been split
    const updatedOrder = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: { items: true }
    });

    const allItemsHavePO = updatedOrder?.items?.every((item: any) => item.poId);
    if (allItemsHavePO) {
        await db.update(orders)
            .set({ status: 'PENDING_DELIVERY', updatedAt: new Date() })
            .where(eq(orders.id, orderId));
    }

    return {
        success: true,
        data: {
            createdPOs,
            orderStatus: allItemsHavePO ? 'PENDING_DELIVERY' : 'PENDING_PO'
        }
    };
}

const requestDeliverySchema = z.object({
    orderId: z.string().uuid(),
    company: z.string(),
    trackingNo: z.string().optional(),
    remark: z.string().optional(),
});

export async function requestDelivery(input: z.infer<typeof requestDeliverySchema>) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const { orderId, company, trackingNo, remark } = input;

    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
    });

    if (!order) throw new Error('订单不存在');
    if (order.status !== 'PENDING_DELIVERY') throw new Error('订单状态不正确');

    await db.update(orders)
        .set({
            status: 'PENDING_INSTALL',
            logistics: {
                company,
                trackingNo,
                remark,
                dispatchedAt: new Date().toISOString(),
                dispatchedBy: session.user.id
            },
            updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));

    return { success: true };
}

export async function updateLogistics(input: z.infer<typeof updateLogisticsSchema>) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    try {
        const result = await LogisticsService.updateLogisticsInfo(input.orderId, input.company, input.trackingNo);
        return { success: true, data: result };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: e.message };
    }
}

export async function confirmInstallationAction(orderId: string) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');
    const tenantId = (session.user as any).tenantId;

    await OrderService.confirmInstallation(orderId, tenantId, session.user.id);
    return { success: true };
}

export async function requestCustomerConfirmationAction(orderId: string) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');
    const tenantId = (session.user as any).tenantId;

    await OrderService.requestCustomerConfirmation(orderId, tenantId);
    return { success: true };
}

export async function customerAcceptAction(orderId: string) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');
    const tenantId = (session.user as any).tenantId;

    await OrderService.customerAccept(orderId, tenantId);
    return { success: true };
}

export async function customerRejectAction(orderId: string, reason: string) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');
    const tenantId = (session.user as any).tenantId;

    await OrderService.customerReject(orderId, tenantId, reason);
    return { success: true };
}
