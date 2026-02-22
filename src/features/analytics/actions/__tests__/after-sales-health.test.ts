import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getAfterSalesHealth } from '../after-sales-health';
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

describe('After Sales Health Action', () => {
    const VALID_TENANT_ID = 'tenant-1';
    const VALID_USER_ID = 'user-1';

    beforeEach(() => {
        vi.clearAllMocks();
        mockResults = [];
    });

    it('should return error when not logged in (auth fails)', async () => {
        (auth as any).mockResolvedValue(null);
        const result = await getAfterSalesHealth({});
        expect(result.success).toBe(false);
    });

    it('should return after-sales health metrics correctly', async () => {
        (auth as any).mockResolvedValue({
            user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID, role: 'MANAGER' }
        });
        (checkPermission as any).mockResolvedValue(true);

        // Mock 1: totalRevenue and totalOrders
        // Mock 2: afterSales tickets count and refundTotal
        // Mock 3: liabilityDistribution
        mockResults = [
            [{ totalRevenue: '100000', totalOrders: 100 }],
            [{ count: 2, refundTotal: '5000' }],
            [
                { partyType: 'SUPPLIER', count: 1, totalAmount: '3000' },
                { partyType: 'SALES', count: 1, totalAmount: '2000' }
            ]
        ];

        const result = await getAfterSalesHealth({});

        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data.totalRevenue).toBe('100000.00');
            expect(result.data.totalOrders).toBe(100);
            expect(result.data.afterSalesCount).toBe(2);
            expect(result.data.refundAmount).toBe('5000.00');
            expect(result.data.refundRate).toBe('5.00'); // 5000 / 100000 * 100
            expect(result.data.complaintRate).toBe('2.00'); // 2 / 100 * 100
            expect(result.data.healthLevel).toBe('WARNING'); // refundRate > 3

            expect(result.data.liabilityDistribution).toHaveLength(2);
            expect(result.data.liabilityDistribution[0].party).toBe('SUPPLIER');
            expect(result.data.liabilityDistribution[0].amount).toBe(3000);
        }
    });

    it('should avoid division by zero when revenue/orders are zero', async () => {
        (auth as any).mockResolvedValue({ user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID } });
        (checkPermission as any).mockResolvedValue(true);

        mockResults = [
            [{ totalRevenue: '0', totalOrders: 0 }],
            [{ count: 0, refundTotal: '0' }],
            []
        ];

        const result = await getAfterSalesHealth({});
        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data.refundRate).toBe('0.00');
            expect(result.data.complaintRate).toBe('0.00');
            expect(result.data.healthLevel).toBe('GOOD');
        }
    });
});
