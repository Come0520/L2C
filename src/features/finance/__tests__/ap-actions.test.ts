import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createPaymentBill, verifyPaymentBill, generateLaborSettlement, createSupplierRefundStatement } from '../actions/ap';
import { createPaymentBillSchema } from '../actions/schema';
import { db } from '@/shared/api/db';
import { auth, checkPermission } from '@/shared/lib/auth';
import { financeAccounts } from '@/shared/api/schema';
import { submitApproval } from '@/features/approval/actions/submission';
import { FinanceApprovalLogic } from '@/features/finance/logic/finance-approval';

// Helper to mock chained DB calls
const createChainedMock = (returnValue: unknown = []) => {
    const mock: Record<string, unknown> = {};
    mock.set = vi.fn().mockReturnValue(mock);
    mock.where = vi.fn().mockReturnValue(mock);
    mock.values = vi.fn().mockReturnValue(mock);
    mock.returning = vi.fn().mockResolvedValue(returnValue);
    mock.then = (onFulfilled: (val: unknown) => unknown) => Promise.resolve(returnValue).then(onFulfilled);
    return mock;
};

// Mock dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        insert: vi.fn(),
        query: {
            paymentBills: { findFirst: vi.fn() },
            financeAccounts: { findFirst: vi.fn() },
            apSupplierStatements: { findFirst: vi.fn() },
            apLaborStatements: { findFirst: vi.fn() },
        },
        transaction: vi.fn(),
        update: vi.fn(),
        select: vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue([]),
            }),
        }),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
    PERMISSIONS: {
        FINANCE: { CREATE: 'finance:create', MANAGE: 'finance:manage' },
    },
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn().mockResolvedValue({}),
    },
}));

vi.mock('@/features/approval/actions/submission', () => ({
    submitApproval: vi.fn(),
}));

