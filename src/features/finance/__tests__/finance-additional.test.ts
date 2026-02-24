import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createCreditNote, approveCreditNote } from '../actions/credit-notes';
import { createDebitNote, approveDebitNote } from '../actions/debit-notes';
import { db } from '@/shared/api/db';
import { auth, checkPermission } from '@/shared/lib/auth';

// Mock dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            creditNotes: { findFirst: vi.fn(), findMany: vi.fn() },
            debitNotes: { findFirst: vi.fn(), findMany: vi.fn() },
            arStatements: { findFirst: vi.fn() },
            apStatements: { findFirst: vi.fn() },
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

vi.mock('@/shared/lib/generate-no', () => ({
    generateBusinessNo: vi.fn().mockReturnValue('MOCK-NO-123'),
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

describe('Finance Note Actions - Credit & Debit', () => {
    const mockTenantId = 'f47ac10b-58cc-4372-a567-0e02b2c3d401';
    const mockUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d402';
    const mockSession = { user: { tenantId: mockTenantId, id: mockUserId } };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession);
        vi.mocked(checkPermission).mockResolvedValue(true);
        vi.mocked(db.update).mockReturnValue({
            set: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(true)
            })
        } as never);
    });

    describe('Credit Notes', () => {
        it('createCreditNote should successfully create a pending credit note', async () => {
            vi.mocked(db.insert).mockReturnValueOnce({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 'mock-credit-note-id' }])
                })
            });



            const result = await createCreditNote({
                customerId: 'f47ac10b-58cc-4372-a567-0e02b2c3d403',
                customerName: 'Test Customer',
                type: 'REFUND',
                amount: 100,
                reason: 'Test Reason'
            });

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe('mock-credit-note-id');
            expect(db.insert).toHaveBeenCalled();
        });

        it('approveCreditNote should approve and update related statement/balance', async () => {
            const mockCreditNote = {
                id: 'mock-credit-note-id',
                status: 'PENDING',
                amount: '100',
                arStatementId: 'mock-statement-id',
                createdBy: 'other-user'
            };

            const mockTx = {
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue(true)
                    })
                }),
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockResolvedValue(true)
                })
            };
            vi.mocked(db.query.creditNotes.findFirst).mockResolvedValue(mockCreditNote as never);
            vi.mocked(db.transaction).mockImplementation(async (cb: (tx: never) => unknown) => cb(mockTx as never));

            const result = await approveCreditNote('mock-credit-note-id', true);
            const data = result.data || result;
            expect(data.success).toBe(true);
            expect(mockTx.update).toHaveBeenCalledTimes(2); // one for creditNote, one for arStatement
        });
    });

    describe('Debit Notes', () => {
        it('createDebitNote should successfully create a pending debit note', async () => {
            vi.mocked(db.insert).mockReturnValueOnce({
                values: vi.fn().mockReturnValue({
                    returning: vi.fn().mockResolvedValue([{ id: 'mock-debit-note-id' }])
                })
            });

            const result = await createDebitNote({
                supplierId: 'f47ac10b-58cc-4372-a567-0e02b2c3d404',
                supplierName: 'Test Supplier',
                type: 'QUALITY_DEDUCTION',
                amount: 200,
                reason: 'Test Deduction'
            });

            expect(result.success).toBe(true);
            expect(result.data?.id).toBe('mock-debit-note-id');
            expect(db.insert).toHaveBeenCalled();
        });

        it('approveDebitNote should approve and update related statement', async () => {
            const mockDebitNote = {
                id: 'mock-debit-note-id',
                status: 'PENDING',
                amount: '200',
                apStatementId: 'mock-ap-statement-id',
                createdBy: 'other-user'
            };

            const mockTx = {
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue(true)
                    })
                }),
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockResolvedValue(true)
                })
            };
            vi.mocked(db.query.debitNotes.findFirst).mockResolvedValue(mockDebitNote as never);
            vi.mocked(db.transaction).mockImplementation(async (cb: (tx: never) => unknown) => cb(mockTx as never));

            const result = await approveDebitNote('mock-debit-note-id', true);
            const data = result.data || result;
            expect(data.success).toBe(true);
            expect(mockTx.update).toHaveBeenCalledTimes(2); // one for debitNote, one for apStatement
        });
    });
});
