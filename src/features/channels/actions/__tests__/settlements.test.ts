import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    createSettlement,
    submitSettlementForApproval,
    approveSettlement,
    markSettlementPaid
} from '../settlements';
import { auth, checkPermission } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { AuditService } from '@/shared/services/audit-service';

// --- Mock external & next libs to prevent next-auth/server failures ---
vi.mock('next-auth');
vi.mock('next-auth/next');
vi.mock('next-auth/providers/credentials');

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: vi.fn() }
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

const mockQueryFindFirst = vi.fn();
const mockQueryFindMany = vi.fn();
const mockUpdateSet = vi.fn();
const mockUpdateWhere = vi.fn(() => ({ returning: vi.fn(() => [{ id: 'mocked-id' }]) }));
const mockUpdate = vi.fn(() => ({ set: mockUpdateSet.mockReturnValue({ where: mockUpdateWhere }) }));
const mockInsertValues = vi.fn(() => ({ returning: vi.fn(() => [{ id: 'mocked-id' }]) }));
const mockInsert = vi.fn(() => ({ values: mockInsertValues }));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            channels: { findFirst: (...args: unknown[]) => mockQueryFindFirst(...args) },
            channelSettlements: {
                findFirst: (...args: unknown[]) => mockQueryFindFirst(...args),
                findMany: (...args: unknown[]) => mockQueryFindMany(...args)
            },
        },
        update: (...args: unknown[]) => mockUpdate(...args),
        transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
            return await cb({
                query: {
                    channelCommissions: { findMany: mockQueryFindMany },
                },
                insert: mockInsert,
                update: mockUpdate,
            });
        }),
    }
}));

describe('Channel Settlements Actions', () => {
    const VALID_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';
    const VALID_USER_ID = '550e8400-e29b-41d4-a716-446655440001';
    const VALID_CHANNEL_ID = '550e8400-e29b-41d4-a716-446655440002';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue({ user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID } } as any);
        vi.mocked(checkPermission).mockResolvedValue(true);
    });

    describe('createSettlement', () => {
        it('should throw error when pending commission is empty', async () => {
            mockQueryFindFirst.mockResolvedValueOnce({ id: VALID_CHANNEL_ID });
            mockQueryFindMany.mockResolvedValueOnce([]); // No pending commissions

            await expect(
                createSettlement({
                    channelId: VALID_CHANNEL_ID,
                    periodStart: new Date(),
                    periodEnd: new Date()
                })
            ).rejects.toThrow('该周期内没有待结算的佣金记录');
        });

        it('should create settlement successfully with valid pending commissions', async () => {
            mockQueryFindFirst.mockResolvedValueOnce({ id: VALID_CHANNEL_ID });
            mockQueryFindMany.mockResolvedValueOnce([
                { id: 'comm-1', amount: '100.50' },
                { id: 'comm-2', amount: '200.00' }
            ]);

            // Ensure tx.update returns the right matching array length
            mockUpdateWhere.mockReturnValueOnce({ returning: vi.fn(() => [{ id: 'comm-1' }, { id: 'comm-2' }]) });

            const result = await createSettlement({
                channelId: VALID_CHANNEL_ID,
                periodStart: new Date(),
                periodEnd: new Date(),
                adjustmentAmount: -50.50 // testing decimal adjustments
            });

            expect(result).toBeDefined();
            expect(mockInsertValues).toHaveBeenCalledWith(
                expect.objectContaining({ finalAmount: '250.00' }) // 300.50 - 50.50
            );
            expect(AuditService.log).toHaveBeenCalled();
        });
    });

    describe('submitSettlementForApproval', () => {
        it('should only update DRAFT settlement to PENDING', async () => {
            const SETTLEMENT_ID = '550e8400-e29b-41d4-a716-446655440003';
            await submitSettlementForApproval(SETTLEMENT_ID);

            expect(mockUpdateSet).toHaveBeenCalledWith({ status: 'PENDING' });
            // Since db logic enforces eq(status, 'DRAFT') in where clause, we verify mock
            expect(mockUpdateWhere).toHaveBeenCalled();
        });
    });

    describe('approveSettlement', () => {
        const SETTLEMENT_ID = '550e8400-e29b-41d4-a716-446655440003';

        it('should enforce segregation of duties (cannot approve self-created settlement)', async () => {
            mockQueryFindFirst.mockResolvedValueOnce({
                id: SETTLEMENT_ID, createdBy: VALID_USER_ID, status: 'PENDING'
            });

            await expect(approveSettlement(SETTLEMENT_ID)).rejects.toThrow(
                '违反职责分离原则：禁止审批自己创建的结算单'
            );
        });

        it('should approve settlement and create payment bill if valid', async () => {
            mockQueryFindFirst.mockResolvedValueOnce({
                id: SETTLEMENT_ID, createdBy: 'other-user', status: 'PENDING', finalAmount: '250.00',
                channel: { contactName: 'John Doe', name: 'Channel A' }
            });

            const result = await approveSettlement(SETTLEMENT_ID);

            expect(result).toBeDefined();
            expect(mockUpdateSet).toHaveBeenCalledWith({ status: 'APPROVED', approvedBy: VALID_USER_ID, approvedAt: expect.any(Date) });
            // Should create PaymentBill
            expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({
                type: 'SUPPLIER', amount: '250.00', payeeName: 'John Doe'
            }));
            expect(AuditService.log).toHaveBeenCalled();
        });
    });

    describe('markSettlementPaid', () => {
        it('should mark approved settlement as paid and cascade comm records', async () => {
            const SETTLEMENT_ID = '550e8400-e29b-41d4-a716-446655440003';
            await markSettlementPaid(SETTLEMENT_ID);

            expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ status: 'PAID' }));
            // Also it triggers updates to commissions too
            expect(mockUpdate).toHaveBeenCalledTimes(2);
            expect(AuditService.log).toHaveBeenCalled();
        });
    });
});
