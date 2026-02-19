
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted Mocks
const { mockOrderService, mockDbQuery, mockSession } = vi.hoisted(() => {
    return {
        mockOrderService: {
            haltOrder: vi.fn(),
            resumeOrder: vi.fn(),
        },
        mockDbQuery: {
            orders: { findMany: vi.fn() }
        },
        mockSession: {
            user: {
                id: 'user-123',
                tenantId: 'tenant-123',
                name: 'Test User'
            }
        }
    };
});

// Mock Dependencies
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue(mockSession),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/services/order.service', () => ({
    OrderService: mockOrderService
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: mockDbQuery
    }
}));

// Import Actions
import { haltOrderAction, resumeOrderAction, getHaltedOrders } from '../actions/halt';

describe('Order Halt Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const VALID_ORDER_ID = '123e4567-e89b-12d3-a456-426614174000';

    describe('haltOrderAction', () => {
        it('should call OrderService.haltOrder and revalidate path', async () => {
            mockOrderService.haltOrder.mockResolvedValue({
                orderNo: 'OD-123',
                snapshotData: { previousStatus: 'SIGNED' }
            });

            const result = await haltOrderAction({
                orderId: VALID_ORDER_ID,
                reason: 'CUSTOMER_REQUEST',
                remark: 'Test Halt'
            });

            expect(result.success).toBe(true);
            expect(result.data?.previousStatus).toBe('SIGNED');
            expect(mockOrderService.haltOrder).toHaveBeenCalledWith(
                VALID_ORDER_ID,
                mockSession.user.tenantId,
                mockSession.user.id,
                expect.stringContaining('CUSTOMER_REQUEST')
            );
        });

        it('should return error if OrderService throws', async () => {
            mockOrderService.haltOrder.mockRejectedValue(new Error('Halt Failed'));

            const result = await haltOrderAction({
                orderId: VALID_ORDER_ID,
                reason: 'OTHER',
                remark: 'Error test'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Halt Failed');
        });
    });

    describe('resumeOrderAction', () => {
        it('should call OrderService.resumeOrder', async () => {
            mockOrderService.resumeOrder.mockResolvedValue({
                orderNo: 'OD-123',
                status: 'SIGNED'
            });

            const result = await resumeOrderAction({
                orderId: VALID_ORDER_ID,
                remark: 'Resume test'
            });

            expect(result.success).toBe(true);
            expect(result.data?.newStatus).toBe('SIGNED');
            expect(mockOrderService.resumeOrder).toHaveBeenCalledWith(
                VALID_ORDER_ID,
                mockSession.user.tenantId,
                mockSession.user.id
            );
        });
    });

    describe('getHaltedOrders', () => {
        it('should return enriched halted orders', async () => {
            const now = new Date();
            const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);

            const mockOrders = [
                {
                    id: 'ord-1',
                    orderNo: 'OD-1',
                    totalAmount: '1000',
                    pausedAt: eightDaysAgo,
                    pauseReason: JSON.stringify({ reason: 'CUSTOMER_REQUEST', remark: 'Long halt' }),
                    updatedAt: eightDaysAgo,
                    customer: { name: 'C1', phone: '123' }
                },
                {
                    id: 'ord-2',
                    orderNo: 'OD-2',
                    totalAmount: '2000',
                    pausedAt: now,
                    pauseReason: JSON.stringify({ reason: 'OTHER' }),
                    updatedAt: now,
                    customer: { name: 'C2', phone: '456' }
                }
            ];

            mockDbQuery.orders.findMany.mockResolvedValue(mockOrders);

            const result = await getHaltedOrders();

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(2);

            // Check enrichment
            const longHalted = result.data?.find((o: any) => o.id === 'ord-1');
            expect(longHalted?.daysHalted).toBeGreaterThanOrEqual(8);
            expect(longHalted?.alertLevel).toBe('WARNING');
            expect(longHalted?.haltReason).toBe('CUSTOMER_REQUEST');

            const justHalted = result.data?.find((o: any) => o.id === 'ord-2');
            expect(justHalted?.daysHalted).toBe(0);
            expect(justHalted?.alertLevel).toBe('NONE');
        });
    });
});
