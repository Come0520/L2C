
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
            returning: vi.fn().mockResolvedValue([{ id: 'new-id', orderNo: 'OD-123', statementNo: 'AR-123' }])
        })
    });

    const mockDbUpdate = vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined)
        })
    });

    const mockSession = {
        user: {
            id: 'test-user',
            tenantId: 'test-tenant',
            name: 'Tester'
        }
    };

    return { mockDbQuery, mockDbInsert, mockDbUpdate, mockSession };
});

// Mock Dependencies
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn().mockResolvedValue(mockSession),
    checkPermission: vi.fn(),
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
vi.mock('@/shared/api/schema', () => ({
    orders: { id: 'orders.id', status: { enumValues: [] } },
    quotes: { id: 'quotes.id' },
    arStatements: { id: 'arStatements.id' },
    receipts: { id: 'receipts.id' },
    paymentSchedules: { id: 'paymentSchedules.id' },
    reconciliationStatements: { id: 'reconciliationStatements.id' },
    apStatements: { id: 'apStatements.id', status: { enumValues: [] }, type: { enumValues: [] } },
    apStatementItems: { id: 'apStatementItems.id' },
    systemLogs: {},
    purchaseOrders: {},
    installTasks: {},
    arStatusEnum: { enumValues: [] },
    receiptStatusEnum: { enumValues: [] },
    receiptTypeEnum: { enumValues: [] },
    paymentMethodEnum: { enumValues: [] },
}));

// Import Actions
import { createOrderFromQuote, confirmOrderProduction } from '../actions';
import { createPayment as recordPayment } from '@/features/finance/actions/mutations';

// Note: createArFromOrderInternal is imported dynamically in createOrderFromQuote, 
// but for unit test we might need to mock the import or ensure it runs.
// Since we are running in same environment, the dynamic import should work or we can mock it.
// To keep it simple, we verify the logic flow by mocking the internal calls if necessary, 
// but here we want integration test. Ideally let the code run.

describe('Order & Finance Integration Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('Scenario 1: Cash Order - Create, Deposit, Confirm Production', async () => {
        // 1. Setup Quote
        const quoteId = 'quote-1';
        const quote = {
            id: quoteId,
            status: 'ACTIVE',
            customerId: 'cust-1',
            leadId: 'lead-1',
            finalAmount: '10000',
            customer: {
                name: 'Test Customer',
                phone: '123',
                settlementType: 'CASH',
                defaultAddress: 'Addr'
            },
            items: []
        };
        mockDbQuery.quotes.findFirst.mockResolvedValue(quote);
        mockDbQuery.orders.findFirst.mockResolvedValue(null); // No existing order

        // 2. Create Order
        const result = await createOrderFromQuote({ quoteId });
        expect(result.success).toBe(true);
        expect(mockDbInsert).toHaveBeenCalledWith(expect.anything()); // Insert Order

        // Assert AR creation logic (Since createArFromOrderInternal is called)
        // We can verify `paymentSchedules` insertion
        // Since we mocked `insert().values().returning()`, the logic continues.
        // We need to check if schema generated schedules were inserted.
        // The last insert call should be SystemLogs, previous should be Schedules.

        // Let's verify confirmOrderProduction logic
        const orderId = 'new-id';
        const orderMock = {
            id: orderId,
            orderNo: 'OD-123',
            status: 'PENDING_PO',
            totalAmount: '10000',
            paidAmount: '0',
            settlementType: 'CASH',
            depositRatio: '0.3', // 3000 deposit required
            productionTrigger: 'DEPOSIT_REQUIRED',
            customer: { creditLimit: 0 },
            approvalStatus: 'NONE'
        };
        mockDbQuery.orders.findFirst.mockResolvedValue(orderMock);

        // 3. Confirm Production - Should Fail (Paid 0 < 3000)
        await expect(confirmOrderProduction({ orderId }))
            .rejects.toThrow('需支付定金 (¥3000.00) 才可排产');

        // 4. Pay Deposit
        // Mock AR Statement finding
        const arStatementMock = {
            id: 'ar-1',
            totalAmount: '10000',
            receivedAmount: '0',
            status: 'PENDING',
            orderId: orderId,
            customerId: 'cust-1'
        };
        mockDbQuery.arStatements.findFirst.mockResolvedValue(arStatementMock);

        await recordPayment({
            statementId: 'ar-1',
            amount: 3000,
            method: 'CASH',
            remark: 'Deposit'
        });

        // 5. Update Order Mock to reflect payment (since logic re-fetches)
        orderMock.paidAmount = '3000';
        mockDbQuery.orders.findFirst.mockResolvedValue(orderMock);

        // 6. Confirm Production - Should Succeed
        // We need to mock createPosFromOrderInternal
        vi.mock('@/features/supply-chain/actions', () => ({
            createPosFromOrderInternal: vi.fn().mockResolvedValue({ success: true })
        }));

        const confirmResult = await confirmOrderProduction({ orderId });
        expect(confirmResult.success).toBe(true);

        // Verify Status Update
        expect(mockDbUpdate).toHaveBeenCalled(); // Order status -> IN_PRODUCTION
    });

    it('Scenario 2: Monthly Settlement - No Deposit Required', async () => {
        // Setup Order Mock
        const orderId = 'order-monthly';
        const orderMock = {
            id: orderId,
            orderNo: 'OD-M',
            status: 'PENDING_PO',
            totalAmount: '10000',
            paidAmount: '0',
            settlementType: 'MONTHLY',
            depositRatio: 0,
            productionTrigger: 'NONE',
            customer: { creditLimit: 100000 },
            approvalStatus: 'NONE'
        };
        mockDbQuery.orders.findFirst.mockResolvedValue(orderMock);

        // Confirm Production - Should Succeed immediately
        const confirmResult = await confirmOrderProduction({ orderId });
        expect(confirmResult.success).toBe(true);
    });
});
