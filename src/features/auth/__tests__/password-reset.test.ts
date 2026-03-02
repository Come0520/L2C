/**
 * 密码重置流程完整测试
 *
 * 覆盖范围：
 * - requestPasswordReset（请求重置）
 *   - 邮箱格式非法
 *   - 邮箱不存在（防枚举攻击：仍返回 success）
 *   - 正常流程：生成 token → 插入 DB → 发邮件 → 审计
 *   - DB 异常时返回统一错误
 * - resetPassword（执行重置）
 *   - 密码太短校验失败
 *   - Token 无效/过期
 *   - 正常流程：事务更新密码 + 核销 token + 审计
 *
 * @since v1.2.5
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

/** ─────────── Hoisted Mock Refs ─────────── */
const {
  mockDbSelect,
  mockDbInsert,
  mockDbInsertValues,
  mockDbQueryUsers,
  mockDbQueryVC,
  mockDbUpdate,
  mockDbTransaction,
  mockSendEmail,
  mockHash,
  mockUuidv4,
  mockAuditLog,
} = vi.hoisted(() => {
  const mockInsertValuesFn = vi.fn().mockResolvedValue(undefined);
  const mockUpdateSetFn = vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue(undefined),
  });

  return {
    mockDbSelect: vi.fn(),
    mockDbInsert: vi.fn().mockReturnValue({ values: mockInsertValuesFn }),
    mockDbInsertValues: mockInsertValuesFn,
    mockDbQueryUsers: { findFirst: vi.fn() },
    mockDbQueryVC: { findFirst: vi.fn() },
    mockDbUpdate: vi.fn().mockReturnValue({ set: mockUpdateSetFn }),
    mockDbTransaction: vi.fn(),
    mockSendEmail: vi.fn().mockResolvedValue(undefined),
    mockHash: vi.fn().mockResolvedValue('$2a$10$hashed_password'),
    mockUuidv4: vi.fn().mockReturnValue('mock-uuid-token-123'),
    mockAuditLog: vi.fn().mockResolvedValue(undefined),
  };
});

/** ─────────── 顶层 Mock 配置 ─────────── */
vi.mock('@/shared/api/db', () => ({
  db: {
    select: mockDbSelect,
    insert: mockDbInsert,
    query: {
      users: mockDbQueryUsers,
      verificationCodes: mockDbQueryVC,
    },
    update: mockDbUpdate,
    transaction: mockDbTransaction,
  },
}));

vi.mock('@/shared/api/schema', () => ({
  users: {
    id: 'id',
    email: 'email',
    tenantId: 'tenantId',
    name: 'name',
    passwordHash: 'passwordHash',
    updatedAt: 'updatedAt',
  },
  verificationCodes: {
    id: 'id',
    userId: 'userId',
    token: 'token',
    type: 'type',
    used: 'used',
    expiresAt: 'expiresAt',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
  and: vi.fn((...args: unknown[]) => args),
  gt: vi.fn((...args: unknown[]) => args),
}));

vi.mock('@/shared/lib/email', () => ({
  sendEmail: mockSendEmail,
}));

vi.mock('bcryptjs', () => ({
  hash: mockHash,
}));

vi.mock('uuid', () => ({
  v4: mockUuidv4,
}));

vi.mock('@/shared/lib/auth-constants', () => ({
  BCRYPT_ROUNDS: 10,
}));

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../services/auth-audit', () => ({
  AuthAuditService: {
    logPasswordResetRequested: mockAuditLog,
    logPasswordResetCompleted: mockAuditLog,
  },
}));

/** ─────────── 测试常量 ─────────── */
const MOCK_USER = {
  id: 'user-001',
  tenantId: 'tenant-001',
  name: '测试用户',
  email: 'test@example.com',
};

describe('requestPasswordReset', () => {
  let requestPasswordReset: typeof import('../actions/password-reset').requestPasswordReset;

  beforeEach(async () => {
    vi.clearAllMocks();
    // 默认的 select chain mock
    const selectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([MOCK_USER]),
    };
    mockDbSelect.mockReturnValue(selectChain);

    const mod = await import('../actions/password-reset');
    requestPasswordReset = mod.requestPasswordReset;
  });

  it('邮箱格式非法时返回验证失败', async () => {
    const result = await requestPasswordReset({ email: 'not-an-email' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('输入验证失败');
  });

  it('邮箱不存在时仍返回 success（防枚举攻击）', async () => {
    const selectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // 空结果 = 用户不存在
    };
    mockDbSelect.mockReturnValue(selectChain);

    const result = await requestPasswordReset({ email: 'nobody@example.com' });
    expect(result.success).toBe(true);
    // 不应发邮件
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('邮箱存在时应生成 token、插入 DB、发邮件、记录审计', async () => {
    const result = await requestPasswordReset({ email: 'test@example.com' });

    expect(result.success).toBe(true);
    // 生成 token
    expect(mockUuidv4).toHaveBeenCalled();
    // 插入 verification_codes
    expect(mockDbInsert).toHaveBeenCalled();
    expect(mockDbInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: MOCK_USER.id,
        email: 'test@example.com',
        token: 'mock-uuid-token-123',
        type: 'PASSWORD_RESET',
      })
    );
    // 发送邮件
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: expect.stringContaining('密码重置'),
      })
    );
    // 审计日志
    expect(mockAuditLog).toHaveBeenCalled();
  });

  it('DB 异常时返回统一错误信息', async () => {
    const selectChain = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockRejectedValue(new Error('DB 连接失败')),
    };
    mockDbSelect.mockReturnValue(selectChain);

    const result = await requestPasswordReset({ email: 'test@example.com' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('发生错误');
  });
});

describe('resetPassword', () => {
  let resetPassword: typeof import('../actions/password-reset').resetPassword;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../actions/password-reset');
    resetPassword = mod.resetPassword;
  });

  it('密码太短时返回验证失败', async () => {
    const result = await resetPassword({
      token: 'some-token',
      newPassword: '123',
    });
    expect(result.success).toBe(false);
    expect(result.error).toBe('输入验证失败');
  });

  it('Token 无效/过期时返回友好提示', async () => {
    mockDbQueryVC.findFirst.mockResolvedValue(null);

    const result = await resetPassword({
      token: 'expired-token',
      newPassword: 'ValidPassword123!',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('无效或已过期');
  });

  it('Token 有效时应执行事务完成密码重置', async () => {
    // 设置有效的验证码记录
    mockDbQueryVC.findFirst.mockResolvedValue({
      id: 'vc-001',
      userId: MOCK_USER.id,
      token: 'valid-token',
      type: 'PASSWORD_RESET',
      used: false,
      expiresAt: new Date(Date.now() + 3600000),
    });
    // 找到对应用户
    mockDbQueryUsers.findFirst.mockResolvedValue(MOCK_USER);
    // 事务 mock：直接执行回调
    mockDbTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
      const mockTx = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(undefined),
          }),
        }),
      };
      await cb(mockTx);
    });

    const result = await resetPassword({
      token: 'valid-token',
      newPassword: 'NewSecurePassword123!',
    });

    expect(result.success).toBe(true);
    // 应调用 bcrypt hash
    expect(mockHash).toHaveBeenCalledWith('NewSecurePassword123!', 10);
    // 事务应被执行
    expect(mockDbTransaction).toHaveBeenCalled();
  });
});
