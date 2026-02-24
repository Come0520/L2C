'use server';

import { db } from '@/shared/api/db';
import { channels, channelCommissions } from '@/shared/api/schema';
import { eq, sql, desc, and, inArray } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { AuditService } from '@/shared/services/audit-service';
import { unstable_cache } from 'next/cache';
import { computeChannelAnalytics } from '../logic/analytics-engine';
import { logger } from '@/shared/lib/logger';

/**
 * 渠道分析查询参数
 */
export interface GetChannelAnalyticsParams {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}

// 类型定义（导出供组件使用）
export interface ChannelAnalyticsData {
    id: string;
    name: string;
    totalLeads: number;
    totalOrders: number;
    totalDealAmount: number;
    commissionAmount: number;
    conversionRate: number; // percentage
    roi: number; // Return on Investment (Deal Amount / Commission Amount)
    avgTransactionValue: number;
}

/**
 * 获取渠道分析数据
 * 
 * 安全检查：自动从 session 获取 tenantId
 */

export async function getChannelAnalytics(params?: GetChannelAnalyticsParams): Promise<ChannelAnalyticsData[]> {
    const session = await auth();
    if (!session?.user?.tenantId) return [];

    // P1 Fix: Add permission check
    await checkPermission(session, PERMISSIONS.CHANNEL.VIEW);

    const tenantId = session.user.tenantId;

    logger.info('[channels] Fetching channel analytics', { userId: session.user.id, params });

    // P1 Fix: Add audit log (Action: VIEW)
    await AuditService.log(db, {
        tableName: 'channels',
        recordId: 'ANALYTICS',
        action: 'VIEW',
        userId: session.user.id,
        tenantId,
        details: { params }
    });

    // P8 Fix: Cache analytics
    const getCachedAnalytics = unstable_cache(
        async (p: GetChannelAnalyticsParams | undefined, tid: string) => _getChannelAnalyticsInternal(p, tid),
        [`channel-analytics-${tenantId}`],
        { revalidate: 3600, tags: ['channel-analytics'] }
    );

    return getCachedAnalytics(params, tenantId);
}

/**
 * 内部分析逻辑 (导出供测试使用)
 */
export async function _getChannelAnalyticsInternal(
    params: GetChannelAnalyticsParams | undefined,
    tenantId: string
): Promise<ChannelAnalyticsData[]> {

    const { startDate, endDate, limit: rawLimit = 10 } = params || {};

    // P3 Fix: 限制最大查询数量
    const limit = Math.min(Math.max(rawLimit, 1), 100);

    // 1. Fetch Basic Channel Stats (Top N by Deal Amount to reduce set size)
    // 注意：totalLeads 和 totalDealAmount 是累积值，不支持时间范围过滤（除非有历史快照表）
    // 如果需要按时间范围统计 leads/amount，需要查询 leads/orders 表聚合。
    // 这里为了性能，如果未指定时间范围，使用缓存字段；如果指定了，则需要实时聚合（更昂贵）。

    // 暂时策略：仅对 Top N 渠道进行详细计算
    const topChannels = await db.query.channels.findMany({
        where: eq(channels.tenantId, tenantId),
        columns: {
            id: true,
            name: true,
            totalLeads: true,
            totalDealAmount: true,
        },
        orderBy: [desc(channels.totalDealAmount)],
        limit: limit, // Limit to Top N
    });

    if (topChannels.length === 0) return [];

    const channelIds = topChannels.map(c => c.id);

    // 2. Calculate Commissions per Channel (Cost) - Filtered by Channel IDs and Date
    let commissionWhere = and(
        eq(channelCommissions.tenantId, tenantId),
        inArray(channelCommissions.channelId, channelIds)
    );

    if (startDate && endDate) {
        commissionWhere = and(
            commissionWhere,
            sql`${channelCommissions.createdAt} BETWEEN ${startDate.toISOString()} AND ${endDate.toISOString()}`
        );
    }

    const commissions = await db
        .select({
            channelId: channelCommissions.channelId,
            totalCommission: sql<number>`sum(${channelCommissions.amount})`,
            orderCount: sql<number>`count(${channelCommissions.orderId})`
        })
        .from(channelCommissions)
        .where(commissionWhere)
        .groupBy(channelCommissions.channelId);

    const commissionMap = new Map<string, { cost: number, orders: number }>();
    commissions.forEach(c => {
        commissionMap.set(c.channelId, {
            cost: Number(c.totalCommission || 0),
            orders: Number(c.orderCount || 0)
        });
    });

    // 3. Merge and Compute KPIs (Using decoupled logic)
    return computeChannelAnalytics(
        topChannels.map(ch => ({
            id: ch.id,
            name: ch.name,
            totalLeads: ch.totalLeads || 0,
            totalDealAmount: ch.totalDealAmount || 0
        })),
        commissions.map(c => ({
            channelId: c.channelId,
            totalCommission: c.totalCommission,
            orderCount: c.orderCount
        }))
    );
}
