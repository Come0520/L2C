import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuoteCalculationService } from '../services/calculation-service';
import { db } from '@/shared/api/db';

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            quoteItems: {
                findFirst: vi.fn(),
            }
        }
    }
}));

describe('报价计算服务 (Calculation Service)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('报价单项不存在时应抛出异常 (Throw on not found)', async () => {
        vi.mocked(db.query.quoteItems.findFirst).mockResolvedValueOnce(null);
        await expect(
            QuoteCalculationService.recalculateItem('invalid-item-id', { width: 100, height: 200 })
        ).rejects.toThrow('Quote item not found');
    });

    it('能够根据分类正常派发到标品策略 (Dispatch standard strategy)', async () => {
        vi.mocked(db.query.quoteItems.findFirst).mockResolvedValueOnce({
            id: 'item-standard',
            category: 'ACCESSORY',
            quantity: 5,
            unitPrice: 20,
            product: null
        } as any);

        const result = await QuoteCalculationService.recalculateItem('item-standard', { width: 0, height: 0 });
        expect(result.usage).toBe(5);
        expect(result.subtotal).toBe(100);
    });

    it('窗帘计算策略处理 (Dispatch curtain strategy)', async () => {
        vi.mocked(db.query.quoteItems.findFirst).mockResolvedValueOnce({
            id: 'item-curtain',
            category: 'CURTAIN',
            width: 200,
            height: 250,
            foldRatio: 2.0,
            unitPrice: 100,
            attributes: {
                fabricWidth: 280, // cm
                headerProcessType: 'WRAPPED',
                openingStyle: 'DOUBLE'
            },
            product: null
        } as any);

        const result = await QuoteCalculationService.recalculateItem('item-curtain', { width: 200, height: 250 });
        expect(result.usage).toBeCloseTo(4.1);
        expect(result.subtotal).toBeCloseTo(410);
    });

    it('墙纸计算策略处理 (Dispatch wallpaper strategy)', async () => {
        vi.mocked(db.query.quoteItems.findFirst).mockResolvedValueOnce({
            id: 'item-wallpaper',
            category: 'WALLPAPER',
            width: 300,
            height: 250,
            unitPrice: 100,
            attributes: {
                fabricWidth: 53, // 53cm
                rollLength: 10
            },
            product: null
        } as any);

        const result = await QuoteCalculationService.recalculateItem('item-wallpaper', { width: 300, height: 250 });
        expect(result.usage).toBeGreaterThan(0);
    });
});
