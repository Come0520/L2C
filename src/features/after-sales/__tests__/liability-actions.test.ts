
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createLiabilityNotice, confirmLiabilityNotice, submitLiabilityNotice, disputeLiabilityNotice, arbitrateLiabilityNotice } from '../actions/liability';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { AuditService } from '@/shared/lib/audit-service';
import { revalidatePath, revalidateTag } from 'next/cache';

// Mock Modules
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            afterSalesTickets: { findFirst: vi.fn() },
            liabilityNotices: { findFirst: vi.fn() },
        },
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(() => Promise.resolve([{ id: 'mock-notice-id' }]))
            }))
        })),
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
        transaction: vi.fn((cb) => cb({
            query: {
                afterSalesTickets: { findFirst: vi.fn() },
                liabilityNotices: { findFirst: vi.fn() },
            },
            insert: vi.fn(() => ({
                values: vi.fn(() => ({
                    returning: vi.fn(() => Promise.resolve([{ id: 'mock-notice-id' }]))
                }))
            })),
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
        })),
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
}));

// Mock utils
vi.mock('../utils', () => ({
    generateNoticeNo: vi.fn().mockResolvedValue('LN20240001'),
}));

// Mock Finance Action (Lazy loaded)
const mockCreateSupplierLiabilityStatement = vi.fn();
vi.mock('@/features/finance/actions/ap', () => ({
    createSupplierLiabilityStatement: (...args: any[]) => mockCreateSupplierLiabilityStatement(...args),
}));

