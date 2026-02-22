import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getDashboardStats } from '../dashboard-stats';
import { checkPermission, auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';

vi.mock('@/shared/api/db', () => {
    const mockWhere = vi.fn();
    const mockFrom = vi.fn(() => ({ where: mockWhere, leftJoin: vi.fn(() => ({ where: mockWhere })) }));
    const mockSelect = vi.fn(() => ({ from: mockFrom }));
    return {
        db: {
            select: mockSelect,
        },
        _mockWhere: mockWhere,
        _mockFrom: mockFrom,
        _mockSelect: mockSelect
    };
});

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((cb) => cb),
}));

describe('Dashboard Stats Action', () => {
    const VALID_TENANT_ID = 'tenant-1';
    const VALID_USER_ID = 'user-1';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return error when not logged in', async () => {
        (auth as any).mockResolvedValue(null);
        const result = await getDashboardStats({});
        expect(result.success).toBe(false);
    });

    it('should intercept when permission denied', async () => {
        (auth as any).mockResolvedValue({
            user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID, role: 'SALES' }
        });
        (checkPermission as any).mockRejectedValue(new Error('Permission denied'));

        const result = await getDashboardStats({});
        expect(result.success).toBe(false);
    });

    it('should return stats correctly and use tenantId isolation', async () => {
        (auth as any).mockResolvedValue({
            user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID, role: 'MANAGER' }
        });
        (checkPermission as any).mockResolvedValue(true);

        const { _mockWhere } = await import('@/shared/api/db') as any;

        // Mock chain responses for the 4 queries: sales, leads, AR, AP
        _mockWhere.mockResolvedValueOnce([{ totalAmount: '50000', orderCount: 5 }]); // sales
        _mockWhere.mockResolvedValueOnce([{ count: 20 }]); // leads
        _mockWhere.mockResolvedValueOnce([{ pendingAmount: '10000' }]); // AR
        _mockWhere.mockResolvedValueOnce([{ pendingCost: '5000' }]); // AP

        const result = await getDashboardStats({});

        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data.totalSales).toBe('50000');
            expect(result.data.orderCount).toBe(5);
            expect(result.data.newLeads).toBe(20);
            expect(result.data.conversionRate).toBe('25.00'); // (5/20) * 100
            expect(result.data.pendingReceivables).toBe('10000');
            expect(result.data.pendingPayables).toBe('5000');
        }
    });
});
