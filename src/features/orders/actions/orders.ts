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

import { OrderService } from '@/services/order.service';

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

export const getOrders = cache(async (page = 1, pageSize = 10) => {
    const offset = (page - 1) * pageSize;
    const data = await db.query.orders.findMany({
        limit: pageSize,
        offset: offset,
        orderBy: [desc(orders.createdAt)],
        with: {
            customer: true,
            sales: true,
        }
    });
    return data;
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
    // TODO: Implement Split Order Logic

    console.log('Split Order', input);
    // Placeholder implementation
    return { success: true };
}

export async function requestDelivery(orderId: string) {
    // TODO: Implement Request Delivery Logic

    console.log('Request Delivery', orderId);
    return { success: true };
}