vi.mock('@/features/finance/logic/finance-approval', () => ({
    FinanceApprovalLogic: {
        isFlowActive: vi.fn(),
        FLOW_CODES: {
            PAYMENT: 'FINANCE_PAYMENT',
            REFUND: 'FINANCE_REFUND',
        },
    },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

// Mock 动态导入 liabilityNotices
vi.mock('@/shared/api/schema', async (importOriginal) => {
    const mod = await importOriginal<Record<string, unknown>>();
    return {
        ...mod,
        liabilityNotices: { id: 'liabilityNotices', tenantId: 'tenantId' },
    };
});

describe('AP Actions', () => {
    // Valid standard V4 UUIDs
    const mockTenantId = 'f47ac10b-58cc-4372-a567-0e02b2c3d401';
    const mockUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d402';
    const mockSession = { user: { tenantId: mockTenantId, id: mockUserId } };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as ReturnType<typeof vi.fn>).mockResolvedValue(mockSession);
        (checkPermission as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    });

    describe('createPaymentBill validation', () => {
        it('should pass schema validation with our mock data', () => {
            const mockData = {
                type: 'SUPPLIER' as const,
                payeeType: 'SUPPLIER' as const,
                payeeId: 'f47ac10b-58cc-4372-a567-0e02b2c3d403',
                payeeName: 'Test Supplier',
                amount: 1000,
                paymentMethod: 'TRANSFER',
                proofUrl: 'test.png',
                items: [
                    { statementType: 'AP_SUPPLIER' as const, statementId: 'f47ac10b-58cc-4372-a567-0e02b2c3d404', amount: 1000 }
                ]
            };

            const result = createPaymentBillSchema.safeParse(mockData);
            if (!result.success) {
                console.error('DEBUG ZOD ERROR:', JSON.stringify(result.error.errors, null, 2));
            }
            expect(result.success).toBe(true);
        });
    });

    describe('createPaymentBill implementation', () => {
        it('should create bill and submit approval if flow is active', async () => {
            const mockData = {
                type: 'SUPPLIER' as const,
                payeeType: 'SUPPLIER' as const,
                payeeId: 'f47ac10b-58cc-4372-a567-0e02b2c3d403',
                payeeName: 'Test Supplier',
                amount: 1000,
                paymentMethod: 'TRANSFER',
                proofUrl: 'test.png',
                items: [
                    { statementType: 'AP_SUPPLIER' as const, statementId: 'f47ac10b-58cc-4372-a567-0e02b2c3d404', amount: 1000 }
                ]
            };

            const mockTx = {
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }]),
                    }),
                }),
                query: {
                    apSupplierStatements: { findFirst: vi.fn().mockResolvedValue({ id: 's1', pendingAmount: '1000' }) }
                }
            };

            (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx));
            (db.insert as ReturnType<typeof vi.fn>).mockReturnValue(createChainedMock([{ id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }]));
            (db.update as ReturnType<typeof vi.fn>).mockReturnValue(createChainedMock());
            (FinanceApprovalLogic.isFlowActive as ReturnType<typeof vi.fn>).mockResolvedValue(true);
            (submitApproval as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });

            const result = await createPaymentBill(mockData);

            expect(result.data).toHaveProperty('id', 'f47ac10b-58cc-4372-a567-0e02b2c3d479');
            expect(submitApproval).toHaveBeenCalled();
        });
    });

    describe('verifyPaymentBill', () => {
        const mockBillId = 'f47ac10b-58cc-4372-a567-0e02b2c3d403';
        const mockAccountId = 'f47ac10b-58cc-4372-a567-0e02b2c3d405';

        it('should verify payment bill and deduct balance', async () => {
            const mockBill = {
                id: mockBillId,
                amount: '100',
                status: 'PENDING',
                accountId: mockAccountId,
            };
            const mockAccount = { id: mockAccountId, balance: '1000' };

            // Mock builder to handle chained calls and returning()

            const mockTx = {
                query: {
                    paymentBills: { findFirst: vi.fn().mockResolvedValue({ ...mockBill, items: [] }) },
                    financeAccounts: { findFirst: vi.fn().mockResolvedValue(mockAccount) },
                    apSupplierStatements: { findFirst: vi.fn() },
                    apLaborStatements: { findFirst: vi.fn() },
                },
                update: vi.fn((table: unknown) => {
                    if (table === financeAccounts) {
                        return createChainedMock([mockAccount]);
                    }
                    return createChainedMock([{ ...mockBill, status: 'PAID' }]);
                }),
                insert: vi.fn().mockReturnValue(createChainedMock([]))
            };

            (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx));

            const result = await verifyPaymentBill({ id: mockBillId, status: 'VERIFIED' });

            if (result.serverError) {
                console.error('Verify failed:', result.serverError);
            }
            expect(result.data).toEqual({ success: true });
            expect(mockTx.update).toHaveBeenCalledWith(financeAccounts);
        });

        it('should fail if insufficient balance', async () => {
            const mockBill = {
                id: mockBillId,
                amount: '2000',
                status: 'PENDING',
                accountId: mockAccountId,
            };
            const mockAccount = { id: mockAccountId, balance: '1000' };

            const mockTx = {
                query: {
                    paymentBills: { findFirst: vi.fn().mockResolvedValue(mockBill) },
                    financeAccounts: { findFirst: vi.fn().mockResolvedValue(mockAccount) },
                    apSupplierStatements: { findFirst: vi.fn() },
                    apLaborStatements: { findFirst: vi.fn() },
                },
                update: vi.fn().mockReturnValue(createChainedMock([mockBill])),
                insert: vi.fn().mockReturnValue(createChainedMock([]))
            };

            (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx));

            const result = await verifyPaymentBill({ id: mockBillId, status: 'VERIFIED' });

            // createSafeAction 捕获 Error 后返回 { error: message, success: false }
            expect(result.error).toMatch(/余额不足/);
        });
    });

    describe('generateLaborSettlement', () => {
        it('无待结算安装任务时应返回 count: 0', async () => {
            const mockTx = {
                select: vi.fn().mockReturnValue({
                    from: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([]),
                    }),
                }),
                query: {
                    installTasks: {
                        findMany: vi.fn().mockResolvedValue([]),
                    },
                    liabilityNotices: {
                        findMany: vi.fn().mockResolvedValue([]),
                    },
                },
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 'stmt-1' }]),
                    }),
                }),
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([]),
                    }),
                }),
            };

            (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(
                async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)
            );

            const result = await generateLaborSettlement();

            expect(result).toEqual({ count: 0, deductionCount: 0 });
        });

        it('有完成任务时应生成结算单', async () => {
            const mockTx = {
                select: vi.fn().mockReturnValue({
                    from: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([]),
                    }),
                }),
                query: {
                    installTasks: {
                        findMany: vi.fn().mockResolvedValue([
                            {
                                id: 'task-1',
                                installerId: 'worker-1',
                                taskNo: 'TASK-001',
                                status: 'COMPLETED',
                                actualLaborFee: '500',
                                installer: { name: '张三' },
                            },
                        ]),
                    },
                    liabilityNotices: {
                        findMany: vi.fn().mockResolvedValue([]),
                    },
                },
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 'stmt-new' }]),
                    }),
                }),
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([]),
                    }),
                }),
            };

            (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(
                async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)
            );

            const result = await generateLaborSettlement();

            expect(result).toEqual({ count: 1, deductionCount: 0 });
            // 验证 insert 被调用（创建结算单 + 费用明细）
            expect(mockTx.insert).toHaveBeenCalled();
        });
    });

    describe('createSupplierRefundStatement', () => {
        const mockOriginalStatementId = 'f47ac10b-58cc-4372-a567-0e02b2c3d410';

        it('应成功创建退款红字对账单', async () => {
            const mockTx = {
                query: {
                    apSupplierStatements: {
                        findFirst: vi.fn().mockResolvedValue({
                            id: mockOriginalStatementId,
                            statementNo: 'SUP-001',
                            purchaseOrderId: 'po-1',
                            supplierId: 'sup-1',
                            supplierName: '供应商A',
                            totalAmount: '5000',
                            paidAmount: '5000',
                            pendingAmount: '0',
                            status: 'COMPLETED',
                            purchaserId: 'buyer-1',
                            supplier: { id: 'sup-1', name: '供应商A' },
                        }),
                    },
                },
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{
                            id: 'refund-stmt-1',
                            statementNo: 'RFD-001',
                        }]),
                    }),
                }),
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue([]),
                    }),
                }),
            };

            (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(
                async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)
            );

            const result = await createSupplierRefundStatement({
                originalStatementId: mockOriginalStatementId,
                refundAmount: 1000,
                reason: '质量问题退款',
            });

            expect(result).toHaveProperty('success', true);
            expect(result).toHaveProperty('data');
        });

        it('原对账单未付款时应拒绝退款', async () => {
            const mockTx = {
                query: {
                    apSupplierStatements: {
                        findFirst: vi.fn().mockResolvedValue({
                            id: mockOriginalStatementId,
                            statementNo: 'SUP-002',
                            totalAmount: '5000',
                            paidAmount: '0',
                            pendingAmount: '5000',
                            status: 'PENDING',
                        }),
                    },
                },
            };

            (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(
                async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)
            );

            const result = await createSupplierRefundStatement({
                originalStatementId: mockOriginalStatementId,
                refundAmount: 1000,
                reason: '退款测试',
            });

            expect(result).toHaveProperty('success', false);
            expect(result).toHaveProperty('error');
        });

        it('退款金额超过已付款额时应拒绝', async () => {
            const mockTx = {
                query: {
                    apSupplierStatements: {
                        findFirst: vi.fn().mockResolvedValue({
                            id: mockOriginalStatementId,
                            statementNo: 'SUP-003',
                            totalAmount: '5000',
                            paidAmount: '2000',
                            pendingAmount: '3000',
                            status: 'PARTIAL',
                        }),
                    },
                },
            };

            (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(
                async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)
            );

            const result = await createSupplierRefundStatement({
                originalStatementId: mockOriginalStatementId,
                refundAmount: 3000, // 超过已付款 2000
                reason: '退款金额过大',
            });

            expect(result).toHaveProperty('success', false);
            expect(result.error).toMatch(/退款金额不能超过/);
        });
    });
});
