import { describe, it, expect } from 'vitest';
import { computeChannelOverview, formatTrendData } from '../stats-engine';

describe('Channels Stats Engine (渠道统计引擎测试)', () => {
    it('应该正确计算概览数据', () => {
        const result = computeChannelOverview(100, {
            totalLeads: 1000,
            totalDealAmount: 50000,
            activeChannels: 50
        });

        expect(result.totalChannels).toBe(100);
        expect(result.activeChannels).toBe(50);
        expect(result.avgConversionRate).toBe(5); // 50/1000 * 100
    });

    it('当 Leads 为 0 时，转化率应为 0', () => {
        const result = computeChannelOverview(10, {
            totalLeads: 0,
            totalDealAmount: 0,
            activeChannels: 5
        });
        expect(result.avgConversionRate).toBe(0);
    });

    it('应该正确格式化趋势数据', () => {
        const raw = [
            { date: '2024-01-01', value: '10' },
            { date: '2024-01-02', value: 20 }
        ];
        const result = formatTrendData(raw);
        expect(result[0].value).toBe(10);
        expect(result[1].value).toBe(20);
    });
});
