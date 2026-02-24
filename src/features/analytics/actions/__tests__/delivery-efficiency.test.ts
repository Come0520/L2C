import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getDeliveryEfficiency } from '../delivery-efficiency';
import { checkPermission, auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';

const mockWhere = vi.fn();
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
    revalidateTag: vi.fn(),
}));

describe('Delivery Efficiency Action', () => {
    const VALID_TENANT_ID = 'tenant-1';
    const VALID_USER_ID = 'user-1';

    beforeEach(() => {
        vi.clearAllMocks();
        (db.select as any).mockReturnValue({ from: mockFrom });
    });

    it('should return error when not logged in', async () => {
        (auth as any).mockResolvedValue(null);
        const result = await getDeliveryEfficiency({});
        expect(result.success).toBe(false);
    });

    it('should return correct delivery efficiency metrics', async () => {
        (auth as any).mockResolvedValue({
            user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID, role: 'MANAGER' }
        });
        (checkPermission as any).mockResolvedValue(true);

        // measureStats
        mockWhere.mockResolvedValueOnce([{ avgDays: 3, total: 10, onTime: 8 }]);
        // installStats
        mockWhere.mockResolvedValueOnce([{ avgDays: 5, total: 20, onTime: 18 }]);

        // pendingMeasure
        mockWhere.mockResolvedValueOnce([{ count: 2 }]);
        // pendingInstall
        mockWhere.mockResolvedValueOnce([{ count: 3 }]);

        // overdueMeasure
        mockWhere.mockResolvedValueOnce([{ count: 1 }]);
        // overdueInstall
        mockWhere.mockResolvedValueOnce([{ count: 0 }]);

        const result = await getDeliveryEfficiency({});

        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data.measureAvgDays).toBe(3);
            expect(result.data.measureOnTimeRate).toBe(80); // 8/10

            expect(result.data.installAvgDays).toBe(5);
            expect(result.data.installOnTimeRate).toBe(90); // 18/20

            expect(result.data.totalPendingTasks).toBe(5); // 2 + 3
            expect(result.data.overdueTaskCount).toBe(1); // 1 + 0
        }
    });

    it('should handle zero tasks avoiding division by zero', async () => {
        (auth as any).mockResolvedValue({ user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID } });
        (checkPermission as any).mockResolvedValue(true);

        mockWhere.mockResolvedValueOnce([{ avgDays: 0, total: 0, onTime: 0 }]); // measure
        mockWhere.mockResolvedValueOnce([{ avgDays: 0, total: 0, onTime: 0 }]); // install
        mockWhere.mockResolvedValueOnce([{ count: 0 }]); // pendingMeasure
        mockWhere.mockResolvedValueOnce([{ count: 0 }]); // pendingInstall
        mockWhere.mockResolvedValueOnce([{ count: 0 }]); // overdueMeasure
        mockWhere.mockResolvedValueOnce([{ count: 0 }]); // overdueInstall

        const result = await getDeliveryEfficiency({});
        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data.measureOnTimeRate).toBe(0);
            expect(result.data.installOnTimeRate).toBe(0);
        }
    });
});
