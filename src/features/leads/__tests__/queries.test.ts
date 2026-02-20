
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLeadFunnelStats } from '../actions/queries';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';

// Mock Dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        select: vi.fn(),
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((fn) => fn),
}));

describe('Leads Queries', () => {
    const tenantId = 'test-tenant-id';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue({
            user: { id: 'user-1', tenantId: tenantId }
        });
    });

    describe('getLeadFunnelStats', () => {
        it('should return funnel statistics correctly', async () => {
            const mockStats = [
                { status: 'PENDING_ASSIGNMENT', count: 10 },
                { status: 'FOLLOWING_UP', count: 5 },
                { status: 'WON', count: 2 },
            ];

            // Mock db.select().from().where().groupBy()
            const mockGroupBy = vi.fn().mockResolvedValue(mockStats);
            const mockWhere = vi.fn().mockReturnValue({ groupBy: mockGroupBy });
            const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
            const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

            vi.mocked(db.select).mockImplementation(mockSelect);

            const result = await getLeadFunnelStats();

            expect(result).toEqual(mockStats);
            expect(db.select).toHaveBeenCalled();
        });

        it('should throw error if user is not authenticated', async () => {
            vi.mocked(auth).mockResolvedValue(null);
            await expect(getLeadFunnelStats()).rejects.toThrow('Unauthorized');
        });
    });
});
