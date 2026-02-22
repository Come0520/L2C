import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getCashFlowForecast } from '../cash-flow';
import { checkPermission, auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';

const queryBuilder: any = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
};
let mockResults: any[] = [];
queryBuilder.then = vi.fn((resolve) => resolve(mockResults.shift() || []));

vi.mock('@/shared/api/db', () => ({
    db: {
        select: vi.fn(() => queryBuilder),
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((cb) => cb),
}));

describe('Cash Flow Forecast Action', () => {
    const VALID_TENANT_ID = 'tenant-1';
    const VALID_USER_ID = 'user-1';

    beforeEach(() => {
        vi.clearAllMocks();
        mockResults = [];
    });

    it('should return error when not logged in', async () => {
        (auth as any).mockResolvedValue(null);
        const result = await getCashFlowForecast({});
        expect(result.success).toBe(false);
    });

    it('should return cash flow predictive data correctly', async () => {
        (auth as any).mockResolvedValue({
            user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID, role: 'MANAGER' }
        });
        (checkPermission as any).mockResolvedValue(true);

        mockResults = [
            // Mock 1: weeklyForecast
            [
                { weekStart: '2026-02-23', totalAmount: '5000', count: 2 },
                { weekStart: '2026-03-02', totalAmount: '3000', count: 1 }
            ],
            // Mock 2: monthlyForecast
            [
                { month: '2026-02', totalAmount: '5000', count: 2 },
                { month: '2026-03', totalAmount: '3000', count: 1 }
            ],
            // Mock 3: overduePayments
            [
                { totalAmount: '2000', count: 1, avgOverdueDays: '15' }
            ],
            // Mock 4: byScheduleType
            [
                { scheduleName: '首付款', totalAmount: '6000', count: 2 },
                { scheduleName: '尾款', totalAmount: '2000', count: 1 }
            ]
        ];

        const result = await getCashFlowForecast({ forecastDays: 90 });

        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data.summary.forecastPeriod).toBe(90);
            expect(result.data.summary.totalForecastAmount).toBe('8000.00'); // 5k + 3k
            expect(result.data.summary.totalOverdueAmount).toBe('2000.00');
            expect(result.data.summary.overdueCount).toBe(1);
            expect(result.data.summary.avgOverdueDays).toBe('15.0');

            expect(result.data.weeklyForecast).toHaveLength(2);
            expect(result.data.monthlyForecast).toHaveLength(2);
            expect(result.data.byScheduleType).toHaveLength(2);
        }
    });

    it('should handle empty cash flow gracefully', async () => {
        (auth as any).mockResolvedValue({ user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID } });
        (checkPermission as any).mockResolvedValue(true);

        mockResults = [
            [], // weekly
            [], // monthly
            [], // overdue
            []  // scheduleType
        ];

        const result = await getCashFlowForecast({});
        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data.summary.totalForecastAmount).toBe('0.00');
            expect(result.data.summary.totalOverdueAmount).toBe('0.00');
            expect(result.data.weeklyForecast).toHaveLength(0);
        }
    });
});