describe('Liability Notice Actions', () => {
    // Standard UUIDs for Zod validation
    const VALID_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
    const VALID_TENANT_ID = '550e8400-e29b-41d4-a716-446655440001';
    const VALID_TICKET_ID = '550e8400-e29b-41d4-a716-446655440002';
    const VALID_NOTICE_ID = '550e8400-e29b-41d4-a716-446655440003';
    const VALID_FACTORY_ID = '550e8400-e29b-41d4-a716-446655440004';

    const mockSession = {
        user: { id: VALID_USER_ID, tenantId: VALID_TENANT_ID }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue(mockSession);
        mockCreateSupplierLiabilityStatement.mockResolvedValue({ success: true });
    });

    describe('createLiabilityNotice', () => {
        it('should create a liability notice successfully', async () => {
            const input = {
                afterSalesId: VALID_TICKET_ID,
                liablePartyType: 'FACTORY' as const,
                liablePartyId: VALID_FACTORY_ID,
                reason: 'Quality issue',
                liabilityReasonCategory: 'PRODUCTION_QUALITY' as const,
                amount: 100,
                evidencePhotos: [],
            };

            (db.transaction as any).mockImplementation(async (cb: any) => {
                const tx = {
                    query: {
                        afterSalesTickets: {
                            findFirst: vi.fn().mockResolvedValue({
                                id: VALID_TICKET_ID,
                                tenantId: VALID_TENANT_ID,
                                status: 'PROCESSING'
                            })
                        }
                    },
                    insert: vi.fn(() => ({
                        values: vi.fn(() => ({
                            returning: vi.fn(() => Promise.resolve([{ id: 'mock-notice-id' }]))
                        }))
                    })),
                };
                return cb(tx);
            });

            const result = await createLiabilityNotice(input);

            expect(result.success).toBe(true);
            expect(result.data?.success).toBe(true);
            expect(AuditService.recordFromSession).toHaveBeenCalled();
        });

        it('should fail if ticket is closed', async () => {
            (db.transaction as any).mockImplementation(async (cb: any) => {
                const tx = {
                    query: {
                        afterSalesTickets: {
                            findFirst: vi.fn().mockResolvedValue({
                                id: VALID_TICKET_ID,
                                tenantId: VALID_TENANT_ID,
                                status: 'CLOSED'
                            })
                        }
                    }
                };
                return cb(tx);
            });

            const result = await createLiabilityNotice({
                afterSalesId: VALID_TICKET_ID,
                liablePartyType: 'FACTORY',
                liablePartyId: VALID_FACTORY_ID,
                reason: 'Test',
                liabilityReasonCategory: 'PRODUCTION_QUALITY',
                amount: 100,
            });

            expect(result.success).toBe(true);
            expect(result.data?.success).toBe(false);
            expect(result.data?.message).toContain('已关闭');
        });
    });

    describe('confirmLiabilityNotice', () => {
        it('should confirm notice and update ticket deduction', async () => {
            (db.transaction as any).mockImplementation(async (cb: any) => {
                const tx = {
                    query: {
                        liabilityNotices: {
                            findFirst: vi.fn().mockResolvedValue({
                                id: VALID_NOTICE_ID,
                                tenantId: VALID_TENANT_ID,
                                status: 'DRAFT',
                                afterSalesId: VALID_TICKET_ID,
                                liablePartyType: 'FACTORY',
                                liablePartyId: VALID_FACTORY_ID
                            })
                        }
                    },
                    update: vi.fn(() => ({
                        set: vi.fn(() => ({
                            where: vi.fn(() => Promise.resolve({}))
                        }))
                    })),
                    select: vi.fn(() => ({
                        from: vi.fn(() => ({
                            where: vi.fn(() => Promise.resolve([{ total: '150.00' }]))
                        }))
                    })),
                };
                const res = await cb(tx);
                return { ...res, notice: { id: VALID_NOTICE_ID, liablePartyType: 'FACTORY', liablePartyId: VALID_FACTORY_ID, afterSalesId: VALID_TICKET_ID } };
            });

            const result = await confirmLiabilityNotice({ noticeId: VALID_NOTICE_ID });

            expect(result.success).toBe(true);
            expect(result.data?.success).toBe(true);
            expect(mockCreateSupplierLiabilityStatement).toHaveBeenCalledWith(VALID_NOTICE_ID);
        });

        it('should handle finance sync failure gracefully', async () => {
            mockCreateSupplierLiabilityStatement.mockRejectedValue(new Error('Finance connection failed'));

            (db.transaction as any).mockImplementation(async (cb: any) => {
                const tx = {
                    query: {
                        liabilityNotices: {
                            findFirst: vi.fn().mockResolvedValue({
                                id: VALID_NOTICE_ID,
                                tenantId: VALID_TENANT_ID,
                                status: 'DRAFT',
                                afterSalesId: VALID_TICKET_ID,
                                liablePartyType: 'FACTORY',
                                liablePartyId: VALID_FACTORY_ID
                            })
                        }
                    },
                    update: vi.fn(() => ({
                        set: vi.fn(() => ({
                            where: vi.fn(() => Promise.resolve({}))
                        }))
                    })),
                    select: vi.fn(() => ({
                        from: vi.fn(() => ({
                            where: vi.fn(() => Promise.resolve([{ total: '150.00' }]))
                        }))
                    })),
                };
                const res = await cb(tx);
                return { ...res, notice: { id: VALID_NOTICE_ID, liablePartyType: 'FACTORY', liablePartyId: VALID_FACTORY_ID, afterSalesId: VALID_TICKET_ID } };
            });

            const result = await confirmLiabilityNotice({ noticeId: VALID_NOTICE_ID });

            expect(result.success).toBe(true);
            expect(result.data?.success).toBe(true);
            expect(result.data?.message).toContain('财务联动同步失败');
        });
    });

    describe('disputeLiabilityNotice', () => {
        it('should set status to DISPUTED', async () => {
            (db.query.liabilityNotices.findFirst as any).mockResolvedValue({
                id: VALID_NOTICE_ID,
                tenantId: VALID_TENANT_ID,
                status: 'PENDING_CONFIRM'
            });

            const result = await disputeLiabilityNotice({
                noticeId: VALID_NOTICE_ID,
                disputeReason: 'Not my fault'
            });

            expect(result.success).toBe(true);
            expect(result.data?.success).toBe(true);
            expect(db.update).toHaveBeenCalled();
        });
    });

    describe('arbitrateLiabilityNotice', () => {
        it('should set status to ARBITRATED', async () => {
            (db.query.liabilityNotices.findFirst as any).mockResolvedValue({
                id: VALID_NOTICE_ID,
                tenantId: VALID_TENANT_ID,
                status: 'DISPUTED'
            });

            const result = await arbitrateLiabilityNotice({
                noticeId: VALID_NOTICE_ID,
                arbitrationResult: 'Factory pays 50%'
            });

            expect(result.success).toBe(true);
            expect(result.data?.success).toBe(true);
            expect(db.update).toHaveBeenCalled();
        });
    });
});
