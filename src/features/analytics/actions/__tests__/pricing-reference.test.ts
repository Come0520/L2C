import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getPricingReference } from '../pricing-reference';
import { checkPermission, auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';

const mockWhere = vi.fn();
const mockInnerJoin = vi.fn(() => ({ where: mockWhere }));
const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));

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

describe('Pricing Reference Action', () => {
    const VALID_TENANT_ID = 'tenant-1';
    const VALID_USER_ID = 'user-1';

    beforeEach(() => {
        vi.clearAllMocks();
        (db.select as any).mockReturnValue({ from: mockFrom });
    });

    it('should return error when not logged in', async () => {
        (auth as any).mockResolvedValue(null);
        const result = await getPricingReference({ productId: 'p1', periodDays: 90 });
        expect(result.success).toBe(false);
    });

    it('should return correct pricing stats for a given product', async () => {
        (auth as any).mockResolvedValue({
            user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID, role: 'MANAGER' }
        });
        (checkPermission as any).mockResolvedValue(true);

        mockWhere.mockResolvedValueOnce([{
            minPrice: 100,
            maxPrice: 300,
            avgPrice: 200,
            totalQuantity: 50,
            count: 20
        }]);

        const result = await getPricingReference({ productId: 'p1', periodDays: 30 });

        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data.productId).toBe('p1');
            expect(result.data.periodDays).toBe(30);
            expect(result.data.minPrice).toBe('100.00');
            expect(result.data.maxPrice).toBe('300.00');
            expect(result.data.avgPrice).toBe('200.00');
            expect(result.data.sampleSize).toBe(20);
        }
    });

    it('should format zeroes correctly when no quotes found', async () => {
        (auth as any).mockResolvedValue({ user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID } });
        (checkPermission as any).mockResolvedValue(true);

        mockWhere.mockResolvedValueOnce([{
            minPrice: null,
            maxPrice: null,
            avgPrice: null,
            totalQuantity: null,
            count: 0
        }]);

        const result = await getPricingReference({ productId: 'p1', periodDays: 90 });
        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data.minPrice).toBe('0.00');
            expect(result.data.maxPrice).toBe('0.00');
            expect(result.data.avgPrice).toBe('0.00');
            expect(result.data.sampleSize).toBe(0);
        }
    });
});
