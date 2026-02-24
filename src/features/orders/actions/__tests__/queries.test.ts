import { vi, describe, it, expect, beforeEach } from 'vitest';
import { getOrders, getOrderById } from '../queries';
import { db } from '@/shared/api/db';
import { checkPermission } from '@/shared/lib/auth';

// Mock server-action to bypass auth complex logic in tests
vi.mock('@/shared/lib/server-action', () => ({
    createSafeAction: (schema: any, handler: any) => {
        return async (data: any) => {
            const mockSession = {
                user: {
                    id: '11111111-1111-4111-8111-111111111111',
                    tenantId: '11111111-1111-4111-8111-111111111111',
                },
            };
            try {
                const result = await handler(data, { session: mockSession });
                return { success: true, data: result };
            } catch (error: any) {
                return { success: false, error: error.message };
            }
        };
    },
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            orders: {
                findMany: vi.fn(),
                findFirst: vi.fn(),
            },
        },
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn().mockResolvedValue([{ count: 10 }]),
            })),
        })),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('next/cache', () => ({
    unstable_cache: vi.fn((fn) => fn),
    revalidateTag: vi.fn(),
    revalidateTag: vi.fn(),
}));

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

describe('Order Queries Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(checkPermission).mockResolvedValue(true);
    });

    describe('getOrders', () => {
        it('should return paginated orders', async () => {
            const mockOrders = [{ id: VALID_UUID, orderNo: 'ORD-001' }];
            vi.mocked(db.query.orders.findMany).mockResolvedValue(mockOrders as any);

            const result = await getOrders({ page: 1, pageSize: 10 });

            expect(result.success).toBe(true);
            expect(result.data.data).toEqual(mockOrders);
            expect(result.data.total).toBe(10);
        });

        it('should filtering by search term', async () => {
            await getOrders({ page: 1, pageSize: 10, search: 'ORD-001' });
            expect(db.query.orders.findMany).toHaveBeenCalled();
        });
    });

    describe('getOrderById', () => {
        it('should return order detail when found', async () => {
            const mockOrder = { id: VALID_UUID, orderNo: 'ORD-001', customer: {}, sales: {} };
            vi.mocked(db.query.orders.findFirst).mockResolvedValue(mockOrder as any);

            const result = await getOrderById(VALID_UUID);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockOrder);
            expect(db.query.orders.findFirst).toHaveBeenCalled();
        });

        it('should return error when order not found', async () => {
            vi.mocked(db.query.orders.findFirst).mockResolvedValue(null as any);

            const result = await getOrderById(VALID_UUID);

            expect(result.success).toBe(false); // createSafeAction catches the thrown error
            expect(result.error).toBe('Order not found');
        });
    });
});
