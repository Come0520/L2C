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

const orderTrendSchema = z.object({
    startDate: z.string(),
    endDate: z.string(),
    granularity: z.enum(['day', 'week', 'month']).default('day'),
});

/**
 * 获取订单趋势数据
 * 支持按日/周/月粒度聚合
 */
const getOrderTrendAction = createSafeAction(orderTrendSchema, async (params, { session }) => {
    await checkPermission(session, ANALYTICS_PERMISSIONS.VIEW);

    const tenantId = session.user.tenantId;
    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);

    return unstable_cache(
        async () => {
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

            return trend.map(item => ({
                date: item.date instanceof Date ? item.date.toISOString().split('T')[0] : String(item.date).split(' ')[0],
                amount: item.totalAmount,
                count: item.orderCount,
            }));
        },
        [`order-trend-${tenantId}-${params.granularity}-${startDate.getTime()}-${endDate.getTime()}`],
        { tags: [`analytics-${tenantId}`, 'analytics-trend'], revalidate: 3600 }
    )();
});

export async function getOrderTrend(params: z.infer<typeof orderTrendSchema>) {
    return getOrderTrendAction(params);
}
