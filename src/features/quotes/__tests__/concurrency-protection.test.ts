import { describe, it, expect, beforeEach, vi } from 'vitest';
import { submitQuoteAction } from '../actions/quote-lifecycle-actions';

// 下面的模块在 quote-lifecycle-actions.ts 中被直接调用，必须 mock
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// 使用 vi.hoisted 提升所有 mock 变量，避免工厂闭包报错
const {
  mockUpdate,
  mockFindFirst,
  mockCheckPermission,
  mockAuth,
  mockQuoteLifecycleSubmit,
  mockAuditRecordFromSession,
} = vi.hoisted(() => ({
  mockUpdate: vi.fn(),
  mockFindFirst: vi.fn(),
  mockCheckPermission: vi.fn(),
  mockAuth: vi.fn(),
  mockQuoteLifecycleSubmit: vi.fn(),
  mockAuditRecordFromSession: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
  db: {
    update: mockUpdate,
    // preflightVersionCheck 已改为纯 SELECT，需要 mock db.query.quotes.findFirst
    query: {
      quotes: {
        findFirst: mockFindFirst,
      },
    },
  },
}));

vi.mock('@/shared/lib/auth', () => ({
  auth: mockAuth,
  checkPermission: mockCheckPermission,
}));

vi.mock('@/services/quote-lifecycle.service', () => ({
  QuoteLifecycleService: {
    submit: mockQuoteLifecycleSubmit,
  },
}));

// AuditService.recordFromSession 内部会尝试访问 DB
// 需要 mock 避免真实 DB 操作
vi.mock('@/shared/services/audit-service', () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
  AuditService: {
    record: vi.fn().mockResolvedValue(undefined),
    recordFromSession: mockAuditRecordFromSession,
  },
}));

describe('报价单并发保护测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重新设置 hoisted mock 的默认返回值（clearAllMocks 会清除实现）
    mockAuth.mockResolvedValue({ user: { id: 'test-user-id', tenantId: 'test-tenant-id' } });
    mockCheckPermission.mockResolvedValue(true);
    mockQuoteLifecycleSubmit.mockResolvedValue(undefined);
    mockAuditRecordFromSession.mockResolvedValue(undefined);
  });

  it('版本号不匹配时应阻断更新 (乐观锁验证)', async () => {
    // preflightVersionCheck 用 eq(quotes.version, version) 查询：
    // 若 DB 中找不到对应 version 的记录（返回 undefined），说明版本已被修改 → 抛出锁冲突
    // 因此 mock findFirst 返回 undefined 即模拟"当前 DB 版本已不是 1"
    mockFindFirst.mockResolvedValueOnce(undefined);

    const result = await submitQuoteAction({
      id: '110e8400-e29b-41d4-a716-446655440000',
      version: 1, // 携带旧版本号，而 DB 中已无 version=1 的记录
    });

    // 断言返回并发冲突错误
    expect(result).toMatchObject({
      error: expect.stringContaining('报价数据已被修改'),
    });
  });

  it('未提供版本号时应跳过检查 (兼容性)', async () => {
    // 没有传入 version，preflightVersionCheck 直接返回，不调用 findFirst
    // submitQuote 内部的 submitById 查询需要 findFirst 返回合法记录
    // 但这里我们做最简单的测试：QuoteLifecycleService.submit 已 mock，直接验证无 error
    const result = await submitQuoteAction({
      id: '110e8400-e29b-41d4-a716-446655440000',
      // 没有 version 字段
    });

    expect(result?.error).toBeUndefined();
  });
});
