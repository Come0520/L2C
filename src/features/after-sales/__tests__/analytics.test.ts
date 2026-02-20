
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getAfterSalesQualityAnalytics } from '../actions/analytics';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';

// Mock Next.js cache
vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((fn) => fn),
    revalidateTag: vi.fn(),
    revalidatePath: vi.fn(),
}));

// Mock DB
vi.mock('@/shared/api/db', () => ({
    db: {
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => ({
                    groupBy: vi.fn()
                }))
            }))
        })),
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

describe('After-Sales Analytics Actions', () => {
    const VALID_TENANT_ID = 'tenant-1';
    const mockSession = { user: { id: 'user-1', tenantId: VALID_TENANT_ID } };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue(mockSession);
    });

    it('should return correct report structure and data (snapshot)', async () => {
        // Mock 1: Liability by party
        const mockLiabilityByParty = [
            { liablePartyType: 'FACTORY', count: 5, totalAmount: '5000.00' },
            { liablePartyType: 'INSTALLER', count: 2, totalAmount: '200.00' }
        ];

        // Mock 2: Tickets by type
        const mockTicketsByType = [
            { type: 'REPAIR', count: 10 },
            { type: 'RETURN', count: 2 }
        ];

        // Mock 3: Tickets by status
        const mockTicketsByStatus = [
            { status: 'PROCESSING', count: 8 },
            { status: 'CLOSED', count: 4 }
        ];

        // Implementation of nested mocks for select chain
        let callCount = 0;
        (db.select as any).mockImplementation(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => ({
                    groupBy: vi.fn(async () => {
                        callCount++;
                        if (callCount === 1) return mockLiabilityByParty;
                        if (callCount === 2) return mockTicketsByType;
                        if (callCount === 3) return mockTicketsByStatus;
                        return [];
                    })
                }))
            }))
        }));

        const result = await getAfterSalesQualityAnalytics({
            startDate: '2024-01-01',
            endDate: '2024-01-31'
        });

        expect(result.success).toBe(true);
        // Vitest snapshot
        expect(result.data).toMatchSnapshot();

        // Manual verification of summary
        expect(result.data.summary.totalLiabilityAmount).toBe(5200);
        expect(result.data.summary.totalLiabilityCount).toBe(7);
    });

    it('should handle empty analytics data', async () => {
        (db.select as any).mockImplementation(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => ({
                    groupBy: vi.fn(async () => [])
                }))
            }))
        }));

        const result = await getAfterSalesQualityAnalytics({});

        expect(result.success).toBe(true);
        expect(result.data.liabilityByParty).toHaveLength(0);
        expect(result.data.summary.totalLiabilityAmount).toBe(0);
    });
});
