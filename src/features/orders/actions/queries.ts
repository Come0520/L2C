'use server';

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { eq, desc, and, ilike, sql } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';

import { unstable_cache } from 'next/cache';

export async function getOrders(params: { search?: string; page?: number; pageSize?: number }) {
    const session = await auth();
    if (!session) return { success: false, error: 'Unauthorized' };

    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const offset = (page - 1) * pageSize;
    const tenantId = session.user.tenantId;

    const getCachedOrders = unstable_cache(
        async () => {
            const whereClause = and(
                eq(orders.tenantId, tenantId),
                params.search ? ilike(orders.orderNo, `%${params.search}%`) : undefined
            );

            // Get total count (separate query for pagination)
            // Note: In real world, count(*) can be slow. For now it's fine.
            const totalResult = await db.select({ count: sql<number>`count(*)` })
                .from(orders)
                .where(whereClause);

            const total = Number(totalResult[0]?.count || 0);

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
                data,
                total,
                totalPages: Math.ceil(total / pageSize)
            };
        },
        [`orders-${tenantId}-${page}-${pageSize}-${params.search || 'all'}`],
        {
            tags: ['orders', `orders-${tenantId}`],
            revalidate: 60 // 1 minute cache if not revalidated manually
        }
    );

    const result = await getCachedOrders();

    return {
        success: true,
        data: result.data,
        total: result.total,
        totalPages: result.totalPages
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
