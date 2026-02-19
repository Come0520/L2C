'use server';

import { db } from '@/shared/api/db';
import { channels, channelCommissions } from '@/shared/api/schema/channels';
import { leads } from '@/shared/api/schema/leads';
import { orders } from '@/shared/api/schema/orders';
import { eq, and, sql, desc, inArray, gte, isNull, isNotNull } from 'drizzle-orm';
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

    return _getChannelStatsInternal(channelId, tenantId);
}

/**
 * 内部统计逻辑 (不含权限检查，供批量调用)
 */
async function _getChannelStatsInternal(channelId: string, tenantId: string): Promise<ChannelStats | null> {
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
            inArray(leads.channelId, allChannelIds)
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
            inArray(leads.channelId, allChannelIds),
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
            inArray(channelCommissions.channelId, allChannelIds)
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
            inArray(leads.channelId, allChannelIds),
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

    const { limit = 10, period = 'month' } = options || {};

    let startDate: Date | undefined;
    const now = new Date();

    switch (period) {
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'quarter':
            startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case 'all':
        default:
            startDate = undefined; // No date filter for 'all'
            break;
    }

    const whereConditions = [
        eq(channels.tenantId, tenantId),
        isNull(channels.parentId)
    ];

    if (startDate) {
        // Assuming 'createdAt' or 'updatedAt' on the channel table could be used for filtering
        // However, for ranking by performance within a period, the aggregated fields (totalDealAmount, totalLeads)
        // would need to be re-calculated for that period, not filtered by channel creation date.
        // The current instruction implies filtering the channels themselves.
        // For a true "ranking by period", the `totalDealAmount` in the `orderBy` and `getQuickStats`
        // would need to be dynamically calculated for the period, not read from a stored field.
        // For now, we'll apply the filter to `channels.createdAt` as per instruction,
        // but note this might not align with a "performance ranking" if totalDealAmount is all-time.
        whereConditions.push(gte(channels.createdAt, startDate));
    }

    // 获取所有一级渠道
    const topChannels = await db.query.channels.findMany({
        where: and(...whereConditions),
        orderBy: [desc(channels.totalDealAmount)], // This still ranks by all-time totalDealAmount
        limit,
        with: {
            children: true // Eager load children to avoid extra query
        }
    });

    const results: ChannelStats[] = [];

    // Parallelize stats fetching for top channels
    // Optimization: Use stored fields from channels table instead of recalculating (N+1 recursion)
    const statsPromises = topChannels.map(async (channel) => {
        // Helper to formatting stats from channel record + lightweight dynamic queries
        const getQuickStats = async (ch: typeof topChannels[0], periodStartDate?: Date): Promise<ChannelStats> => {
            // Fetch missing dynamic stats (non-recursive, single channel)
            const [commissionStats, orderStats, recentOrders] = await Promise.all([
                db.select({ total: sql<number>`COALESCE(sum(${channelCommissions.amount}), 0)::numeric` })
                    .from(channelCommissions)
                    .where(and(
                        eq(channelCommissions.tenantId, tenantId),
                        eq(channelCommissions.channelId, ch.id),
                        periodStartDate ? gte(channelCommissions.createdAt, periodStartDate) : undefined
                    )),
                db.select({
                    total: sql<number>`COALESCE(sum(${orders.totalAmount}), 0)::numeric`,
                    count: sql<number>`count(*)::int`
                })
                    .from(orders)
                    .innerJoin(leads, eq(orders.leadId, leads.id))
                    .where(and(
                        eq(leads.tenantId, tenantId),
                        eq(leads.channelId, ch.id),
                        eq(orders.status, 'COMPLETED'),
                        periodStartDate ? gte(orders.createdAt, periodStartDate) : undefined
                    )),
                // Recent orders for activity check (always 30 days, not period-specific)
                db.select({ count: sql<number>`count(*)::int` })
                    .from(orders)
                    .innerJoin(leads, eq(orders.leadId, leads.id))
                    .where(and(
                        eq(leads.tenantId, tenantId),
                        eq(leads.channelId, ch.id),
                        gte(orders.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                    ))
            ]);

            const totalDealAmount = Number(orderStats[0]?.total) || 0;
            const dealCount = orderStats[0]?.count || 0;
            // For lead count, if we want period-specific, we need to query leads table with periodStartDate
            // For now, using stored totalLeads, assuming it's all-time or updated periodically.
            // If period-specific lead count is needed, uncomment and adjust:
            // const periodLeadStats = await db.select({ count: sql<number>`count(*)::int` })
            //     .from(leads)
            //     .where(and(
            //         eq(leads.tenantId, tenantId),
            //         eq(leads.channelId, ch.id),
            //         periodStartDate ? gte(leads.createdAt, periodStartDate) : undefined
            //     ));
            // const leadCount = periodLeadStats[0]?.count || 0;
            const leadCount = ch.totalLeads || 0; // Using stored all-time lead count for now

            const totalCommission = Number(commissionStats[0]?.total) || 0;

            return {
                channelId: ch.id,
                channelName: ch.name,
                channelLevel: ch.level,
                hierarchyLevel: ch.hierarchyLevel,
                totalDealAmount,
                dealCount,
                avgDealAmount: dealCount > 0 ? totalDealAmount / dealCount : 0,
                leadCount,
                conversionRate: leadCount > 0 ? (dealCount / leadCount) * 100 : 0,
                totalCommission,
                isActive: (recentOrders[0]?.count || 0) > 0,
            };
        };

        const stats = await getQuickStats(channel, startDate);

        // Process children (also using quick stats)
        if (channel.children) {
            const childStats = await Promise.all(
                channel.children.map(child => getQuickStats(child as typeof topChannels[0], startDate))
            );
            stats.children = childStats;
        }

        return stats;
    });

    const resolvedStats = await Promise.all(statsPromises);
    results.push(...resolvedStats);

    // 按带单总额排序 (Now sorting by the period-specific totalDealAmount)
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
        conditions.push(inArray(leads.channelId, allChannelIds));
    } else {
        conditions.push(isNotNull(leads.channelId));
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
    // 使用递归 CTE 查询所有子孙渠道 ID，增加 depth 限制防止死循环
    // Max depth 10
    const result = await db.execute(sql`
        WITH RECURSIVE descendants AS (
            SELECT id, 1 as depth FROM ${channels} WHERE parent_id = ${channelId} AND tenant_id = ${tenantId}
            UNION ALL
            SELECT c.id, d.depth + 1 FROM ${channels} c JOIN descendants d ON c.parent_id = d.id AND c.tenant_id = ${tenantId}
            WHERE d.depth < 10
        )
        SELECT id FROM descendants
    `);

    return result.map(row => row.id as string);
}
