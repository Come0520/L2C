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
  returning: vi.fn().mockResolvedValue([{ id: MOCK_QUOTE_ID }]),
};
mockDb.update = vi.fn(() => mockUpdateChain) as unknown as typeof mockDb.update;

vi.mock('@/shared/api/db', () => ({
  db: mockDb,
}));

// Mock Server Action Middleware
vi.mock('@/shared/lib/server-action', () => ({
  createSafeAction: (
    schema: unknown,
    handler: (input: unknown, ctx: unknown) => Promise<unknown>
  ) => {
    return async (input: unknown) => {
      return handler(input, { session: MOCK_SESSION });
    };
  },
}));

// Mock Auth Check
vi.mock('@/shared/lib/auth', () => ({
  checkPermission: vi.fn().mockResolvedValue(true),
}));

// Mock Audit
vi.mock('@/shared/services/audit-service', () => ({
  AuditService: { recordFromSession: vi.fn() },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

vi.mock('@/shared/api/schema/quotes', () => ({
  quotes: { id: 'quotes.id', tenantId: 'quotes.tenantId', version: 'quotes.version' },
}));

// Mock 相关的 Service
vi.mock('@/services/quote-lifecycle.service', () => ({
  QuoteLifecycleService: {
    submit: vi.fn().mockResolvedValue(true),
    reject: vi.fn().mockResolvedValue(true),
    approve: vi.fn().mockResolvedValue(true),
    convertToOrder: vi.fn().mockResolvedValue({ id: MOCK_ORDER_ID }),
  },
}));

vi.mock('@/features/quotes/services/quote-version.service', () => ({
  QuoteVersionService: {
    createNextVersion: vi.fn().mockResolvedValue({ id: MOCK_NEW_VERSION_ID }),
  },
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
      lockedAt: null,
    });

    // 重置权限 mock (在文件顶部已经被 vi.mock 拦截，可以直接控制)
    const m = await import('@/shared/lib/auth');
    vi.mocked(m.checkPermission).mockResolvedValue(true);
  });

  it('submitQuote 应检查编辑权限并调用生命周期服务', async () => {
    const { submitQuote } = await import('../quote-lifecycle-actions');
    const { checkPermission } = await import('@/shared/lib/auth');
    const { QuoteLifecycleService } = await import('@/services/quote-lifecycle.service');
    const { AuditService } = await import('@/shared/services/audit-service');

    const result = await submitQuote({ id: MOCK_QUOTE_ID });

    expect(checkPermission).toHaveBeenCalledWith(MOCK_SESSION, PERMISSIONS.QUOTE.OWN_EDIT);
    expect(QuoteLifecycleService.submit).toHaveBeenCalledWith(
      MOCK_QUOTE_ID,
      MOCK_TENANT_ID,
      MOCK_USER_ID
    );
    expect(AuditService.recordFromSession).toHaveBeenCalledWith(
      MOCK_SESSION,
      'quotes',
      MOCK_QUOTE_ID,
      'UPDATE',
      expect.objectContaining({ new: { action: 'SUBMIT' } })
    );
    expect(result).toEqual({ success: true });
  });

  it('rejectQuote 应检查审批权限并带上拒绝理由', async () => {
    const { rejectQuote } = await import('../quote-lifecycle-actions');
    const { checkPermission } = await import('@/shared/lib/auth');
    const { QuoteLifecycleService } = await import('@/services/quote-lifecycle.service');

    const result = await rejectQuote({ id: MOCK_QUOTE_ID, rejectReason: 'Price too high' });

    expect(checkPermission).toHaveBeenCalledWith(MOCK_SESSION, PERMISSIONS.QUOTE.APPROVE);
    expect(QuoteLifecycleService.reject).toHaveBeenCalledWith(
      MOCK_QUOTE_ID,
      'Price too high',
      MOCK_TENANT_ID
    );
    expect(result).toEqual({ success: true });
  });

  it('lockQuote 应检查编辑权限和当前锁定状态，并直接更新 DB', async () => {
    const { lockQuote } = await import('../quote-lifecycle-actions');

    const result = await lockQuote({ id: MOCK_QUOTE_ID });

    expect(mockUpdateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        lockedAt: expect.anything(),
      })
    );
    expect(result).toHaveProperty('id', MOCK_QUOTE_ID);
  });

  it('lockQuote 遇到已锁定的报价单会抛出异常', async () => {
    // 新实现：原子 UPDATE WHERE lockedAt IS NULL 影响 0 行（lockedAt 已有值）
    mockUpdateChain.returning.mockResolvedValueOnce([]);
    // 随后 findFirst 回查，确认是"已锁定"场景
    mockDb.query.quotes.findFirst.mockResolvedValueOnce({
      lockedAt: new Date(),
    });
    const { lockQuote } = await import('../quote-lifecycle-actions');

    await expect(lockQuote({ id: MOCK_QUOTE_ID })).rejects.toThrow('该报价单已锁定');
  });

  it('unlockQuote 应清除锁定标记', async () => {
    const { unlockQuote } = await import('../quote-lifecycle-actions');

    const result = await unlockQuote({ id: MOCK_QUOTE_ID });

    expect(mockUpdateChain.set).toHaveBeenCalledWith(
      expect.objectContaining({
        lockedAt: null,
      })
    );
    expect(result).toHaveProperty('id', MOCK_QUOTE_ID);
  });

  it('approveQuote 应验证审批权限并调用生命周期服务', async () => {
    const { approveQuote } = await import('../quote-lifecycle-actions');
    const { QuoteLifecycleService } = await import('@/services/quote-lifecycle.service');

    const result = await approveQuote({ id: MOCK_QUOTE_ID });

    expect(QuoteLifecycleService.approve).toHaveBeenCalledWith(
      MOCK_QUOTE_ID,
      MOCK_USER_ID,
      MOCK_TENANT_ID
    );
    expect(result).toEqual({ success: true });
  });

  it('convertQuoteToOrder 应验证新建订单权限并调用生命周期服务', async () => {
    const { convertQuoteToOrder } = await import('../quote-lifecycle-actions');
    const { checkPermission } = await import('@/shared/lib/auth');
    const { QuoteLifecycleService } = await import('@/services/quote-lifecycle.service');

    const result = await convertQuoteToOrder({ quoteId: MOCK_QUOTE_ID });

    expect(checkPermission).toHaveBeenCalledWith(MOCK_SESSION, PERMISSIONS.ORDER.OWN_EDIT);
    expect(QuoteLifecycleService.convertToOrder).toHaveBeenCalledWith(
      MOCK_QUOTE_ID,
      MOCK_TENANT_ID,
      MOCK_USER_ID
    );
    expect(result).toHaveProperty('id', MOCK_ORDER_ID);
  });

  it('createNextVersion 应当验证创建报价单权限并交由 QuoteService 创建新版本', async () => {
    const { createNextVersion } = await import('../quote-lifecycle-actions');
    const { checkPermission } = await import('@/shared/lib/auth');
    const { QuoteVersionService } =
      await import('@/features/quotes/services/quote-version.service');

    const result = await createNextVersion({ quoteId: MOCK_QUOTE_ID });

    expect(checkPermission).toHaveBeenCalledWith(MOCK_SESSION, PERMISSIONS.QUOTE.OWN_EDIT);
    expect(QuoteVersionService.createNextVersion).toHaveBeenCalledWith(
      MOCK_QUOTE_ID,
      MOCK_USER_ID,
      MOCK_TENANT_ID
    );
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

    await expect(lockQuote({ id: MOCK_QUOTE_ID, version: 1 })).rejects.toThrow(
      '报价数据已被修改，请刷新后重试'
    );
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

  it('submitQuote 正常版本检查：传入 version 且版本匹配时，preflightVersionCheck 只做 SELECT（db.update 不被调用）', async () => {
    const { submitQuote } = await import('../quote-lifecycle-actions');

    // 修复后 preflightVersionCheck 只做 SELECT：findFirst 返回匹配记录
    mockDb.query.quotes.findFirst.mockResolvedValueOnce({ id: MOCK_QUOTE_ID });

    await submitQuote({ id: MOCK_QUOTE_ID, version: 10 });

    // 修复后：action 层不再触发 db.update（只有 service 层会更新，service 是 mock 的）
    expect(mockDb.update).not.toHaveBeenCalled();
    // 验证 preflightVersionCheck 调用了 SELECT
    expect(mockDb.query.quotes.findFirst).toHaveBeenCalled();
  });

  it('submitQuote 版本冲突：传入 version 但 findFirst 未找到记录时应抛出错误', async () => {
    const { submitQuote } = await import('../quote-lifecycle-actions');

    // 修复后：模拟版本不匹配（findFirst 未找到匹配版本的记录）
    mockDb.query.quotes.findFirst.mockResolvedValueOnce(null);

    await expect(submitQuote({ id: MOCK_QUOTE_ID, version: 10 })).rejects.toThrow(
      '报价数据已被修改，请刷新后重试'
    );
  });

  it('approveQuote 正常版本检查：db.update 不被调用（preflightVersionCheck 为纯 SELECT）', async () => {
    const { approveQuote } = await import('../quote-lifecycle-actions');

    // findFirst 返回版本匹配的记录（第1次：preflightVersionCheck；第2次：自我审批检查）
    mockDb.query.quotes.findFirst
      .mockResolvedValueOnce({ createdBy: 'other-user-id' })   // 自我审批检查（先执行）
      .mockResolvedValueOnce({ id: MOCK_QUOTE_ID });           // preflightVersionCheck

    await approveQuote({ id: MOCK_QUOTE_ID, version: 5 });

    // 修复后：preflightVersionCheck 只做 SELECT，不触发 db.update
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('rejectQuote 正常版本检查：db.update 不被调用（preflightVersionCheck 为纯 SELECT）', async () => {
    const { rejectQuote } = await import('../quote-lifecycle-actions');

    // findFirst 返回版本匹配的记录
    mockDb.query.quotes.findFirst.mockResolvedValueOnce({ id: MOCK_QUOTE_ID });

    await rejectQuote({ id: MOCK_QUOTE_ID, rejectReason: 'test', version: 3 });

    // 修复后：preflightVersionCheck 只做 SELECT，不触发 db.update
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  // ── [TDD-新增] 2.4: preflightVersionCheck 不应递增版本 ──

  it('[2.4] preflightVersionCheck 版本不匹配时应只做 SELECT 校验，不递增版本', async () => {
    // 安排：模拟版本不匹配（SELECT 未找到对应版本记录）
    mockDb.query.quotes.findFirst.mockResolvedValueOnce(null);

    const { submitQuote } = await import('../quote-lifecycle-actions');

    // 断言：版本校验失败时应抛出并发冲突错误
    await expect(submitQuote({ id: MOCK_QUOTE_ID, version: 99 })).rejects.toThrow(
      '报价数据已被修改，请刷新后重试'
    );

    // 断言：发生预检失败时，db.update（版本递增）不应被调用
    // 修复前：preflightVersionCheck 用 UPDATE 递增版本；修复后：只做 SELECT
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('[2.4] preflightVersionCheck 版本匹配时：db.update 调用次数应为 0（版本管理下沉至 service）', async () => {
    // 安排：版本匹配（SELECT 找到记录）
    mockDb.query.quotes.findFirst.mockResolvedValueOnce({
      id: MOCK_QUOTE_ID,
      tenantId: MOCK_TENANT_ID,
      version: 5,
    });

    const { submitQuote } = await import('../quote-lifecycle-actions');

    // 修复后 preflightVersionCheck 只做 SELECT 校验，版本递增由 service 层负责
    // 因此 action 层的 db.update 不应出现
    await submitQuote({ id: MOCK_QUOTE_ID, version: 5 });
    expect(mockDb.update).toHaveBeenCalledTimes(0);
  });

  // ── [TDD-新增] 2.3: lockQuote 原子操作 ──

  it('[2.3] lockQuote 应通过原子 UPDATE 执行（不预先 SELECT 检查 lockedAt）', async () => {
    const { lockQuote } = await import('../quote-lifecycle-actions');

    await lockQuote({ id: MOCK_QUOTE_ID });

    // 修复后：原子 UPDATE WHERE lockedAt IS NULL，不再预先 SELECT
    expect(mockDb.update).toHaveBeenCalled();
    // 关键断言：findFirst 不应在锁定路径中被调用
    expect(mockDb.query.quotes.findFirst).not.toHaveBeenCalled();
  });

  it('[2.3] lockQuote 原子操作：若报价单已锁定（UPDATE 返回空）则抛出已锁定异常', async () => {
    // 安排：原子 UPDATE 影响 0 行（lockedAt IS NULL 条件不满足）
    mockUpdateChain.returning.mockResolvedValueOnce([]);
    // 安排：随后的 findFirst 回查返回有 lockedAt 的数据（表明已锁）
    mockDb.query.quotes.findFirst.mockResolvedValueOnce({
      lockedAt: new Date(),
    });
    const { lockQuote } = await import('../quote-lifecycle-actions');

    await expect(lockQuote({ id: MOCK_QUOTE_ID })).rejects.toThrow('该报价单已锁定');
  });
});

