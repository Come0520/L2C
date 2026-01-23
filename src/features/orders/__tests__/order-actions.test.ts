
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { splitOrder, requestDelivery } from '../actions/orders';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';

// Mock Modules
vi.mock('next-auth', () => ({
    default: vi.fn(),
    NextAuth: vi.fn(() => ({ auth: vi.fn() })),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            orders: { findFirst: vi.fn(), findMany: vi.fn() },
            suppliers: { findFirst: vi.fn() }
        },
        select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn() })) })),
        insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn() })) })),
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn() })) })) })),
        transaction: vi.fn((cb) => cb({
            query: { orders: { findFirst: vi.fn() } },
            update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn() })) })) }))
        })),
    }
}));

// Mock auth library
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(true)
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}));

describe('Order Actions', () => {
    const VALID_ORDER_ID = '123e4567-e89b-12d3-a456-426614174000';
    const VALID_SUPPLIER_ID = '123e4567-e89b-12d3-a456-426614174004';
    const ITEM_ID_1 = '123e4567-e89b-12d3-a456-426614174001';
    const ITEM_ID_2 = '123e4567-e89b-12d3-a456-426614174002';

    const mockOrder = {
        id: VALID_ORDER_ID,
        tenantId: 'tenant-1',
        status: 'PENDING_PO',
        items: [
            { id: ITEM_ID_1, productId: 'p1', quantity: 1, unitPrice: '100', poId: null },
            { id: ITEM_ID_2, productId: 'p2', quantity: 2, unitPrice: '50', poId: null }
        ]
    };

    const mockSession = {
        user: { id: 'user-1', tenantId: 'tenant-1', role: 'ADMIN' }
    };

    beforeEach(() => {
        vi.resetAllMocks();
        (auth as any).mockResolvedValue(mockSession);
    });

    describe('splitOrder', () => {
        it('should successfully split order with valid input and permission', async () => {
            // Mock DB to return order
            (db.query.orders.findFirst as any).mockResolvedValue(mockOrder);
            // Mock Supplier
            (db.query.suppliers.findFirst as any).mockResolvedValue({ id: VALID_SUPPLIER_ID, name: 'Supplier A' });
            // Mock Insert/Update responses
            const returnMock = vi.fn().mockResolvedValue([{ id: 'new-po-id' }]);
            (db.insert as any).mockReturnValue({ values: vi.fn().mockReturnValue({ returning: returnMock }) });

            const input = {
                orderId: VALID_ORDER_ID,
                items: [{ itemId: ITEM_ID_1, quantity: '1', supplierId: VALID_SUPPLIER_ID }]
            };

            const result = await splitOrder(input);
            expect(result.success).toBe(true);
        });

        it('should fail if unauthorized (no session)', async () => {
            (auth as any).mockResolvedValue(null);
            await expect(splitOrder({ orderId: VALID_ORDER_ID, items: [] }))
                .rejects.toThrow('Unauthorized');
        });

        it('should fail if order not found or wrong tenant', async () => {
            (db.query.orders.findFirst as any).mockResolvedValue(null);

            const input = {
                orderId: VALID_ORDER_ID,
                items: [{ itemId: ITEM_ID_1, quantity: '1', supplierId: VALID_SUPPLIER_ID }]
            };

            await expect(splitOrder(input)).rejects.toThrow('订单不存在或无权操作');
        });
    });

    describe('requestDelivery', () => {
        it('should succeed for valid PENDING_DELIVERY order', async () => {
            // Mock order
            (db.query.orders.findFirst as any).mockResolvedValue({
                ...mockOrder,
                status: 'PENDING_DELIVERY'
            });

            const input = {
                orderId: VALID_ORDER_ID,
                company: 'SF',
                trackingNo: '123456'
            };

            const result = await requestDelivery(input);
            expect(result.success).toBe(true);
        });

        it('should fail if status is not PENDING_DELIVERY', async () => {
            // Mock order
            (db.query.orders.findFirst as any).mockResolvedValue({
                ...mockOrder,
                status: 'PENDING_PO'
            });

            const input = {
                orderId: VALID_ORDER_ID,
                company: 'SF',
                trackingNo: '123456'
            };

            await expect(requestDelivery(input)).rejects.toThrow('订单状态不正确');
        });
    });
});
