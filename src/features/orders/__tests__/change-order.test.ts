
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createChangeRequestAction, approveChangeRequestAction } from '../actions/change-order';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { submitApproval } from '@/features/approval/actions/submission';

// Mock Modules
vi.mock('next-auth', () => ({
    default: vi.fn(),
    NextAuth: vi.fn(() => ({ auth: vi.fn() })),
}));

const mockTx = {
    query: {
        orderChanges: { findFirst: vi.fn() },
        orders: { findFirst: vi.fn() }
    },
    insert: vi.fn(() => ({
        values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }])
        }))
    })),
    update: vi.fn(() => ({
        set: vi.fn(() => ({
            where: vi.fn(() => ({
                returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }])
            }))
        }))
    }))
};

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            orderChanges: { findFirst: vi.fn() },
            orders: { findFirst: vi.fn() }
        },
        insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]) })) })),
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]) })) })) })),
        transaction: vi.fn(async (cb) => cb(mockTx)),
    }
}));

// Mock auth library
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(true)
}));

vi.mock('@/features/approval/actions/submission', () => ({
    submitApproval: vi.fn().mockResolvedValue({ success: true, approvalId: 'app-1' })
}));
vi.mock('next/cache');

describe('Change Order Actions', () => {
    const VALID_ORDER_ID = '123e4567-e89b-12d3-a456-426614174000';
    const VALID_TENANT_ID = '123e4567-e89b-12d3-a456-426614174999';
    const VALID_USER_ID = '123e4567-e89b-12d3-a456-426614174005';

    const mockSession = {
        user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID, role: 'ADMIN' }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue(mockSession);
    });

    describe('createChangeRequestAction', () => {
        it('should create change request and submit approval', async () => {
            // Mock Order Finding inside transaction
            (mockTx.query.orders.findFirst as any).mockResolvedValue({ id: VALID_ORDER_ID, tenantId: VALID_TENANT_ID });

            // Mock Insert Change Request
            const mockChangeRecord = { id: 'change-1', diffAmount: '100' };
            (mockTx.insert as any).mockReturnValue({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([mockChangeRecord])
                })
            });

            const input = {
                orderId: VALID_ORDER_ID,
                type: 'FIELD_CHANGE' as const,
                reason: 'Price adjustment',
                diffAmount: '100'
            };

            const result = await createChangeRequestAction(input);
            expect(result.success).toBe(true);
        });
    });

    describe('approveChangeRequestAction', () => {
        it('should approve request and update order', async () => {
            const requestId = '123e4567-e89b-12d3-a456-426614174001';

            // Mock finding change request in transaction
            (mockTx.query.orderChanges.findFirst as any).mockResolvedValue({
                id: requestId,
                orderId: VALID_ORDER_ID,
                status: 'PENDING',
                type: 'FIELD_CHANGE',
                newData: { totalAmount: '2000' },
                diffAmount: '100',
                tenantId: VALID_TENANT_ID
            });

            // Mock finding order
            (mockTx.query.orders.findFirst as any).mockResolvedValue({
                id: VALID_ORDER_ID,
                tenantId: VALID_TENANT_ID,
                status: 'PENDING_PO'
            });

            const result = await approveChangeRequestAction(requestId);
            expect(result.success).toBe(true);
            expect(mockTx.update).toHaveBeenCalled();
        });
    });
});
