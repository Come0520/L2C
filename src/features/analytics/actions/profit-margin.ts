"use server";

import { db } from '@/shared/api/db';
import { orders, purchaseOrders } from '@/shared/api/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { logger } from '@/shared/lib/logger';
import { ANALYTICS_PERMISSIONS } from '../constants';

const profitMarginSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    groupBy: z.enum(['category', 'month', 'sales']).default('category'),
});

/**
 * 获取利润率分析数据 (Get Profit Margin Analysis)
 * 
 * 计算毛利、毛利率、月度趋势等关键财务指标。
 * 毛利 = 销售收入 - 采购成本，毛利率 = 毛利 / 销售收入 × 100%。
 * 结果通过 `unstable_cache` 进行缓存，用于高层财务决策分析。
 * 
 * 权限要求: ANALYTICS_PERMISSIONS.VIEW_ALL (管理层权限)
 * 
 * @param params - 查询参数
 * @param params.startDate - 开始日期，若为空则默认从本月 1 号开始
 * @param params.endDate - 结束日期，若为空则默认为今天
 * @param params.groupBy - 分组维度，支持 'category' | 'month' | 'sales'
 * @returns 利润率分析结果对象，包含收入、成本、利润、利润率及月度趋势
 */
const getProfitMarginAnalysisAction = createSafeAction(profitMarginSchema, async (params, { session }) => {
    await checkPermission(session, ANALYTICS_PERMISSIONS.VIEW_ALL);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            try {
                logger.info('利润率分析查询开始', { tenantId, startDate, endDate });

                const [orderStats, costStats, monthlyTrend] = await Promise.all([
                    db.select({
                        totalRevenue: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
                        orderCount: sql<number>`COUNT(DISTINCT ${orders.id})`,
                    }).from(orders).where(and(
                        eq(orders.tenantId, tenantId), gte(orders.createdAt, startDate), lte(orders.createdAt, endDate),
                        sql`${orders.status} NOT IN ('CANCELLED', 'DRAFT')`
                    )),
                    db.select({
                        totalCost: sql<string>`COALESCE(SUM(CAST(${purchaseOrders.totalAmount} AS DECIMAL)), 0)`,
                    }).from(purchaseOrders).where(and(
                        eq(purchaseOrders.tenantId, tenantId), gte(purchaseOrders.createdAt, startDate), lte(purchaseOrders.createdAt, endDate),
                        sql`${purchaseOrders.status} NOT IN ('CANCELLED', 'REJECTED')`
                    )),
                    db.select({
                        month: sql`DATE_TRUNC('month', ${orders.createdAt})`,
                        revenue: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
                    }).from(orders).where(and(
                        eq(orders.tenantId, tenantId), gte(orders.createdAt, startDate), lte(orders.createdAt, endDate),
                        sql`${orders.status} NOT IN ('CANCELLED', 'DRAFT')`
                    )).groupBy(sql`DATE_TRUNC('month', ${orders.createdAt})`).orderBy(sql`DATE_TRUNC('month', ${orders.createdAt})`)
                ]);

                const revenue = Number(orderStats[0]?.totalRevenue || 0);
                const cost = Number(costStats[0]?.totalCost || 0);
                const grossProfit = revenue - cost;
                const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

                const result = {
                    totalRevenue: revenue.toFixed(2),
                    totalCost: cost.toFixed(2),
                    grossProfit: grossProfit.toFixed(2),
                    grossMargin: grossMargin.toFixed(2),
                    orderCount: Number(orderStats[0]?.orderCount || 0),
                    avgOrderValue: Number(orderStats[0]?.orderCount) > 0 ? (revenue / Number(orderStats[0]?.orderCount)).toFixed(2) : '0',
                    monthlyTrend: monthlyTrend.map(item => ({
                        month: item.month instanceof Date ? item.month.toISOString().slice(0, 7) : String(item.month).slice(0, 7),
                        revenue: item.revenue,
                    })),
                };

                logger.info('利润率分析查询成功', { tenantId, revenue: result.totalRevenue, grossMargin: result.grossMargin });
                return result;
            } catch (error) {
                logger.error('利润率分析查询失败', { tenantId, error });
                throw error;
            }
        },
        [`profit-margin-${tenantId}-${startDate.toDateString()}-${endDate.toDateString()}`],
        { tags: [`analytics-${tenantId}`, 'analytics-profit'], revalidate: 3600 }
    )();
});

/**
 * 导出：获取利润率分析数据
 * @param params - 查询参数
 */
export async function getProfitMarginAnalysis(params: z.infer<typeof profitMarginSchema>) {
    return getProfitMarginAnalysisAction(params);
}
