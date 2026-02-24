/**
 * Quotes 模块 Server Actions 集成测试 (Calculation Engine)
 *
 * 覆盖范围：
 * - getCalcPreview (公式预览)
 * - recalculateQuote (重新计算整单)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createMockDb } from '@/shared/tests/mock-db';
import { createMockSession } from '@/shared/tests/mock-factory';

const MOCK_QUOTE_ID = '110e8400-e29b-41d4-a716-446655440000';
const MOCK_ITEM_ID_1 = '330e8400-e29b-41d4-a716-446655440000';
const MOCK_ITEM_ID_2 = '330e8400-e29b-41d4-a716-446655440001';
const MOCK_SESSION = createMockSession();
const MOCK_TENANT_ID = MOCK_SESSION.user.tenantId;

// ── Mock Db Config ──
const mockDb = createMockDb(['quotes', 'quoteItems']);

const mockUpdateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: MOCK_QUOTE_ID }])
};
mockDb.update = vi.fn(() => mockUpdateChain) as unknown as typeof mockDb.update;

vi.mock('@/shared/api/db', () => ({
    db: mockDb,
}));

// Mock Auth
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue(MOCK_SESSION),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

// Mock Schema
vi.mock('@/shared/api/schema/quotes', () => ({
    quotes: { id: 'quotes.id', tenantId: 'quotes.tenantId' },
    quoteItems: { id: 'quoteItems.id', tenantId: 'quoteItems.tenantId' }
}));

// Mock StrategyFactory
const mockStrategy = {
    calculate: vi.fn().mockReturnValue({
        usage: 10,
        subtotal: 500,
        details: { info: 'Mock calculation' }
    })
};

vi.mock('../../calc-strategies/strategy-factory', () => ({
    StrategyFactory: {
        getStrategy: vi.fn(() => mockStrategy)
    }
}));

// ── 测试套件 ──
describe('Calc Actions (L5)', () => {
    beforeEach(async () => {
        vi.clearAllMocks();

        // 默认该报价单存在且带有明细
        mockDb.query.quotes.findFirst.mockResolvedValue({
            id: MOCK_QUOTE_ID,
            tenantId: MOCK_TENANT_ID,
            discountRate: '0.9',
            discountAmount: '0',
            items: [
                {
                    id: MOCK_ITEM_ID_1,
                    category: 'CURTAIN',
                    width: '100',
                    height: '200',
                    unitPrice: '50',
                    attributes: { foldRatio: 2 }
                },
                {
                    id: MOCK_ITEM_ID_2,
                    category: 'WALLPAPER',
                    width: '300',
                    height: '250',
                    unitPrice: '20',
                    attributes: {}
                }
            ]
        });

        const { auth } = await import('@/shared/lib/auth');
        vi.mocked(auth).mockResolvedValue(MOCK_SESSION);
    });

    it('getCalcPreview 应当调用对应的计算策略并返回结果', async () => {
        const { getCalcPreviewAction: getCalcPreview } = await import('../calc-actions');
        const { StrategyFactory } = await import('../../calc-strategies/strategy-factory');

        const params = {
            category: 'WALLPAPER',
            measuredWidth: 300,
            measuredHeight: 250,
            unitPrice: 20
        };

        const result = await getCalcPreview(params);

        expect(StrategyFactory.getStrategy).toHaveBeenCalledWith('WALLPAPER');
        expect(mockStrategy.calculate).toHaveBeenCalledWith(params);
        expect(result.data).toEqual({
            usage: 10,
            subtotal: 500,
            details: { info: 'Mock calculation' }
        });
    });

    it('getCalcPreview 缺少登录信息时抛出异常', async () => {
        const { getCalcPreviewAction: getCalcPreview } = await import('../calc-actions');
        const { auth } = await import('@/shared/lib/auth');
        vi.mocked(auth).mockResolvedValue(null);

        await expect(getCalcPreview({})).rejects.toThrow('未授权访问');
    });

    it('recalculateQuote 应当遍历所有明细项并重新计算总计，同时更新 DB', async () => {
        const { recalculateQuote } = await import('../calc-actions');
        const { StrategyFactory } = await import('../../calc-strategies/strategy-factory');

        // 测试时因为 mockStrategy.calculate 总是返回 500, 
        // 所以 2 个明细项的新 subtotal 都是 500，总额应为 1000
        const result = await recalculateQuote(MOCK_QUOTE_ID);

        expect(StrategyFactory.getStrategy).toHaveBeenCalledTimes(2);

        // 第一次调用应当处理 CURTAIN
        expect(StrategyFactory.getStrategy).toHaveBeenCalledWith('CURTAIN');
        const call1Params = mockStrategy.calculate.mock.calls[0][0];
        expect(call1Params).toMatchObject({ measuredWidth: 100, measuredHeight: 200, unitPrice: 50 });

        // 第二次调用应当处理 WALLPAPER
        expect(StrategyFactory.getStrategy).toHaveBeenCalledWith('WALLPAPER');

        // 更新 QuoteItems (针对每个明细分别更新)
        // db.update 被调用的次数 = 2 (items) + 1 (quote head)
        expect(mockDb.update).toHaveBeenCalledTimes(3);

        const thirdUpdateArgs = mockUpdateChain.set.mock.calls[2][0];
        // expected subtotal aggregate = 500 + 500 = 1000
        expect(thirdUpdateArgs.totalAmount).toBe('1000');
        // finalAmount: 1000 * 0.9 (discountRate) - 0 (discountAmount) = 900
        expect(thirdUpdateArgs.finalAmount).toBe('900');

        expect(result).toEqual({ success: true, message: 'Recalculated successfully' });
    });

    it('recalculateQuote 当查询不到报价单时应报错返回', async () => {
        mockDb.query.quotes.findFirst.mockResolvedValue(null);
        const { recalculateQuote } = await import('../calc-actions');

        const result = await recalculateQuote('non-existent');

        expect(result).toEqual({ success: false, message: 'Quote not found' });
    });

    it('recalculateQuote 缺少登录信息时应被拦截', async () => {
        const { recalculateQuote } = await import('../calc-actions');
        const { auth } = await import('@/shared/lib/auth');
        vi.mocked(auth).mockResolvedValue(null);

        const result = await recalculateQuote(MOCK_QUOTE_ID);

        expect(result).toEqual({ success: false, message: '未授权访问' });
    });
});
