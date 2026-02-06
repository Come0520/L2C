'use server';

import { db } from '@/shared/api/db';
import { channels, channelCommissions } from '@/shared/api/schema/channels';
import { leads } from '@/shared/api/schema/leads';
import { orders } from '@/shared/api/schema/orders';
import { eq, and, sql, gte, desc } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';

/**
 * 渠道统计结果类型
 */
export interface ChannelStats {
    channelId: string;
    channelName: string;
    channelLevel: string | null;
    hierarchyLevel: number;
    totalDealAmount: number;      // 带单总额
    dealCount: number;            // 成交单数
    avgDealAmount: number;        // 平均单价
    leadCount: number;            // 线索数量
    conversionRate: number;       // 转化率
    totalCommission: number;      // 佣金总额
    isActive: boolean;            // 活跃度（30天内有新单）
    children?: ChannelStats[];    // 子渠道统计
}

/**
 * 渠道概览数据类型
 */
export interface ChannelStatsOverview {
    activeChannelCount: number;   // 活跃渠道数
    totalDealAmount: number;      // 本月带单总额
    totalLeadCount: number;       // 本月线索数
    avgConversionRate: number;    // 平均转化率
    pendingCommission: number;    // 待结算佣金
}

/**
 * 获取单个渠道的统计数据
 * 
 * 权限：需要 CHANNEL.VIEW 权限
 */
export async function getChannelStats(channelId: string): Promise<ChannelStats | null> {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    await checkPermission(session, PERMISSIONS.CHANNEL.VIEW);
    const tenantId = session.user.tenantId;

    // 获取渠道基本信息
    const channel = await db.query.channels.findFirst({
        where: and(eq(channels.id, channelId), eq(channels.tenantId, tenantId)),
    });

    if (!channel) return null;

    // 获取该渠道及其子渠道的所有ID
    const allChannelIds = await getAllDescendantIds(channelId, tenantId);
    allChannelIds.push(channelId);

    // 统计线索数量
    const leadStats = await db
        .select({
            count: sql<number>`count(*)::int`,
        })
        .from(leads)
        .where(and(
            eq(leads.tenantId, tenantId),
            sql`${leads.channelId} = ANY(${allChannelIds})`
        ));

    // 统计成交订单（通过线索关联）
    const orderStats = await db
        .select({
            count: sql<number>`count(*)::int`,
            total: sql<number>`COALESCE(sum(${orders.totalAmount}), 0)::numeric`,
        })
        .from(orders)
        .innerJoin(leads, eq(orders.leadId, leads.id))
        .where(and(
            eq(leads.tenantId, tenantId),
            sql`${leads.channelId} = ANY(${allChannelIds})`,
            eq(orders.status, 'COMPLETED')
        ));

    // 统计佣金
    const commissionStats = await db
        .select({
            total: sql<number>`COALESCE(sum(${channelCommissions.amount}), 0)::numeric`,
        })
        .from(channelCommissions)
        .where(and(
            eq(channelCommissions.tenantId, tenantId),
            sql`${channelCommissions.channelId} = ANY(${allChannelIds})`
        ));

    // 检查30天内是否有新订单（活跃度）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentOrders = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .innerJoin(leads, eq(orders.leadId, leads.id))
        .where(and(
            eq(leads.tenantId, tenantId),
            sql`${leads.channelId} = ANY(${allChannelIds})`,
            gte(orders.createdAt, thirtyDaysAgo)
        ));

    const leadCount = leadStats[0]?.count || 0;
    const dealCount = orderStats[0]?.count || 0;
    const totalDealAmount = Number(orderStats[0]?.total) || 0;
    const totalCommission = Number(commissionStats[0]?.total) || 0;

    return {
        channelId: channel.id,
        channelName: channel.name,
        channelLevel: channel.level,
        hierarchyLevel: channel.hierarchyLevel,
        totalDealAmount,
        dealCount,
        avgDealAmount: dealCount > 0 ? totalDealAmount / dealCount : 0,
        leadCount,
        conversionRate: leadCount > 0 ? (dealCount / leadCount) * 100 : 0,
        totalCommission,
        isActive: (recentOrders[0]?.count || 0) > 0,
    };
}

/**
 * 获取渠道统计概览（Dashboard 卡片用）
 * 
 * 权限：需要 CHANNEL.VIEW 权限
 */
