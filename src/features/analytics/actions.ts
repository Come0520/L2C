'use server';

import { db } from '@/shared/api/db';
import { orders, leads, quotes, measureTasks, arStatements, purchaseOrders, users } from '@/shared/api/schema';
import { eq, and, gte, lte, sql, desc, SQL } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { cache } from 'react';

const PERMISSIONS = {
    ANALYTICS: {
        VIEW: 'analytics:view',
        VIEW_ALL: 'analytics:view_all', // 店长/管理层
    }
};

// ==================== Schemas ====================

const dashboardStatsSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    salesId: z.string().optional(), // 如果是销售，自动过滤到本人
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

// ==================== Actions (Optimized with React.cache) ====================

/**
 * 获取核心指标数据
 */
export const getDashboardStats = cache(createSafeAction(dashboardStatsSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.ANALYTICS.VIEW);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();

    const conditions = [
        eq(orders.tenantId, session.user.tenantId),
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
    ];

    // 濡傛灉鏄櫘閫氶攢鍞紝鍙兘鐪嬭嚜宸辩殑鏁版嵁
    if (params.salesId || session.user.role !== 'MANAGER') {
        conditions.push(eq(orders.salesId, params.salesId || session.user.id));
    }

    const whereClause = and(...conditions);

    // 鏈湀閿€鍞
    const salesResult = await db
        .select({
            totalAmount: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
            orderCount: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(whereClause);

    // 杞寲鐜囪绠楋紙绾跨储鏁帮級
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

    // 寰呮敹娆?
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

    // 寰呬粯娆撅紙閲囪喘鍗曪級
    const apResult = await db
        .select({
            pendingCost: sql<string>`COALESCE(SUM(CAST(${purchaseOrders.totalAmount} AS DECIMAL)), 0)`,
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
}));

/**
 * 鑾峰彇閿€鍞紡鏂楁暟鎹?
 */
export const getSalesFunnel = cache(createSafeAction(salesFunnelSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.ANALYTICS.VIEW);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();

    const salesId = params.salesId || (session.user.role !== 'MANAGER' ? session.user.id : undefined);

    // 绾跨储鏁?
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

    // 娴嬮噺鏁?
    const measureCount = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${measureTasks.leadId})` })
        .from(measureTasks)
        .leftJoin(leads, eq(measureTasks.leadId, leads.id))
        .where(
            and(
                eq(measureTasks.tenantId, session.user.tenantId),
                gte(measureTasks.createdAt, startDate),
                lte(measureTasks.createdAt, endDate),
                salesId ? eq(leads.assignedSalesId, salesId) : sql`true`
            )
        );

    // 鎶ヤ环鏁?
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

    // 鎴愪氦鏁?
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
            { stage: '绾跨储', count: Number(leadCount[0]?.count || 0) },
            { stage: '娴嬮噺', count: Number(measureCount[0]?.count || 0) },
            { stage: '鎶ヤ环', count: Number(quoteCount[0]?.count || 0) },
            { stage: '鎴愪氦', count: Number(orderCount[0]?.count || 0) },
        ]
    };
}));

/**
 * 鑾峰彇涓氱哗鎺掑悕
 */
export const getLeaderboard = cache(createSafeAction(leaderboardSchema, async (params, { session }) => {
    checkPermission(session, PERMISSIONS.ANALYTICS.VIEW_ALL); // 浠呭簵闀垮彲瑙?

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
            salesName: item.salesName || '鏈煡',
            totalAmount: item.totalAmount,
            orderCount: item.orderCount,
        }))
    };
}));

/**
 * 鑾峰彇璁㈠崟瓒嬪娍鏁版嵁
 */
export const getOrderTrend = cache(createSafeAction(orderTrendSchema, async (params, { session }) => {
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
}));

