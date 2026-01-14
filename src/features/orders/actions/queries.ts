'use server';

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { eq, desc, and, ilike } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';

export async function getOrders(params: { search?: string; page?: number; pageSize?: number }) {
    const session = await auth();
    if (!session) return { success: false, error: 'Unauthorized' };

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const offset = (page - 1) * pageSize;

    const whereClause = and(
        eq(orders.tenantId, session.user.tenantId),
        params.search ? ilike(orders.orderNo, `%${params.search}%`) : undefined
    );

    const data = await db.query.orders.findMany({
        where: whereClause,
        with: {
            customer: true,
            sales: true,
        },
        limit: pageSize,
        offset: offset,
        orderBy: [desc(orders.createdAt)],
    });

    return {
        success: true,
        data,
    };
}

export async function getOrderById(id: string) {
    const session = await auth();
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    const order = await db.query.orders.findFirst({
        where: eq(orders.id, id),
        with: {
            customer: true,
            sales: true,
            items: true,
            quote: {
                with: {
                    lead: true
                }
            },
        },
    });

    if (!order) return { success: false, error: 'Order not found' };

    return { success: true, data: order };
}
