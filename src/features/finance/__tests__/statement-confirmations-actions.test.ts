import { vi, describe, it, expect, beforeEach } from 'vitest';
import { generateStatementConfirmation, confirmStatement, getStatementConfirmations } from '../actions/statement-confirmations';
import { db } from '@/shared/api/db';
import { auth, checkPermission } from '@/shared/lib/auth';

// Mock dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            arStatements: { findMany: vi.fn() },
            apSupplierStatements: { findMany: vi.fn() },
            statementConfirmations: { findMany: vi.fn(), findFirst: vi.fn() },
            statementConfirmationDetails: { findMany: vi.fn(), findFirst: vi.fn() },
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

// Mock PERMISSIONS
vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        FINANCE: { VIEW: 'finance:view', MANAGE: 'finance:manage', RECONCILE: 'finance:reconcile' },
    },
}));

describe('Statement Confirmation Actions', () => {
    // Valid standard V4 UUIDs
    const mockTenantId = 'f47ac10b-58cc-4372-a567-0e02b2c3d401';
    const mockUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d402';
    const mockTargetId = 'f47ac10b-58cc-4372-a567-0e02b2c3d403';
    const mockConfId = 'f47ac10b-58cc-4372-a567-0e02b2c3d404';
    const mockSession = { user: { tenantId: mockTenantId, id: mockUserId } };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue(mockSession);
        (checkPermission as any).mockResolvedValue(true);
    });

    describe('generateStatementConfirmation', () => {
        it('should generate confirmation successfully', async () => {
            const mockStatements = [
                { id: 'stmt-1', statementNo: 'AR-001', createdAt: new Date(), totalAmount: '1000' }
            ];
            (db.query.arStatements.findMany as any).mockResolvedValue(mockStatements);

            const mockTx = {
                query: {
                    arStatements: { findMany: vi.fn().mockResolvedValue(mockStatements) }
                },
                insert: vi.fn().mockReturnValue({
                    values: vi.fn().mockReturnValue({
                        returning: vi.fn().mockResolvedValue([{ id: mockConfId, confirmationNo: 'CC-001' }])
                    })
                }),
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue({})
                    })
                })
            };
            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            const result = await generateStatementConfirmation({
                type: 'CUSTOMER',
                targetId: mockTargetId,
                targetName: 'Test Customer',
                periodStart: '2023-01-01',
                periodEnd: '2023-01-31'
            });

            expect(result.success).toBe(true);
            expect(result.data?.confirmationId).toBe(mockConfId);
        });
    });

    describe('confirmStatement', () => {
        it('should confirm statement successfully', async () => {
            const mockConf = {
                id: mockConfId,
                status: 'PENDING',
                tenantId: mockTenantId,
                totalAmount: '1000.00'
            };
            (db.query.statementConfirmations.findFirst as any).mockResolvedValue(mockConf);

            const mockTx = {
                query: {
                    statementConfirmations: { findFirst: vi.fn().mockResolvedValue(mockConf) },
                    statementConfirmationDetails: { findFirst: vi.fn() }
                },
                update: vi.fn().mockReturnValue({
                    set: vi.fn().mockReturnValue({
                        where: vi.fn().mockResolvedValue({})
                    })
                })
            };
            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            const result = await confirmStatement(mockConfId, mockUserId);

            expect(result.success).toBe(true);
        });
    });

    describe('getStatementConfirmations', () => {
        it('should get confirmations list successfully', async () => {
            const mockConfirmations = [
                { id: mockConfId, confirmationNo: 'CC-001', tenantId: mockTenantId }
            ];
            (db.query.statementConfirmations.findMany as any).mockResolvedValue(mockConfirmations);

            const result = await getStatementConfirmations(1, 10);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockConfirmations);
            expect(db.query.statementConfirmations.findMany).toHaveBeenCalled();
        });

        it('should return error when session is invalid', async () => {
            (auth as any).mockResolvedValue(null);

            const result = await getStatementConfirmations();

            expect(result.success).toBe(false);
            expect(result.error).toBe('未授权');
        });
    });
});
