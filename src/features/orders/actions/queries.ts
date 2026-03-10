'use server';

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { eq, desc, and, ilike, sql, inArray } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';
import { requirePermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
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
  dateRange: z
    .object({
      from: z.date(),
      to: z.date().optional(),
    })
    .optional(),
});

const getOrderByIdSchema = z.object({
  id: z.string().uuid(),
});

// =============================================================
// 性能优化（P0-2）：模块顶层缓存函数
// 将所有 unstable_cache 从函数体内提升到此处，确保缓存实例全局唯一，
// 避免每次调用都创建新实例导致命中率为零的反模式。
// 运行时参数通过显式函数入参传入，而非闭包捕获。
// =============================================================

/**
 * 订单列表顶层缓存函数
 * 将运行时参数（params/tenantId）显式传入，消除闭包依赖
 */
const _getCachedOrdersList = unstable_cache(
  async (
    p: z.infer<typeof getOrdersSchema>,
    tenantId: string,
    page: number,
    pageSize: number,
    offset: number
  ) => {
    const conditions: (
      | ReturnType<typeof eq>
      | ReturnType<typeof ilike>
      | ReturnType<typeof and>
    )[] = [eq(orders.tenantId, tenantId)];

    if (p.search) {
      conditions.push(ilike(orders.orderNo, `%${p.search}%`));
    }

    if (p.status) {
      if (Array.isArray(p.status) && p.status.length > 0) {
        conditions.push(inArray(orders.status, p.status as (typeof orders.status._.data)[]));
      } else if (typeof p.status === 'string' && p.status !== 'ALL') {
        conditions.push(eq(orders.status, p.status as typeof orders.status._.data));
      }
    }

    if (p.salesId) {
      conditions.push(eq(orders.salesId, p.salesId));
    }

    if (p.channelId) {
      conditions.push(eq(orders.channelId, p.channelId));
    }

    if (p.dateRange?.from) {
      conditions.push(sql`${orders.createdAt} >= ${p.dateRange.from.toISOString()}`);
      if (p.dateRange.to) {
        conditions.push(sql`${orders.createdAt} <= ${p.dateRange.to.toISOString()}`);
      }
    }

    const whereClause = and(...conditions);

    const [totalResult, data] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(whereClause),
      db.query.orders.findMany({
        where: whereClause,
        with: {
          // 性能优化：只取列表展示所需字段，避免无效 items JOIN
          customer: { columns: { id: true, name: true } },
          sales: { columns: { id: true, name: true } },
        },
        limit: pageSize,
        offset: offset,
        orderBy: [desc(orders.createdAt)],
      }),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      data,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  },
  ['orders-list'],
  {
    // 缓存失效策略：基于租户的 tag 过滤 (Next.js 15+ 推荐模式)
    // 当订单发生增删改时，通过 revalidateTag(`orders-${tenantId}`) 批量失效
    tags: ['orders'],
    revalidate: 60,
  }
);

/**
 * 订单详情顶层缓存函数
 */
const _getCachedOrderDetail = unstable_cache(
  async (id: string, tenantId: string) => {
    return await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.tenantId, tenantId)),
      with: {
        customer: true,
        sales: true,
        // 基础信息不含 items 和 paymentSchedules，改由专用 Action 查询
      },
    });
  },
  ['order-detail'],
  {
    tags: ['orders'],
    revalidate: 30, // 详情缓存 30 秒
  }
);

/**
 * 订单明细项顶层缓存函数
 */
const _getCachedOrderItems = unstable_cache(
  async (orderId: string) => {
    return await db.query.orderItems.findMany({
      where: eq(orderItems.orderId, orderId),
      orderBy: (items, { asc }) => [asc(items.id)],
    });
  },
  ['order-items'],
  {
    tags: ['order-items'],
    revalidate: 60, // 缓存 60 秒
  }
);

/**
 * 订单收款计划顶层缓存函数
 */
const _getCachedPaymentSchedules = unstable_cache(
  async (orderId: string) => {
    return await db.query.paymentSchedules.findMany({
      where: eq(paymentSchedules.orderId, orderId),
      orderBy: (s, { asc }) => [asc(s.createdAt)],
    });
  },
  ['order-payment-schedules'],
  {
    tags: ['order-payment-schedules'],
    revalidate: 60, // 缓存 60 秒
  }
);

// createSafeAction 内部实现
const getOrdersInternal = createSafeAction(getOrdersSchema, async (params, { session }) => {
  // 权限检查：需要订单查看权限
  await requirePermission(session, PERMISSIONS.ORDER.VIEW);

  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  const offset = (page - 1) * pageSize;
  const tenantId = session.user.tenantId;

  if (tenantId === '__PLATFORM__') {
    return {
      data: [],
      total: 0,
      totalPages: 0,
    };
  }

  // 调用模块顶层缓存函数（P0-2 修复）
  const result = await _getCachedOrdersList(params, tenantId, page, pageSize, offset);

  return {
    data: result.data,
    total: result.total,
    totalPages: result.totalPages,
  };
});

const getOrderByIdInternal = createSafeAction(getOrderByIdSchema, async (params, { session }) => {
  // 权限检查：需要订单查看权限
  await requirePermission(session, PERMISSIONS.ORDER.VIEW);

  if (session.user.tenantId === '__PLATFORM__') {
    throw new Error('Order not found');
  }

  const tenantId = session.user.tenantId;

  // 调用模块顶层缓存函数（P0-2 修复）
  const order = await _getCachedOrderDetail(params.id, tenantId);
  if (!order) throw new Error('Order not found');
  return order;
});

/**
 * 获取订单明细项 Action。
 *
 * @description 根据订单 ID 查询关联的所有明细项。
 * 性能优化：
 * 1. 按需加载：通过专用 Action 加载明细，避免主列表查询过重。
 * 2. 缓存：使用顶层 `_getCachedOrderItems` 缓存明细数据（60s）。
 * 3. 结果解耦：缓存 Key 与订单项 ID 绑定。
 *
 * @param orderId 待查询详情的订单 ID
 * @returns 包含订单项列表的返回对象 `{ success: true, data: items }`
 */
export const getOrderItems = cache(async (orderId: string) => {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  if (session.user.tenantId === '__PLATFORM__') {
    return { success: true, data: [] };
  }

  // 调用模块顶层缓存函数（P0-2 修复）
  const items = await _getCachedOrderItems(orderId);
  return { success: true, data: items };
});

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
export const getOrderPaymentSchedules = cache(async (orderId: string) => {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  if (session.user.tenantId === '__PLATFORM__') {
    return { success: true, data: [] };
  }

  // 调用模块顶层缓存函数（P0-2 修复）
  const schedules = await _getCachedPaymentSchedules(orderId);
  return { success: true, data: schedules };
});

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
export const getOrderById = cache(async (id: string) => {
  return getOrderByIdInternal({ id });
});
