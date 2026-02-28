"use server";

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
import { logger } from '@/shared/lib/logger';

const dashboardStatsSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    salesId: z.string().optional(),
});

/**
 * 获取核心指标数据 (Get Dashboard Statistics)
 * 
 * 获取指定时间范围和销售人员的核心业务指标，包括总销售额、订单数、新增线索数、转化率、待收和待付款。
 * 结果通过 `unstable_cache` 进行缓存。
 * 
 * 权限要求: ANALYTICS_PERMISSIONS.VIEW
 *
 * @param {z.infer<typeof dashboardStatsSchema>} params - 查询参数，包含起始日期、结束日期和销售人员 ID
 * @returns {Promise<Object>} 包含核心统计指标的对象
 * @throws {Error} 如果在执行数据库查询时发生错误
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
            logger.info('获取仪表盘核心统计数据开始 (Starting getDashboardStats)', { tenantId, params });
            try {
                const conditions = [
                    eq(orders.tenantId, tenantId),
                    gte(orders.createdAt, startDate),
                    lte(orders.createdAt, endDate),
                ];
                if (salesId) conditions.push(eq(orders.salesId, salesId));
                const whereClause = and(...conditions);

                const leadConditions = [
                    eq(leads.tenantId, tenantId),
                    gte(leads.createdAt, startDate),
                    lte(leads.createdAt, endDate),
                ];
                if (salesId) leadConditions.push(eq(leads.assignedSalesId, salesId));


                const [salesResult, leadResult, arResult, apResult] = await Promise.all([
                    db.select({
                        totalAmount: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
                        orderCount: sql<number>`COUNT(*)`,
                    }).from(orders).where(whereClause),

                    db.select({ count: sql<number>`COUNT(*)` }).from(leads).where(and(...leadConditions)),

                    db.select({
                        pendingAmount: sql<string>`COALESCE(SUM(CAST(${arStatements.pendingAmount} AS DECIMAL)), 0)`,
                    }).from(arStatements).where(and(
                        eq(arStatements.tenantId, tenantId),
                        sql`${arStatements.status} IN ('PENDING_RECON', 'PENDING_INVOICE', 'PENDING_PAYMENT', 'PARTIAL')`
                    )),

                    db.select({
                        pendingCost: sql<string>`COALESCE(SUM(CAST(${purchaseOrders.totalAmount} AS DECIMAL)), 0)`,
                    }).from(purchaseOrders).where(and(
                        eq(purchaseOrders.tenantId, tenantId),
                        eq(purchaseOrders.paymentStatus, 'PENDING')
                    ))
                ]);

                const totalLeads = Number(leadResult[0]?.count || 0);
                const wonOrders = Number(salesResult[0]?.orderCount || 0);
                const conversionRate = totalLeads > 0 ? ((wonOrders / totalLeads) * 100).toFixed(2) : '0';

                logger.info('获取仪表盘核心统计数据成功 (Successfully fetched dashboard stats)', { tenantId });

                return {
                    totalSales: salesResult[0]?.totalAmount || '0',
                    orderCount: wonOrders,
                    newLeads: totalLeads,
                    conversionRate,
                    pendingReceivables: arResult[0]?.pendingAmount || '0',
                    pendingPayables: apResult[0]?.pendingCost || '0',
                };
            } catch (error) {
                logger.error('获取仪表盘核心统计数据失败 (Failed to fetch dashboard stats)', { tenantId, error });
                throw new Error('获取数据失败');
            }
        },
        [`dashboard-stats-${tenantId}-${salesId}-${startDate.toDateString()}-${endDate.toDateString()}`],
        { tags: [`analytics-${tenantId}`, 'analytics-dashboard'], revalidate: 3600 }
    )();
});

export async function getDashboardStats(params: z.infer<typeof dashboardStatsSchema>) {
    return getDashboardStatsAction(params);
}
