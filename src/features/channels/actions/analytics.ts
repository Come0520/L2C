'use server';

import { db } from '@/shared/api/db';
import { channels, channelCommissions } from '@/shared/api/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';

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

export async function getChannelAnalytics(tenantId?: string): Promise<ChannelAnalyticsData[]> {
    const session = await auth();
    const effectiveTenantId = tenantId || session?.user?.tenantId;

    if (!effectiveTenantId) return [];

    // 1. Fetch Basic Channel Stats (Leads, Deal Amount from denormalized fields)
    const channelStats = await db.query.channels.findMany({
        where: eq(channels.tenantId, effectiveTenantId),
        columns: {
            id: true,
            name: true,
            totalLeads: true,
            totalDealAmount: true,
        },
        orderBy: [desc(channels.totalDealAmount)],
    });

    // 2. Calculate Commissions per Channel (Cost)
    // We group by channelId to get total commission cost
    const commissions = await db
        .select({
            channelId: channelCommissions.channelId,
            totalCommission: sql<number>`sum(${channelCommissions.amount})`,
            orderCount: sql<number>`count(${channelCommissions.orderId})` // Or distinct orders
        })
        .from(channelCommissions)
        .where(eq(channelCommissions.tenantId, effectiveTenantId))
        .groupBy(channelCommissions.channelId);

    const commissionMap = new Map<string, { cost: number, orders: number }>();
    commissions.forEach(c => {
        commissionMap.set(c.channelId, {
            cost: Number(c.totalCommission || 0),
            orders: Number(c.orderCount || 0)
        });
    });

    // 3. Merge and Compute KPIs
    const results: ChannelAnalyticsData[] = channelStats.map(ch => {
        const commData = commissionMap.get(ch.id) || { cost: 0, orders: 0 };
        const totalDealAmount = Number(ch.totalDealAmount || 0);
        const totalLeads = ch.totalLeads || 0;

        // Orders: logic might vary, here we use commissions count or we could query orders table
        // For simplicity, let's assume totalOrders is close to commission orders count (paid channels)
        // OR better: use channel's associated orders if we had a direct link. 
        // Given current schema, channelCommissions links order to channel.
        const totalOrders = commData.orders;

        // Conversion Rate: Orders / Leads
        const conversionRate = totalLeads > 0 ? (totalOrders / totalLeads) * 100 : 0;

        // ROI: (Deal Amount - Cost) / Cost  (or just Revenue / Cost, let's use Revenue / Cost for simple ROI factor or (Rev-Cost)/Cost%)
        // Let's us (Revenue - Cost) / Cost * 100% for standard ROI
        const roi = commData.cost > 0 ? ((totalDealAmount - commData.cost) / commData.cost) * 100 : 0;

        // Avg Transaction Value
        const avgTransactionValue = totalOrders > 0 ? totalDealAmount / totalOrders : 0;

        return {
            id: ch.id,
            name: ch.name,
            totalLeads,
            totalOrders,
            totalDealAmount,
            commissionAmount: commData.cost,
            conversionRate: parseFloat(conversionRate.toFixed(2)),
            roi: parseFloat(roi.toFixed(2)),
            avgTransactionValue: parseFloat(avgTransactionValue.toFixed(2)),
        };
    });

    return results.sort((a, b) => b.totalDealAmount - a.totalDealAmount);
}
