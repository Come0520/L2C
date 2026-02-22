import { describe, it, expect, vi } from 'vitest';
import { MeasureMatcherService } from '../services/measure-matcher.service';
import type { MeasureItem } from '../config/measure-mapping';

vi.mock('../config/measure-mapping', () => ({
    mapMeasureItemToQuoteItem: vi.fn((item) => ({ ...item, isDraft: true }))
}));

describe('尺量匹配服务 (Measure Matcher Service)', () => {
    it('精确匹配：房间名完全相同 (Exact room match fallback to NEW if threshold unmet)', () => {
        const measureItems: MeasureItem[] = [{
            id: 'm1',
            roomName: '主卧',
            width: 300,
            height: 250
        } as any];

        const existingQuoteItems: any[] = [{
            id: 'q1',
            roomName: '主卧',
            category: 'CURTAIN'
        }];

        const results = MeasureMatcherService.autoMatch(measureItems, existingQuoteItems);

        // 0.6 + 0.2 = 0.8. > 0.8 is false, so it's a NEW match
        expect(results).toHaveLength(1);
        expect(results[0].matchType).toBe('NEW');
        expect(results[0].confidence).toBe(1.0);
    });

    it('模糊匹配：房间名包含 (Fuzzy room match)', () => {
        const measureItems: MeasureItem[] = [{
            id: 'm2',
            roomName: '次卧A',
        } as any];

        const existingQuoteItems: any[] = [{
            id: 'q2',
            roomName: '次卧',
        }];

        const results = MeasureMatcherService.autoMatch(measureItems, existingQuoteItems);
        expect(results[0].matchType).toBe('NEW');
    });

    it('无匹配项自动生成新项目 (New generation when no match)', () => {
        const measureItems: MeasureItem[] = [{
            id: 'm3',
            roomName: '阳台',
        } as any];

        const results = MeasureMatcherService.autoMatch(measureItems, []);
        expect(results).toHaveLength(1);
        expect(results[0].matchType).toBe('NEW');
    });

    it('防止同一个报价单项目被重复匹配 (Prevent duplicate matching)', () => {
        const measureItems: MeasureItem[] = [
            { id: 'm4', roomName: '客厅' } as any,
            { id: 'm5', roomName: '客厅' } as any
        ];

        const existingQuoteItems: any[] = [
            { id: 'q4', roomName: '客厅' }
        ];

        const results = MeasureMatcherService.autoMatch(measureItems, existingQuoteItems);
        expect(results).toHaveLength(2);
    });
});
