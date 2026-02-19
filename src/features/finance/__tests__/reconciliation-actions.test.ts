import { vi, describe, it, expect, beforeEach } from 'vitest';
import { generateAggregatedStatement, batchWriteOff, crossPeriodReconciliation } from '../actions/reconciliation';
import { db } from '@/shared/api/db';
import { auth, checkPermission } from '@/shared/lib/auth';
import { Decimal } from 'decimal.js';

// Mock dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            arStatements: { findMany: vi.fn() },
            receiptBills: { findFirst: vi.fn() },
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
}));

describe('Reconciliation Actions', () => {
    const mockTenantId = 'f47ac10b-58cc-4372-a567-0e02b2c3d401';
    const mockUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d402';
    const mockSession = { user: { tenantId: mockTenantId, id: mockUserId } };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue(mockSession);
        (checkPermission as any).mockResolvedValue(true);
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
            (db.query.arStatements.findMany as any).mockResolvedValue(mockStatements);

            const result: any = await generateAggregatedStatement({
                startDate: '2023-01-01',
                endDate: '2023-01-31'
            });

            // Handle createSafeAction wrapper structure { data, error, validationError }
            const data = result.data || result;
            expect(data.success).toBe(true);
            expect(new Decimal(data.summary.totalAmount).toFixed(2)).toBe('100.00');
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
            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            const result: any = await batchWriteOff({
                receiptId: mockReceiptId,
                statementIds: mockStatementIds
            });

            const data = result.data || result;
            if (result.validationError) {
                console.error('Validation Error:', JSON.stringify(result.validationError, null, 2));
            }
            expect(data.success).toBe(true);
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
            (db.query.arStatements.findMany as any).mockResolvedValue(mockStatements);

            const result: any = await crossPeriodReconciliation({
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
            (auth as any).mockResolvedValue(null);

            // 函数直接 throw Error，需用 rejects.toThrow 断言
            await expect(
                generateAggregatedStatement({
                    startDate: '2023-01-01',
                    endDate: '2023-01-31'
                })
            ).rejects.toThrow('未授权');
        });

        it('权限不足时应拒绝 batchWriteOff', async () => {
            (checkPermission as any).mockResolvedValue(false);

            await expect(
                batchWriteOff({
                    receiptId: 'f47ac10b-58cc-4372-a567-0e02b2c3d405',
                    statementIds: ['f47ac10b-58cc-4372-a567-0e02b2c3d406']
                })
            ).rejects.toThrow('权限不足');
        });

        it('权限不足时应拒绝 crossPeriodReconciliation', async () => {
            (checkPermission as any).mockResolvedValue(false);

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
