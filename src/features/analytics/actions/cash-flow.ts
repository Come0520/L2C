/**
 * 现金流预测 — getCashFlowForecast
 */

import { db } from '@/shared/api/db';
import { orders, paymentSchedules } from '@/shared/api/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { ANALYTICS_PERMISSIONS } from '../constants';

const cashFlowForecastSchema = z.object({
    forecastDays: z.number().optional().default(90),
});

/**
 * 获取现金流预测数据
 * 基于 paymentSchedules 表预测未来回款
 */
const getCashFlowForecastAction = createSafeAction(cashFlowForecastSchema, async (params, { session }) => {
    await checkPermission(session, ANALYTICS_PERMISSIONS.VIEW);

    const today = new Date();
    const forecastEndDate = new Date();
    forecastEndDate.setDate(today.getDate() + params.forecastDays);

    const todayStr = today.toISOString().split('T')[0];
    const forecastEndDateStr = forecastEndDate.toISOString().split('T')[0];
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            const weeklyForecast = await db.select({
                weekStart: sql<string>`DATE_TRUNC('week', ${paymentSchedules.expectedDate})::date`,
                totalAmount: sql<number>`SUM(${paymentSchedules.amount})`,
                count: sql<number>`COUNT(*)`,
            }).from(paymentSchedules).innerJoin(orders, eq(paymentSchedules.orderId, orders.id))
                .where(and(
                    eq(paymentSchedules.tenantId, tenantId), eq(paymentSchedules.status, 'PENDING'),
                    gte(paymentSchedules.expectedDate, todayStr), lte(paymentSchedules.expectedDate, forecastEndDateStr)
                )).groupBy(sql`DATE_TRUNC('week', ${paymentSchedules.expectedDate})`)
                .orderBy(sql`DATE_TRUNC('week', ${paymentSchedules.expectedDate})`);

            const monthlyForecast = await db.select({
                month: sql<string>`TO_CHAR(${paymentSchedules.expectedDate}, 'YYYY-MM')`,
                totalAmount: sql<number>`SUM(${paymentSchedules.amount})`,
                count: sql<number>`COUNT(*)`,
            }).from(paymentSchedules).innerJoin(orders, eq(paymentSchedules.orderId, orders.id))
                .where(and(
                    eq(paymentSchedules.tenantId, tenantId), eq(paymentSchedules.status, 'PENDING'),
                    gte(paymentSchedules.expectedDate, todayStr), lte(paymentSchedules.expectedDate, forecastEndDateStr)
                )).groupBy(sql`TO_CHAR(${paymentSchedules.expectedDate}, 'YYYY-MM')`)
                .orderBy(sql`TO_CHAR(${paymentSchedules.expectedDate}, 'YYYY-MM')`);

            const overduePayments = await db.select({
                totalAmount: sql<number>`SUM(${paymentSchedules.amount})`,
                count: sql<number>`COUNT(*)`,
                avgOverdueDays: sql<number>`AVG(EXTRACT(EPOCH FROM (CURRENT_DATE - ${paymentSchedules.expectedDate})) / 86400)`,
            }).from(paymentSchedules).innerJoin(orders, eq(paymentSchedules.orderId, orders.id))
                .where(and(
                    eq(paymentSchedules.tenantId, tenantId), eq(paymentSchedules.status, 'PENDING'),
                    sql`${paymentSchedules.expectedDate} < CURRENT_DATE`
                ));

            const byScheduleType = await db.select({
                scheduleName: paymentSchedules.name,
                totalAmount: sql<number>`SUM(${paymentSchedules.amount})`,
                count: sql<number>`COUNT(*)`,
            }).from(paymentSchedules).innerJoin(orders, eq(paymentSchedules.orderId, orders.id))
                .where(and(
                    eq(paymentSchedules.tenantId, tenantId), eq(paymentSchedules.status, 'PENDING'),
                    gte(paymentSchedules.expectedDate, todayStr), lte(paymentSchedules.expectedDate, forecastEndDateStr)
                )).groupBy(paymentSchedules.name).orderBy(sql`SUM(${paymentSchedules.amount}) DESC`);

            const totalForecast = weeklyForecast.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
            const totalOverdue = Number(overduePayments[0]?.totalAmount || 0);

            return {
                summary: {
                    forecastPeriod: params.forecastDays,
                    totalForecastAmount: totalForecast.toFixed(2),
                    totalOverdueAmount: totalOverdue.toFixed(2),
                    overdueCount: Number(overduePayments[0]?.count || 0),
                    avgOverdueDays: Number(overduePayments[0]?.avgOverdueDays || 0).toFixed(1),
                },
                weeklyForecast: weeklyForecast.map(item => ({ weekStart: item.weekStart, amount: Number(item.totalAmount || 0).toFixed(2), count: Number(item.count || 0) })),
                monthlyForecast: monthlyForecast.map(item => ({ month: item.month, amount: Number(item.totalAmount || 0).toFixed(2), count: Number(item.count || 0) })),
                byScheduleType: byScheduleType.map(item => ({ type: item.scheduleName, amount: Number(item.totalAmount || 0).toFixed(2), count: Number(item.count || 0) })),
            }
        },
        [`cash-flow-forecast-${tenantId}-${params.forecastDays}`],
        { tags: [`analytics-${tenantId}`, 'analytics-cashflow'], revalidate: 3600 }
    )();
});

export async function getCashFlowForecast(params: z.infer<typeof cashFlowForecastSchema>) {
    return getCashFlowForecastAction(params);
}
