/**
 * Magic Login API 路由测试
 *
 * 覆盖范围：
 * - 缺少 token 参数 → 302 重定向 /login?error=invalid_magic_link
 * - Token 无效/已使用 → 302 重定向 /login?error=magic_link_expired
 * - Token 已过期 → 302 重定向 /login?error=magic_link_expired
 * - 用户不存在/已停用 → 302 重定向 /login?error=account_inactive
 * - 成功场景 → 标记已用 + 生成重置 token + JWT cookie + 302 重定向
 *
 * @since v1.2.5
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

/** ─────────── Hoisted Mock Refs ─────────── */
const {
  mockDbQueryVC,
  mockDbQueryUsers,
  mockDbUpdate,
  mockDbUpdateSet,
  mockDbInsert,
  mockDbInsertValues,
  mockEncode,
  mockUuidv4,
  mockAuditLog,
} = vi.hoisted(() => {
  const mockUpdateSetWhere = vi.fn().mockResolvedValue(undefined);
  const mockUpdateSetFn = vi.fn().mockReturnValue({ where: mockUpdateSetWhere });
  const mockInsertValuesFn = vi.fn().mockResolvedValue(undefined);

  return {
    mockDbQueryVC: { findFirst: vi.fn() },
    mockDbQueryUsers: { findFirst: vi.fn() },
    mockDbUpdate: vi.fn().mockReturnValue({ set: mockUpdateSetFn }),
    mockDbUpdateSet: mockUpdateSetFn,
    mockDbInsert: vi.fn().mockReturnValue({ values: mockInsertValuesFn }),
    mockDbInsertValues: mockInsertValuesFn,
    mockEncode: vi.fn().mockResolvedValue('mock-jwt-token'),
    mockUuidv4: vi.fn().mockReturnValue('mock-reset-token'),
    mockAuditLog: vi.fn().mockResolvedValue(undefined),
  };
});

/** ─────────── 顶层 Mock 配置 ─────────── */
vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      verificationCodes: mockDbQueryVC,
      users: mockDbQueryUsers,
    },
    update: mockDbUpdate,
    insert: mockDbInsert,
  },
}));

vi.mock('@/shared/api/schema', () => ({
  users: { id: 'id', isActive: 'isActive' },
}));

vi.mock('@/shared/api/schema/verification_codes', () => ({
  verificationCodes: { id: 'id', token: 'token', type: 'type', used: 'used' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
  and: vi.fn((...args: unknown[]) => args),
}));

vi.mock('next-auth/jwt', () => ({
  encode: mockEncode,
}));

vi.mock('uuid', () => ({
  v4: mockUuidv4,
}));

vi.mock('@/shared/services/audit-service', () => ({
  AuditService: { log: mockAuditLog },
}));

vi.mock('@/shared/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

/** ─────────── 工具函数 ─────────── */
function createRequest(url: string): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'));
}

/** ─────────── 测试常量 ─────────── */
const MOCK_ACTIVE_CODE = {
  id: 'vc-magic-001',
  userId: 'user-001',
  token: 'valid-magic-token',
  type: 'MAGIC_LOGIN',
  used: false,
  expiresAt: new Date(Date.now() + 3600000), // 1 小时后过期
};

const MOCK_ACTIVE_USER = {
  id: 'user-001',
  name: '测试用户',
  email: 'test@example.com',
  avatarUrl: null,
  role: 'BOSS',
  roles: ['BOSS'],
  tenantId: 'tenant-001',
  isPlatformAdmin: false,
  isActive: true,
};

describe('GET /api/auth/magic-login', () => {
  let GET: typeof import('../route').GET;

  beforeEach(async () => {
    vi.clearAllMocks();
    // 设置环境变量
    process.env.AUTH_SECRET = 'test-secret-key-for-jwt';
    process.env.NODE_ENV = 'test';

    const mod = await import('../route');
    GET = mod.GET;
  });

  it('缺少 token 参数时应重定向到登录页', async () => {
    const request = createRequest('/api/auth/magic-login');
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('/login');
    expect(location).toContain('error=invalid_magic_link');
  });

  it('Token 无效/已使用时应重定向到登录页', async () => {
    mockDbQueryVC.findFirst.mockResolvedValue(null);

    const request = createRequest('/api/auth/magic-login?token=bad-token');
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('error=magic_link_expired');
  });

  it('Token 已过期时应重定向到登录页', async () => {
    mockDbQueryVC.findFirst.mockResolvedValue({
      ...MOCK_ACTIVE_CODE,
      expiresAt: new Date(Date.now() - 3600000), // 1 小时前已过期
    });

    const request = createRequest('/api/auth/magic-login?token=expired-token');
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('error=magic_link_expired');
  });

  it('用户不存在时应重定向到登录页', async () => {
    mockDbQueryVC.findFirst.mockResolvedValue(MOCK_ACTIVE_CODE);
    mockDbQueryUsers.findFirst.mockResolvedValue(null);

    const request = createRequest('/api/auth/magic-login?token=valid-magic-token');
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('error=account_inactive');
  });

  it('用户已停用时应重定向到登录页', async () => {
    mockDbQueryVC.findFirst.mockResolvedValue(MOCK_ACTIVE_CODE);
    mockDbQueryUsers.findFirst.mockResolvedValue({ ...MOCK_ACTIVE_USER, isActive: false });

    const request = createRequest('/api/auth/magic-login?token=valid-magic-token');
    const response = await GET(request);

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('error=account_inactive');
  });

  it('成功场景：标记 token 已用 → 生成重置 token → 签发 JWT → 重定向', async () => {
    mockDbQueryVC.findFirst.mockResolvedValue(MOCK_ACTIVE_CODE);
    mockDbQueryUsers.findFirst.mockResolvedValue(MOCK_ACTIVE_USER);

    const request = createRequest('/api/auth/magic-login?token=valid-magic-token');
    const response = await GET(request);

    // 应重定向到密码重置页
    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toContain('/reset-password');
    expect(location).toContain('token=mock-reset-token');

    // 应标记原始 magic token 为已使用
    expect(mockDbUpdate).toHaveBeenCalled();
    expect(mockDbUpdateSet).toHaveBeenCalledWith({ used: true });

    // 应生成新的密码重置 token
    expect(mockDbInsert).toHaveBeenCalled();
    expect(mockDbInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: MOCK_ACTIVE_USER.id,
        token: 'mock-reset-token',
        type: 'PASSWORD_RESET',
      })
    );

    // 应签发 JWT
    expect(mockEncode).toHaveBeenCalledWith(
      expect.objectContaining({
        token: expect.objectContaining({
          sub: MOCK_ACTIVE_USER.id,
          tenantId: MOCK_ACTIVE_USER.tenantId,
        }),
      })
    );

    // 应设置 session cookie
    const cookies = response.cookies.getAll();
    const sessionCookie = cookies.find((c) => c.name.includes('session-token'));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie!.value).toBe('mock-jwt-token');

    // 应记录审计日志
    expect(mockAuditLog).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: 'MAGIC_LOGIN_SUCCESS',
        userId: MOCK_ACTIVE_USER.id,
        tenantId: MOCK_ACTIVE_USER.tenantId,
      })
    );
  });
});
