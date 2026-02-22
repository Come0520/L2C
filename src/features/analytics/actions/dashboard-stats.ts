/**
 * 核心仪表盘统计 — getDashboardStats
 */

import { db } from '@/shared/api/db';
import { orders, leads, arStatements, purchaseOrders } from '@/shared/api/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { ANALYTICS_PERMISSIONS } from '../constants';

const dashboardStatsSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    salesId: z.string().optional(),
});

/**
 * 获取核心指标数据
 * 包含：销售额、订单数、新增线索、转化率、待收/待付款
 */
const getDashboardStatsAction = createSafeAction(dashboardStatsSchema, async (params, { session }) => {
    await checkPermission(session, ANALYTICS_PERMISSIONS.VIEW);

    const tenantId = session.user.tenantId;
    const userId = session.user.id;
    const isManager = session.user.role === 'MANAGER';
    const salesId = params.salesId || (!isManager ? userId : undefined);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();

    return unstable_cache(
        async () => {
            const conditions = [
                eq(orders.tenantId, tenantId),
                gte(orders.createdAt, startDate),
                lte(orders.createdAt, endDate),
            ];
            if (salesId) conditions.push(eq(orders.salesId, salesId));
            const whereClause = and(...conditions);

            const salesResult = await db
                .select({
                    totalAmount: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
                    orderCount: sql<number>`COUNT(*)`,
                })
                .from(orders)
                .where(whereClause);

            const leadConditions = [
                eq(leads.tenantId, tenantId),
                gte(leads.createdAt, startDate),
                lte(leads.createdAt, endDate),
            ];
            if (salesId) leadConditions.push(eq(leads.assignedSalesId, salesId));

            const leadResult = await db
                .select({ count: sql<number>`COUNT(*)` })
                .from(leads)
                .where(and(...leadConditions));

            const totalLeads = Number(leadResult[0]?.count || 0);
            const wonOrders = Number(salesResult[0]?.orderCount || 0);
            const conversionRate = totalLeads > 0 ? ((wonOrders / totalLeads) * 100).toFixed(2) : '0';

            const arResult = await db
                .select({
                    pendingAmount: sql<string>`COALESCE(SUM(CAST(${arStatements.pendingAmount} AS DECIMAL)), 0)`,
                })
                .from(arStatements)
                .where(and(
                    eq(arStatements.tenantId, tenantId),
                    sql`${arStatements.status} IN ('PENDING_RECON', 'PENDING_INVOICE', 'PENDING_PAYMENT', 'PARTIAL')`
                ));

            const apResult = await db
                .select({
                    pendingCost: sql<string>`COALESCE(SUM(CAST(${purchaseOrders.totalAmount} AS DECIMAL)), 0)`,
                })
                .from(purchaseOrders)
                .where(and(
                    eq(purchaseOrders.tenantId, tenantId),
                    eq(purchaseOrders.paymentStatus, 'PENDING')
                ));

            return {
                totalSales: salesResult[0]?.totalAmount || '0',
                orderCount: wonOrders,
                newLeads: totalLeads,
                conversionRate,
                pendingReceivables: arResult[0]?.pendingAmount || '0',
                pendingPayables: apResult[0]?.pendingCost || '0',
            };
        },
        [`dashboard-stats-${tenantId}-${salesId}-${startDate.getTime()}-${endDate.getTime()}`],
        { tags: [`analytics-${tenantId}`, 'analytics-dashboard'], revalidate: 3600 }
    )();
});

export async function getDashboardStats(params: z.infer<typeof dashboardStatsSchema>) {
    return getDashboardStatsAction(params);
}
