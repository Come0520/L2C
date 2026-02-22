import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createPaymentBill, verifyPaymentBill, generateLaborSettlement, createSupplierRefundStatement, getAPSupplierStatements, getAPSupplierStatement, getAPLaborStatements, getAPLaborStatement, getApStatementById, createSupplierLiabilityStatement } from '../actions/ap';
import { createPaymentBillSchema } from '../actions/schema';
import { db } from '@/shared/api/db';
import { auth, checkPermission } from '@/shared/lib/auth';
import { financeAccounts, apSupplierStatements, apLaborStatements, liabilityNotices, paymentBills } from '@/shared/api/schema';
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
            apSupplierStatements: { findFirst: vi.fn(), findMany: vi.fn() },
            apLaborStatements: { findFirst: vi.fn(), findMany: vi.fn() },
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
    revalidateTag: vi.fn(),
    unstable_cache: vi.fn().mockImplementation((fn: any) => fn),
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

    describe('Queries (getAPSupplierStatements, getApStatementById, detail queries)', () => {
        it('should get supplier statements with permission', async () => {
            (db.query.apSupplierStatements.findMany as any).mockResolvedValue([
                { id: 'stmt-1', totalAmount: '100', supplier: { name: 'Supplier A' } }
            ]);

            const result = await getAPSupplierStatements({ limit: 10 });
            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty('id', 'stmt-1');
        });

        it('should get single supplier statement detail', async () => {
            const mockId = 'f47ac10b-58cc-4372-a567-0e02b2c3d409';
            (db.query.apSupplierStatements.findFirst as any).mockResolvedValue({
                id: mockId,
                tenantId: mockTenantId,
                supplier: { name: 'A' }
            });

            const result = await getAPSupplierStatement(mockId);
            expect(result).toHaveProperty('id', mockId);
            expect(db.query.apSupplierStatements.findFirst).toHaveBeenCalledWith(expect.objectContaining({
                where: expect.anything()
            }));
        });

        it('should get labor statements list', async () => {
            (db.query.apLaborStatements.findMany as any).mockResolvedValue([{ id: 'l-1', worker: { name: 'W1' } }]);
            (checkPermission as any).mockResolvedValueOnce(true); // LABOR_VIEW

            const result = await getAPLaborStatements();
            expect(result).toHaveLength(1);
            expect(result[0]).toHaveProperty('id', 'l-1');
        });

        it('should get single labor statement detail', async () => {
            const mockId = 'f47ac10b-58cc-4372-a567-0e02b2c3d410';
            (db.query.apLaborStatements.findFirst as any).mockResolvedValue({
                id: mockId,
                worker: { name: 'W1' },
                feeDetails: []
            });

            const result = await getAPLaborStatement(mockId);
            expect(result).toHaveProperty('id', mockId);
        });

        it('should throw error when missing VIEW permission', async () => {
            (checkPermission as any).mockResolvedValue(false);
            await expect(getAPSupplierStatements()).rejects.toThrow('权限不足：需要财务查看权限');
        });

        it('should get by ID (supplier routing)', async () => {
            (db.query.apSupplierStatements.findFirst as any).mockResolvedValue({ id: 's1', purchaseOrder: { items: [] } });
            (db.query.apLaborStatements.findFirst as any).mockResolvedValue(null);

            const result = await getApStatementById({ id: 's1' });
            expect(result.success).toBe(true);
            expect(result.data).toHaveProperty('type', 'SUPPLIER');
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
                paymentNo: 'BILL-001'
            };
            const mockAccount = { id: mockAccountId, balance: '1000' };

            const mockTx = {
                query: {
                    paymentBills: { findFirst: vi.fn().mockResolvedValue({ ...mockBill, items: [] }) },
                    financeAccounts: { findFirst: vi.fn().mockResolvedValue(mockAccount) },
                    apSupplierStatements: { findFirst: vi.fn() },
                    apLaborStatements: { findFirst: vi.fn() },
                },
                update: vi.fn((table: any) => {
                    if (table === financeAccounts) return createChainedMock([mockAccount]);
                    if (table === paymentBills) return createChainedMock([{ ...mockBill, status: 'PAID' }]);
                    return createChainedMock([]);
                }),
                insert: vi.fn().mockReturnValue(createChainedMock([]))
            };

            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            const result = await verifyPaymentBill({ id: mockBillId, status: 'VERIFIED' });
            expect(result.data).toEqual({ success: true });
            expect(mockTx.update).toHaveBeenCalledWith(paymentBills);
            expect(mockTx.update).toHaveBeenCalledWith(financeAccounts);
        });

        it('should handle REJECTED status', async () => {
            const mockTx = {
                query: {
                    paymentBills: { findFirst: vi.fn().mockResolvedValue({ id: mockBillId, status: 'PENDING', items: [] }) },
                },
                update: vi.fn().mockReturnValue(createChainedMock([])),
            };
            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            const result = await verifyPaymentBill({ id: mockBillId, status: 'REJECTED', remark: 'Invalid' });
            expect(result.data).toEqual({ success: true });
            expect(mockTx.update).toHaveBeenCalledWith(paymentBills);
        });

        it('should update statement status to COMPLETED when fully paid', async () => {
            const stmtId = 'stmt-111';
            const mockBill = {
                id: mockBillId,
                amount: '100',
                status: 'PENDING',
                accountId: mockAccountId,
                items: [{ statementType: 'AP_SUPPLIER', statementId: stmtId, amount: '100' }]
            };
            const mockStmt = { id: stmtId, totalAmount: '100', paidAmount: '0', status: 'PENDING' };

            const mockTx = {
                query: {
                    paymentBills: { findFirst: vi.fn().mockResolvedValue(mockBill) },
                    financeAccounts: { findFirst: vi.fn().mockResolvedValue({ balance: '500' }) },
                    apSupplierStatements: { findFirst: vi.fn().mockResolvedValue(mockStmt) },
                },
                update: vi.fn().mockReturnValue(createChainedMock([{}])),
                insert: vi.fn().mockReturnValue(createChainedMock([])),
            };
            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            await verifyPaymentBill({ id: mockBillId, status: 'VERIFIED' });

            // 验证对账单更新为 COMPLETED
            expect(mockTx.update).toHaveBeenCalledWith(apSupplierStatements);
        });

        it('should fail if payment bill status is not auditable', async () => {
            const mockTx = {
                query: {
                    paymentBills: { findFirst: vi.fn().mockResolvedValue({ id: mockBillId, status: 'PAID' }) },
                }
            };
            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            const result = await verifyPaymentBill({ id: mockBillId, status: 'VERIFIED' });
            expect(result.error).toMatch(/状态不可审核/);
        });
    });

    describe('generateLaborSettlement', () => {
        it('should combine tasks and deductions correctly', async () => {
            const mockTx = {
                select: vi.fn().mockReturnValue({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) }),
                query: {
                    installTasks: {
                        findMany: vi.fn().mockResolvedValue([
                            { id: 't1', installerId: 'w1', actualLaborFee: '1000', installer: { name: 'Worker' } }
                        ]),
                    },
                    liabilityNotices: {
                        findMany: vi.fn().mockResolvedValue([
                            { id: 'ln1', liablePartyId: 'w1', amount: '200', reason: 'Damage' }
                        ]),
                    },
                },
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 's1' }]),
                    }),
                }),
                update: vi.fn().mockReturnValue(createChainedMock([])),
            };

            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            const result = await generateLaborSettlement();
            expect(result).toEqual({ count: 1, deductionCount: 1 });

            // 验证插入明细时的金额计算 (1000 - 200 = 800)
            const insertCalls = mockTx.insert(apLaborStatements).values.mock.calls;
            const settlementValue = insertCalls[0][0];
            expect(settlementValue.totalAmount).toBe('800.00');
        });
    });

    describe('createSupplierLiabilityStatement', () => {
        const mockNoticeId = 'notice-123';

        it('should create liability statement for FACTORY', async () => {
            const mockTx = {
                query: {
                    liabilityNotices: {
                        findFirst: vi.fn().mockResolvedValue({
                            id: mockNoticeId,
                            liablePartyType: 'FACTORY',
                            status: 'CONFIRMED',
                            amount: '500',
                            liablePartyId: 'sup-1',
                        }),
                    },
                    suppliers: {
                        findFirst: vi.fn().mockResolvedValue({ id: 'sup-1', name: 'Supplier A' }),
                    },
                },
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: 'new-stmt-id', statementNo: 'AP-DED-1' }]),
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

            const result = await createSupplierLiabilityStatement(mockNoticeId);

            expect(result).toEqual({ success: true, statementId: 'new-stmt-id' });
            expect(mockTx.insert).toHaveBeenCalled();
            expect(mockTx.update).toHaveBeenCalled();
        });

        it('should reject if not FACTORY', async () => {
            const mockTx = {
                query: {
                    liabilityNotices: {
                        findFirst: vi.fn().mockResolvedValue({
                            id: mockNoticeId,
                            liablePartyType: 'INSTALLER',
                            status: 'CONFIRMED',
                        }),
                    },
                },
            };

            (db.transaction as ReturnType<typeof vi.fn>).mockImplementation(
                async (cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)
            );

            await expect(createSupplierLiabilityStatement(mockNoticeId)).rejects.toThrow('此定责单非供应商(工厂)责任');
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
