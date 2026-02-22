/**
 * Quotes 模块 Server Actions 集成测试 (CRUD: 创建单头)
 *
 * 覆盖范围：
 * - createQuoteBundle
 * - createQuote
 * - updateQuote
 * - copyQuote
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Decimal from 'decimal.js';

// ── 导入 Mock 工具 ──
import { createMockDb, createMockQuery, createMockInsert, createMockUpdate } from '@/shared/tests/mock-db';
import { createMockSession } from '@/shared/tests/mock-factory';

const MOCK_QUOTE_ID = '33100000-0000-4000-a000-000000000006';
const MOCK_BUNDLE_ID = '33100000-0000-4000-a000-000000000007';
const MOCK_SESSION = createMockSession();
const MOCK_TENANT_ID = MOCK_SESSION.user.tenantId;

// ── Mock Db Config ──
const mockDb = createMockDb(['quotes']);

// 重写 update 以匹配 returning 签名
const mockUpdateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: MOCK_BUNDLE_ID }]),
};
mockDb.update = vi.fn(() => mockUpdateChain) as ReturnType<typeof mockDb.update>;

// 设置事务内的 Mock
mockDb.transaction = vi.fn().mockImplementation(async (callback) => {
    return callback(mockDb);
});

vi.mock('@/shared/api/db', () => ({
    db: mockDb,
}));

// Mock Server Action Middleware
vi.mock('@/shared/lib/server-action', () => ({
    createSafeAction: (schema: any, handler: any) => {
        return async (input: any) => {
            return handler(input, { session: MOCK_SESSION });
        };
    }
}));

vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: { recordFromSession: vi.fn() },
}));

// Mock QuoteService 和 DiscountControlService
vi.mock('@/services/quote.service', () => ({
    QuoteService: { copyQuote: vi.fn() },
}));
vi.mock('@/services/discount-control.service', () => ({
    DiscountControlService: { checkRequiresApproval: vi.fn().mockResolvedValue(false) },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/shared/api/schema/quotes', () => ({
    quotes: { id: 'quotes.id', tenantId: 'quotes.tenantId', version: 'quotes.version' },
}));

// Mock shared-helpers
vi.mock('../shared-helpers', () => ({
    updateBundleTotal: vi.fn().mockResolvedValue(true),
}));

// ── 测试套件 ──
describe('Quotes CRUD Actions (L5)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // 复原 Mock DB 的默认状态
        mockDb.query.quotes.findFirst.mockResolvedValue({
            id: MOCK_QUOTE_ID,
            tenantId: MOCK_TENANT_ID,
            totalAmount: '1000',
            discountRate: '1',
            discountAmount: '0',
            finalAmount: '1000',
        });
    });

    it('createQuoteBundle 应创建报价套餐并指定 rootQuoteId', async () => {
        // 重写 insert 返回
        const insertChain = {
            values: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: MOCK_BUNDLE_ID, quoteNo: 'QB123', type: 'BUNDLE' }])
        };
        mockDb.insert = vi.fn(() => insertChain) as ReturnType<typeof mockDb.insert>;

        const { createQuoteBundleActionInternal } = await import('../quote-crud');
        const result = await createQuoteBundleActionInternal({
            customerId: '33333333-3333-3333-3333-333333333333',
            leadId: '44444444-4444-4444-4444-444444444444',
            remark: 'Test Bundle'
        });

        expect(mockDb.insert).toHaveBeenCalled();
        expect(mockUpdateChain.set).toHaveBeenCalledWith({ rootQuoteId: MOCK_BUNDLE_ID }); // 它自己是 root
        expect(result).toHaveProperty('id', MOCK_BUNDLE_ID);
        expect(result).toHaveProperty('quoteNo', 'QB123');

        const { AuditService } = await import('@/shared/lib/audit-service');
        expect(AuditService.recordFromSession).toHaveBeenCalledWith(
            MOCK_SESSION, 'quotes', MOCK_BUNDLE_ID, 'CREATE', expect.anything()
        );
    });

    it('createQuote 应创建报价单并触发更新套餐总额 (如果带 bundleId)', async () => {
        const insertChain = {
            values: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: MOCK_QUOTE_ID, quoteNo: 'QT123', bundleId: MOCK_BUNDLE_ID }])
        };
        mockDb.insert = vi.fn(() => insertChain) as ReturnType<typeof mockDb.insert>;
        const { updateBundleTotal } = await import('../shared-helpers');

        const { createQuote } = await import('../quote-crud');
        const result = await createQuote({
            customerId: 'cus-123',
            title: 'Test Quote',
            bundleId: MOCK_BUNDLE_ID
        });

        expect(mockDb.insert).toHaveBeenCalled();
        expect(mockUpdateChain.set).toHaveBeenCalledWith({ rootQuoteId: MOCK_QUOTE_ID });
        expect(updateBundleTotal).toHaveBeenCalledWith(MOCK_BUNDLE_ID, MOCK_TENANT_ID);
        expect(result).toHaveProperty('id', MOCK_QUOTE_ID);
    });

    it('updateQuote 应根据折扣和原价计算出 finalAmount', async () => {
        const { updateQuote } = await import('../quote-crud');
        const { DiscountControlService } = await import('@/services/discount-control.service');

        // 我们传入 0.8 的折扣，1000 * 0.8 = 800
        const result = await updateQuote({
            id: MOCK_QUOTE_ID,
            discountRate: 0.8
        });

        expect(result).toEqual({ success: true });
        expect(DiscountControlService.checkRequiresApproval).toHaveBeenCalledWith(MOCK_TENANT_ID, 0.8);

        // 关键断言：验证调用 db.update 时 set 的内部是否包含计算正确的 finalAmount
        const setArgs = mockUpdateChain.set.mock.calls[0][0];
        expect(setArgs.discountRate).toBe('0.8000');
        expect(setArgs.finalAmount).toBe('800.00'); // 1000 * 0.8
    });

    it('copyQuote 应当调用 QuoteService 委托处理新复制', async () => {
        const { QuoteService } = await import('@/services/quote.service');
        vi.mocked(QuoteService.copyQuote).mockResolvedValue({ id: 'new-copied-quote-id' });

        const { copyQuote } = await import('../quote-crud');
        const result = await copyQuote({
            quoteId: MOCK_QUOTE_ID,
            targetCustomerId: 'cus-456'
        });

        expect(QuoteService.copyQuote).toHaveBeenCalledWith(
            MOCK_QUOTE_ID,
            MOCK_SESSION.user.id,
            MOCK_TENANT_ID,
            'cus-456'
        );
        expect(result).toHaveProperty('id', 'new-copied-quote-id');
    });

    it('在查询不到报价单时 updateQuote 会被阻拦并抛出错误', async () => {
        mockDb.query.quotes.findFirst.mockResolvedValue(null);
        const { updateQuote } = await import('../quote-crud');
        await expect(updateQuote({ id: 'wrong-id' })).rejects.toThrow('报价单不存在或无权操作');
    });

    // ── 乐观锁 (版本冲突) 测试 ──

    it('updateQuote 版本冲突：传入旧 version 时应抛出 CONCURRENCY_CONFLICT', async () => {
        // 模拟 db.update().returning() 返回空数组（表示 where 条件不匹配 → 版本号不一致）
        mockUpdateChain.returning.mockResolvedValueOnce([]);

        const { updateQuote } = await import('../quote-crud');

        await expect(
            updateQuote({ id: MOCK_QUOTE_ID, version: 1, discountRate: 0.9 })
        ).rejects.toThrow('报价数据已被修改，请刷新后重试');
    });

    it('updateQuote 正常版本更新：传入正确 version 应更新成功且 set 含 version 自增表达式', async () => {
        // 模拟 db.update().returning() 返回更新后的记录
        mockUpdateChain.returning.mockResolvedValueOnce([{ id: MOCK_QUOTE_ID, version: 2 }]);

        const { updateQuote } = await import('../quote-crud');
        const result = await updateQuote({ id: MOCK_QUOTE_ID, version: 1, discountRate: 0.85 });

        expect(result).toEqual({ success: true });

        // 验证 set 调用包含 version 字段（SQL 表达式）
        const setArgs = mockUpdateChain.set.mock.calls[0][0];
        expect(setArgs).toHaveProperty('version');
        expect(setArgs.discountRate).toBe('0.8500');
    });
});
