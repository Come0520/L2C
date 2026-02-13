'use server';

import { db } from '@/shared/api/db';
import { channels, channelCommissions } from '@/shared/api/schema';
import { eq, sql, desc, and } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';

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
/**
 * 获取渠道分析数据
 * 
 * 安全检查：自动从 session 获取 tenantId
 */
export async function getChannelAnalytics(params?: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
}): Promise<ChannelAnalyticsData[]> {
    const session = await auth();
    if (!session?.user?.tenantId) return [];

    const tenantId = session.user.tenantId;
    const { startDate, endDate, limit = 50 } = params || {};

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
        sql`${channelCommissions.channelId} IN ${channelIds}`
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

    // 3. Merge and Compute KPIs
    const results: ChannelAnalyticsData[] = topChannels.map(ch => {
        const commData = commissionMap.get(ch.id) || { cost: 0, orders: 0 };
        const totalDealAmount = Number(ch.totalDealAmount || 0);
        const totalLeads = ch.totalLeads || 0;

        // Note: With date filter, totalDealAmount/totalLeads from channel table are inaccurate (they are lifetime totals).
        // A full analytics solution would aggregate these from source tables too.
        // For this refactor, we stick to existing logic but optimize cost query.

        const totalOrders = commData.orders;
        const conversionRate = totalLeads > 0 ? (totalOrders / totalLeads) * 100 : 0;
        const cost = commData.cost;
        const roi = cost > 0 ? ((totalDealAmount - cost) / cost) * 100 : 0;
        const avgTransactionValue = totalOrders > 0 ? totalDealAmount / totalOrders : 0;

        return {
            id: ch.id,
            name: ch.name,
            totalLeads,
            totalOrders,
            totalDealAmount,
            commissionAmount: cost,
            conversionRate: parseFloat(conversionRate.toFixed(2)),
            roi: parseFloat(roi.toFixed(2)),
            avgTransactionValue: parseFloat(avgTransactionValue.toFixed(2)),
        };
    });

    return results.sort((a, b) => b.totalDealAmount - a.totalDealAmount);
}
