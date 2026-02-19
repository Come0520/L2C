
/**
 * 计算渠道价格
 * (CQ-07) Moved from Server Action to Shared Utility
 */
export function calculateChannelPrice(basePrice: number, channelRate: number): number {
    return Number((basePrice * (1 + channelRate)).toFixed(2));
}

/**
 * 计算利润
 */
export function calculateProfit(params: {
    retailPrice: number;
    cost: number;
    channelRate: number;
}) {
    const { retailPrice, cost, channelRate } = params;
    const channelPrice = calculateChannelPrice(retailPrice, channelRate);
    const profit = channelPrice - cost;
    const margin = channelPrice > 0 ? (profit / channelPrice) * 100 : 0;

    return {
        channelPrice,
        profit: Number(profit.toFixed(2)),
        margin: Number(margin.toFixed(2))
    };
}
