
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { restoreLeadAction, canRestoreLead } from '../actions/restore';

// Mock Dependencies - Use simple mocks for restore.test.ts to avoid complex db mock issues
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            leads: { findFirst: vi.fn(), findMany: vi.fn() },
            leadStatusHistory: { findFirst: vi.fn() },
            approvalFlows: { findFirst: vi.fn() }
        },
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })) })),
        insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue({}) })),
        transaction: vi.fn((cb) => cb({
            query: {
                leads: { findFirst: vi.fn() },
                approvalFlows: { findFirst: vi.fn() },
                leadStatusHistory: { findFirst: vi.fn() }
            },
            select: vi.fn().mockReturnValue({
                from: vi.fn().mockReturnValue({
                    where: vi.fn().mockReturnValue({
                        for: vi.fn().mockResolvedValue([])
                    })
                })
            }),
            update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })) })),
            insert: vi.fn(() => ({ values: vi.fn().mockResolvedValue({}) })),
            delete: vi.fn(() => ({ where: vi.fn().mockResolvedValue({}) })),
        }))
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

// Mock next/server for NextRequest/NextResponse if used, or just cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

// Mock dynamic imports for approval
vi.mock('@/features/approval/actions/submission', () => ({
    submitApproval: vi.fn(),
}));

import { auth, checkPermission } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';

describe('Lead Restore Actions', () => {
    const tenantId = '11111111-1111-4111-8111-111111111111';
    const userId = '22222222-2222-4222-8222-222222222222';
    const leadId = '33333333-3333-4333-8333-333333333333';

    beforeEach(() => {
        vi.clearAllMocks();
        // vi.spyOn(console, 'error').mockImplementation(() => { }); // Suppress error logs - ENABLE FOR DEBUGGING

        // Default auth mock
        vi.mocked(auth).mockResolvedValue({
            user: { id: userId, tenantId: tenantId }
        } as never);
    });

    describe('canRestoreLead', () => {
        it('should return false if user is not authenticated', async () => {
            vi.mocked(auth).mockResolvedValue(null);
            const result = await canRestoreLead(leadId);
            expect(result.canRestore).toBe(false);
            expect(result.reason).toContain('未登录');
        });

        it('should return false if lead does not exist', async () => {
            vi.mocked(db.query.leads.findFirst).mockResolvedValue(undefined as never);
            const result = await canRestoreLead(leadId);
            expect(result.canRestore).toBe(false);
            expect(result.reason).toBe('线索不存在');
        });

        it('should return false if lead status is not INVALID', async () => {
            vi.mocked(db.query.leads.findFirst).mockResolvedValue({ status: 'WON' } as never);
            const result = await canRestoreLead(leadId);
            expect(result.canRestore).toBe(false);
            expect(result.reason).toContain('仅可恢复');
        });

        it('should return true if lead status is INVALID', async () => {
            vi.mocked(db.query.leads.findFirst).mockResolvedValue({ status: 'INVALID' } as never);
            const result = await canRestoreLead(leadId);
            expect(result.canRestore).toBe(true);
        });
    });

    describe('restoreLeadAction', () => {
        const validInput = { id: leadId, reason: 'Test restore' };

        it('should throw/return error if not authenticated', async () => {
            vi.mocked(auth).mockResolvedValue(null);
            const result = await restoreLeadAction(validInput);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Unauthorized');
        });

        it('should check permissions', async () => {
            await restoreLeadAction(validInput);
            expect(checkPermission).toHaveBeenCalled();
        });

        it('should fail if lead not found', async () => {
            vi.mocked(db.query.leads.findFirst).mockResolvedValue(undefined as never);
            const result = await restoreLeadAction(validInput);
            expect(result.success).toBe(false);
            expect(result.error).toBe('线索不存在');
        });

        it('should fail if lead is not INVALID', async () => {
            vi.mocked(db.query.leads.findFirst).mockResolvedValue({ status: 'FOLLOWING_UP' } as never);
            const result = await restoreLeadAction(validInput);
            expect(result.success).toBe(false);
            expect(result.error).toContain('仅可恢复');
        });

        it('should restore lead successfully', async () => {
            // Setup
            const mockLead = {
                id: leadId,
                status: 'INVALID',
                statusHistory: [{ oldStatus: 'FOLLOWING_UP', newStatus: 'INVALID', createdAt: new Date() }]
            };
            vi.mocked(db.query.leads.findFirst).mockResolvedValue(mockLead as never);
            vi.mocked(db.query.leadStatusHistory.findFirst).mockResolvedValue({ oldStatus: 'FOLLOWING_UP' } as never);

            // Mock transaction to ensure the callback is executed correctly
            vi.mocked(db.transaction).mockImplementation(async (cb: (tx: any) => Promise<any>) => {
                // 使用完整的事务 Mock（包含 select 链以支持行锁）
                return await cb({
                    query: {
                        leads: { findFirst: vi.fn().mockResolvedValue(mockLead) },
                        approvalFlows: { findFirst: vi.fn().mockResolvedValue(null) },
                        leadStatusHistory: { findFirst: vi.fn().mockResolvedValue({ oldStatus: 'FOLLOWING_UP' }) }
                    },
                    select: vi.fn().mockReturnValue({
                        from: vi.fn().mockReturnValue({
                            where: vi.fn().mockReturnValue({
                                for: vi.fn().mockResolvedValue([mockLead])
                            })
                        })
                    }),
                    update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn() }) }),
                    insert: vi.fn().mockReturnValue({ values: vi.fn().mockResolvedValue({}) }),
                    delete: vi.fn()
                });
            });

            const result = await restoreLeadAction(validInput);

            expect(result.success).toBe(true);
            expect(result.targetStatus).toBe('FOLLOWING_UP');
        });
    });
});
