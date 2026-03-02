/**
 * AuthAuditService 审计服务单元测试
 *
 * 覆盖范围：
 * - logLoginSuccess — 登录成功审计
 * - logMagicLinkLogin — 魔术链接登录审计
 * - logLoginFailed — 登录失败审计
 * - logLogout — 注销审计
 * - logPasswordResetRequested — 密码重置请求审计
 * - logPasswordResetCompleted — 密码重置完成审计
 *
 * @since v1.2.5
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

/** ─────────── Hoisted Mock Refs ─────────── */
const { mockAuditLog } = vi.hoisted(() => ({
  mockAuditLog: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/shared/services/audit-service', () => ({
  AuditService: { log: mockAuditLog },
}));

/** ─────────── 常量 ─────────── */
const MOCK_DB = {} as any; // 仅作为透传参数，不实际调用
const TENANT_ID = 'tenant-test-001';
const USER_ID = 'user-test-001';

describe('AuthAuditService', () => {
  let AuthAuditService: typeof import('../services/auth-audit').AuthAuditService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('../services/auth-audit');
    AuthAuditService = mod.AuthAuditService;
  });

  // ── logLoginSuccess ──

  it('logLoginSuccess 应记录 LOGIN 操作及 userAgent', async () => {
    await AuthAuditService.logLoginSuccess(MOCK_DB, {
      userId: USER_ID,
      tenantId: TENANT_ID,
      userAgent: 'Mozilla/5.0 Test',
    });

    expect(mockAuditLog).toHaveBeenCalledWith(MOCK_DB, {
      tableName: 'users',
      recordId: USER_ID,
      action: 'LOGIN',
      tenantId: TENANT_ID,
      userId: USER_ID,
      details: {
        userAgent: 'Mozilla/5.0 Test',
        authType: 'credentials',
      },
    });
  });

  // ── logMagicLinkLogin ──

  it('logMagicLinkLogin 应记录 MAGIC_LOGIN 操作及 generatedBy', async () => {
    await AuthAuditService.logMagicLinkLogin(MOCK_DB, {
      userId: USER_ID,
      tenantId: TENANT_ID,
      generatedBy: 'admin-001',
    });

    expect(mockAuditLog).toHaveBeenCalledWith(MOCK_DB, {
      tableName: 'users',
      recordId: USER_ID,
      action: 'MAGIC_LOGIN',
      tenantId: TENANT_ID,
      userId: USER_ID,
      details: {
        authType: 'magic_link',
        generatedBy: 'admin-001',
      },
    });
  });

  // ── logLoginFailed ──

  it('logLoginFailed 应记录 LOGIN_FAILED 及拒绝原因', async () => {
    await AuthAuditService.logLoginFailed(MOCK_DB, {
      username: 'te***@test.com',
      reason: 'credentials',
      userAgent: 'Bot/1.0',
    });

    expect(mockAuditLog).toHaveBeenCalledWith(MOCK_DB, {
      tableName: 'users',
      recordId: 'auth',
      action: 'LOGIN_FAILED',
      tenantId: 'system',
      userId: 'system',
      details: {
        usernameMasked: 'te***@test.com',
        reason: 'credentials',
        userAgent: 'Bot/1.0',
      },
    });
  });

  // ── logLogout ──

  it('logLogout 应记录 LOGOUT 操作', async () => {
    await AuthAuditService.logLogout(MOCK_DB, {
      userId: USER_ID,
      tenantId: TENANT_ID,
    });

    expect(mockAuditLog).toHaveBeenCalledWith(MOCK_DB, {
      tableName: 'users',
      recordId: USER_ID,
      action: 'LOGOUT',
      tenantId: TENANT_ID,
      userId: USER_ID,
    });
  });

  // ── logPasswordResetRequested ──

  it('logPasswordResetRequested 应记录请求并脱敏邮箱', async () => {
    await AuthAuditService.logPasswordResetRequested(MOCK_DB, {
      userId: USER_ID,
      tenantId: TENANT_ID,
      email: 'testuser@example.com',
    });

    expect(mockAuditLog).toHaveBeenCalledWith(MOCK_DB, {
      tableName: 'users',
      recordId: USER_ID,
      action: 'PASSWORD_RESET_REQUESTED',
      tenantId: TENANT_ID,
      userId: USER_ID,
      details: {
        // 'te***@example.com' — password-reset 审计使用正则脱敏
        emailMasked: expect.stringContaining('***'),
      },
    });
  });

  // ── logPasswordResetCompleted ──

  it('logPasswordResetCompleted 应记录密码重置完成', async () => {
    await AuthAuditService.logPasswordResetCompleted(MOCK_DB, {
      userId: USER_ID,
      tenantId: TENANT_ID,
    });

    expect(mockAuditLog).toHaveBeenCalledWith(MOCK_DB, {
      tableName: 'users',
      recordId: USER_ID,
      action: 'PASSWORD_RESET_COMPLETED',
      tenantId: TENANT_ID,
      userId: USER_ID,
    });
  });
});
