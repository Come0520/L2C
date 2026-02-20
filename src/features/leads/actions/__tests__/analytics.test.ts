/**
 * Leads 模块 Server Actions 集成测试 (Analytics)
 *
 * 覆盖范围：
 * - getLeadChannelROIStats
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockDb } from '@/shared/tests/mock-db';
import { createMockSession } from '@/shared/tests/mock-factory';

const MOCK_SESSION = createMockSession();

const mockQueryBuilder = {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    then: function (resolve: any) {
        // Mock query resolution with test data
        resolve([
            {
                channelId: 'ch-1',
                channelName: '抖音',
                leadCount: 100,
                quoteCount: 20,
                orderCount: 5,
                totalAmount: 50000,
                avgCycleDays: 12.5,
            }
        ]);
    }
};

const mockDb = createMockDb([]);
mockDb.select = vi.fn().mockReturnValue(mockQueryBuilder);

vi.mock('@/shared/api/db', () => ({
    db: mockDb,
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

// Mock unstable_cache to pass-through the inner function
vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((fn) => fn),
}));

describe('Lead Analytics (L5)', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        const { auth } = await import('@/shared/lib/auth');
        vi.mocked(auth).mockResolvedValue(MOCK_SESSION);
    });

    describe('getLeadChannelROIStats', () => {
        it('应当正确计算各大渠道的转化与平均单价', async () => {
            const { getLeadChannelROIStats } = await import('../analytics');
            const result = await getLeadChannelROIStats();

            // Verification
            expect(result).toBeDefined();
            expect(result).toHaveLength(1);

            const stats = result[0];
            expect(stats.channelName).toBe('抖音');
            expect(stats.leadCount).toBe(100);
            expect(stats.orderCount).toBe(5);

            // conversionRate: (5 / 100) * 100 = 5.00
            expect(stats.conversionRate).toBe(5);

            // avgOrderValue: 50000 / 5 = 10000
            expect(stats.avgOrderValue).toBe(10000);

            expect(mockDb.select).toHaveBeenCalled();
        });

        it('应当拦截未授权访问', async () => {
            const { auth } = await import('@/shared/lib/auth');
            vi.mocked(auth).mockResolvedValue(null);

            const { getLeadChannelROIStats } = await import('../analytics');
            await expect(getLeadChannelROIStats()).rejects.toThrow('Unauthorized');
        });
    });
});
