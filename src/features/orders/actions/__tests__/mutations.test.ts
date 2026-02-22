import { vi, describe, it, expect, beforeEach } from 'vitest';
import { updateOrderStatus, requestOrderCancellation, pauseOrder, resumeOrder } from '../mutations';
import { db } from '@/shared/api/db';
import { auth, checkPermission } from '@/shared/lib/auth';
import { AuditService } from '@/shared/lib/audit-service';
import { OrderService } from '@/services/order.service';
import { OrderStateMachine } from '../../logic/order-state-machine';
import { revalidatePath } from 'next/cache';

// Mock dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            orders: {
                findFirst: vi.fn(),
            },
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: vi.fn().mockResolvedValue([{ id: '11111111-1111-4111-8111-111111111111' }]),
                })),
            })),
        })),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        record: vi.fn(),
    },
}));

vi.mock('@/services/order.service', () => ({
    OrderService: {
        requestCancellation: vi.fn(),
        haltOrder: vi.fn(),
        resumeOrder: vi.fn(),
    },
}));

vi.mock('../../logic/order-state-machine', () => ({
    OrderStateMachine: {
        validateTransition: vi.fn(),
    },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

const mockSession = {
    user: {
        id: '11111111-1111-4111-8111-111111111111',
        tenantId: '11111111-1111-4111-8111-111111111111',
    },
};

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

describe('Order Mutations Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession as any);
    });

    describe('updateOrderStatus', () => {
        it('should update order status and record audit log when transition is valid', async () => {
            const mockOrder = {
                id: VALID_UUID,
                status: 'PENDING',
                tenantId: mockSession.user.tenantId,
            };
            vi.mocked(db.query.orders.findFirst).mockResolvedValue(mockOrder as any);
            vi.mocked(OrderStateMachine.validateTransition).mockReturnValue(true);

            const result = await updateOrderStatus({
                id: VALID_UUID,
                status: 'PROCESSING',
                version: 1,
            });

            expect(result.success).toBe(true);
            expect(db.update).toHaveBeenCalled();
            expect(AuditService.record).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalled();
        });

        it('should return error when transition is invalid', async () => {
            const mockOrder = {
                id: VALID_UUID,
                status: 'PENDING',
                tenantId: mockSession.user.tenantId,
            };
            vi.mocked(db.query.orders.findFirst).mockResolvedValue(mockOrder as any);
            vi.mocked(OrderStateMachine.validateTransition).mockReturnValue(false);

            const result = await updateOrderStatus({
                id: VALID_UUID,
                status: 'COMPLETED',
                version: 1,
            });

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/不允许从 PENDING 转换到 COMPLETED/);
        });
    });

    describe('pauseOrder', () => {
        it('should call OrderService.haltOrder and record audit log', async () => {
            const result = await pauseOrder({
                orderId: VALID_UUID,
                reason: 'Wait for customer confirmation',
                version: 1,
            });

            expect(result.success).toBe(true);
            expect(OrderService.haltOrder).toHaveBeenCalledWith(
                VALID_UUID,
                mockSession.user.tenantId,
                1,
                mockSession.user.id,
                'Wait for customer confirmation'
            );
            expect(AuditService.record).toHaveBeenCalledWith(expect.objectContaining({
                action: 'ORDER_PAUSED',
                newValues: { reason: 'Wait for customer confirmation' },
            }));
        });
    });

    describe('resumeOrder', () => {
        it('should call OrderService.resumeOrder and record audit log', async () => {
            const result = await resumeOrder({
                orderId: VALID_UUID,
                remark: 'Customer confirmed',
                version: 1,
            });

            expect(result.success).toBe(true);
            expect(OrderService.resumeOrder).toHaveBeenCalledWith(
                VALID_UUID,
                mockSession.user.tenantId,
                1,
                mockSession.user.id,
                'Customer confirmed'
            );
            expect(AuditService.record).toHaveBeenCalledWith(expect.objectContaining({
                action: 'ORDER_RESUMED',
                newValues: { remark: 'Customer confirmed' },
            }));
        });
    });
});
