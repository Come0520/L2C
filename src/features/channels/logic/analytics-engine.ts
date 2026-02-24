/**
 * 渠道分析核心计算逻辑
 */

export interface AnalyticsInput {
    id: string;
    name: string;
    totalLeads: number;
    totalDealAmount: string | number;
}

export interface CommissionInput {
    channelId: string;
    totalCommission: string | number;
    orderCount: string | number;
}

export interface ChannelAnalyticsResult {
    id: string;
    name: string;
    totalLeads: number;
    totalOrders: number;
    totalDealAmount: number;
    commissionAmount: number;
    conversionRate: number;
    roi: number;
    avgTransactionValue: number;
}

/**
 * 核心聚合逻辑：将渠道基础信息与佣金数据进行合并并计算 KPI
 */
export function computeChannelAnalytics(
    channels: AnalyticsInput[],
    commissions: CommissionInput[]
): ChannelAnalyticsResult[] {
    const commissionMap = new Map<string, { cost: number, orders: number }>();
    commissions.forEach(c => {
        commissionMap.set(c.channelId, {
            cost: Number(c.totalCommission || 0),
            orders: Number(c.orderCount || 0)
        });
    });

    const results = channels.map(ch => {
        const commData = commissionMap.get(ch.id) || { cost: 0, orders: 0 };
        const totalDealAmount = Number(ch.totalDealAmount || 0);
        const totalLeads = ch.totalLeads || 0;
        const totalOrders = commData.orders;
        const cost = commData.cost;

        const conversionRate = totalLeads > 0 ? (totalOrders / totalLeads) * 100 : 0;
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
