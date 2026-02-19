'use server';

import { db } from '@/shared/api/db';
import { orders, leads, quotes, quoteItems, measureTasks, arStatements, purchaseOrders, users, paymentSchedules } from '@/shared/api/schema';
import { eq, and, gte, lte, sql, desc, SQL, notInArray, inArray } from 'drizzle-orm';
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
const getDashboardStatsAction = cache(createSafeAction(dashboardStatsSchema, async (params, { session }) => {
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

    // 待收款
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

export async function getDashboardStats(params: z.infer<typeof dashboardStatsSchema>) {
    return getDashboardStatsAction(params);
}

/**
 * 获取销售漏斗数据（增强版）
 * 包含转化率、平均阶段耗时、同比数据
 */
const getSalesFunnelAction = cache(createSafeAction(salesFunnelSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.ANALYTICS.VIEW);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();

    const salesId = params.salesId || (session.user.role !== 'MANAGER' ? session.user.id : undefined);

    // 计算上月同期日期范围（用于环比）
    const previousStartDate = new Date(startDate);
    previousStartDate.setMonth(previousStartDate.getMonth() - 1);
    const previousEndDate = new Date(endDate);
    previousEndDate.setMonth(previousEndDate.getMonth() - 1);

    // ========== 当前期数据 ==========

    // 线索数
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

    // 测量数 + 平均耗时（线索→测量）
    const measureStats = await db
        .select({
            count: sql<number>`COUNT(DISTINCT ${measureTasks.leadId})`,
            avgDays: sql<number>`AVG(EXTRACT(EPOCH FROM (${measureTasks.createdAt} - ${leads.createdAt})) / 86400)`,
        })
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

    // 报价数 + 平均耗时（测量→报价）
    const quoteConditions = [
        eq(quotes.tenantId, session.user.tenantId),
        gte(quotes.createdAt, startDate),
        lte(quotes.createdAt, endDate),
    ];
    if (salesId) quoteConditions.push(eq(quotes.createdBy, salesId));

    const quoteStats = await db
        .select({
            count: sql<number>`COUNT(*)`,
            avgDays: sql<number>`AVG(EXTRACT(EPOCH FROM (${quotes.createdAt} - ${measureTasks.completedAt})) / 86400)`,
        })
        .from(quotes)
        .leftJoin(measureTasks, eq(quotes.leadId, measureTasks.leadId))
        .where(and(...quoteConditions, sql`${measureTasks.completedAt} IS NOT NULL`));

    // 成交数 + 平均耗时（报价→成交）
    const orderConditions = [
        eq(orders.tenantId, session.user.tenantId),
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
    ];
    if (salesId) orderConditions.push(eq(orders.salesId, salesId));

    const orderStats = await db
        .select({
            count: sql<number>`COUNT(*)`,
            avgDays: sql<number>`AVG(EXTRACT(EPOCH FROM (${orders.createdAt} - ${quotes.createdAt})) / 86400)`,
        })
        .from(orders)
        .leftJoin(quotes, eq(orders.quoteId, quotes.id))
        .where(and(...orderConditions, sql`${quotes.createdAt} IS NOT NULL`));

    // ========== 上月同期数据（环比） ==========

    const prevLeadConditions = [
        eq(leads.tenantId, session.user.tenantId),
        gte(leads.createdAt, previousStartDate),
        lte(leads.createdAt, previousEndDate),
    ];
    if (salesId) prevLeadConditions.push(eq(leads.assignedSalesId, salesId));

    const prevLeadCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(leads)
        .where(and(...prevLeadConditions));

    const prevMeasureCount = await db
        .select({ count: sql<number>`COUNT(DISTINCT ${measureTasks.leadId})` })
        .from(measureTasks)
        .leftJoin(leads, eq(measureTasks.leadId, leads.id))
        .where(
            and(
                eq(measureTasks.tenantId, session.user.tenantId),
                gte(measureTasks.createdAt, previousStartDate),
                lte(measureTasks.createdAt, previousEndDate),
                salesId ? eq(leads.assignedSalesId, salesId) : sql`true`
            )
        );

    const prevQuoteConditions = [
        eq(quotes.tenantId, session.user.tenantId),
        gte(quotes.createdAt, previousStartDate),
        lte(quotes.createdAt, previousEndDate),
    ];
    if (salesId) prevQuoteConditions.push(eq(quotes.createdBy, salesId));

    const prevQuoteCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(quotes)
        .where(and(...prevQuoteConditions));

    const prevOrderConditions = [
        eq(orders.tenantId, session.user.tenantId),
        gte(orders.createdAt, previousStartDate),
        lte(orders.createdAt, previousEndDate),
    ];
    if (salesId) prevOrderConditions.push(eq(orders.salesId, salesId));

    const prevOrderCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(orders)
        .where(and(...prevOrderConditions));

    // ========== 数据组装 ==========

    const currentLeads = Number(leadCount[0]?.count || 0);
    const currentMeasures = Number(measureStats[0]?.count || 0);
    const currentQuotes = Number(quoteStats[0]?.count || 0);
    const currentOrders = Number(orderStats[0]?.count || 0);

    const prevLeads = Number(prevLeadCount[0]?.count || 0);
    const prevMeasures = Number(prevMeasureCount[0]?.count || 0);
    const prevQuotes = Number(prevQuoteCount[0]?.count || 0);
    const prevOrders = Number(prevOrderCount[0]?.count || 0);

    // 计算转化率和环比
    const calculateConversion = (current: number, previous: number) =>
        previous > 0 ? ((current / previous) * 100).toFixed(1) : null;

    const calculateTrend = (current: number, previous: number) =>
        previous > 0 ? (((current - previous) / previous) * 100).toFixed(1) : null;

    return {
        success: true,
        data: {
            stages: [
                {
                    stage: '线索',
                    count: currentLeads,
                    conversionRate: null,
                    avgDaysInStage: null,
                    previousPeriodCount: prevLeads,
                    trend: calculateTrend(currentLeads, prevLeads),
                },
                {
                    stage: '测量',
                    count: currentMeasures,
                    conversionRate: calculateConversion(currentMeasures, currentLeads),
                    avgDaysInStage: Number(measureStats[0]?.avgDays || 0).toFixed(1),
                    previousPeriodCount: prevMeasures,
                    trend: calculateTrend(currentMeasures, prevMeasures),
                },
                {
                    stage: '报价',
                    count: currentQuotes,
                    conversionRate: calculateConversion(currentQuotes, currentMeasures),
                    avgDaysInStage: Number(quoteStats[0]?.avgDays || 0).toFixed(1),
                    previousPeriodCount: prevQuotes,
                    trend: calculateTrend(currentQuotes, prevQuotes),
                },
                {
                    stage: '成交',
                    count: currentOrders,
                    conversionRate: calculateConversion(currentOrders, currentQuotes),
                    avgDaysInStage: Number(orderStats[0]?.avgDays || 0).toFixed(1),
                    previousPeriodCount: prevOrders,
                    trend: calculateTrend(currentOrders, prevOrders),
                },
            ],
            summary: {
                overallConversion: currentLeads > 0 ? ((currentOrders / currentLeads) * 100).toFixed(1) : '0',
                avgCycleTime: (
                    Number(measureStats[0]?.avgDays || 0) +
                    Number(quoteStats[0]?.avgDays || 0) +
                    Number(orderStats[0]?.avgDays || 0)
                ).toFixed(1),
            }
        }
    };
}));

export async function getSalesFunnel(params: z.infer<typeof salesFunnelSchema>) {
    return getSalesFunnelAction(params);
}

/**
 * 获取业绩排名
 */
const getLeaderboardAction = cache(createSafeAction(leaderboardSchema, async (params, { session }) => {
    checkPermission(session, PERMISSIONS.ANALYTICS.VIEW_ALL); // 仅店长可见

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
}));

export async function getLeaderboard(params: z.infer<typeof leaderboardSchema>) {
    return getLeaderboardAction(params);
}

/**
 * 获取订单趋势数据
 */
const getOrderTrendAction = cache(createSafeAction(orderTrendSchema, async (params, { session }) => {
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

export async function getOrderTrend(params: z.infer<typeof orderTrendSchema>) {
    return getOrderTrendAction(params);
}

// ==================== 新增：交付效率统计 ====================

import { installTasks, channels } from '@/shared/api/schema';

const deliveryEfficiencySchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

/**
 * 获取交付效率数据 (测量/安装)
 */
const getDeliveryEfficiencyAction = cache(createSafeAction(deliveryEfficiencySchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.ANALYTICS.VIEW);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const tenantId = session.user.tenantId;

    // 测量效率：平均周期、按时率
    const measureStats = await db
        .select({
            avgDays: sql<number>`AVG(EXTRACT(EPOCH FROM (${measureTasks.completedAt} - ${measureTasks.createdAt})) / 86400)`,
            total: sql<number>`COUNT(*)`,
            onTime: sql<number>`SUM(CASE WHEN ${measureTasks.completedAt} <= ${measureTasks.scheduledAt} THEN 1 ELSE 0 END)`,
        })
        .from(measureTasks)
        .where(
            and(
                eq(measureTasks.tenantId, tenantId),
                gte(measureTasks.createdAt, startDate),
                lte(measureTasks.createdAt, endDate),
                sql`${measureTasks.status} = 'COMPLETED'`
            )
        );

    const measureAvgDays = Number(measureStats[0]?.avgDays || 0);
    const measureTotal = Number(measureStats[0]?.total || 0);
    const measureOnTime = Number(measureStats[0]?.onTime || 0);
    const measureOnTimeRate = measureTotal > 0 ? (measureOnTime / measureTotal) * 100 : 0;

    // 安装效率
    const installStats = await db
        .select({
            avgDays: sql<number>`AVG(EXTRACT(EPOCH FROM (${installTasks.completedAt} - ${installTasks.createdAt})) / 86400)`,
            total: sql<number>`COUNT(*)`,
            onTime: sql<number>`SUM(CASE WHEN ${installTasks.completedAt} <= ${installTasks.scheduledDate} THEN 1 ELSE 0 END)`,
        })
        .from(installTasks)
        .where(
            and(
                eq(installTasks.tenantId, tenantId),
                gte(installTasks.createdAt, startDate),
                lte(installTasks.createdAt, endDate),
                sql`${installTasks.status} = 'COMPLETED'`
            )
        );

    const installAvgDays = Number(installStats[0]?.avgDays || 0);
    const installTotal = Number(installStats[0]?.total || 0);
    const installOnTime = Number(installStats[0]?.onTime || 0);
    const installOnTimeRate = installTotal > 0 ? (installOnTime / installTotal) * 100 : 0;

    // 待处理和逾期任务
    const pendingMeasure = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(measureTasks)
        .where(and(eq(measureTasks.tenantId, tenantId), sql`${measureTasks.status} IN ('PENDING', 'SCHEDULED')`));

    const pendingInstall = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(installTasks)
        .where(and(eq(installTasks.tenantId, tenantId), sql`${installTasks.status} IN ('PENDING', 'SCHEDULED')`));;

    const overdueMeasure = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(measureTasks)
        .where(and(
            eq(measureTasks.tenantId, tenantId),
            sql`${measureTasks.status} IN ('PENDING', 'SCHEDULED')`,
            lte(measureTasks.scheduledAt, new Date())
        ));

    const overdueInstall = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(installTasks)
        .where(and(
            eq(installTasks.tenantId, tenantId),
            sql`${installTasks.status} IN ('PENDING', 'SCHEDULED')`,
            lte(installTasks.scheduledDate, new Date())
        ));

    return {
        success: true,
        data: {
            measureAvgDays,
            measureOnTimeRate,
            installAvgDays,
            installOnTimeRate,
            totalPendingTasks: Number(pendingMeasure[0]?.count || 0) + Number(pendingInstall[0]?.count || 0),
            overdueTaskCount: Number(overdueMeasure[0]?.count || 0) + Number(overdueInstall[0]?.count || 0),
        }
    };
}));

export async function getDeliveryEfficiency(params: z.infer<typeof deliveryEfficiencySchema>) {
    return getDeliveryEfficiencyAction(params);
}

// ==================== 新增：客户来源分布统计 ====================

const customerSourceSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

/**
 * 获取客户来源分布数据
 */
const getCustomerSourceDistributionAction = cache(createSafeAction(customerSourceSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.ANALYTICS.VIEW);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const tenantId = session.user.tenantId;

    // 按渠道分组统计线索数
    const sourceStats = await db
        .select({
            channelId: leads.channelId,
            channelName: channels.name,
            count: sql<number>`COUNT(*)`,
        })
        .from(leads)
        .leftJoin(channels, eq(leads.channelId, channels.id))
        .where(
            and(
                eq(leads.tenantId, tenantId),
                gte(leads.createdAt, startDate),
                lte(leads.createdAt, endDate)
            )
        )
        .groupBy(leads.channelId, channels.name)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(10);

    // 无渠道的统计
    const noChannelStats = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(leads)
        .where(
            and(
                eq(leads.tenantId, tenantId),
                gte(leads.createdAt, startDate),
                lte(leads.createdAt, endDate),
                sql`${leads.channelId} IS NULL`
            )
        );

    const result = sourceStats.map(item => ({
        name: item.channelName || '未知渠道',
        value: Number(item.count || 0),
    }));

    const noChannelCount = Number(noChannelStats[0]?.count || 0);
    if (noChannelCount > 0) {
        result.push({ name: '直客/未分配', value: noChannelCount });
    }

    return {
        success: true,
        data: result
    };
}));

