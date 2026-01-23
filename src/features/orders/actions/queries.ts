'use server';

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { eq, desc, and, ilike, sql } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';

// Schema 定义
const getOrdersSchema = z.object({
    search: z.string().optional(),
    page: z.number().default(1),
    pageSize: z.number().default(10),
});

const getOrderByIdSchema = z.object({
    id: z.string().uuid(),
});

// createSafeAction 内部实现
const getOrdersInternal = createSafeAction(getOrdersSchema, async (params, { session }) => {
    // 权限检查：需要订单查看权限
    await checkPermission(session, PERMISSIONS.ORDER.VIEW);

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
            revalidate: 60
        }
    );

    const result = await getCachedOrders();

    return {
        success: true,
        data: result.data,
        total: result.total,
        totalPages: result.totalPages
    };
});

const getOrderByIdInternal = createSafeAction(getOrderByIdSchema, async (params, { session }) => {
    // 权限检查：需要订单查看权限
    await checkPermission(session, PERMISSIONS.ORDER.VIEW);

    const order = await db.query.orders.findFirst({
        where: and(
            eq(orders.id, params.id),
            eq(orders.tenantId, session.user.tenantId)
        ),
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
});

// 导出函数
export async function getOrders(params: z.infer<typeof getOrdersSchema>) {
    return getOrdersInternal(params);
}

export async function getOrderById(id: string) {
    return getOrderByIdInternal({ id });
}
