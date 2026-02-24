/**
 * 渠道统计核心计算引擎
 */

export interface StatsOverviewInput {
    totalLeads: number;
    totalDealAmount: string | number;
    activeChannels: number;
}

export interface ChannelStatsResult {
    totalChannels: number;
    activeChannels: number;
    totalLeads: number;
    totalDealAmount: number;
    avgConversionRate: number;
}

/**
 * 计算渠道概览统计数据
 */
export function computeChannelOverview(
    totalCount: number,
    overviewData: StatsOverviewInput
): ChannelStatsResult {
    const totalLeads = overviewData.totalLeads || 0;
    const totalDealAmount = Number(overviewData.totalDealAmount || 0);
    const activeChannels = overviewData.activeChannels || 0;

    return {
        totalChannels: totalCount,
        activeChannels,
        totalLeads,
        totalDealAmount,
        avgConversionRate: totalLeads > 0 ? parseFloat(((activeChannels / totalLeads) * 100).toFixed(2)) : 0
    };
}

export interface TrendDataItem {
    date: string;
    value: string | number;
}

/**
 * 格式化趋势数据 (保持结构一致性)
 */
export function formatTrendData(rawData: TrendDataItem[]) {
    return rawData.map(item => ({
        date: item.date,
        value: Number(item.value || 0)
    }));
}