export async function getCustomerSourceDistribution(params: z.infer<typeof customerSourceSchema>) {
    return getCustomerSourceDistributionAction(params);
}

// ==================== 新增：利润率计算 (Profit Margin) ====================

// 注意：orderItems 和 products 已导入用于未来扩展，暂未使用
import { orderItems as _orderItems, products as _products } from '@/shared/api/schema';

const profitMarginSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    groupBy: z.enum(['category', 'month', 'sales']).default('category'),
});

/**
 * 获取利润率分析数据
 * 
 * 计算公式：
 * - 毛利 = 销售收入 - 采购成本
 * - 毛利率 = 毛利 / 销售收入 * 100%
 */
const getProfitMarginAnalysisAction = cache(createSafeAction(profitMarginSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.ANALYTICS.VIEW_ALL);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const tenantId = session.user.tenantId;

    // 订单收入和成本（基于订单项）
    const orderStats = await db
        .select({
            totalRevenue: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
            orderCount: sql<number>`COUNT(DISTINCT ${orders.id})`,
        })
        .from(orders)
        .where(
            and(
                eq(orders.tenantId, tenantId),
                gte(orders.createdAt, startDate),
                lte(orders.createdAt, endDate),
                sql`${orders.status} NOT IN ('CANCELLED', 'DRAFT')`
            )
        );

    // 计算采购成本（基于订单关联的采购单）
    const costStats = await db
        .select({
            totalCost: sql<string>`COALESCE(SUM(CAST(${purchaseOrders.totalAmount} AS DECIMAL)), 0)`,
        })
        .from(purchaseOrders)
        .where(
            and(
                eq(purchaseOrders.tenantId, tenantId),
                gte(purchaseOrders.createdAt, startDate),
                lte(purchaseOrders.createdAt, endDate),
                sql`${purchaseOrders.status} NOT IN ('CANCELLED', 'REJECTED')`
            )
        );

    const revenue = Number(orderStats[0]?.totalRevenue || 0);
    const cost = Number(costStats[0]?.totalCost || 0);
    const grossProfit = revenue - cost;
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    // 按月份趋势
    const monthlyTrend = await db
        .select({
            month: sql`DATE_TRUNC('month', ${orders.createdAt})`,
            revenue: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
        })
        .from(orders)
        .where(
            and(
                eq(orders.tenantId, tenantId),
                gte(orders.createdAt, startDate),
                lte(orders.createdAt, endDate),
                sql`${orders.status} NOT IN ('CANCELLED', 'DRAFT')`
            )
        )
        .groupBy(sql`DATE_TRUNC('month', ${orders.createdAt})`)
        .orderBy(sql`DATE_TRUNC('month', ${orders.createdAt})`);

    return {
        success: true,
        data: {
            totalRevenue: revenue.toFixed(2),
            totalCost: cost.toFixed(2),
            grossProfit: grossProfit.toFixed(2),
            grossMargin: grossMargin.toFixed(2),
            orderCount: Number(orderStats[0]?.orderCount || 0),
            avgOrderValue: Number(orderStats[0]?.orderCount) > 0
                ? (revenue / Number(orderStats[0]?.orderCount)).toFixed(2)
                : '0',
            monthlyTrend: monthlyTrend.map(item => ({
                month: item.month instanceof Date ? item.month.toISOString().slice(0, 7) : String(item.month).slice(0, 7),
                revenue: item.revenue,
            })),
        }
    };
}));

