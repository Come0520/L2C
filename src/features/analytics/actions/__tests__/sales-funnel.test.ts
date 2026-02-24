import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getSalesFunnel } from '../sales-funnel';
import { checkPermission, auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';

const mockWhere = vi.fn();
const mockLeftJoin = vi.fn(() => ({ where: mockWhere }));
const mockFrom = vi.fn(() => ({ where: mockWhere, leftJoin: mockLeftJoin }));

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
    revalidateTag: vi.fn(),
}));

describe('Sales Funnel Action', () => {
    const VALID_TENANT_ID = 'tenant-1';
    const VALID_USER_ID = 'user-1';

    beforeEach(() => {
        vi.clearAllMocks();
        (db.select as any).mockReturnValue({ from: mockFrom });
    });

    it('should return error when not logged in', async () => {
        (auth as any).mockResolvedValue(null);
        const result = await getSalesFunnel({});
        expect(result.success).toBe(false);
    });

    it('should return sales funnel correctly with phase times and trends', async () => {
        (auth as any).mockResolvedValue({
            user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID, role: 'MANAGER' }
        });
        (checkPermission as any).mockResolvedValue(true);

        // Current period: leads=100, measures=50(2.5d), quotes=30(1.5d), orders=10(3.0d)
        mockWhere.mockResolvedValueOnce([{ count: 100 }]);
        mockWhere.mockResolvedValueOnce([{ count: 50, avgDays: 2.5 }]);
        mockWhere.mockResolvedValueOnce([{ count: 30, avgDays: 1.5 }]);
        mockWhere.mockResolvedValueOnce([{ count: 10, avgDays: 3.0 }]);

        // Previous period: leads=80, measures=40, quotes=20, orders=5
        mockWhere.mockResolvedValueOnce([{ count: 80 }]);
        mockWhere.mockResolvedValueOnce([{ count: 40 }]);
        mockWhere.mockResolvedValueOnce([{ count: 20 }]);
        mockWhere.mockResolvedValueOnce([{ count: 5 }]);

        const result = await getSalesFunnel({});

        expect(result.success).toBe(true);
        if (result.success && result.data) {
            const currentOrders = result.data.stages.find(s => s.stage === '成交')!;
            expect(currentOrders.count).toBe(10);
            expect(currentOrders.trend).toBe('100.0'); // (10-5)/5 * 100
            expect(currentOrders.avgDaysInStage).toBe('3.0');
            expect(result.data.summary.overallConversion).toBe('10.0'); // 10 / 100
            expect(result.data.summary.avgCycleTime).toBe('7.0'); // 2.5 + 1.5 + 3.0
        }
    });
});
