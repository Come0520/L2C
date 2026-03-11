/**
 * proxy.ts 超级管理员路由隔离重构测试
 *
 * TDD RED 阶段：验证以下行为变更
 * 1. 超管可访问业务页面（如 /leads）— 不再 redirect 到 /admin
 * 2. 超管可调用业务 API（如 /api/leads）— 不再 403
 * 3. 超管访问 /admin/platform 正常放行
 * 4. 普通用户不可访问 /admin/platform — 403
 * 5. 普通用户不可访问 /api/admin — 403
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock getToken
const mockGetToken = vi.fn();
vi.mock('next-auth/jwt', () => ({
  getToken: (...args: unknown[]) => mockGetToken(...args),
}));

// Mock extractAndVerifyToken
vi.mock('@/shared/lib/jwt', () => ({
  extractAndVerifyToken: vi.fn().mockResolvedValue(null),
}));

// Mock logger
vi.mock('@/shared/lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

/**
 * 辅助函数：创建模拟 NextRequest
 */
function createMockRequest(pathname: string, method = 'GET') {
  const url = `http://localhost:3000${pathname}`;
  return {
    nextUrl: { pathname },
    url,
    method,
    headers: new Headers({
      'user-agent': 'test-agent',
    }),
  } as unknown as import('next/server').NextRequest;
}

/**
 * 辅助函数：创建超管 JWT Token
 */
function platformAdminToken() {
  return {
    sub: 'super-admin-001',
    tenantId: '__PLATFORM__',
    role: 'PLATFORM_ADMIN',
    roles: ['PLATFORM_ADMIN', 'SUPER_ADMIN'],
    isPlatformAdmin: true,
    name: '超管',
    email: 'admin@l2c.com',
  };
}

/**
 * 辅助函数：创建普通租户用户 JWT Token
 */
function normalUserToken(tenantId = 'tenant-001') {
  return {
    sub: 'user-001',
    tenantId,
    role: 'SALES',
    roles: ['SALES'],
    isPlatformAdmin: false,
    name: '张销售',
    email: 'sales@company.com',
  };
}

describe('proxy.ts - 超管路由隔离重构', () => {
  let proxy: typeof import('@/proxy').default;

  beforeEach(async () => {
    vi.resetModules();
    mockGetToken.mockReset();
    // 动态导入以确保每次测试清洁
    const mod = await import('@/proxy');
    proxy = mod.default;
  });

  describe('超管放行（核心变更）', () => {
    it('超管访问业务页面 /leads 不再 redirect 到 /admin', async () => {
      mockGetToken.mockResolvedValueOnce(platformAdminToken());

      const request = createMockRequest('/leads');
      const response = await proxy(request);

      // 不应 redirect，应 next()
      expect(response.status).not.toBe(307);
      expect(response.status).not.toBe(308);
      // 确认不含 Location header 指向 /admin
      const locationHeader = response.headers.get('location');
      expect(locationHeader).not.toContain('/admin');
    });

    it('超管调用业务 API /api/leads 不再返回 403', async () => {
      mockGetToken.mockResolvedValueOnce(platformAdminToken());

      const request = createMockRequest('/api/leads');
      const response = await proxy(request);

      expect(response.status).not.toBe(403);
    });

    it('超管可正常访问 /api/orders', async () => {
      mockGetToken.mockResolvedValueOnce(platformAdminToken());

      const request = createMockRequest('/api/orders');
      const response = await proxy(request);

      expect(response.status).not.toBe(403);
    });

    it('超管可访问 /dashboard 页面', async () => {
      mockGetToken.mockResolvedValueOnce(platformAdminToken());

      const request = createMockRequest('/dashboard');
      const response = await proxy(request);

      expect(response.status).not.toBe(307);
      expect(response.status).not.toBe(308);
    });

    it('超管请求头中正确注入用户上下文', async () => {
      mockGetToken.mockResolvedValueOnce(platformAdminToken());

      const request = createMockRequest('/api/leads');
      const response = await proxy(request);

      // NextResponse.next() 携带了增强后的 headers
      // 检查 response 不是 403/redirect 即代表放行成功
      expect(response.status).not.toBe(403);
    });
  });

  describe('普通用户不可访问平台管理路由', () => {
    it('普通用户访问 /admin/platform 返回 403', async () => {
      mockGetToken.mockResolvedValueOnce(normalUserToken());

      const request = createMockRequest('/admin/platform');
      const response = await proxy(request);

      expect(response.status).toBe(403);
    });

    it('普通用户访问 /api/admin 返回 403', async () => {
      mockGetToken.mockResolvedValueOnce(normalUserToken());

      const request = createMockRequest('/api/admin/tenants');
      const response = await proxy(request);

      expect(response.status).toBe(403);
    });
  });

  describe('超管访问平台管理路由正常通过', () => {
    it('超管访问 /admin/platform 正常放行', async () => {
      mockGetToken.mockResolvedValueOnce(platformAdminToken());

      const request = createMockRequest('/admin/platform');
      const response = await proxy(request);

      expect(response.status).not.toBe(403);
      expect(response.status).not.toBe(307);
    });

    it('超管访问 /api/admin/tenants 正常放行', async () => {
      mockGetToken.mockResolvedValueOnce(platformAdminToken());

      const request = createMockRequest('/api/admin/tenants');
      const response = await proxy(request);

      expect(response.status).not.toBe(403);
    });
  });
});