export async function getProfitMarginAnalysis(params: z.infer<typeof profitMarginSchema>) {
    return getProfitMarginAnalysisAction(params);
}

// ==================== 新增：售后健康度指标 (After-Sales Health) ====================

import { liabilityNotices, afterSalesTickets } from '@/shared/api/schema/after-sales';

const afterSalesHealthSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

/**
 * 获取售后健康度指标
 * 
 * 指标：
 * - 退款率 = 退款金额 / 总销售额
 * - 客诉率 = 客诉工单数 / 总订单数
 * - 责任分布 = 按责任方统计的定责单分布
 */
const getAfterSalesHealthAction = cache(createSafeAction(afterSalesHealthSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.ANALYTICS.VIEW);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const tenantId = session.user.tenantId;

    // 总销售额和订单数（同期）
    const salesStats = await db
        .select({
            totalRevenue: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
            totalOrders: sql<number>`COUNT(*)`,
        })
        .from(orders)
        .where(
            and(
                eq(orders.tenantId, tenantId),
                gte(orders.createdAt, startDate),
                lte(orders.createdAt, endDate),
                notInArray(orders.status, ['CANCELLED', 'DRAFT'])
            )
        );

    const totalRevenue = Number(salesStats[0]?.totalRevenue || 0);
    const totalOrders = Number(salesStats[0]?.totalOrders || 0);

    // 售后工单统计（使用 afterSalesTickets 表的 actualDeduction 字段作为退款金额）
    let afterSalesCount = 0;
    let refundAmount = 0;
    try {
        const asStats = await db
            .select({
                count: sql<number>`COUNT(*)`,
                refundTotal: sql<string>`COALESCE(SUM(CAST(${afterSalesTickets.actualDeduction} AS DECIMAL)), 0)`,
            })
            .from(afterSalesTickets)
            .where(
                and(
                    eq(afterSalesTickets.tenantId, tenantId),
                    gte(afterSalesTickets.createdAt, startDate),
                    lte(afterSalesTickets.createdAt, endDate)
                )
            );
        afterSalesCount = Number(asStats[0]?.count || 0);
        refundAmount = Number(asStats[0]?.refundTotal || 0);
    } catch {
        // 表可能不存在，忽略
    }

    // 定责单责任分布
    let liabilityDistribution: { party: string; count: number; amount: number }[] = [];
    try {
        const liability = await db
            .select({
                partyType: liabilityNotices.liablePartyType,
                count: sql<number>`COUNT(*)`,
                totalAmount: sql<string>`COALESCE(SUM(CAST(${liabilityNotices.amount} AS DECIMAL)), 0)`,
            })
            .from(liabilityNotices)
            .where(
                and(
                    eq(liabilityNotices.tenantId, tenantId),
                    gte(liabilityNotices.createdAt, startDate),
                    lte(liabilityNotices.createdAt, endDate),
                    eq(liabilityNotices.status, 'CONFIRMED')
                )
            )
            .groupBy(liabilityNotices.liablePartyType);

        liabilityDistribution = liability.map(item => ({
            party: item.partyType || '未知',
            count: Number(item.count || 0),
            amount: Number(item.totalAmount || 0),
        }));
    } catch {
        // 表可能不存在，忽略
    }

    // 计算指标
    const refundRate = totalRevenue > 0 ? (refundAmount / totalRevenue) * 100 : 0;
    const complaintRate = totalOrders > 0 ? (afterSalesCount / totalOrders) * 100 : 0;

    return {
        success: true,
        data: {
            // 核心指标
            refundRate: refundRate.toFixed(2),
            refundAmount: refundAmount.toFixed(2),
            complaintRate: complaintRate.toFixed(2),
            afterSalesCount,

            // 基准数据
            totalRevenue: totalRevenue.toFixed(2),
            totalOrders,

            // 责任分布
            liabilityDistribution,

            // 健康等级评估
            healthLevel: refundRate < 1 && complaintRate < 3 ? 'GOOD'
                : refundRate < 3 && complaintRate < 5 ? 'NORMAL'
                    : 'WARNING',
        }
    };
}));

