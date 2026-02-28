import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createInternalTransfer, cancelInternalTransfer, getInternalTransfers, getInternalTransfer } from '../actions/transfers';
import { db } from '@/shared/api/db';
import { auth, checkPermission } from '@/shared/lib/auth';
import { financeAccounts, internalTransfers } from '@/shared/api/schema';
import { Decimal } from 'decimal.js';

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
        query: {
            financeAccounts: { findFirst: vi.fn() },
            internalTransfers: { findMany: vi.fn(), findFirst: vi.fn() },
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

vi.mock('@/shared/lib/generate-no', () => ({
    generateBusinessNo: vi.fn().mockReturnValue('MOCK-NO-123'),
}));

// Mock PERMISSIONS
vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        FINANCE: { VIEW: 'finance:view', MANAGE: 'finance:manage' },
    },
}));

describe('Transfer Actions', () => {
    // Valid standard V4 UUIDs
    const mockTenantId = 'f47ac10b-58cc-4372-a567-0e02b2c3d401';
    const mockUserId = 'f47ac10b-58cc-4372-a567-0e02b2c3d402';
    const mockAcc1 = 'f47ac10b-58cc-4372-a567-0e02b2c3d403';
    const mockAcc2 = 'f47ac10b-58cc-4372-a567-0e02b2c3d404';
    const mockSession = { user: { tenantId: mockTenantId, id: mockUserId } };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue(mockSession);
        (checkPermission as any).mockResolvedValue(true);
    });

    describe('getInternalTransfers', () => {
        it('should return transfers successfully', async () => {
            const mockTransfers = [
                { id: 'trf-1', transferNo: 'TRF-001', amount: '1000' }
            ];
            (db.query.internalTransfers.findMany as any).mockResolvedValue(mockTransfers);

            const result = await getInternalTransfers();

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
        });

        it('should fail if unauthorized', async () => {
            (auth as any).mockResolvedValue(null);
            const result = await getInternalTransfers();
            expect(result.success).toBe(false);
            expect(result.error).toBe('未授权');
        });
    });

    describe('createInternalTransfer', () => {
        const validParams = {
            fromAccountId: mockAcc1,
            toAccountId: mockAcc2,
            amount: 500,
            remark: 'test transfer'
        };

        it('should create transfer successfully', async () => {
            const mockFromAccount = { id: mockAcc1, balance: '1000', isActive: true, accountName: 'From' };
            const mockToAccount = { id: mockAcc2, balance: '100', isActive: true, accountName: 'To' };

            const mockTx = {
                query: {
                    financeAccounts: {
                        findFirst: vi.fn()
                            .mockResolvedValueOnce(mockFromAccount)
                            .mockResolvedValueOnce(mockToAccount)
                    }
                },
                insert: vi.fn().mockReturnValue(createChainedMock([{ id: 'trf-new', transferNo: 'TRF-NEW' }])),
                update: vi.fn().mockReturnValue(createChainedMock([{ id: 'any-id' }])),
            };

            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            const result = await createInternalTransfer(validParams);

            expect(result.success).toBe(true);
            expect(result.data?.transferId).toBe('trf-new');
        });

        it('should fail if balance insufficient', async () => {
            const mockFromAccount = { id: mockAcc1, balance: '100', isActive: true };

            const mockTx = {
                query: {
                    financeAccounts: {
                        findFirst: vi.fn().mockResolvedValueOnce(mockFromAccount)
                    }
                }
            };
            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            const result = await createInternalTransfer(validParams);

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/余额不足/);
        });

        it('should fail if from and to account are same', async () => {
            const result = await createInternalTransfer({
                ...validParams,
                toAccountId: mockAcc1
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('源账户和目标账户不能相同');
        });
    });

    describe('cancelInternalTransfer', () => {
        it('should cancel transfer successfully', async () => {
            const mockTransfer = {
                id: 'trf-1',
                transferNo: 'TRF-001',
                amount: '500.00',
                status: 'COMPLETED',
                fromAccountId: mockAcc1,
                toAccountId: mockAcc2
            };
            const mockFromAccount = { id: mockAcc1, balance: '500', accountName: 'From' };
            const mockToAccount = { id: mockAcc2, balance: '1000', accountName: 'To' };

            const mockTx = {
                query: {
                    internalTransfers: { findFirst: vi.fn().mockResolvedValue(mockTransfer) },
                    financeAccounts: {
                        findFirst: vi.fn()
                            .mockResolvedValueOnce(mockFromAccount)
                            .mockResolvedValueOnce(mockToAccount)
                    }
                },
                update: vi.fn()
                    .mockReturnValueOnce(createChainedMock([mockTransfer])) // Mock status update to CANCELLING
                    .mockReturnValue(createChainedMock([{ id: 'any-id' }])),
                insert: vi.fn().mockReturnValue(createChainedMock()),
            };

            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            const result = await cancelInternalTransfer('trf-1', 'test cancel');

            expect(result.success).toBe(true);
            expect(result.message).toBe('调拨单已冲销');
        });

        it('should fail if destination account balance insufficient for reversal', async () => {
            const mockTransfer = {
                id: 'trf-1',
                transferNo: 'TRF-001',
                amount: '500.00',
                status: 'COMPLETED',
                fromAccountId: mockAcc1,
                toAccountId: mockAcc2
            };
            const mockToAccount = { id: mockAcc2, balance: '100', accountName: 'To' }; // Balance < 500

            const mockTx = {
                query: {
                    internalTransfers: { findFirst: vi.fn().mockResolvedValue(mockTransfer) },
                    financeAccounts: {
                        findFirst: vi.fn()
                            .mockResolvedValueOnce({ id: mockAcc1, balance: '500' })
                            .mockResolvedValueOnce(mockToAccount)
                    }
                },
                update: vi.fn().mockReturnValue(createChainedMock([mockTransfer])),
            };
            (db.transaction as any).mockImplementation(async (cb: any) => cb(mockTx));

            const result = await cancelInternalTransfer('trf-1');

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/目标账户余额不足/);
        });
    });

    describe('getInternalTransfer', () => {
        it('should return detail successfully', async () => {
            const mockTransfer = { id: 'trf-1', transferNo: 'TRF-001' };
            (db.query.internalTransfers.findFirst as any).mockResolvedValue(mockTransfer);

            const result = await getInternalTransfer('trf-1');

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockTransfer);
        });
    });
});
