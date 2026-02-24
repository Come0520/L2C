import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getProfitMarginAnalysis } from '../profit-margin';
import { checkPermission, auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';

const mockOrderBy = vi.fn();
const mockGroupBy = vi.fn(() => ({ orderBy: mockOrderBy }));
const mockWhereTrend = vi.fn(() => ({ groupBy: mockGroupBy }));

const mockFromTrend = vi.fn(() => ({ where: mockWhereTrend }));
const mockWhere = vi.fn();
const mockFrom = vi.fn(() => ({ where: mockWhere }));

vi.mock('@/shared/api/db', () => ({
    db: {
        select: vi.fn()
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((cb) => cb),
    revalidateTag: vi.fn(),
}));

describe('Profit Margin Analysis Action', () => {
    const VALID_TENANT_ID = 'tenant-1';
    const VALID_USER_ID = 'user-1';

    beforeEach(() => {
        vi.clearAllMocks();
        // Since we have multiple queries using .from() with different chains, we set mock behavior per call or generic
        let callCount = 0;
        (db.select as any).mockImplementation(() => {
            callCount++;
            return {
                from: callCount === 3 ? mockFromTrend : mockFrom
            };
        });
    });

    it('should return error when not logged in', async () => {
        (auth as any).mockResolvedValue(null);
        const result = await getProfitMarginAnalysis({ groupBy: 'month' });
        expect(result.success).toBe(false);
    });

    it('should return complex profit margins', async () => {
        (auth as any).mockResolvedValue({
            user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID, role: 'MANAGER' }
        });
        (checkPermission as any).mockResolvedValue(true);

        // orderStats query
        mockWhere.mockResolvedValueOnce([{ totalRevenue: '100000', orderCount: 50 }]);

        // costStats query
        mockWhere.mockResolvedValueOnce([{ totalCost: '60000' }]);

        // monthlyTrend query
        mockOrderBy.mockResolvedValueOnce([
            { month: new Date('2026-01-01T00:00:00.000Z'), revenue: '50000' },
            { month: new Date('2026-02-01T00:00:00.000Z'), revenue: '50000' }
        ]);

        const result = await getProfitMarginAnalysis({ groupBy: 'month' });

        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data.totalRevenue).toBe('100000.00');
            expect(result.data.totalCost).toBe('60000.00');
            expect(result.data.grossProfit).toBe('40000.00');
            expect(result.data.grossMargin).toBe('40.00'); // 40000 / 100000 * 100
            expect(result.data.avgOrderValue).toBe('2000.00');

            expect(result.data.monthlyTrend).toHaveLength(2);
            expect(result.data.monthlyTrend[0].month).toBe('2026-01');
        }
    });

    it('should handle zero revenue without division by zero', async () => {
        (auth as any).mockResolvedValue({ user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID } });
        (checkPermission as any).mockResolvedValue(true);

        mockWhere.mockResolvedValueOnce([{ totalRevenue: '0', orderCount: 0 }]);
        mockWhere.mockResolvedValueOnce([{ totalCost: '5000' }]);
        mockOrderBy.mockResolvedValueOnce([]);

        const result = await getProfitMarginAnalysis({ groupBy: 'month' });
        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data.totalRevenue).toBe('0.00');
            expect(result.data.totalCost).toBe('5000.00');
            expect(result.data.grossProfit).toBe('-5000.00'); // Valid loss
            expect(result.data.grossMargin).toBe('0.00'); // revenue is 0, so 0% (instead of -Infinity)
            expect(result.data.avgOrderValue).toBe('0');
        }
    });
});
