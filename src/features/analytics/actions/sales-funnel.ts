"use server";

import { db } from '@/shared/api/db';
import { orders, leads, quotes, measureTasks } from '@/shared/api/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { logger } from '@/shared/lib/logger';
import { ANALYTICS_PERMISSIONS } from '../constants';

const salesFunnelSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    salesId: z.string().optional(),
});

/**
 * 获取销售漏斗分析数据 (Get Sales Funnel Analysis)
 * 
 * 分析从线索→测量→报价→成交的全链路转化漏斗。
 * 包含各阶段数量、转化率、平均阶段耗时、以及同比上月的趋势变化。
 * 结果通过 `unstable_cache` 进行缓存，缓存生存时间 3600 秒。
 * 
 * 权限要求: ANALYTICS_PERMISSIONS.VIEW
 * 
 * @param params - 查询参数
 * @param params.startDate - 开始日期 (YYYY-MM-DD)，若为空则默认从本月 1 号开始
 * @param params.endDate - 结束日期 (YYYY-MM-DD)，若为空则默认为今天
 * @param params.salesId - 可选，指定销售人员 ID 进行过滤
 * @returns 包含 stages 数组和 summary 汇总的漏斗分析结果
 */
const getSalesFunnelAction = createSafeAction(salesFunnelSchema, async (params, { session }) => {
    await checkPermission(session, ANALYTICS_PERMISSIONS.VIEW);

    const tenantId = session.user.tenantId;
    const userId = session.user.id;
    const isManager = session.user.role === 'MANAGER';
    const salesId = params.salesId || (!isManager ? userId : undefined);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();

    return unstable_cache(
        async () => {
            try {
                logger.info('销售漏斗分析查询开始', { tenantId, salesId, startDate, endDate });

                const previousStartDate = new Date(startDate);
                previousStartDate.setMonth(previousStartDate.getMonth() - 1);
                const previousEndDate = new Date(endDate);
                previousEndDate.setMonth(previousEndDate.getMonth() - 1);

                // 当前期
                const leadConditions = [eq(leads.tenantId, tenantId), gte(leads.createdAt, startDate), lte(leads.createdAt, endDate)];
                if (salesId) leadConditions.push(eq(leads.assignedSalesId, salesId));

                const quoteConditions = [eq(quotes.tenantId, tenantId), gte(quotes.createdAt, startDate), lte(quotes.createdAt, endDate)];
                if (salesId) quoteConditions.push(eq(quotes.createdBy, salesId));

                const orderConditions = [eq(orders.tenantId, tenantId), gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)];
                if (salesId) orderConditions.push(eq(orders.salesId, salesId));

                // 上月同期
                const prevLeadConditions = [eq(leads.tenantId, tenantId), gte(leads.createdAt, previousStartDate), lte(leads.createdAt, previousEndDate)];
                if (salesId) prevLeadConditions.push(eq(leads.assignedSalesId, salesId));

                const prevQuoteConditions = [eq(quotes.tenantId, tenantId), gte(quotes.createdAt, previousStartDate), lte(quotes.createdAt, previousEndDate)];
                if (salesId) prevQuoteConditions.push(eq(quotes.createdBy, salesId));

                const prevOrderConditions = [eq(orders.tenantId, tenantId), gte(orders.createdAt, previousStartDate), lte(orders.createdAt, previousEndDate)];
                if (salesId) prevOrderConditions.push(eq(orders.salesId, salesId));

                const [
                    leadCount, measureStats, quoteStats, orderStats,
                    prevLeadCount, prevMeasureCount, prevQuoteCount, prevOrderCount
                ] = await Promise.all([
                    db.select({ count: sql<number>`COUNT(*)` }).from(leads).where(and(...leadConditions)),
                    db.select({
                        count: sql<number>`COUNT(DISTINCT ${measureTasks.leadId})`,
                        avgDays: sql<number>`AVG(EXTRACT(EPOCH FROM (${measureTasks.createdAt} - ${leads.createdAt})) / 86400)`,
                    }).from(measureTasks).leftJoin(leads, eq(measureTasks.leadId, leads.id)).where(and(
                        eq(measureTasks.tenantId, tenantId), gte(measureTasks.createdAt, startDate), lte(measureTasks.createdAt, endDate),
                        salesId ? eq(leads.assignedSalesId, salesId) : sql`true`
                    )),
                    db.select({
                        count: sql<number>`COUNT(*)`,
                        avgDays: sql<number>`AVG(EXTRACT(EPOCH FROM (${quotes.createdAt} - ${measureTasks.completedAt})) / 86400)`,
                    }).from(quotes).leftJoin(measureTasks, eq(quotes.leadId, measureTasks.leadId))
                        .where(and(...quoteConditions, sql`${measureTasks.completedAt} IS NOT NULL`)),
                    db.select({
                        count: sql<number>`COUNT(*)`,
                        avgDays: sql<number>`AVG(EXTRACT(EPOCH FROM (${orders.createdAt} - ${quotes.createdAt})) / 86400)`,
                    }).from(orders).leftJoin(quotes, eq(orders.quoteId, quotes.id))
                        .where(and(...orderConditions, sql`${quotes.createdAt} IS NOT NULL`)),
                    db.select({ count: sql<number>`COUNT(*)` }).from(leads).where(and(...prevLeadConditions)),
                    db.select({ count: sql<number>`COUNT(DISTINCT ${measureTasks.leadId})` })
                        .from(measureTasks).leftJoin(leads, eq(measureTasks.leadId, leads.id)).where(and(
                            eq(measureTasks.tenantId, tenantId), gte(measureTasks.createdAt, previousStartDate), lte(measureTasks.createdAt, previousEndDate),
                            salesId ? eq(leads.assignedSalesId, salesId) : sql`true`
                        )),
                    db.select({ count: sql<number>`COUNT(*)` }).from(quotes).where(and(...prevQuoteConditions)),
                    db.select({ count: sql<number>`COUNT(*)` }).from(orders).where(and(...prevOrderConditions))
                ]);

                // 组装
                const currentLeads = Number(leadCount[0]?.count || 0);
                const currentMeasures = Number(measureStats[0]?.count || 0);
                const currentQuotes = Number(quoteStats[0]?.count || 0);
                const currentOrders = Number(orderStats[0]?.count || 0);
                const prevLeads = Number(prevLeadCount[0]?.count || 0);
                const prevMeasures = Number(prevMeasureCount[0]?.count || 0);
                const prevQuotes = Number(prevQuoteCount[0]?.count || 0);
                const prevOrders = Number(prevOrderCount[0]?.count || 0);

                const calcConversion = (cur: number, prev: number) => prev > 0 ? ((cur / prev) * 100).toFixed(1) : null;
                const calcTrend = (cur: number, prev: number) => prev > 0 ? (((cur - prev) / prev) * 100).toFixed(1) : null;

                const result = {
                    stages: [
                        { stage: '线索', count: currentLeads, conversionRate: null, avgDaysInStage: null, previousPeriodCount: prevLeads, trend: calcTrend(currentLeads, prevLeads) },
                        { stage: '测量', count: currentMeasures, conversionRate: calcConversion(currentMeasures, currentLeads), avgDaysInStage: Number(measureStats[0]?.avgDays || 0).toFixed(1), previousPeriodCount: prevMeasures, trend: calcTrend(currentMeasures, prevMeasures) },
                        { stage: '报价', count: currentQuotes, conversionRate: calcConversion(currentQuotes, currentMeasures), avgDaysInStage: Number(quoteStats[0]?.avgDays || 0).toFixed(1), previousPeriodCount: prevQuotes, trend: calcTrend(currentQuotes, prevQuotes) },
                        { stage: '成交', count: currentOrders, conversionRate: calcConversion(currentOrders, currentQuotes), avgDaysInStage: Number(orderStats[0]?.avgDays || 0).toFixed(1), previousPeriodCount: prevOrders, trend: calcTrend(currentOrders, prevOrders) },
                    ],
                    summary: {
                        overallConversion: currentLeads > 0 ? ((currentOrders / currentLeads) * 100).toFixed(1) : '0',
                        avgCycleTime: (Number(measureStats[0]?.avgDays || 0) + Number(quoteStats[0]?.avgDays || 0) + Number(orderStats[0]?.avgDays || 0)).toFixed(1),
                    }
                };

                logger.info('销售漏斗分析查询成功', { tenantId, overallConversion: result.summary.overallConversion });
                return result;
            } catch (error) {
                logger.error('销售漏斗分析查询失败', { tenantId, salesId, error });
                throw error;
            }
        },
        [`sales-funnel-${tenantId}-${salesId}-${startDate.getTime()}-${endDate.getTime()}`],
        { tags: [`analytics-${tenantId}`, 'analytics-funnel'], revalidate: 3600 }
    )();
});

/**
 * 导出：获取销售漏斗数据
 * @param params - 查询参数
 */
export async function getSalesFunnel(params: z.infer<typeof salesFunnelSchema>) {
    return getSalesFunnelAction(params);
}
