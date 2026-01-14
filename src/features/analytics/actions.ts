'use server';

import { db } from '@/shared/api/db';
import { orders, leads, quotes, measureTasks, arStatements, purchaseOrders, users } from '@/shared/api/schema';
import { eq, and, gte, lte, sql, desc, SQL } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';

const PERMISSIONS = {
    ANALYTICS: {
        VIEW: 'analytics:view',
        VIEW_ALL: 'analytics:view_all', // 店长/管理�?
    }
};

// ==================== Schemas ====================

const dashboardStatsSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    salesId: z.string().optional(), // 如果是销售，自动过滤到本�?
});

const salesFunnelSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    salesId: z.string().optional(),
});

const leaderboardSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z.enum(['amount', 'count']).default('amount'),
    limit: z.number().default(10),
});

const orderTrendSchema = z.object({
    startDate: z.string(),
    endDate: z.string(),
    granularity: z.enum(['day', 'week', 'month']).default('day'),
});

// ==================== Actions ====================

/**
 * 获取核心指标数据
 */
export const getDashboardStats = createSafeAction(dashboardStatsSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.ANALYTICS.VIEW);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();

    const conditions = [
        eq(orders.tenantId, session.user.tenantId),
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
    ];

    // 如果是普通销售，只能看自己的数据
    if (params.salesId || session.user.role !== 'MANAGER') {
        conditions.push(eq(orders.salesId, params.salesId || session.user.id));
    }

    const whereClause = and(...conditions);

    // 本月销售额
    const salesResult = await db
        .select({
            totalAmount: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
            orderCount: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(whereClause);

    // 转化率计算（线索数）
    const leadConditions = [
        eq(leads.tenantId, session.user.tenantId),
        gte(leads.createdAt, startDate),
        lte(leads.createdAt, endDate),
    ];
    if (params.salesId || session.user.role !== 'MANAGER') {
        leadConditions.push(eq(leads.assignedSalesId, params.salesId || session.user.id));
    }

    const leadResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(leads)
        .where(and(...leadConditions));

    const totalLeads = Number(leadResult[0]?.count || 0);
    const wonOrders = Number(salesResult[0]?.orderCount || 0);
    const conversionRate = totalLeads > 0 ? ((wonOrders / totalLeads) * 100).toFixed(2) : '0';

    // 待收�?
    const arResult = await db
        .select({
            pendingAmount: sql<string>`COALESCE(SUM(CAST(${arStatements.pendingAmount} AS DECIMAL)), 0)`,
        })
        .from(arStatements)
        .where(
            and(
                eq(arStatements.tenantId, session.user.tenantId),
                sql`${arStatements.status} IN ('PENDING_RECON', 'PENDING_INVOICE', 'PENDING_PAYMENT', 'PARTIAL')`
            )
        );

    // 待付款（采购单）
    const apResult = await db
        .select({
            pendingCost: sql<string>`COALESCE(SUM(CAST(${purchaseOrders.totalCost} AS DECIMAL)), 0)`,
        })
        .from(purchaseOrders)
        .where(
            and(
                eq(purchaseOrders.tenantId, session.user.tenantId),
                eq(purchaseOrders.paymentStatus, 'PENDING')
            )
        );

    return {
        success: true,
        data: {
            totalSales: salesResult[0]?.totalAmount || '0',
            orderCount: wonOrders,
            newLeads: totalLeads,
            conversionRate,
            pendingReceivables: arResult[0]?.pendingAmount || '0',
            pendingPayables: apResult[0]?.pendingCost || '0',
        }
    };
});

/**
 * 获取销售漏斗数�?
 */