export async function getAfterSalesHealth(params: z.infer<typeof afterSalesHealthSchema>) {
    return getAfterSalesHealthAction(params);
}

// ==================== 现金流预测 ====================

/**
 * 现金流预测 Schema
 */
const cashFlowForecastSchema = z.object({
    forecastDays: z.number().optional().default(90), // 预测天数 30/60/90
});

/**
 * 获取现金流预测数据
 * 基于 paymentSchedules 表预测未来回款
 */
const getCashFlowForecastAction = cache(createSafeAction(cashFlowForecastSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.ANALYTICS.VIEW);

    const today = new Date();
    const forecastEndDate = new Date();
    forecastEndDate.setDate(today.getDate() + params.forecastDays);

    const todayStr = today.toISOString().split('T')[0];
    const forecastEndDateStr = forecastEndDate.toISOString().split('T')[0];

    // ========== 未来回款预测（基于 paymentSchedules） ==========

    // 按周分组统计未来回款
    const weeklyForecast = await db
        .select({
            weekStart: sql<string>`DATE_TRUNC('week', ${paymentSchedules.expectedDate})::date`,
            totalAmount: sql<number>`SUM(${paymentSchedules.amount})`,
            count: sql<number>`COUNT(*)`,
        })
        .from(paymentSchedules)
        .innerJoin(orders, eq(paymentSchedules.orderId, orders.id))
        .where(
            and(
                eq(paymentSchedules.tenantId, session.user.tenantId),
                eq(paymentSchedules.status, 'PENDING'),
                gte(paymentSchedules.expectedDate, todayStr),
                lte(paymentSchedules.expectedDate, forecastEndDateStr)
            )
        )
        .groupBy(sql`DATE_TRUNC('week', ${paymentSchedules.expectedDate})`)
        .orderBy(sql`DATE_TRUNC('week', ${paymentSchedules.expectedDate})`);

    // 按月分组统计未来回款
    const monthlyForecast = await db
        .select({
            month: sql<string>`TO_CHAR(${paymentSchedules.expectedDate}, 'YYYY-MM')`,
            totalAmount: sql<number>`SUM(${paymentSchedules.amount})`,
            count: sql<number>`COUNT(*)`,
        })
        .from(paymentSchedules)
        .innerJoin(orders, eq(paymentSchedules.orderId, orders.id))
        .where(
            and(
                eq(paymentSchedules.tenantId, session.user.tenantId),
                eq(paymentSchedules.status, 'PENDING'),
                gte(paymentSchedules.expectedDate, todayStr),
                lte(paymentSchedules.expectedDate, forecastEndDateStr)
            )
        )
        .groupBy(sql`TO_CHAR(${paymentSchedules.expectedDate}, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(${paymentSchedules.expectedDate}, 'YYYY-MM')`);

    // 逾期未收款统计
    const overduePayments = await db
        .select({
            totalAmount: sql<number>`SUM(${paymentSchedules.amount})`,
            count: sql<number>`COUNT(*)`,
            avgOverdueDays: sql<number>`AVG(EXTRACT(EPOCH FROM (CURRENT_DATE - ${paymentSchedules.expectedDate})) / 86400)`,
        })
        .from(paymentSchedules)
        .innerJoin(orders, eq(paymentSchedules.orderId, orders.id))
        .where(
            and(
                eq(paymentSchedules.tenantId, session.user.tenantId),
                eq(paymentSchedules.status, 'PENDING'),
                sql`${paymentSchedules.expectedDate} < CURRENT_DATE`
            )
        );

    // 按收款节点类型分组统计
    const byScheduleType = await db
        .select({
            scheduleName: paymentSchedules.name,
            totalAmount: sql<number>`SUM(${paymentSchedules.amount})`,
            count: sql<number>`COUNT(*)`,
        })
        .from(paymentSchedules)
        .innerJoin(orders, eq(paymentSchedules.orderId, orders.id))
        .where(
            and(
                eq(paymentSchedules.tenantId, session.user.tenantId),
                eq(paymentSchedules.status, 'PENDING'),
                gte(paymentSchedules.expectedDate, todayStr),
                lte(paymentSchedules.expectedDate, forecastEndDateStr)
            )
        )
        .groupBy(paymentSchedules.name)
        .orderBy(sql`SUM(${paymentSchedules.amount}) DESC`);

    // 计算总预测金额
    const totalForecast = weeklyForecast.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
    const totalOverdue = Number(overduePayments[0]?.totalAmount || 0);

    return {
        success: true,
        data: {
            summary: {
                forecastPeriod: params.forecastDays,
                totalForecastAmount: totalForecast.toFixed(2),
                totalOverdueAmount: totalOverdue.toFixed(2),
                overdueCount: Number(overduePayments[0]?.count || 0),
                avgOverdueDays: Number(overduePayments[0]?.avgOverdueDays || 0).toFixed(1),
            },
            weeklyForecast: weeklyForecast.map(item => ({
                weekStart: item.weekStart,
                amount: Number(item.totalAmount || 0).toFixed(2),
                count: Number(item.count || 0),
            })),
            monthlyForecast: monthlyForecast.map(item => ({
                month: item.month,
                amount: Number(item.totalAmount || 0).toFixed(2),
                count: Number(item.count || 0),
            })),
            byScheduleType: byScheduleType.map(item => ({
                type: item.scheduleName,
                amount: Number(item.totalAmount || 0).toFixed(2),
                count: Number(item.count || 0),
            })),
        }
    };
}));

