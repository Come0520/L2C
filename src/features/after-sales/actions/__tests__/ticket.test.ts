import { describe, it, expect, vi } from 'vitest';
import { updateTicketStatus, closeResolutionCostClosure } from '../ticket';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';

vi.mock('@/shared/api/db', () => ({
    db: {
        transaction: vi.fn(),
        query: {
            afterSalesTickets: {
                findFirst: vi.fn(),
            },
        },
        update: vi.fn(() => ({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{}]),
        })),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockReturnValue(true),
}));

describe('Ticket Optimistic Locking', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should fail update when version mismatch occurs in updateTicketStatus', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'u1', tenantId: 't1' } } as any);
        vi.mocked(db.query.afterSalesTickets.findFirst).mockResolvedValue({
            id: validUuid,
            tenantId: 't1',
            status: 'PENDING',
            version: 2, // Current version is 2
        } as any);

        // We pass expectedVersion: 1 (stale data)
        const result = await updateTicketStatus({
            ticketId: validUuid,
            status: 'PROCESSING', // Use valid enum value
            expectedVersion: 1,
        });

        if (result.error && !result.success) {
            console.error('Action error:', result.error);
        }

        expect(result?.success).toBe(true);
        expect(result?.data?.success).toBe(false);
        expect(result?.data?.message).toContain('版本过期');
    });

    it('should fail closure when version mismatch occurs in closeResolutionCostClosure', async () => {
        vi.mocked(auth).mockResolvedValue({ user: { id: 'u1', tenantId: 't1' } } as any);
        vi.mocked(db.query.afterSalesTickets.findFirst).mockResolvedValue({
            id: validUuid,
            tenantId: 't1',
            status: 'PROCESSING',
            version: 3, // Current version is 3
        } as any);

        // We pass expectedVersion: 2 (stale data)
        const result = await closeResolutionCostClosure(validUuid, 2);

        expect(result?.success).toBe(false);
        expect(result?.error).toContain('版本过期');
    });
});
