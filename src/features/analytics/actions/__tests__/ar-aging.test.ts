import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getARAgingAnalysis } from '../ar-aging';
import { checkPermission, auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';

const mockOrderBy = vi.fn();
const mockGroupBy = vi.fn(() => ({ orderBy: mockOrderBy }));
const mockWhere2 = vi.fn(() => ({ groupBy: mockGroupBy }));
const mockLeftJoin = vi.fn(() => ({ where: mockWhere2 }));
const mockWhere = vi.fn();
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
}));

describe('AR Aging Analysis Action', () => {
    const VALID_TENANT_ID = 'tenant-1';
    const VALID_USER_ID = 'user-1';

    beforeEach(() => {
        vi.clearAllMocks();
        (db.select as any).mockReturnValue({ from: mockFrom });
    });

    it('should return error when not logged in', async () => {
        (auth as any).mockResolvedValue(null);
        const result = await getARAgingAnalysis({});
        expect(result.success).toBe(false);
    });

    it('should return AR aging data correctly segmented by days', async () => {
        (auth as any).mockResolvedValue({
            user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID, role: 'MANAGER' }
        });
        (checkPermission as any).mockResolvedValue(true);

        const now = Date.now();
        const DayMs = 1000 * 60 * 60 * 24;

        // Mock 1: pendingARStatements
        mockWhere.mockResolvedValueOnce([
            { id: '1', pendingAmount: '1000', createdAt: new Date(now - 10 * DayMs), salesId: 's1' }, // 0-30
            { id: '2', pendingAmount: '2000', createdAt: new Date(now - 45 * DayMs), salesId: 's1' }, // 31-60
            { id: '3', pendingAmount: '3000', createdAt: new Date(now - 75 * DayMs), salesId: 's2' }, // 61-90
            { id: '4', pendingAmount: '4000', createdAt: new Date(now - 120 * DayMs), salesId: 's2' } // 90+
        ]);

        // Mock 2: bySales
        mockOrderBy.mockResolvedValueOnce([
            { salesId: 's1', salesName: 'Alice', totalPending: '3000', count: 2 },
            { salesId: 's2', salesName: 'Bob', totalPending: '7000', count: 2 }
        ]);

        const result = await getARAgingAnalysis({ asOfDate: new Date(now).toISOString() });

        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data.summary.totalPendingAmount).toBe('10000.00');
            expect(result.data.summary.totalCount).toBe(4);

            expect(result.data.agingBuckets).toHaveLength(4);
            expect(result.data.agingBuckets[0].amount).toBe('1000.00'); // 0-30
            expect(result.data.agingBuckets[0].percentage).toBe('10.0'); // 1k/10k
            expect(result.data.agingBuckets[1].amount).toBe('2000.00'); // 31-60
            expect(result.data.agingBuckets[2].amount).toBe('3000.00'); // 61-90
            expect(result.data.agingBuckets[3].amount).toBe('4000.00'); // 90+
            expect(result.data.agingBuckets[3].riskLevel).toBe('HIGH');

            expect(result.data.bySales).toHaveLength(2);
            expect(result.data.bySales[0].salesName).toBe('Alice');
            expect(result.data.bySales[0].amount).toBe('3000.00');
        }
    });

    it('should handle zero AR correctly', async () => {
        (auth as any).mockResolvedValue({ user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID } });
        (checkPermission as any).mockResolvedValue(true);

        mockWhere.mockResolvedValueOnce([]);
        mockOrderBy.mockResolvedValueOnce([]);

        const result = await getARAgingAnalysis({});
        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data.summary.totalPendingAmount).toBe('0.00');
            expect(result.data.agingBuckets[0].percentage).toBe('0');
        }
    });
});
