/**
 * Supply Chain 模块 Server Actions 集成测试 - 产品定价 (Product Pricing)
 *
 * 覆盖范围：
 * - calculateProductCost
 * - analyzeProductProfit
 * - calculateChannelPrice
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDb } from '@/shared/tests/mock-db';
import { createMockSession } from '@/shared/tests/mock-factory';

const MOCK_SESSION = createMockSession();

const mockDb = createMockDb(['products', 'productSuppliers']);

vi.mock('@/shared/api/db', () => ({
    db: mockDb,
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

describe('Product Pricing Actions (L5)', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { auth } = await import('@/shared/lib/auth');
        vi.mocked(auth).mockResolvedValue(MOCK_SESSION);
    });

    describe('calculateProductCost', () => {
        it('未授权访问应拦截', async () => {
            const { auth } = await import('@/shared/lib/auth');
            vi.mocked(auth).mockResolvedValue(null);

            const { calculateProductCost } = await import('../product-pricing');

            await expect(calculateProductCost('prod-1')).rejects.toThrow('未授权');
        });

        it('产品不存在应抛出错误', async () => {
            mockDb.query.products.findFirst.mockResolvedValue(null);

            const { calculateProductCost } = await import('../product-pricing');

            await expect(calculateProductCost('prod-x')).rejects.toThrow('产品不存在或无权访问');
        });

        it('应正确计算标准综合成本（无供应商覆盖）', async () => {
            mockDb.query.products.findFirst.mockResolvedValue({
                id: 'prod-1',
                purchasePrice: '100',
                logisticsCost: '10',
                processingCost: '5',
                lossRate: '0.05' // 5% 损耗
            });

            const { calculateProductCost } = await import('../product-pricing');

            const cost = await calculateProductCost('prod-1');

            // 期望结果： 采购 100 + 物流 10 + 加工 5 + 损耗 (100 * 0.05 = 5)  总计: 120
            expect(cost.purchaseCost).toBe(100);
            expect(cost.logisticsCost).toBe(10);
            expect(cost.processingCost).toBe(5);
            expect(cost.lossCost).toBe(5);
            expect(cost.totalCost).toBe(120);
        });

        it('应正确计算并覆盖供应商特定采购价', async () => {
            mockDb.query.products.findFirst.mockResolvedValue({
                id: 'prod-1',
                purchasePrice: '100', // 默认采购价
                logisticsCost: '10',
                processingCost: '5',
                lossRate: '0.05' // 5% 损耗
            });

            // 供应商特定价格 90
            mockDb.query.productSuppliers.findFirst.mockResolvedValue({
                purchasePrice: '90'
            });

            const { calculateProductCost } = await import('../product-pricing');

            const cost = await calculateProductCost('prod-1', 'sup-1');

            // 采购价应变为 90，损耗 90 * 0.05 = 4.5
            // 90 + 10 + 5 + 4.5 = 109.5
            expect(cost.purchaseCost).toBe(90);
            expect(cost.lossCost).toBe(4.5);
            expect(cost.totalCost).toBe(109.5);
        });
    });

    describe('analyzeProductProfit', () => {
        it('应正确分析产品利润和毛利率', async () => {
            mockDb.query.products.findFirst.mockResolvedValue({
                id: 'prod-1',
                purchasePrice: '100',
                logisticsCost: '10',
                processingCost: '5',
                lossRate: '0.05'
            }); // cost = 120

            const { analyzeProductProfit } = await import('../product-pricing');

            // 售价 150
            const profit = await analyzeProductProfit('prod-1', 150);

            // margin = 150 - 120 = 30
            // marginRate = 30 / 150 = 0.2
            expect(profit.basePrice).toBe(150);
            expect(profit.cost.totalCost).toBe(120);
            expect(profit.margin).toBe(30);
            expect(profit.marginRate).toBe(0.2);
        });

        it('售价为 0 时毛利率应为 0 避免除以零错误', async () => {
            mockDb.query.products.findFirst.mockResolvedValue({
                id: 'prod-1',
                purchasePrice: '100',
                logisticsCost: '10',
                processingCost: '5',
                lossRate: '0.05'
            }); // cost = 120

            const { analyzeProductProfit } = await import('../product-pricing');

            // 售价 0
            const profit = await analyzeProductProfit('prod-1', 0);

            expect(profit.margin).toBe(-120);
            expect(profit.marginRate).toBe(0);
        });
    });

    describe('calculateChannelPrice', () => {
        it('应当在 FIXED 模式使用固定价格或回退原价', async () => {
            const { calculateChannelPrice } = await import('../product-pricing');

            expect(calculateChannelPrice(100, 'FIXED', 90)).toBe(90);
            expect(calculateChannelPrice(100, 'FIXED')).toBe(100);
        });

        it('应当在 DISCOUNT 模式使用折扣率', async () => {
            const { calculateChannelPrice } = await import('../product-pricing');

            expect(calculateChannelPrice(100, 'DISCOUNT', undefined, 0.85)).toBe(85);
            expect(calculateChannelPrice(100, 'DISCOUNT')).toBe(100); // 无折扣率回退
        });
    });
});
