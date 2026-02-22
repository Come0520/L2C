'use server';

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { eq, desc, and, ilike, sql, inArray, count } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { auth } from '@/shared/lib/auth';
import { orderItems, paymentSchedules } from '@/shared/api/schema/orders';

// Schema 定义
const getOrdersSchema = z.object({
    search: z.string().optional(),
    page: z.number().default(1),
    pageSize: z.number().default(10),
    status: z.union([z.string(), z.array(z.string())]).optional(),
    salesId: z.string().optional(),
    channelId: z.string().optional(),
    dateRange: z.object({
        from: z.date(),
        to: z.date().optional()
    }).optional(),
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

    // Cache key needs to include all filter parameters
    const statusKey = Array.isArray(params.status) ? params.status.sort().join(',') : (params.status || 'all');
    const salesIdKey = params.salesId || 'all';
    const channelIdKey = params.channelId || 'all';
    const dateRangeKey = params.dateRange ? `${params.dateRange.from.getTime()}-${params.dateRange.to?.getTime() || 'none'}` : 'none';

    // 缓存失效策略：基于租户的 tag 过滤 (Next.js 15+ 推荐模式)
    // 当订单发生增删改时，通过 revalidateTag(`orders-${tenantId}`) 批量失效
    const getCachedOrders = unstable_cache(
        async () => {
            const conditions: (ReturnType<typeof eq> | ReturnType<typeof ilike> | ReturnType<typeof and>)[] = [
                eq(orders.tenantId, tenantId)
            ];

            if (params.search) {
                conditions.push(ilike(orders.orderNo, `%${params.search}%`));
            }

            if (params.status) {
                if (Array.isArray(params.status) && params.status.length > 0) {
                    conditions.push(inArray(orders.status, params.status as (typeof orders.status._.data)[]));
                } else if (typeof params.status === 'string' && params.status !== 'ALL') {
                    conditions.push(eq(orders.status, params.status as (typeof orders.status._.data)));
                }
            }

            if (params.salesId) {
                conditions.push(eq(orders.salesId, params.salesId));
            }

            if (params.channelId) {
                conditions.push(eq(orders.channelId, params.channelId));
            }

            if (params.dateRange?.from) {
                conditions.push(sql`${orders.createdAt} >= ${params.dateRange.from.toISOString()}`);
                if (params.dateRange.to) {
                    conditions.push(sql`${orders.createdAt} <= ${params.dateRange.to.toISOString()}`);
                }
            }

            const whereClause = and(...conditions);

            const totalResult = await db.select({ count: sql<number>`count(*)` })
                .from(orders)
                .where(whereClause);

            const total = Number(totalResult[0]?.count || 0);

            const data = await db.query.orders.findMany({
                where: whereClause,
                with: {
                    customer: true,
                    sales: true,
                    items: true, // Often needed in lists for previews
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
        [`orders-${tenantId}-${page}-${pageSize}-${params.search || 'all'}-${statusKey}-${salesIdKey}-${channelIdKey}-${dateRangeKey}`],
        {
            tags: ['orders', `orders-${tenantId}`],
            revalidate: 60
        }
    );

    const result = await getCachedOrders();

    return {
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
            // 基础信息不再包含 items 和 paymentSchedules，改由专用 Action 查询
        },
    });

    if (!order) throw new Error('Order not found');

    const getCachedOrder = unstable_cache(
        async () => order,
        [`order-detail-${params.id}`],
        {
            tags: ['orders', `order-detail-${params.id}`],
            revalidate: 30 // 详情缓存 30 秒
        }
    );

    return getCachedOrder();
});

/**
 * 获取订单明细项 Action。
 * 
 * @description 根据订单 ID 查询关联的所有明细项。
 * 性能优化：
 * 1. 按需加载：通过专用 Action 加载明细，避免主列表查询过重。
 * 2. 缓存：使用 `unstable_cache` 缓存明细数据 (60s)，显著提升详情页二次访问速度。
 * 3. 结果解耦：缓存 Key 与订单项 ID 绑定。
 * 
 * @param orderId 待查询详情的订单 ID
 * @returns 包含订单项列表的返回对象 `{ success: true, data: items }`
 */
export async function getOrderItems(orderId: string) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    // 权限检查省略...
    const getCachedItems = unstable_cache(
        async () => {
            return await db.query.orderItems.findMany({
                where: eq(orderItems.orderId, orderId),
                orderBy: (items, { asc }) => [asc(items.id)]
            });
        },
        [`order-items-${orderId}`],
        {
            tags: ['order-items', `order-items-${orderId}`],
            revalidate: 60 // 缓存 60 秒
        }
    );

    const items = await getCachedItems();
    return { success: true, data: items };
}

/**
 * 获取订单收款计划 Action。
 * 
 * @description 查询订单关联的财务收款计划表。
 * 性能优化：
 * 1. 独立加载：财务数据与订单主表分离，优化首页加载。
 * 2. 缓存维护：缓存时间 60s，配合 `order-payment-schedules` Tag 进行失效管理。
 * 
 * @param orderId 待查询收款计划的订单 ID
 * @returns 包含收款计划列表的返回对象 `{ success: true, data: schedules }`
 */
export async function getOrderPaymentSchedules(orderId: string) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');

    const getCachedSchedules = unstable_cache(
        async () => {
            return await db.query.paymentSchedules.findMany({
                where: eq(paymentSchedules.orderId, orderId),
                orderBy: (s, { asc }) => [asc(s.createdAt)]
            });
        },
        [`order-payment-schedules-${orderId}`],
        {
            tags: ['order-payment-schedules', `order-payment-schedules-${orderId}`],
            revalidate: 60 // 缓存 60 秒
        }
    );

    const schedules = await getCachedSchedules();
    return { success: true, data: schedules };
}

/**
 * 安全导出获取订单列表请求，主要用于分页和条件查询
 *
 * @param params 分页与搜索参数对象
 * @returns 订单查询的结果与分页信息
 */
export async function getOrders(params: z.infer<typeof getOrdersSchema>) {
    return getOrdersInternal(params);
}

/**
 * 安全导出根据订单 ID 获取单条订单详情的请求
 *
 * @param id 订单 ID 
 * @returns 包含顾客及销售关联信息的完整订单对象
 */
export async function getOrderById(id: string) {
    return getOrderByIdInternal({ id });
}
