import { describe, it, expect } from 'vitest';
import { computeChannelAnalytics } from '../analytics-engine';

describe('Channels Analytics Engine (渠道分析计算引擎测试)', () => {
    it('应该正确合并数据并计算 KPI', () => {
        const channels = [
            { id: 'ch-1', name: '渠道A', totalLeads: 100, totalDealAmount: 10000 }
        ];
        const commissions = [
            { channelId: 'ch-1', totalCommission: 1000, orderCount: 10 }
        ];

        const result = computeChannelAnalytics(channels, commissions);

        expect(result).toHaveLength(1);
        const data = result[0];
        expect(data.roi).toBe(900); // (10000 - 1000) / 1000 * 100
        expect(data.conversionRate).toBe(10); // 10 / 100 * 100
        expect(data.avgTransactionValue).toBe(1000);
    });

    it('当佣金为 0 时，ROI 应返回 0', () => {
        const channels = [
            { id: 'ch-2', name: '渠道B', totalLeads: 10, totalDealAmount: 500 }
        ];
        const commissions: any[] = [];

        const result = computeChannelAnalytics(channels, commissions);
        expect(result[0].roi).toBe(0);
        expect(result[0].commissionAmount).toBe(0);
    });

    it('计算结果应按成交总额降序排列', () => {
        const channels = [
            { id: 'ch-1', name: '渠道A', totalLeads: 10, totalDealAmount: 100 },
            { id: 'ch-2', name: '渠道B', totalLeads: 10, totalDealAmount: 200 }
        ];
        const commissions: any[] = [];

        const result = computeChannelAnalytics(channels, commissions);
        expect(result[0].id).toBe('ch-2');
        expect(result[1].id).toBe('ch-1');
    });
});
