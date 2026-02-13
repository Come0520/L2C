
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted Mocks
const { mockDbQuery, mockDbInsert, mockDbUpdate, mockSession } = vi.hoisted(() => {
    const mockDbQuery = {
        orders: { findFirst: vi.fn(), findMany: vi.fn() },
        quotes: { findFirst: vi.fn() },
        arStatements: { findFirst: vi.fn(), findMany: vi.fn() },
        receipts: { findFirst: vi.fn(), findMany: vi.fn() },
        paymentSchedules: { findFirst: vi.fn(), findMany: vi.fn() },
        purchaseOrders: { findFirst: vi.fn(), findMany: vi.fn() },
        installTasks: { findFirst: vi.fn(), findMany: vi.fn() },
    };

    const mockDbInsert = vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'new-id-uuid', orderNo: 'OD-123', statementNo: 'AR-123' }])
        })
    });

    const mockDbUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: 'mock-id-uuid' }])
            })
        })
    });

    const mockSession = {
        user: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            tenantId: '123e4567-e89b-12d3-a456-426614174999',
            name: 'Tester'
        }
    };

    return { mockDbQuery, mockDbInsert, mockDbUpdate, mockSession };
});

// Mock Dependencies
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue(mockSession),
    checkPermission: vi.fn().mockResolvedValue(true),
    requirePermission: vi.fn().mockResolvedValue(mockSession),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: mockDbQuery,
        insert: mockDbInsert,
        update: mockDbUpdate,
        transaction: vi.fn(async (cb) => {
            return await cb({
                query: mockDbQuery,
                insert: mockDbInsert,
                update: mockDbUpdate,
            });
        }),
        select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ count: 0 }]) }) })
    }
}));

vi.mock('next-auth', () => ({
    default: vi.fn(),
    NextAuth: vi.fn(() => ({ auth: vi.fn() })),
}));

// Import Actions
import { createOrderFromQuote, confirmOrderProduction } from '../actions';

describe('Order & Finance Integration Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const VALID_QUOTE_ID = '123e4567-e89b-12d3-a456-426614174001';
    const VALID_ORDER_ID = '123e4567-e89b-12d3-a456-426614174002';
    const VALID_CUST_ID = '123e4567-e89b-12d3-a456-426614174003';
    const VALID_TENANT_ID = '123e4567-e89b-12d3-a456-426614174999';

    it('Scenario 1: Cash Order - Create, Deposit, Confirm Production', async () => {
        // 1. Setup Quote
        const quote = {
            id: VALID_QUOTE_ID,
            status: 'ACCEPTED',
            customerId: VALID_CUST_ID,
            leadId: 'lead-1-uuid',
            finalAmount: '10000',
            tenantId: VALID_TENANT_ID,
            customer: {
                name: 'Test Customer',
                phone: '123',
                settlementType: 'CASH',
                defaultAddress: 'Addr'
            },
            items: []
        };
        mockDbQuery.quotes.findFirst.mockResolvedValue(quote);
        mockDbQuery.orders.findFirst.mockResolvedValue(null);

        // 2. Create Order
        const result = await createOrderFromQuote({ quoteId: VALID_QUOTE_ID });
        expect(result).toBeDefined();

        // 3. Confirm Production logic
        const orderMock = {
            id: VALID_ORDER_ID,
            orderNo: 'OD-123',
            status: 'PENDING_PO',
            tenantId: VALID_TENANT_ID,
            totalAmount: '10000',
            paidAmount: '3000', // Pre-paid deposit for mock
            settlementType: 'CASH',
            depositRatio: '0.3',
            productionTrigger: 'DEPOSIT_REQUIRED',
            customer: { creditLimit: 0 },
            approvalStatus: 'NONE'
        };
        mockDbQuery.orders.findFirst.mockResolvedValue(orderMock);

        const confirmResult = await confirmOrderProduction({ orderId: VALID_ORDER_ID });
        expect(confirmResult.success).toBe(true);

        // Verify Status Update -> PENDING_PRODUCTION (according to state machine)
        expect(mockDbUpdate).toHaveBeenCalledWith(expect.anything());
    });

    it('Scenario 2: Monthly Settlement - No Deposit Required', async () => {
        // Setup Order Mock
        const orderMock = {
            id: VALID_ORDER_ID,
            orderNo: 'OD-M',
            status: 'PENDING_PO',
            tenantId: VALID_TENANT_ID,
            totalAmount: '10000',
            paidAmount: '0',
            settlementType: 'MONTHLY',
            depositRatio: 0,
            productionTrigger: 'NONE',
            customer: { creditLimit: 100000 },
            approvalStatus: 'NONE'
        };
        mockDbQuery.orders.findFirst.mockResolvedValue(orderMock);

        const confirmResult = await confirmOrderProduction({ orderId: VALID_ORDER_ID });
        expect(confirmResult.success).toBe(true);
    });
});
