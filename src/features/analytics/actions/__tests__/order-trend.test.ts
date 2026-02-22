import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getOrderTrend } from '../order-trend';
import { checkPermission, auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';

const mockOrderBy = vi.fn();
const mockGroupBy = vi.fn(() => ({ orderBy: mockOrderBy }));
const mockWhere = vi.fn(() => ({ groupBy: mockGroupBy }));
const mockFrom = vi.fn(() => ({ where: mockWhere }));

vi.mock('@/shared/api/db', () => ({
    db: {
        select: vi.fn(),
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((cb) => cb),
}));

describe('Order Trend Action', () => {
    const VALID_TENANT_ID = 'tenant-1';
    const VALID_USER_ID = 'user-1';

    beforeEach(() => {
        vi.clearAllMocks();
        (db.select as any).mockReturnValue({ from: mockFrom });
    });

    it('should return error when not logged in', async () => {
        (auth as any).mockResolvedValue(null);
        const result = await getOrderTrend({ startDate: '2026-01-01', endDate: '2026-01-31', granularity: 'month' });
        expect(result.success).toBe(false);
    });

    it('should return trend grouped by date format correctly', async () => {
        (auth as any).mockResolvedValue({
            user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID, role: 'MANAGER' }
        });
        (checkPermission as any).mockResolvedValue(true);

        mockOrderBy.mockResolvedValueOnce([
            { date: new Date('2026-01-01T00:00:00.000Z'), totalAmount: '500', orderCount: 2 },
            { date: '2026-01-02 00:00:00', totalAmount: '1500', orderCount: 5 } // Test string date handling fallback
        ]);

        const result = await getOrderTrend({ startDate: '2026-01-01', endDate: '2026-01-02', granularity: 'day' });

        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data).toHaveLength(2);
            expect(result.data[0].date).toBe('2026-01-01');
            expect(result.data[0].amount).toBe('500');
            expect(result.data[0].count).toBe(2);

            expect(result.data[1].date).toBe('2026-01-02');
            expect(result.data[1].amount).toBe('1500');
            expect(result.data[1].count).toBe(5);
        }
    });

    it('should handle empty trend correctly', async () => {
        (auth as any).mockResolvedValue({ user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID } });
        (checkPermission as any).mockResolvedValue(true);

        mockOrderBy.mockResolvedValueOnce([]);

        const result = await getOrderTrend({ startDate: '2026-01-01', endDate: '2026-01-31', granularity: 'month' });
        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data).toHaveLength(0);
        }
    });
});
