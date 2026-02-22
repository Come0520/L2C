import { vi, describe, it, expect, beforeEach } from 'vitest';
import { generateAggregatedStatement, batchWriteOff, crossPeriodReconciliation, getReconciliations, getReconciliation, generatePeriodStatements } from '../actions/reconciliation';
import { db } from '@/shared/api/db';
import { auth, checkPermission } from '@/shared/lib/auth';
import { Decimal } from 'decimal.js';

// Mock dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            arStatements: { findMany: vi.fn() },
            receiptBills: { findFirst: vi.fn() },
            reconciliations: { findMany: vi.fn(), findFirst: vi.fn() },
        },
        transaction: vi.fn(),
        update: vi.fn(),
        insert: vi.fn(),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn().mockResolvedValue({}),
    },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    unstable_cache: vi.fn().mockImplementation((fn: any) => fn),
}));

describe('Reconciliation Actions', () => {
    const mockTenantId = 'f47ac10b-58cc-4372-a567-0e02b2c3d401';
    const mockUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d402';
    const mockSession = { user: { tenantId: mockTenantId, id: mockUserId } };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession);
        vi.mocked(checkPermission).mockResolvedValue(true);
    });

    describe('Queries (getReconciliations, getReconciliation)', () => {
        it('should get reconciliations list', async () => {
            const mockData = [{ id: 'recon-1', totalAmount: '100' }];
            vi.mocked(db.query.reconciliations.findMany).mockResolvedValue(mockData);

            const result = await getReconciliations();
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('recon-1');
        });

        it('should get single reconciliation by id', async () => {
            const mockData = { id: 'recon-2', totalAmount: '200' };
            vi.mocked(db.query.reconciliations.findFirst).mockResolvedValue(mockData);

            const result = await getReconciliation('recon-2');
            expect(result).not.toBeNull();
            expect(result?.id).toBe('recon-2');
        });

        it('should throw error if permission denied in queries', async () => {
            vi.mocked(checkPermission).mockResolvedValue(false);
            await expect(getReconciliations()).rejects.toThrow('权限不足');
            await expect(getReconciliation('recon-1')).rejects.toThrow('权限不足');
        });
    });

    describe('generateAggregatedStatement', () => {
        it('should generate summary correctly', async () => {
            const mockStatements = [
                {
                    customerId: 'f47ac10b-58cc-4372-a567-0e02b2c3d403',
                    customerName: 'C1',
                    totalAmount: '100',
                    receivedAmount: '20',
                    pendingAmount: '80',
                    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d404'
                },
            ];
            vi.mocked(db.query.arStatements.findMany).mockResolvedValue(mockStatements);

            const result = await generateAggregatedStatement({
                startDate: '2023-01-01',
                endDate: '2023-01-31'
            });

            // Handle createSafeAction wrapper structure { data, error, validationError }
            const data = result.data || result;
            expect(data.success).toBe(true);
            expect(new Decimal(data.summary.totalAmount).toFixed(2)).toBe('100.00');
        });

        it('should return error if no statements found', async () => {
            vi.mocked(db.query.arStatements.findMany).mockResolvedValue([]);

            const result = await generateAggregatedStatement({
                startDate: '2023-01-01',
                endDate: '2023-01-31'
            });

            const data = result.data || result;
            expect(data.error).toBe('没有找到符合条件的账单');
        });
    });

    describe('generatePeriodStatements', () => {
        it('should generate period statements for WEEKLY', async () => {
            const mockStatements = [
                { id: 'st-1', statementNo: 'AR-001', pendingAmount: '100' }
            ];
            vi.mocked(db.query.arStatements.findMany).mockResolvedValue(mockStatements);

            const result = await generatePeriodStatements({
                period: 'WEEKLY',
                baseDate: '2023-10-10'
            });

            const data = result.data || result;
            expect(data.success).toBe(true);
            expect(data.period).toBe('周');
            expect(data.pendingCount).toBe(1);
            expect(data.totalPendingAmount).toBe('100.00');
        });
    });

    describe('batchWriteOff', () => {
        const mockReceiptId = 'f47ac10b-58cc-4372-a567-0e02b2c3d405';
        const mockStatementIds = ['f47ac10b-58cc-4372-a567-0e02b2c3d406'];

        it('should write off statements when receipt has balance', async () => {
            const mockReceipt = {
                id: mockReceiptId,
                totalAmount: '1000',
                usedAmount: '500',
                status: 'VERIFIED'
            };
            const mockStatements = [{
                id: mockStatementIds[0],
                totalAmount: '100',
                pendingAmount: '100',
                receivedAmount: '0',
                status: 'PENDING',
                statementNo: 'ST001'
            }];

            const mockTx = {
                query: {
                    receiptBills: { findFirst: vi.fn().mockResolvedValue(mockReceipt) },
                    arStatements: { findMany: vi.fn().mockResolvedValue(mockStatements) }
                },
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockReturnValue({
                            returning: vi.fn().mockResolvedValue([{}])
                        })
                    })
                }),
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{}])
                    })
                })
            };
            vi.mocked(db.transaction).mockImplementation(async (cb: (tx: never) => unknown) => cb(mockTx as never));

            const result = await batchWriteOff({
                receiptId: mockReceiptId,
                statementIds: mockStatementIds
            });

            const data = result.data || result;
            if (result.validationError) {
                console.error('Validation Error:', JSON.stringify(result.validationError, null, 2));
            }
            expect(data.success).toBe(true);
        });

        it('should return error if receipt bill not found', async () => {
            const mockTx = {
                query: {
                    receiptBills: { findFirst: vi.fn().mockResolvedValue(null) },
                }
            };
            vi.mocked(db.transaction).mockImplementation(async (cb: (tx: never) => unknown) => cb(mockTx as never));

            const result = await batchWriteOff({
                receiptId: mockReceiptId,
                statementIds: mockStatementIds
            });

            const data = result.data || result;
            expect(data.error).toBe('收款单不存在');
        });

        it('should return error if available balance is zero', async () => {
            const mockReceipt = {
                id: mockReceiptId,
                totalAmount: '1000',
                usedAmount: '1000',
                status: 'VERIFIED'
            };
            const mockStatements = [{ id: mockStatementIds[0] }];
            const mockTx = {
                query: {
                    receiptBills: { findFirst: vi.fn().mockResolvedValue(mockReceipt) },
                    arStatements: { findMany: vi.fn().mockResolvedValue(mockStatements) }
                }
            };
            vi.mocked(db.transaction).mockImplementation(async (cb: (tx: never) => unknown) => cb(mockTx as never));

            const result = await batchWriteOff({
                receiptId: mockReceiptId,
                statementIds: mockStatementIds
            });

            const data = result.data || result;
            expect(data.error).toBe('收款单可用余额不足');
        });

        it('should fail if receipt status is not auditable', async () => {
            const mockReceipt = {
                id: mockReceiptId,
                totalAmount: '1000',
                usedAmount: '0',
                status: 'PENDING', // 不可核销状态
                receiptNo: 'RC001'
            };
            const mockTx = {
                query: {
                    receiptBills: { findFirst: vi.fn().mockResolvedValue(mockReceipt) },
                }
            };
            vi.mocked(db.transaction).mockImplementation(async (cb: (tx: never) => unknown) => cb(mockTx as never));

            const result = await batchWriteOff({
                receiptId: mockReceiptId,
                statementIds: mockStatementIds
            });

            const data = result.data || result;
            expect(data.error).toContain('收款单当前状态为 PENDING，不可核销');
        });

        it('should fail if some statements are already paid', async () => {
            const mockReceipt = {
                id: mockReceiptId,
                totalAmount: '1000',
                usedAmount: '0',
                status: 'VERIFIED'
            };
            const mockStatements = [{
                id: mockStatementIds[0],
                status: 'PAID', // 已结清
                statementNo: 'ST-ALREADY-PAID'
            }];
            const mockTx = {
                query: {
                    receiptBills: { findFirst: vi.fn().mockResolvedValue(mockReceipt) },
                    arStatements: { findMany: vi.fn().mockResolvedValue(mockStatements) }
                }
            };
            vi.mocked(db.transaction).mockImplementation(async (cb: (tx: never) => unknown) => cb(mockTx as never));

            const result = await batchWriteOff({
                receiptId: mockReceiptId,
                statementIds: mockStatementIds
            });

            const data = result.data || result;
            expect(data.error).toContain('部分账单已结清或不可核销');
        });

        it('should fail if aggregate allocated amount exceeds available amount', async () => {
            const mockReceipt = {
                id: mockReceiptId,
                totalAmount: '1000',
                usedAmount: '900', // 可用 100
                status: 'VERIFIED'
            };
            const mockStatements = [{
                id: mockStatementIds[0],
                statementNo: 'ST001',
                pendingAmount: '200'
            }];
            const mockTx = {
                query: {
                    receiptBills: { findFirst: vi.fn().mockResolvedValue(mockReceipt) },
                    arStatements: { findMany: vi.fn().mockResolvedValue(mockStatements) }
                }
            };
            vi.mocked(db.transaction).mockImplementation(async (cb: (tx: never) => unknown) => cb(mockTx as never));

            const result = await batchWriteOff({
                receiptId: mockReceiptId,
                statementIds: mockStatementIds,
                allocations: [{ statementId: mockStatementIds[0], amount: 150 }] // 150 > 100
            });

            const data = result.data || result;
            expect(data.error).toContain('超出可用金额');
        });
    });

    describe('crossPeriodReconciliation', () => {
        it('should return pending statements', async () => {
            const mockStatements = [
                {
                    id: 'f47ac10b-58cc-4372-a567-0e02b2c3d407',
                    customerId: 'f47ac10b-58cc-4372-a567-0e02b2c3d408',
                    customerName: 'C1',
                    pendingAmount: '50'
                }
            ];
            vi.mocked(db.query.arStatements.findMany).mockResolvedValue(mockStatements);

            const result = await crossPeriodReconciliation({
                originalStartDate: '2023-01-01',
                originalEndDate: '2023-01-31',
                newEndDate: '2023-02-28'
            });

            const data = result.data || result;
            expect(data.success).toBe(true);
            expect(data.movedCount).toBe(1);
        });
    });

    describe('权限校验', () => {
        it('未登录时应拒绝 generateAggregatedStatement', async () => {
            vi.mocked(auth).mockResolvedValue(null);

            // 函数直接 throw Error，需用 rejects.toThrow 断言
            await expect(
                generateAggregatedStatement({
                    startDate: '2023-01-01',
                    endDate: '2023-01-31'
                })
            ).rejects.toThrow('未授权');
        });

        it('权限不足时应拒绝 batchWriteOff', async () => {
            vi.mocked(checkPermission).mockResolvedValue(false);

            await expect(
                batchWriteOff({
                    receiptId: 'f47ac10b-58cc-4372-a567-0e02b2c3d405',
                    statementIds: ['f47ac10b-58cc-4372-a567-0e02b2c3d406']
                })
            ).rejects.toThrow('权限不足');
        });

        it('权限不足时应拒绝 crossPeriodReconciliation', async () => {
            vi.mocked(checkPermission).mockResolvedValue(false);

            await expect(
                crossPeriodReconciliation({
                    originalStartDate: '2023-01-01',
                    originalEndDate: '2023-01-31',
                    newEndDate: '2023-02-28'
                })
            ).rejects.toThrow('权限不足');
        });
    });
});
