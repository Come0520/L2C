/**
 * 利润率分析 — getProfitMarginAnalysis
 */

import { db } from '@/shared/api/db';
import { orders, purchaseOrders } from '@/shared/api/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { ANALYTICS_PERMISSIONS } from '../constants';

const profitMarginSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    groupBy: z.enum(['category', 'month', 'sales']).default('category'),
});

/**
 * 获取利润率分析数据
 * 毛利 = 销售收入 - 采购成本
 * 毛利率 = 毛利 / 销售收入 * 100%
 */
const getProfitMarginAnalysisAction = createSafeAction(profitMarginSchema, async (params, { session }) => {
    await checkPermission(session, ANALYTICS_PERMISSIONS.VIEW_ALL);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            const orderStats = await db.select({
                totalRevenue: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
                orderCount: sql<number>`COUNT(DISTINCT ${orders.id})`,
            }).from(orders).where(and(
                eq(orders.tenantId, tenantId), gte(orders.createdAt, startDate), lte(orders.createdAt, endDate),
                sql`${orders.status} NOT IN ('CANCELLED', 'DRAFT')`
            ));

            const costStats = await db.select({
                totalCost: sql<string>`COALESCE(SUM(CAST(${purchaseOrders.totalAmount} AS DECIMAL)), 0)`,
            }).from(purchaseOrders).where(and(
                eq(purchaseOrders.tenantId, tenantId), gte(purchaseOrders.createdAt, startDate), lte(purchaseOrders.createdAt, endDate),
                sql`${purchaseOrders.status} NOT IN ('CANCELLED', 'REJECTED')`
            ));

            const revenue = Number(orderStats[0]?.totalRevenue || 0);
            const cost = Number(costStats[0]?.totalCost || 0);
            const grossProfit = revenue - cost;
            const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

            const monthlyTrend = await db.select({
                month: sql`DATE_TRUNC('month', ${orders.createdAt})`,
                revenue: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
            }).from(orders).where(and(
                eq(orders.tenantId, tenantId), gte(orders.createdAt, startDate), lte(orders.createdAt, endDate),
                sql`${orders.status} NOT IN ('CANCELLED', 'DRAFT')`
            )).groupBy(sql`DATE_TRUNC('month', ${orders.createdAt})`).orderBy(sql`DATE_TRUNC('month', ${orders.createdAt})`);

            return {
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
            }
        },
        [`profit-margin-${tenantId}-${startDate.getTime()}-${endDate.getTime()}`],
        { tags: [`analytics-${tenantId}`, 'analytics-profit'], revalidate: 3600 }
    )();
});

export async function getProfitMarginAnalysis(params: z.infer<typeof profitMarginSchema>) {
    return getProfitMarginAnalysisAction(params);
}
