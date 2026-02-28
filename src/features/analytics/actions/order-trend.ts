"use server";

/**
 * 订单趋势 — getOrderTrend
 */

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { eq, and, gte, lte, sql, SQL } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { ANALYTICS_PERMISSIONS } from '../constants';
import { logger } from '@/shared/lib/logger';

const orderTrendSchema = z.object({
    startDate: z.string(),
    endDate: z.string(),
    granularity: z.enum(['day', 'week', 'month']).default('day'),
});

/**
 * 获取订单趋势分析 (Get Order Trend Analysis)
 * 
 * 分析指定时间范围内和粒度（日/周/月）的订单趋势，聚合订单总金额和订单数。
 * 结果通过 `unstable_cache` 进行缓存。
 * 
 * 权限要求: ANALYTICS_PERMISSIONS.VIEW
 *
 * @param {z.infer<typeof orderTrendSchema>} params - 查询参数，包含聚合粒度和起始/结束日期
 * @returns {Promise<Array>} 包含每个时间周期的聚合数据的数组
 * @throws {Error} 如果在执行数据库查询时发生错误
 */
const getOrderTrendAction = createSafeAction(orderTrendSchema, async (params, { session }) => {
    await checkPermission(session, ANALYTICS_PERMISSIONS.VIEW);

    const tenantId = session.user.tenantId;
    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);

    return unstable_cache(
        async () => {
            logger.info('获取订单趋势分析开始 (Starting getOrderTrend)', { tenantId, params });
            try {
                let dateTruncate: SQL;
                switch (params.granularity) {
                    case 'week': dateTruncate = sql`DATE_TRUNC('week', ${orders.createdAt})`; break;
                    case 'month': dateTruncate = sql`DATE_TRUNC('month', ${orders.createdAt})`; break;
                    default: dateTruncate = sql`DATE_TRUNC('day', ${orders.createdAt})`;
                }

                const trend = await db
                    .select({
                        date: dateTruncate,
                        totalAmount: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
                        orderCount: sql<number>`COUNT(*)`,
                    })
                    .from(orders)
                    .where(and(eq(orders.tenantId, tenantId), gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
                    .groupBy(dateTruncate)
                    .orderBy(dateTruncate);

                logger.info('获取订单趋势分析成功 (Successfully fetched order trend)', { tenantId, resultCount: trend.length });

                return trend.map(item => ({
                    date: item.date instanceof Date ? item.date.toISOString().split('T')[0] : String(item.date).split(' ')[0],
                    amount: item.totalAmount,
                    count: item.orderCount,
                }));
            } catch (error) {
                logger.error('获取订单趋势分析失败 (Failed to fetch order trend)', { tenantId, error });
                throw new Error('获取数据失败');
            }
        },
        [`order-trend-${tenantId}-${params.granularity}-${startDate.toDateString()}-${endDate.toDateString()}`],
        { tags: [`analytics-${tenantId}`, 'analytics-trend'], revalidate: 3600 }
    )();
});

export async function getOrderTrend(params: z.infer<typeof orderTrendSchema>) {
    return getOrderTrendAction(params);
}
