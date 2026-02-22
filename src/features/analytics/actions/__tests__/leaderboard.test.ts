import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getLeaderboard } from '../leaderboard';
import { checkPermission, auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';

const mockLimit = vi.fn();
const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
const mockGroupBy = vi.fn(() => ({ orderBy: mockOrderBy }));
const mockWhere = vi.fn(() => ({ groupBy: mockGroupBy }));
const mockLeftJoin = vi.fn(() => ({ where: mockWhere }));
const mockFrom = vi.fn(() => ({ leftJoin: mockLeftJoin }));

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

describe('Leaderboard Action', () => {
    const VALID_TENANT_ID = 'tenant-1';
    const VALID_USER_ID = 'user-1';

    beforeEach(() => {
        vi.clearAllMocks();
        (db.select as any).mockReturnValue({ from: mockFrom });
    });

    it('should intercept when permission denied', async () => {
        (auth as any).mockResolvedValue({
            // Role below MANAGER should be forbidden by VIEW_ALL normally
            user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID, role: 'SALES' }
        });
        (checkPermission as any).mockRejectedValue(new Error('Permission denied'));

        const result = await getLeaderboard({});
        expect(result.success).toBe(false);
    });

    it('should return leaderboard respecting toggle and limit', async () => {
        (auth as any).mockResolvedValue({
            user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID, role: 'MANAGER' }
        });
        (checkPermission as any).mockResolvedValue(true);

        mockLimit.mockResolvedValueOnce([
            { salesId: 's1', salesName: 'Alice', totalAmount: '10000', orderCount: 5 },
            { salesId: 's2', salesName: 'Bob', totalAmount: '8000', orderCount: 3 }
        ]);

        const result = await getLeaderboard({ limit: 2, sortBy: 'amount' });

        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data.length).toBe(2);
            expect(result.data[0].rank).toBe(1);
            expect(result.data[0].salesName).toBe('Alice');
            expect(mockLimit).toHaveBeenCalledWith(2);
        }
    });
});
