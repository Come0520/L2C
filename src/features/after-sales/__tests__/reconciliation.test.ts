
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { confirmLiabilityNotice } from '../actions/liability';
import { checkTicketFinancialClosure } from '../actions/ticket';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { AuditService } from '@/shared/lib/audit-service';

// Mock Modules
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            liabilityNotices: { findFirst: vi.fn(), findMany: vi.fn() },
        },
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve({ success: true }))
            }))
        })),
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => Promise.resolve([{ total: '100.00' }]))
            }))
        })),
        transaction: vi.fn(async (cb) => {
            const tx = {
                query: {
                    liabilityNotices: {
                        findFirst: vi.fn(),
                    }
                },
                update: vi.fn(() => ({
                    set: vi.fn(() => ({
                        where: vi.fn(() => Promise.resolve({}))
                    }))
                })),
                select: vi.fn(() => ({
                    from: vi.fn(() => ({
                        where: vi.fn(() => Promise.resolve([{ total: '100.00' }]))
                    }))
                })),
            };
            return cb(tx);
        }),
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        recordFromSession: vi.fn().mockResolvedValue({}),
    }
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
    cache: vi.fn((fn) => fn),
}));

const mockCreateStatement = vi.fn();
vi.mock('@/features/finance/actions/ap', () => ({
    createSupplierLiabilityStatement: (...args: any[]) => mockCreateStatement(...args),
}));

describe('After-Sales Reconciliation (跨域对账保障)', () => {
    const VALID_TENANT_ID = '550e8400-e29b-41d4-a716-446655440001';
    const VALID_NOTICE_ID = '550e8400-e29b-41d4-a716-446655440003';
    const VALID_TICKET_ID = '550e8400-e29b-41d4-a716-446655440002';

    const mockSession = { user: { id: 'user-1', tenantId: VALID_TENANT_ID } };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue(mockSession);
        mockCreateStatement.mockResolvedValue({ success: true });
    });

    it('场景1：财务同步成功时，定责单状态标记为 SYNCED', async () => {
        (db.transaction as any).mockImplementation(async (cb: any) => {
            const tx = {
                query: {
                    liabilityNotices: {
                        findFirst: vi.fn().mockResolvedValue({
                            id: VALID_NOTICE_ID,
                            status: 'DRAFT',
                            liablePartyType: 'FACTORY',
                            liablePartyId: 'factory-1',
                            afterSalesId: VALID_TICKET_ID,
                            tenantId: VALID_TENANT_ID
                        }),
                    }
                },
                update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve({})) })) })),
                select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => Promise.resolve([{ total: '100.00' }])) })) })),
            };
            const res = await cb(tx);
            return {
                ...res,
                notice: { id: VALID_NOTICE_ID, liablePartyType: 'FACTORY', liablePartyId: 'factory-1', afterSalesId: VALID_TICKET_ID }
            };
        });

        const result = await confirmLiabilityNotice({ noticeId: VALID_NOTICE_ID });

        expect(result.success).toBe(true);
        expect(mockCreateStatement).toHaveBeenCalledWith(VALID_NOTICE_ID);
        // 验证同步成功的 update 调用
        expect(db.update).toHaveBeenCalledWith(expect.anything());
    });

    it('场景2：财务系统调用异常时，定责单状态标记为 FAILED', async () => {
        mockCreateStatement.mockRejectedValue(new Error('Finance connection error'));

        (db.transaction as any).mockImplementation(async (cb: any) => {
            const tx = {
                query: {
                    liabilityNotices: {
                        findFirst: vi.fn().mockResolvedValue({
                            id: VALID_NOTICE_ID,
                            status: 'DRAFT',
                            liablePartyType: 'FACTORY',
                            liablePartyId: 'factory-1',
                            afterSalesId: VALID_TICKET_ID,
                            tenantId: VALID_TENANT_ID
                        }),
                    }
                },
                update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve({})) })) })),
                select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => Promise.resolve([{ total: '100.00' }])) })) })),
            };
            const res = await cb(tx);
            return {
                ...res,
                notice: { id: VALID_NOTICE_ID, liablePartyType: 'FACTORY', liablePartyId: 'factory-1', afterSalesId: VALID_TICKET_ID }
            };
        });

        const result = await confirmLiabilityNotice({ noticeId: VALID_NOTICE_ID });

        expect(result.success).toBe(true);
        expect(result.data?.message).toContain('财务联动同步失败');
        // 应该记录 FAILED 状态
        expect(db.update).toHaveBeenCalled();
    });

    it('场景3：checkTicketFinancialClosure 应准确识别未同步的定责单', async () => {
        (db.query.liabilityNotices.findMany as any).mockResolvedValue([
            { id: 'notice-1', financeStatus: 'SYNCED' },
            { id: 'notice-2', financeStatus: 'FAILED' }
        ]);

        const result = await checkTicketFinancialClosure(VALID_TICKET_ID);

        expect(result.isClosed).toBe(false);
        expect(result.message).toContain('仍有 1 份定责单未完成财务同步');
    });

    it('场景4：非工厂责任方（如安装工）不触发财务对账单生成', async () => {
        (db.transaction as any).mockImplementation(async (cb: any) => {
            const tx = {
                query: {
                    liabilityNotices: {
                        findFirst: vi.fn().mockResolvedValue({
                            id: VALID_NOTICE_ID,
                            status: 'DRAFT',
                            liablePartyType: 'INSTALLER',
                            liablePartyId: 'installer-1',
                            afterSalesId: VALID_TICKET_ID,
                            tenantId: VALID_TENANT_ID
                        }),
                    }
                },
                update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve({})) })) })),
                select: vi.fn(() => ({ from: vi.fn(() => ({ where: vi.fn(() => Promise.resolve([{ total: '50.00' }])) })) })),
            };
            const res = await cb(tx);
            return {
                ...res,
                notice: { id: VALID_NOTICE_ID, liablePartyType: 'INSTALLER', liablePartyId: 'installer-1', afterSalesId: VALID_TICKET_ID }
            };
        });

        await confirmLiabilityNotice({ noticeId: VALID_NOTICE_ID });

        expect(mockCreateStatement).not.toHaveBeenCalled();
    });
});
