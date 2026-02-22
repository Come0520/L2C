import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getCustomerSourceDistribution } from '../customer-source';
import { checkPermission, auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';

const mockLimit = vi.fn();
const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
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

describe('Customer Source Distribution Action', () => {
    const VALID_TENANT_ID = 'tenant-1';
    const VALID_USER_ID = 'user-1';

    beforeEach(() => {
        vi.clearAllMocks();
        (db.select as any).mockReturnValue({ from: mockFrom });
    });

    it('should return error when not logged in', async () => {
        (auth as any).mockResolvedValue(null);
        const result = await getCustomerSourceDistribution({});
        expect(result.success).toBe(false);
    });

    it('should return source distribution with direct/unknown channels', async () => {
        (auth as any).mockResolvedValue({
            user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID, role: 'MANAGER' }
        });
        (checkPermission as any).mockResolvedValue(true);

        // Mock 1: sourceStats (channels)
        mockLimit.mockResolvedValueOnce([
            { channelId: 'c1', channelName: 'Little Red Book', count: 50 },
            { channelId: 'c2', channelName: 'Douyin', count: 30 }
        ]);

        // Mock 2: noChannelStats
        mockWhere.mockResolvedValueOnce([{ count: 20 }]);

        const result = await getCustomerSourceDistribution({});

        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data).toHaveLength(3); // 2 channels + 1 direct
            expect(result.data[0].name).toBe('Little Red Book');
            expect(result.data[0].value).toBe(50);

            expect(result.data[1].name).toBe('Douyin');
            expect(result.data[1].value).toBe(30);

            expect(result.data[2].name).toBe('直客/未分配');
            expect(result.data[2].value).toBe(20);
        }
    });

    it('should not push direct channel if count is zero', async () => {
        (auth as any).mockResolvedValue({ user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID } });
        (checkPermission as any).mockResolvedValue(true);

        mockLimit.mockResolvedValueOnce([
            { channelId: 'c1', channelName: 'Web', count: 10 }
        ]);
        mockWhere.mockResolvedValueOnce([{ count: 0 }]); // no direct

        const result = await getCustomerSourceDistribution({});
        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data).toHaveLength(1);
            expect(result.data[0].name).toBe('Web');
        }
    });
});
