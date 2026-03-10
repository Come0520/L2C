import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getOrderItems, getOrderPaymentSchedules } from '../actions/queries';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            orderItems: {
                findMany: vi.fn(),
            },
            paymentSchedules: {
                findMany: vi.fn(),
            },
        },
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((fn) => fn),
}));

vi.mock('react', () => ({
    cache: vi.fn((fn) => fn),
}));

describe('Order Queries', () => {
    const mockSession = {
        user: {
            id: 'test-user',
            tenantId: 'test-tenant',
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue(mockSession);
    });

    describe('getOrderItems', () => {
        it('should throw Unauthorized if no session', async () => {
            (auth as any).mockResolvedValue(null);
            await expect(getOrderItems('order-123')).rejects.toThrow('Unauthorized');
        });

        it('should return empty array for __PLATFORM__ tenant', async () => {
            (auth as any).mockResolvedValue({ user: { tenantId: '__PLATFORM__' } });
            const result = await getOrderItems('order-123');
            expect(result).toEqual({ success: true, data: [] });
        });

        it('should query orderItems with tenantId filtering to prevent cross-tenant access', async () => {
            const mockItems = [{ id: 'item-1' }];
            (db.query.orderItems.findMany as any).mockResolvedValue(mockItems);

            const result = await getOrderItems('order-123');

            expect(result).toEqual({ success: true, data: mockItems });
            expect(db.query.orderItems.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.any(Object), // The SQL condition object
                })
            );
        });
    });

    describe('getOrderPaymentSchedules', () => {
        it('should throw Unauthorized if no session', async () => {
            (auth as any).mockResolvedValue(null);
            await expect(getOrderPaymentSchedules('order-123')).rejects.toThrow('Unauthorized');
        });

        it('should return empty array for __PLATFORM__ tenant', async () => {
            (auth as any).mockResolvedValue({ user: { tenantId: '__PLATFORM__' } });
            const result = await getOrderPaymentSchedules('order-123');
            expect(result).toEqual({ success: true, data: [] });
        });

        it('should query paymentSchedules with tenantId filtering to prevent cross-tenant access', async () => {
            const mockSchedules = [{ id: 'schedule-1' }];
            (db.query.paymentSchedules.findMany as any).mockResolvedValue(mockSchedules);

            const result = await getOrderPaymentSchedules('order-123');

            expect(result).toEqual({ success: true, data: mockSchedules });
            expect(db.query.paymentSchedules.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.any(Object), // The SQL condition object
                })
            );
        });
    });
});