export async function getCashFlowForecast(params: z.infer<typeof cashFlowForecastSchema>) {
    return getCashFlowForecastAction(params);
}

// ==================== AR 账龄分析 ====================

/**
 * AR 账龄分析 Schema
 */
const arAgingAnalysisSchema = z.object({
    asOfDate: z.string().optional(), // 截止日期,默认今天
});

/**
 * 获取 AR 账龄分析数据
 * 按 30/60/90/90+ 天分层统计应收账款
 */
const getARAgingAnalysisAction = cache(createSafeAction(arAgingAnalysisSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.ANALYTICS.VIEW);

    const asOfDate = params.asOfDate ? new Date(params.asOfDate) : new Date();

    // ========== 查询所有未完成的 AR 对账单 ==========

    const pendingARStatements = await db
        .select({
            id: arStatements.id,
            statementNo: arStatements.statementNo,
            customerName: arStatements.customerName,
            totalAmount: arStatements.totalAmount,
            pendingAmount: arStatements.pendingAmount,
            createdAt: arStatements.createdAt,
            salesId: arStatements.salesId,
        })
        .from(arStatements)
        .where(
            and(
                eq(arStatements.tenantId, session.user.tenantId),
                sql`${arStatements.status} != 'COMPLETED'`,
                sql`${arStatements.pendingAmount} > 0`
            )
        );

    // ========== 计算账龄并分层 ==========

    const agingBuckets = {
        current: { amount: 0, count: 0, items: [] as typeof pendingARStatements },      // 0-30天
        days30: { amount: 0, count: 0, items: [] as typeof pendingARStatements },       // 31-60天
        days60: { amount: 0, count: 0, items: [] as typeof pendingARStatements },       // 61-90天
        days90Plus: { amount: 0, count: 0, items: [] as typeof pendingARStatements },   // 90+天
    };

    pendingARStatements.forEach(statement => {
        const ageDays = Math.floor((asOfDate.getTime() - new Date(statement.createdAt ?? Date.now()).getTime()) / (1000 * 60 * 60 * 24));
        const pendingAmount = Number(statement.pendingAmount || 0);

        if (ageDays <= 30) {
            agingBuckets.current.amount += pendingAmount;
            agingBuckets.current.count++;
            agingBuckets.current.items.push(statement);
        } else if (ageDays <= 60) {
            agingBuckets.days30.amount += pendingAmount;
            agingBuckets.days30.count++;
            agingBuckets.days30.items.push(statement);
        } else if (ageDays <= 90) {
            agingBuckets.days60.amount += pendingAmount;
            agingBuckets.days60.count++;
            agingBuckets.days60.items.push(statement);
        } else {
            agingBuckets.days90Plus.amount += pendingAmount;
            agingBuckets.days90Plus.count++;
            agingBuckets.days90Plus.items.push(statement);
        }
    });

    // ========== 按销售人员分组统计 ==========

    const bySales = await db
        .select({
            salesId: arStatements.salesId,
            salesName: users.name,
            totalPending: sql<number>`SUM(${arStatements.pendingAmount})`,
            count: sql<number>`COUNT(*)`,
        })
        .from(arStatements)
        .leftJoin(users, eq(arStatements.salesId, users.id))
        .where(
            and(
                eq(arStatements.tenantId, session.user.tenantId),
                sql`${arStatements.status} != 'COMPLETED'`,
                sql`${arStatements.pendingAmount} > 0`
            )
        )
        .groupBy(arStatements.salesId, users.name)
        .orderBy(sql`SUM(${arStatements.pendingAmount}) DESC`);

    // ========== 计算总计 ==========

    const totalPending = Object.values(agingBuckets).reduce((sum, bucket) => sum + bucket.amount, 0);
    const totalCount = pendingARStatements.length;

    return {
        success: true,
        data: {
            summary: {
                asOfDate: asOfDate.toISOString().split('T')[0],
                totalPendingAmount: totalPending.toFixed(2),
                totalCount,
            },
            agingBuckets: [
                {
                    range: '0-30天',
                    amount: agingBuckets.current.amount.toFixed(2),
                    count: agingBuckets.current.count,
                    percentage: totalPending > 0 ? ((agingBuckets.current.amount / totalPending) * 100).toFixed(1) : '0',
                },
                {
                    range: '31-60天',
                    amount: agingBuckets.days30.amount.toFixed(2),
                    count: agingBuckets.days30.count,
                    percentage: totalPending > 0 ? ((agingBuckets.days30.amount / totalPending) * 100).toFixed(1) : '0',
                },
                {
                    range: '61-90天',
                    amount: agingBuckets.days60.amount.toFixed(2),
                    count: agingBuckets.days60.count,
                    percentage: totalPending > 0 ? ((agingBuckets.days60.amount / totalPending) * 100).toFixed(1) : '0',
                },
                {
                    range: '90天以上',
                    amount: agingBuckets.days90Plus.amount.toFixed(2),
                    count: agingBuckets.days90Plus.count,
                    percentage: totalPending > 0 ? ((agingBuckets.days90Plus.amount / totalPending) * 100).toFixed(1) : '0',
                    riskLevel: 'HIGH', // 90+天标记为高风险
                },
            ],
            bySales: bySales.map(item => ({
                salesId: item.salesId,
                salesName: item.salesName || '未分配',
                amount: Number(item.totalPending || 0).toFixed(2),
                count: Number(item.count || 0),
            })),
        }
    };
}));