export const getSalesFunnel = createSafeAction(salesFunnelSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.ANALYTICS.VIEW);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();

    const salesId = params.salesId || (session.user.role !== 'MANAGER' ? session.user.id : undefined);

    // 线索�?
    const leadConditions = [
        eq(leads.tenantId, session.user.tenantId),
        gte(leads.createdAt, startDate),
        lte(leads.createdAt, endDate),
    ];
    if (salesId) leadConditions.push(eq(leads.assignedSalesId, salesId));

    const leadCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(leads)
        .where(and(...leadConditions));

    // 测量�?
    const measureCount = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${measureTasks.leadId})` })
        .from(measureTasks)
        .where(
            and(
                eq(measureTasks.tenantId, session.user.tenantId),
                gte(measureTasks.createdAt, startDate),
                lte(measureTasks.createdAt, endDate),
                salesId ? eq(measureTasks.createdBy, salesId) : sql`true`
            )
        );

    // 报价�?
    const quoteConditions = [
        eq(quotes.tenantId, session.user.tenantId),
        gte(quotes.createdAt, startDate),
        lte(quotes.createdAt, endDate),
    ];
    if (salesId) quoteConditions.push(eq(quotes.createdBy, salesId));

    const quoteCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(quotes)
        .where(and(...quoteConditions));

    // 成交�?
    const orderConditions = [
        eq(orders.tenantId, session.user.tenantId),
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
    ];
    if (salesId) orderConditions.push(eq(orders.salesId, salesId));

    const orderCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(orders)
        .where(and(...orderConditions));

    return {
        success: true,
        data: [
            { stage: '线索', count: Number(leadCount[0]?.count || 0) },
            { stage: '测量', count: Number(measureCount[0]?.count || 0) },
            { stage: '报价', count: Number(quoteCount[0]?.count || 0) },
            { stage: '成交', count: Number(orderCount[0]?.count || 0) },
        ]
    };
});

/**
 * 获取业绩排名
 */
export const getLeaderboard = createSafeAction(leaderboardSchema, async (params, { session }) => {
    checkPermission(session, PERMISSIONS.ANALYTICS.VIEW_ALL); // 仅店长可�?

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();

    const leaderboard = await db
        .select({
            salesId: orders.salesId,
            salesName: users.name,
            totalAmount: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
            orderCount: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .leftJoin(users, eq(orders.salesId, users.id))
        .where(
            and(
                eq(orders.tenantId, session.user.tenantId),
                gte(orders.createdAt, startDate),
                lte(orders.createdAt, endDate)
            )
        )
        .groupBy(orders.salesId, users.name)
        .orderBy(params.sortBy === 'amount' ? desc(sql`SUM(CAST(${orders.totalAmount} AS DECIMAL))`) : desc(sql`COUNT(*)`))
        .limit(params.limit);

    return {
        success: true,
        data: leaderboard.map((item, index) => ({
            rank: index + 1,
            salesId: item.salesId,
            salesName: item.salesName || '未知',
            totalAmount: item.totalAmount,
            orderCount: item.orderCount,
        }))
    };
});

/**
 * 获取订单趋势数据
 */
export const getOrderTrend = createSafeAction(orderTrendSchema, async (params, { session }) => {
    checkPermission(session, PERMISSIONS.ANALYTICS.VIEW);

    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);

    let dateTruncate: SQL;
    switch (params.granularity) {
        case 'week':
            dateTruncate = sql`DATE_TRUNC('week', ${orders.createdAt})`;
            break;
        case 'month':
            dateTruncate = sql`DATE_TRUNC('month', ${orders.createdAt})`;
            break;
        default:
            dateTruncate = sql`DATE_TRUNC('day', ${orders.createdAt})`;
    }

    const trend = await db
        .select({
            date: dateTruncate,
            totalAmount: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
            orderCount: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(
            and(
                eq(orders.tenantId, session.user.tenantId),
                gte(orders.createdAt, startDate),
                lte(orders.createdAt, endDate)
            )
        )
        .groupBy(dateTruncate)
        .orderBy(dateTruncate);

    return {
        success: true,
        data: trend.map(item => ({
            date: item.date instanceof Date ? item.date.toISOString().split('T')[0] : String(item.date),
            amount: item.totalAmount,
            count: item.orderCount,
        }))
    };
});
