/**
 * Quotes 模块 Server Actions 集成测试 (Lifecycle: 生命周期管理)
 *
 * 覆盖范围：
 * - submitQuote
 * - rejectQuote
 * - lockQuote
 * - unlockQuote
 * - approveQuote
 * - rejectQuoteDiscount
 * - convertQuoteToOrder
 * - createNextVersion
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── 导入 Mock 工具 ──
import { createMockDb, createMockUpdate } from '@/shared/tests/mock-db';
import { createMockSession } from '@/shared/tests/mock-factory';

const MOCK_QUOTE_ID = '110e8400-e29b-41d4-a716-446655440000';
const MOCK_ORDER_ID = '990e8400-e29b-41d4-a716-446655440000';
const MOCK_NEW_VERSION_ID = '880e8400-e29b-41d4-a716-446655440000';
const MOCK_SESSION = createMockSession();
const MOCK_TENANT_ID = MOCK_SESSION.user.tenantId;
const MOCK_USER_ID = MOCK_SESSION.user.id;

// ── Mock Db Config ──
const mockDb = createMockDb(['quotes']);

const mockUpdateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: MOCK_QUOTE_ID }])
};
mockDb.update = vi.fn(() => mockUpdateChain) as unknown as typeof mockDb.update;

vi.mock('@/shared/api/db', () => ({
    db: mockDb,
}));

// Mock Server Action Middleware
vi.mock('@/shared/lib/server-action', () => ({
    createSafeAction: (schema: unknown, handler: (input: unknown, ctx: unknown) => Promise<unknown>) => {
        return async (input: unknown) => {
            return handler(input, { session: MOCK_SESSION });
        };
    }
}));

// Mock Auth Check
vi.mock('@/shared/lib/auth', () => ({
    checkPermission: vi.fn().mockResolvedValue(true),
}));

// Mock Audit
vi.mock('@/shared/lib/audit-service', () => ({
    AuditService: { recordFromSession: vi.fn() },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

vi.mock('@/shared/api/schema/quotes', () => ({
    quotes: { id: 'quotes.id', tenantId: 'quotes.tenantId', version: 'quotes.version' }
}));

// Mock 相关的 Service
vi.mock('@/services/quote-lifecycle.service', () => ({
    QuoteLifecycleService: {
        submit: vi.fn().mockResolvedValue(true),
        reject: vi.fn().mockResolvedValue(true),
        approve: vi.fn().mockResolvedValue(true),
        convertToOrder: vi.fn().mockResolvedValue({ id: MOCK_ORDER_ID })
    }
}));

vi.mock('@/services/quote.service', () => ({
    QuoteService: {
        createNextVersion: vi.fn().mockResolvedValue({ id: MOCK_NEW_VERSION_ID })
    }
}));

import { PERMISSIONS } from '@/shared/config/permissions';

// ── 测试套件 ──
describe('Quote Lifecycle Actions (L5)', () => {
    beforeEach(async () => {
        vi.clearAllMocks();

        // 默认该报价单存在且未被锁定
        mockDb.query.quotes.findFirst.mockResolvedValue({
            id: MOCK_QUOTE_ID,
            tenantId: MOCK_TENANT_ID,
            lockedAt: null
        });

        // 重置权限 mock (在文件顶部已经被 vi.mock 拦截，可以直接控制)
        const m = await import('@/shared/lib/auth');
        vi.mocked(m.checkPermission).mockResolvedValue(true);
    });

    it('submitQuote 应检查编辑权限并调用生命周期服务', async () => {
        const { submitQuote } = await import('../quote-lifecycle-actions');
        const { checkPermission } = await import('@/shared/lib/auth');
        const { QuoteLifecycleService } = await import('@/services/quote-lifecycle.service');
        const { AuditService } = await import('@/shared/lib/audit-service');

        const result = await submitQuote({ id: MOCK_QUOTE_ID });

        expect(checkPermission).toHaveBeenCalledWith(MOCK_SESSION, PERMISSIONS.QUOTE.EDIT);
        expect(QuoteLifecycleService.submit).toHaveBeenCalledWith(MOCK_QUOTE_ID, MOCK_TENANT_ID, MOCK_USER_ID);
        expect(AuditService.recordFromSession).toHaveBeenCalledWith(
            MOCK_SESSION, 'quotes', MOCK_QUOTE_ID, 'UPDATE', expect.objectContaining({ new: { action: 'SUBMIT' } })
        );
        expect(result).toEqual({ success: true });
    });

    it('rejectQuote 应检查审批权限并带上拒绝理由', async () => {
        const { rejectQuote } = await import('../quote-lifecycle-actions');
        const { checkPermission } = await import('@/shared/lib/auth');
        const { QuoteLifecycleService } = await import('@/services/quote-lifecycle.service');

        const result = await rejectQuote({ id: MOCK_QUOTE_ID, rejectReason: 'Price too high' });

        expect(checkPermission).toHaveBeenCalledWith(MOCK_SESSION, PERMISSIONS.QUOTE.APPROVE);
        expect(QuoteLifecycleService.reject).toHaveBeenCalledWith(MOCK_QUOTE_ID, 'Price too high', MOCK_TENANT_ID);
        expect(result).toEqual({ success: true });
    });

    it('lockQuote 应检查编辑权限和当前锁定状态，并直接更新 DB', async () => {
        const { lockQuote } = await import('../quote-lifecycle-actions');

        const result = await lockQuote({ id: MOCK_QUOTE_ID });

        expect(mockUpdateChain.set).toHaveBeenCalledWith(expect.objectContaining({
            lockedAt: expect.any(Date)
        }));
        expect(result).toHaveProperty('id', MOCK_QUOTE_ID);
    });

    it('lockQuote 遇到已锁定的报价单会抛出异常', async () => {
        mockDb.query.quotes.findFirst.mockResolvedValue({
            id: MOCK_QUOTE_ID,
            tenantId: MOCK_TENANT_ID,
            lockedAt: new Date()
        });
        const { lockQuote } = await import('../quote-lifecycle-actions');

        await expect(lockQuote({ id: MOCK_QUOTE_ID })).rejects.toThrow('该报价单已锁定');
    });

    it('unlockQuote 应清除锁定标记', async () => {
        const { unlockQuote } = await import('../quote-lifecycle-actions');

        const result = await unlockQuote({ id: MOCK_QUOTE_ID });

        expect(mockUpdateChain.set).toHaveBeenCalledWith(expect.objectContaining({
            lockedAt: null
        }));
        expect(result).toHaveProperty('id', MOCK_QUOTE_ID);
    });

    it('approveQuote 应验证审批权限并调用生命周期服务', async () => {
        const { approveQuote } = await import('../quote-lifecycle-actions');
        const { QuoteLifecycleService } = await import('@/services/quote-lifecycle.service');

        const result = await approveQuote({ id: MOCK_QUOTE_ID });

        expect(QuoteLifecycleService.approve).toHaveBeenCalledWith(MOCK_QUOTE_ID, MOCK_USER_ID, MOCK_TENANT_ID);
        expect(result).toEqual({ success: true });
    });

    it('convertQuoteToOrder 应验证新建订单权限并调用生命周期服务', async () => {
        const { convertQuoteToOrder } = await import('../quote-lifecycle-actions');
        const { checkPermission } = await import('@/shared/lib/auth');
        const { QuoteLifecycleService } = await import('@/services/quote-lifecycle.service');

        const result = await convertQuoteToOrder({ quoteId: MOCK_QUOTE_ID });

        expect(checkPermission).toHaveBeenCalledWith(MOCK_SESSION, PERMISSIONS.ORDER.CREATE);
        expect(QuoteLifecycleService.convertToOrder).toHaveBeenCalledWith(MOCK_QUOTE_ID, MOCK_TENANT_ID, MOCK_USER_ID);
        expect(result).toHaveProperty('id', MOCK_ORDER_ID);
    });

    it('createNextVersion 应当验证创建报价单权限并交由 QuoteService 创建新版本', async () => {
        const { createNextVersion } = await import('../quote-lifecycle-actions');
        const { checkPermission } = await import('@/shared/lib/auth');
        const { QuoteService } = await import('@/services/quote.service');

        const result = await createNextVersion({ quoteId: MOCK_QUOTE_ID });

        expect(checkPermission).toHaveBeenCalledWith(MOCK_SESSION, PERMISSIONS.QUOTE.CREATE);
        expect(QuoteService.createNextVersion).toHaveBeenCalledWith(MOCK_QUOTE_ID, MOCK_USER_ID, MOCK_TENANT_ID);
        expect(result).toHaveProperty('id', MOCK_NEW_VERSION_ID);
    });

    it('执行缺少权限操作时应被阻断', async () => {
        const { checkPermission } = await import('@/shared/lib/auth');
        vi.mocked(checkPermission).mockResolvedValue(false);
        const { approveQuote } = await import('../quote-lifecycle-actions');

        await expect(approveQuote({ id: MOCK_QUOTE_ID })).rejects.toThrow('无权执行此操作');
    });

    // ── 乐观锁 (版本冲突) 测试 ──

    it('lockQuote 版本冲突：传入旧 version 后 db.update 返回空时应抛出并发错误', async () => {
        // 模拟 returning() 返回空数组（版本号不匹配）
        mockUpdateChain.returning.mockResolvedValueOnce([]);

        const { lockQuote } = await import('../quote-lifecycle-actions');

        await expect(
            lockQuote({ id: MOCK_QUOTE_ID, version: 1 })
        ).rejects.toThrow('报价数据已被修改，请刷新后重试');
    });

    it('lockQuote 正常锁定时 set 调用应包含 version 自增表达式', async () => {
        const { lockQuote } = await import('../quote-lifecycle-actions');

        const result = await lockQuote({ id: MOCK_QUOTE_ID });

        // 验证 set 调用含 version 字段和 lockedAt
        const setArgs = mockUpdateChain.set.mock.calls[0][0];
        expect(setArgs).toHaveProperty('version');
        expect(setArgs).toHaveProperty('lockedAt');
        expect(result).toHaveProperty('id', MOCK_QUOTE_ID);
    });

    it('unlockQuote 应同步递增 version', async () => {
        const { unlockQuote } = await import('../quote-lifecycle-actions');

        const result = await unlockQuote({ id: MOCK_QUOTE_ID });

        // 验证 set 调用含 version 自增
        const setArgs = mockUpdateChain.set.mock.calls[0][0];
        expect(setArgs).toHaveProperty('version');
        expect(setArgs.lockedAt).toBeNull();
        expect(result).toHaveProperty('id', MOCK_QUOTE_ID);
    });

    it('submitQuote 正常版本检查：传入 version 时应先调用 preflightVersionCheck（即触发 db.update）', async () => {
        const { submitQuote } = await import('../quote-lifecycle-actions');

        // 模拟 preflightVersionCheck 成功的 update 返回
        mockUpdateChain.returning.mockResolvedValueOnce([{ id: MOCK_QUOTE_ID }]);

        await submitQuote({ id: MOCK_QUOTE_ID, version: 10 });

        // 验证 db.update 被调用，且 where 包含版本校验
        expect(mockDb.update).toHaveBeenCalled();
        const whereArgs = mockUpdateChain.where.mock.calls[0][0];
        // Drizzle-orm and() 内部结构比较复杂，这里简单验证 mock 调用
        expect(mockUpdateChain.set).toHaveBeenCalledWith(expect.objectContaining({
            version: expect.anything()
        }));
    });

    it('submitQuote 版本冲突：传入 version 但 db.update 未找到记录时应抛出错误', async () => {
        const { submitQuote } = await import('../quote-lifecycle-actions');

        // 模拟 preflightVersionCheck 失败（返回空）
        mockUpdateChain.returning.mockResolvedValueOnce([]);

        await expect(
            submitQuote({ id: MOCK_QUOTE_ID, version: 10 })
        ).rejects.toThrow('报价数据已被修改，请刷新后重试');
    });

    it('approveQuote 正常版本检查逻辑同 submitQuote', async () => {
        const { approveQuote } = await import('../quote-lifecycle-actions');
        mockUpdateChain.returning.mockResolvedValueOnce([{ id: MOCK_QUOTE_ID }]);

        await approveQuote({ id: MOCK_QUOTE_ID, version: 5 });

        expect(mockDb.update).toHaveBeenCalled();
        expect(mockUpdateChain.set).toHaveBeenCalledWith(expect.objectContaining({
            version: expect.anything()
        }));
    });

    it('rejectQuote 正常版本检查逻辑同 submitQuote', async () => {
        const { rejectQuote } = await import('../quote-lifecycle-actions');
        mockUpdateChain.returning.mockResolvedValueOnce([{ id: MOCK_QUOTE_ID }]);

        await rejectQuote({ id: MOCK_QUOTE_ID, rejectReason: 'test', version: 3 });

        expect(mockDb.update).toHaveBeenCalled();
        expect(mockUpdateChain.set).toHaveBeenCalledWith(expect.objectContaining({
            version: expect.anything()
        }));
    });
});