export async function getChannelStatsOverview(): Promise<ChannelStatsOverview> {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    await checkPermission(session, PERMISSIONS.CHANNEL.VIEW);
    const tenantId = session.user.tenantId;

    // 计算本月起始时间
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 统计活跃渠道数（30天内有新订单的渠道）
    const activeChannels = await db
        .select({
            count: sql<number>`count(distinct ${leads.channelId})::int`,
        })
        .from(orders)
        .innerJoin(leads, eq(orders.leadId, leads.id))
        .where(and(
            eq(leads.tenantId, tenantId),
            gte(orders.createdAt, thirtyDaysAgo)
        ));

    // 本月带单总额
    const monthlyStats = await db
        .select({
            total: sql<number>`COALESCE(sum(${orders.totalAmount}), 0)::numeric`,
            count: sql<number>`count(*)::int`,
        })
        .from(orders)
        .innerJoin(leads, eq(orders.leadId, leads.id))
        .where(and(
            eq(leads.tenantId, tenantId),
            gte(orders.createdAt, monthStart),
            eq(orders.status, 'COMPLETED')
        ));

    // 本月线索数
    const monthlyLeads = await db
        .select({
            count: sql<number>`count(*)::int`,
        })
        .from(leads)
        .where(and(
            eq(leads.tenantId, tenantId),
            gte(leads.createdAt, monthStart),
            sql`${leads.channelId} IS NOT NULL`
        ));

    // 待结算佣金
    const pendingCommission = await db
        .select({
            total: sql<number>`COALESCE(sum(${channelCommissions.amount}), 0)::numeric`,
        })
        .from(channelCommissions)
        .where(and(
            eq(channelCommissions.tenantId, tenantId),
            eq(channelCommissions.status, 'PENDING')
        ));

    const dealCount = monthlyStats[0]?.count || 0;
    const leadCount = monthlyLeads[0]?.count || 0;

    return {
        activeChannelCount: activeChannels[0]?.count || 0,
        totalDealAmount: Number(monthlyStats[0]?.total) || 0,
        totalLeadCount: leadCount,
        avgConversionRate: leadCount > 0 ? (dealCount / leadCount) * 100 : 0,
        pendingCommission: Number(pendingCommission[0]?.total) || 0,
    };
}

/**
 * 获取渠道排行榜
 * 
 * 权限：需要 CHANNEL.VIEW 权限
 */
export async function getChannelRanking(options?: {
    limit?: number;
    period?: 'month' | 'quarter' | 'year' | 'all';
}): Promise<ChannelStats[]> {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    await checkPermission(session, PERMISSIONS.CHANNEL.VIEW);
    const tenantId = session.user.tenantId;

    const { limit = 10 } = options || {};

    // TODO: Implement date range filtering for ranking. Currently returns all-time ranking.
    // const { period = 'month' } = options || {};

    // 获取所有一级渠道
    const topChannels = await db.query.channels.findMany({
        where: and(
            eq(channels.tenantId, tenantId),
            sql`${channels.parentId} IS NULL`
        ),
        orderBy: [desc(channels.totalDealAmount)],
        limit,
    });

    // 为每个渠道计算统计数据
    const results: ChannelStats[] = [];

    for (const channel of topChannels) {
        const stats = await getChannelStats(channel.id);
        if (stats) {
            // 获取子渠道统计
            const childChannels = await db.query.channels.findMany({
                where: and(
                    eq(channels.tenantId, tenantId),
                    eq(channels.parentId, channel.id)
                ),
            });

            const childStats: ChannelStats[] = [];
            for (const child of childChannels) {
                const childStat = await getChannelStats(child.id);
                if (childStat) {
                    childStats.push(childStat);
                }
            }

            stats.children = childStats;
            results.push(stats);
        }
    }

    // 按带单总额排序
    results.sort((a, b) => b.totalDealAmount - a.totalDealAmount);

    return results;
}

/**
 * 获取渠道趋势数据（按月统计）
 * 
 * 权限：需要 CHANNEL.VIEW 权限
 */
export async function getChannelTrend(options?: {
    months?: number;
    channelId?: string;
}): Promise<{ month: string; dealAmount: number; dealCount: number }[]> {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    await checkPermission(session, PERMISSIONS.CHANNEL.VIEW);
    const tenantId = session.user.tenantId;

    const { months = 6, channelId } = options || {};

    // 计算起始月份
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months + 1);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    // 构建查询条件
    const conditions = [
        eq(leads.tenantId, tenantId),
        gte(orders.createdAt, startDate),
        eq(orders.status, 'COMPLETED'),
    ];

    if (channelId) {
        const allChannelIds = await getAllDescendantIds(channelId, tenantId);
        allChannelIds.push(channelId);
        conditions.push(sql`${leads.channelId} = ANY(${allChannelIds})`);
    } else {
        conditions.push(sql`${leads.channelId} IS NOT NULL`);
    }

    // 按月分组统计
    const trendData = await db
        .select({
            month: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM')`,
            dealAmount: sql<number>`COALESCE(sum(${orders.totalAmount}), 0)::numeric`,
            dealCount: sql<number>`count(*)::int`,
        })
        .from(orders)
        .innerJoin(leads, eq(orders.leadId, leads.id))
        .where(and(...conditions))
        .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM')`);

    return trendData.map(item => ({
        month: item.month,
        dealAmount: Number(item.dealAmount),
        dealCount: item.dealCount,
    }));
}

/**
 * 辅助函数：获取所有子孙渠道ID
 */
async function getAllDescendantIds(channelId: string, tenantId: string): Promise<string[]> {
    const result: string[] = [];

    const children = await db.query.channels.findMany({
        where: and(
            eq(channels.tenantId, tenantId),
            eq(channels.parentId, channelId)
        ),
        columns: { id: true },
    });

    for (const child of children) {
        result.push(child.id);
        const grandChildren = await getAllDescendantIds(child.id, tenantId);
        result.push(...grandChildren);
    }

    return result;
}