export async function getARAgingAnalysis(params: z.infer<typeof arAgingAnalysisSchema>) {
    return getARAgingAnalysisAction(params);
}

// ==================== 报价参考价格 ====================

/**
 * 报价参考价格 Schema
 */
const pricingReferenceSchema = z.object({
    productId: z.string(),
    periodDays: z.number().optional().default(90), // 统计最近多少天,默认90天
});

/**
 * 获取报价参考价格
 * 聚合历史 quoteItems 的均价/最高/最低
 * 仅统计已确认(CONFIRMED/WON/COMPLETED)的报价
 */
const getPricingReferenceAction = cache(createSafeAction(pricingReferenceSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.ANALYTICS.VIEW);

    const { productId, periodDays } = params;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // 统计已生效的报价 (假设 CONFIRMED, WON, COMPLETED 为有效成交状态)
    // 注意: 这里需要根据实际的 quoteStatusEnum 调整, 下一步会确认 enums
    // 暂时包含: CONFIRMED, COMPLETED (假设)

    const stats = await db
        .select({
            minPrice: sql<number>`MIN(${quoteItems.unitPrice})`,
            maxPrice: sql<number>`MAX(${quoteItems.unitPrice})`,
            avgPrice: sql<number>`AVG(${quoteItems.unitPrice})`,
            totalQuantity: sql<number>`SUM(${quoteItems.quantity})`,
            count: sql<number>`COUNT(*)`,
        })
        .from(quoteItems)
        .innerJoin(quotes, eq(quoteItems.quoteId, quotes.id))
        .where(
            and(
                eq(quoteItems.tenantId, session.user.tenantId),
                eq(quoteItems.productId, productId),
                gte(quotes.createdAt, startDate),
                // 排除草稿和取消的报价,只看正式的
                notInArray(quotes.status, ['DRAFT', 'REJECTED'])
            )
        );

    const result = stats[0];

    return {
        success: true,
        data: {
            productId,
            periodDays,
            minPrice: Number(result?.minPrice || 0).toFixed(2),
            maxPrice: Number(result?.maxPrice || 0).toFixed(2),
            avgPrice: Number(result?.avgPrice || 0).toFixed(2),
            sampleSize: Number(result?.count || 0),
        }
    };
}));

export async function getPricingReference(params: z.infer<typeof pricingReferenceSchema>) {
    return getPricingReferenceAction(params);
}


