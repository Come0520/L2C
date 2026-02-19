
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
}));

// Mock dynamic imports for approval
vi.mock('@/features/approval/actions/submission', () => ({
    submitApproval: vi.fn(),
}));

import { auth, checkPermission } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';

describe('Lead Restore Actions', () => {
    const tenantId = 'test-tenant-id';
    const userId = 'test-user-id';
    const leadId = 'test-lead-id';

    beforeEach(() => {
        vi.clearAllMocks();
        // vi.spyOn(console, 'error').mockImplementation(() => { }); // Suppress error logs - ENABLE FOR DEBUGGING

        // Default auth mock
        (auth as any).mockResolvedValue({
            user: { id: userId, tenantId: tenantId }
        });
    });

    describe('canRestoreLead', () => {
        it('should return false if user is not authenticated', async () => {
            (auth as any).mockResolvedValue(null);
            const result = await canRestoreLead(leadId);
            expect(result.canRestore).toBe(false);
            expect(result.reason).toContain('未登录');
        });

        it('should return false if lead does not exist', async () => {
            (db.query.leads.findFirst as any).mockResolvedValue(null);
            const result = await canRestoreLead(leadId);
            expect(result.canRestore).toBe(false);
            expect(result.reason).toBe('线索不存在');
        });

        it('should return false if lead status is not INVALID', async () => {
            (db.query.leads.findFirst as any).mockResolvedValue({ status: 'WON' });
            const result = await canRestoreLead(leadId);
            expect(result.canRestore).toBe(false);
            expect(result.reason).toContain('仅可恢复');
        });

        it('should return true if lead status is INVALID', async () => {
            (db.query.leads.findFirst as any).mockResolvedValue({ status: 'INVALID' });
            const result = await canRestoreLead(leadId);
            expect(result.canRestore).toBe(true);
        });
    });

    describe('restoreLeadAction', () => {
        const validInput = { id: leadId, reason: 'Test restore' };

        it('should throw/return error if not authenticated', async () => {
            (auth as any).mockResolvedValue(null);
            const result = await restoreLeadAction(validInput);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Unauthorized');
        });

        it('should check permissions', async () => {
            await restoreLeadAction(validInput);
            expect(checkPermission).toHaveBeenCalled();
        });

        it('should fail if lead not found', async () => {
            (db.query.leads.findFirst as any).mockResolvedValue(null);
            const result = await restoreLeadAction(validInput);
            expect(result.success).toBe(false);
            expect(result.error).toBe('线索不存在');
        });

        it('should fail if lead is not INVALID', async () => {
            (db.query.leads.findFirst as any).mockResolvedValue({ status: 'FOLLOWING_UP' });
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
            (db.query.leads.findFirst as any).mockResolvedValue(mockLead);
            (db.query.leadStatusHistory.findFirst as any).mockResolvedValue({ oldStatus: 'FOLLOWING_UP' });

            // Mock transaction to ensure the callback is executed correctly
            (db.transaction as any).mockImplementation(async (cb: any) => {
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
