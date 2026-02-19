/**
 * 报价模块审计日志集成测试
 * 
 * 验证核心 Action 操作是否正确触发 AuditService.recordFromSession
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService } from '@/shared/lib/audit-service';

// ─── Mock Setup ─────────────────────────────────

const mockChainable = (returnValue: any = []) => {
    const chain = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue(returnValue),
        execute: vi.fn().mockResolvedValue(returnValue),
    };
    return chain;
};

// Define MOCK_QUOTE here or ensure it's defined before mockTx
const MOCK_QUOTE = { id: 'mock-quote-id', quoteNo: 'QT-MOCK' };

const mockTx = {
    insert: vi.fn(() => mockChainable([MOCK_QUOTE])),
    update: vi.fn(() => mockChainable([MOCK_QUOTE])),
    delete: vi.fn(() => mockChainable([MOCK_QUOTE])),
    query: {
        quotes: {
            findFirst: vi.fn()
        },
        tenants: {
            findFirst: vi.fn()
        },
        quoteItems: {
            findMany: vi.fn(),
            deleteMany: vi.fn()
        }
    }
};

vi.mock('@/shared/api/db', () => ({
    db: {
        transaction: vi.fn((callback) => callback(mockTx)),
        query: {
            quotes: {
                findFirst: vi.fn()
            },
            quoteItems: {
                findMany: vi.fn(),
                deleteMany: vi.fn()
            }
        },
        insert: vi.fn(() => mockChainable([MOCK_QUOTE])),
        update: vi.fn(() => mockChainable([MOCK_QUOTE])),
        delete: vi.fn(() => mockChainable([MOCK_QUOTE])),
    },
    eq: vi.fn(),
    and: vi.fn(),
    desc: vi.fn(),
    sql: vi.fn(),
    inArray: vi.fn()
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn()
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: {
        recordFromSession: vi.fn()
    }
}));

vi.mock('@/shared/lib/server-action', () => ({
    createSafeAction: (schema: any, handler: any) => async (data: any) => {
        // Mock Session matching MOCK_SESSION structure
        const session = {
            user: {
                id: '11111111-1111-1111-1111-111111111111',
                tenantId: '22222222-2222-2222-2222-222222222222',
                name: 'Test User'
            }
        };
        // Bypass schema validation for simplicity in this mock, or utilize it if strictness is needed
        // Here we assume data is correct or verified by schema in real code
        const result = await handler(data, { session });
        return { data: result, success: true };
    }
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}));

vi.mock('@/features/quotes/actions/shared-helpers', () => ({
    updateBundleTotal: vi.fn()
}));

vi.mock('@/services/quote.service', () => ({
    QuoteService: {
        copyQuote: vi.fn().mockResolvedValue({ id: 'new-quote-id', quoteNo: 'QT-NEW' }),
        createNextVersion: vi.fn().mockResolvedValue({ id: 'version-quote-id', quoteNo: 'QT-VER' }),
        calculateTotal: vi.fn().mockReturnValue(1000)
    }
}));

vi.mock('@/services/discount-control.service', () => ({
    DiscountControlService: {
        checkRequiresApproval: vi.fn().mockResolvedValue(false),
        calculateItemPrice: vi.fn().mockReturnValue(100)
    }
}));

vi.mock('@/services/quote-lifecycle.service', () => ({
    QuoteLifecycleService: {
        submit: vi.fn(),
        reject: vi.fn(),
        approve: vi.fn(),
        convertToOrder: vi.fn().mockResolvedValue({ id: 'order-id' })
    }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(true)
}));

vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        QUOTE: { EDIT: 'quote:edit', APPROVE: 'quote:approve', CREATE: 'quote:create' },
        ORDER: { CREATE: 'order:create' }
    }
}));

// 导入被测模块
import { createQuote, updateQuote, copyQuote } from '../quote-crud';
import * as LifecycleActions from '../quote-lifecycle-actions';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { QuoteService } from '@/services/quote.service';
import { QuoteLifecycleService } from '@/services/quote-lifecycle.service';

const MOCK_SESSION = {
    user: {
        id: '11111111-1111-1111-1111-111111111111',
        tenantId: '22222222-2222-2222-2222-222222222222',
        name: 'Test User'
    }
};

const MOCK_UUID = {
    QUOTE: '33333333-3333-3333-3333-333333333333',
    CUSTOMER: '44444444-4444-4444-4444-444444444444',
    PROJECT: '55555555-5555-5555-5555-555555555555',
    MEASURE: '66666666-6666-6666-6666-666666666666',
    NEW_QUOTE: '77777777-7777-7777-7777-777777777777',
    ORDER: '88888888-8888-8888-8888-888888888888'
};

describe('Quote Actions Audit Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // 默认模拟登录用户
        vi.mocked(auth).mockResolvedValue(MOCK_SESSION as any);

        // Mock QuoteService 返回的 ID
        vi.mocked(QuoteService.copyQuote).mockResolvedValue({ id: MOCK_UUID.NEW_QUOTE, quoteNo: 'QT-NEW' } as any);
        vi.mocked(QuoteService.createNextVersion).mockResolvedValue({ id: MOCK_UUID.NEW_QUOTE, quoteNo: 'QT-VER' } as any);
        vi.mocked(QuoteLifecycleService.convertToOrder).mockResolvedValue({ id: MOCK_UUID.ORDER } as any);

        // Mock DB insert returning 必须匹配 schema
        vi.mocked(db.insert).mockReturnValue({
            values: vi.fn().mockReturnValue({
                returning: vi.fn().mockResolvedValue([{ id: MOCK_UUID.QUOTE, quoteNo: 'QT-MOCK' }])
            })
        } as any);
    });

    describe('createQuote', () => {
        it('创建报价单时应记录审计日志', async () => {
            const input = {
                customerId: MOCK_UUID.CUSTOMER,
                projectId: MOCK_UUID.PROJECT, // 确保包含所有必需字段
                measureVariantId: MOCK_UUID.MEASURE
            };

            await createQuote(input as any);

            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                MOCK_SESSION,
                'quotes',
                expect.any(String), // insert mock return logic might need tweaking or assume flow works
                'CREATE',
                expect.objectContaining({
                    new: expect.objectContaining({
                        quoteNo: 'QT-MOCK',
                        customerId: MOCK_UUID.CUSTOMER
                    })
                })
            );
        });
    });

    describe('updateQuote', () => {
        it('更新报价单折扣应记录审计日志', async () => {
            // 模拟数据库返回现有报价单
            vi.mocked(db.query.quotes.findFirst).mockResolvedValue({
                id: MOCK_UUID.QUOTE,
                tenantId: MOCK_SESSION.user.tenantId,
                discountRate: '1.0000',
                discountAmount: '0.00',
                totalAmount: '1000.00'
            } as any);

            const input = {
                id: MOCK_UUID.QUOTE,
                discountRate: 0.9,
                discountAmount: 0
            };

            await updateQuote(input);

            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                MOCK_SESSION,
                'quotes',
                MOCK_UUID.QUOTE,
                'UPDATE',
                expect.objectContaining({
                    old: expect.objectContaining({
                        discountRate: '1.0000'
                    }),
                    new: expect.objectContaining({
                        discountRate: '0.9000'
                    })
                })
            );
        });
    });

    describe('copyQuote', () => {
        it('复制报价单应记录审计日志', async () => {
            // 模拟源报价单存在
            vi.mocked(db.query.quotes.findFirst).mockResolvedValue({ id: MOCK_UUID.QUOTE } as any);

            const input = {
                quoteId: MOCK_UUID.QUOTE,
                targetCustomerId: MOCK_UUID.CUSTOMER
            };

            await copyQuote(input);

            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                MOCK_SESSION,
                'quotes',
                MOCK_UUID.NEW_QUOTE,
                'CREATE',
                expect.objectContaining({
                    new: expect.objectContaining({
                        sourceQuoteId: MOCK_UUID.QUOTE,
                        targetCustomerId: MOCK_UUID.CUSTOMER
                    })
                })
            );
        });
    });

    describe('Lifecycle Actions', () => {
        beforeEach(() => {
            // 确保每次测试前 mock 数据干净
            vi.clearAllMocks();
            vi.mocked(auth).mockResolvedValue(MOCK_SESSION as any);
        });

        it('提交报价单应记录审计日志', async () => {
            await LifecycleActions.submitQuote({ id: MOCK_UUID.QUOTE });
            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                MOCK_SESSION, 'quotes', MOCK_UUID.QUOTE, 'UPDATE',
                expect.objectContaining({ new: { action: 'SUBMIT' } })
            );
        });

        it('拒绝报价单应记录审计日志', async () => {
            const reason = 'Too expensive';
            await LifecycleActions.rejectQuote({ id: MOCK_UUID.QUOTE, rejectReason: reason });
            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                MOCK_SESSION, 'quotes', MOCK_UUID.QUOTE, 'UPDATE',
                expect.objectContaining({
                    new: { action: 'REJECT', rejectReason: reason }
                })
            );
        });

        it('锁定报价单应记录审计日志', async () => {
            vi.mocked(db.query.quotes.findFirst).mockResolvedValue({ id: MOCK_UUID.QUOTE, tenantId: MOCK_SESSION.user.tenantId } as any);
            await LifecycleActions.lockQuote({ id: MOCK_UUID.QUOTE });
            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                MOCK_SESSION, 'quotes', MOCK_UUID.QUOTE, 'UPDATE',
                expect.objectContaining({
                    new: expect.objectContaining({ action: 'LOCK' })
                })
            );
        });

        it('解锁报价单应记录审计日志', async () => {
            vi.mocked(db.query.quotes.findFirst).mockResolvedValue({ id: MOCK_UUID.QUOTE, tenantId: MOCK_SESSION.user.tenantId } as any);
            await LifecycleActions.unlockQuote({ id: MOCK_UUID.QUOTE });
            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                MOCK_SESSION, 'quotes', MOCK_UUID.QUOTE, 'UPDATE',
                expect.objectContaining({ new: { action: 'UNLOCK' } })
            );
        });

        it('审批报价单应记录审计日志', async () => {
            await LifecycleActions.approveQuote({ id: MOCK_UUID.QUOTE });
            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                MOCK_SESSION, 'quotes', MOCK_UUID.QUOTE, 'UPDATE',
                expect.objectContaining({ new: { action: 'APPROVE' } })
            );
        });

        it('转订单应记录审计日志', async () => {
            await LifecycleActions.convertQuoteToOrder({ quoteId: MOCK_UUID.QUOTE });
            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                MOCK_SESSION, 'quotes', MOCK_UUID.QUOTE, 'UPDATE',
                expect.objectContaining({
                    new: { action: 'CONVERT_TO_ORDER', orderId: MOCK_UUID.ORDER }
                })
            );
        });

        it('创建新版本应记录审计日志', async () => {
            await LifecycleActions.createNextVersion({ quoteId: MOCK_UUID.QUOTE });
            expect(AuditService.recordFromSession).toHaveBeenCalledWith(
                MOCK_SESSION, 'quotes', MOCK_UUID.NEW_QUOTE, 'CREATE',
                expect.objectContaining({
                    new: { action: 'CREATE_VERSION', sourceQuoteId: MOCK_UUID.QUOTE }
                })
            );
        });
    });
});
