/**
 * 老板端 - 仪表盘核心指标 API
 * GET /api/mobile/dashboard/summary
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { orders, leads, paymentBills } from '@/shared/api/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { authenticateMobile, requireBoss } from '@/shared/middleware/mobile-auth';
import { createLogger } from '@/shared/lib/logger';
import { dashboardCache } from '@/shared/lib/cache-utils';
import { withTiming } from '@/shared/middleware/api-timing';


const log = createLogger('mobile/dashboard/summary');
export const GET = withTiming(async (request: NextRequest) => {
    // 1. 认证
    const authResult = await authenticateMobile(request);
    if (!authResult.success) {
        return authResult.response;
    }
    const { session } = authResult;

    // 2. 权限检查
    const roleCheck = requireBoss(session);
    if (!roleCheck.allowed) {
        return roleCheck.response;
    }

    try {
        const tenantId = session.tenantId;
        const userId = session.userId;
        const cacheKey = `dashboard:summary:${tenantId}:${userId}`;

        // 尝试从缓存获取
        const cachedData = dashboardCache.get(cacheKey);
        if (cachedData) {
            return apiSuccess(cachedData);
        }

        const now = new Date();

        // 今日范围
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        // 昨日范围
        const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayEnd = new Date(todayEnd.getTime() - 24 * 60 * 60 * 1000);

        // 3. 今日订单数
        const todayOrders = await db.select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(and(
                eq(orders.tenantId, tenantId),
                gte(orders.createdAt, todayStart),
                lte(orders.createdAt, todayEnd)
            ));

        // 昨日订单数
        const yesterdayOrders = await db.select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(and(
                eq(orders.tenantId, tenantId),
                gte(orders.createdAt, yesterdayStart),
                lte(orders.createdAt, yesterdayEnd)
            ));

        // 4. 今日付款（注意：paidAt 可能为 null，使用 createdAt 且只统计已付款状态）
        const todayPayments = await db.select({
            total: sql<string>`COALESCE(SUM(CAST(${paymentBills.amount} AS DECIMAL)), 0)`
        })
            .from(paymentBills)
            .where(and(
                eq(paymentBills.tenantId, tenantId),
                eq(paymentBills.status, 'PAID'),
                gte(paymentBills.createdAt, todayStart),
                lte(paymentBills.createdAt, todayEnd)
            ));

        // 昨日付款
        const yesterdayPayments = await db.select({
            total: sql<string>`COALESCE(SUM(CAST(${paymentBills.amount} AS DECIMAL)), 0)`
        })
            .from(paymentBills)
            .where(and(
                eq(paymentBills.tenantId, tenantId),
                eq(paymentBills.status, 'PAID'),
                gte(paymentBills.createdAt, yesterdayStart),
                lte(paymentBills.createdAt, yesterdayEnd)
            ));

        // 5. 新增线索
        const todayLeads = await db.select({ count: sql<number>`count(*)` })
            .from(leads)
            .where(and(
                eq(leads.tenantId, tenantId),
                gte(leads.createdAt, todayStart),
                lte(leads.createdAt, todayEnd)
            ));

        const yesterdayLeads = await db.select({ count: sql<number>`count(*)` })
            .from(leads)
            .where(and(
                eq(leads.tenantId, tenantId),
                gte(leads.createdAt, yesterdayStart),
                lte(leads.createdAt, yesterdayEnd)
            ));

        // 6. 计算对比
        const todayOrderCount = Number(todayOrders[0]?.count || 0);
        const yesterdayOrderCount = Number(yesterdayOrders[0]?.count || 0);
        const todayPaymentTotal = parseFloat(todayPayments[0]?.total || '0');
        const yesterdayPaymentTotal = parseFloat(yesterdayPayments[0]?.total || '0');
        const todayLeadCount = Number(todayLeads[0]?.count || 0);
        const yesterdayLeadCount = Number(yesterdayLeads[0]?.count || 0);

        const result = {
            orders: {
                today: todayOrderCount,
                yesterday: yesterdayOrderCount,
                change: todayOrderCount - yesterdayOrderCount,
                trend: todayOrderCount >= yesterdayOrderCount ? 'up' : 'down',
            },
            payments: {
                today: todayPaymentTotal,
                yesterday: yesterdayPaymentTotal,
                change: todayPaymentTotal - yesterdayPaymentTotal,
                changePercent: yesterdayPaymentTotal > 0
                    ? Math.round((todayPaymentTotal - yesterdayPaymentTotal) / yesterdayPaymentTotal * 100)
                    : 0,
                trend: todayPaymentTotal >= yesterdayPaymentTotal ? 'up' : 'down',
            },
            leads: {
                today: todayLeadCount,
                yesterday: yesterdayLeadCount,
                change: todayLeadCount - yesterdayLeadCount,
                trend: todayLeadCount >= yesterdayLeadCount ? 'up' : 'down',
            },
            generatedAt: now.toISOString(),
        };

        // 存入缓存 (5分钟)
        dashboardCache.set(cacheKey, result);

        return apiSuccess(result);

    } catch (error) {
        log.error('仪表盘数据查询错误', {}, error);
        return apiError('查询仪表盘数据失败', 500);
    }
});
