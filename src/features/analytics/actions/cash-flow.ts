"use server";

import { db } from '@/shared/api/db';
import { orders, paymentSchedules } from '@/shared/api/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { ANALYTICS_PERMISSIONS } from '../constants';
import { logger } from '@/shared/lib/logger';

const cashFlowForecastSchema = z.object({
    forecastDays: z.number().optional().default(90),
});

/**
 * 获取现金流预测数据 (Get Cash Flow Forecast)
 * 
 * 基于待处理的付款计划 (paymentSchedules) 预测未来的资金回款情况。
 * 包含按周汇总、按月汇总、按款项类型汇总以及逾期未付汇总。
 * 结果通过 `unstable_cache` 进行缓存。
 * 
 * 权限要求: ANALYTICS_PERMISSIONS.VIEW
 * 
 * @param params - 查询参数
 * @param params.forecastDays - 预测未来的天数，默认 90 天
 * @returns 包含汇总数据(summary)和各维度明细的预测结果
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
            logger.info('现金流预测查询开始', { tenantId, forecastDays: params.forecastDays });
            try {
                // 使用 Promise.all 并行化 4 个统计查询
                const [weeklyForecast, monthlyForecast, overduePayments, byScheduleType] = await Promise.all([
                    db.select({
                        weekStart: sql<string>`DATE_TRUNC('week', ${paymentSchedules.expectedDate})::date`,
                        totalAmount: sql<number>`SUM(${paymentSchedules.amount})`,
                        count: sql<number>`COUNT(*)`,
                    }).from(paymentSchedules).innerJoin(orders, eq(paymentSchedules.orderId, orders.id))
                        .where(and(
                            eq(paymentSchedules.tenantId, tenantId), eq(paymentSchedules.status, 'PENDING'),
                            gte(paymentSchedules.expectedDate, todayStr), lte(paymentSchedules.expectedDate, forecastEndDateStr)
                        )).groupBy(sql`DATE_TRUNC('week', ${paymentSchedules.expectedDate})`)
                        .orderBy(sql`DATE_TRUNC('week', ${paymentSchedules.expectedDate})`),

                    db.select({
                        month: sql<string>`TO_CHAR(${paymentSchedules.expectedDate}, 'YYYY-MM')`,
                        totalAmount: sql<number>`SUM(${paymentSchedules.amount})`,
                        count: sql<number>`COUNT(*)`,
                    }).from(paymentSchedules).innerJoin(orders, eq(paymentSchedules.orderId, orders.id))
                        .where(and(
                            eq(paymentSchedules.tenantId, tenantId), eq(paymentSchedules.status, 'PENDING'),
                            gte(paymentSchedules.expectedDate, todayStr), lte(paymentSchedules.expectedDate, forecastEndDateStr)
                        )).groupBy(sql`TO_CHAR(${paymentSchedules.expectedDate}, 'YYYY-MM')`)
                        .orderBy(sql`TO_CHAR(${paymentSchedules.expectedDate}, 'YYYY-MM')`),

                    db.select({
                        totalAmount: sql<number>`SUM(${paymentSchedules.amount})`,
                        count: sql<number>`COUNT(*)`,
                        avgOverdueDays: sql<number>`AVG(EXTRACT(EPOCH FROM (CURRENT_DATE - ${paymentSchedules.expectedDate})) / 86400)`,
                    }).from(paymentSchedules).innerJoin(orders, eq(paymentSchedules.orderId, orders.id))
                        .where(and(
                            eq(paymentSchedules.tenantId, tenantId), eq(paymentSchedules.status, 'PENDING'),
                            sql`${paymentSchedules.expectedDate} < CURRENT_DATE`
                        )),

                    db.select({
                        scheduleName: paymentSchedules.name,
                        totalAmount: sql<number>`SUM(${paymentSchedules.amount})`,
                        count: sql<number>`COUNT(*)`,
                    }).from(paymentSchedules).innerJoin(orders, eq(paymentSchedules.orderId, orders.id))
                        .where(and(
                            eq(paymentSchedules.tenantId, tenantId), eq(paymentSchedules.status, 'PENDING'),
                            gte(paymentSchedules.expectedDate, todayStr), lte(paymentSchedules.expectedDate, forecastEndDateStr)
                        )).groupBy(paymentSchedules.name).orderBy(sql`SUM(${paymentSchedules.amount}) DESC`)
                ]);

                const totalForecast = weeklyForecast.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
                const totalOverdue = Number(overduePayments[0]?.totalAmount || 0);

                logger.info('现金流预测查询成功', { tenantId, totalForecast, totalOverdue });

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
                };
            } catch (error) {
                logger.error('现金流预测查询失败', { tenantId, error });
                throw error;
            }
        },
        [`cash-flow-forecast-${tenantId}-${params.forecastDays}`],
        { tags: [`analytics-${tenantId}`, 'analytics-cashflow'], revalidate: 3600 }
    )();
});

/**
 * 导出：获取现金流预测分析数据
 * @param params - 查询参数
 */
export async function getCashFlowForecast(params: z.infer<typeof cashFlowForecastSchema>) {
    return getCashFlowForecastAction(params);
}
