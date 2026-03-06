/**
 * 租户存储配额 API 测试（TDD — vitest 风格）
 *
 * T12: GET /api/miniprogram/storage/quota
 *   - 已认证用户成功获取当前租户配额
 *   - action 报错时返回 500
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import * as authUtils from '../auth-utils';

// ─── Mock: auth-utils ──────────────────────────────────────────
vi.mock('../auth-utils', async () => {
  const actual = await vi.importActual('../auth-utils');
  return {
    ...actual,
    getMiniprogramUser: vi.fn(),
    withMiniprogramAuth: vi.fn((handler) => async (req: NextRequest, ctx?: unknown) => {
      const user = await (
        authUtils as { getMiniprogramUser: (req: NextRequest) => Promise<unknown> }
      ).getMiniprogramUser(req);
      if (!user) return Response.json({ error: '请先登录' }, { status: 401 });
      return handler(req, user, ctx);
    }),
  };
});

// ─── Mock: storage action ──────────────────────────────────────
const mockGetTenantStorageQuota = vi.fn();
vi.mock('@/features/measure/actions/storage', () => ({
  getTenantStorageQuota: (...args: unknown[]) => mockGetTenantStorageQuota(...args),
}));

// ─── 帮助函数 ──────────────────────────────────────────────────
const MOCK_USER = { id: 'user_001', tenantId: 'tenant_001', role: 'WORKER' };

const makeGetReq = (url = 'http://localhost/api/miniprogram/storage/quota') =>
  new NextRequest(url, {
    method: 'GET',
    headers: { Authorization: 'Bearer mock-token' },
  });

// ═══════════════════════════════════════════════════════════════
describe('GET /api/miniprogram/storage/quota — 租户存储配额', () => {
  let handler:
    | Awaited<
        ReturnType<
          typeof import('../storage/quota/route').GET extends (...args: infer A) => infer R
            ? (...args: A) => R
            : never
        >
      >
    | unknown;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.mocked(
      authUtils.getMiniprogramUser as unknown as (req: NextRequest) => Promise<unknown>
    ).mockResolvedValue(MOCK_USER);
    const mod = await import('../storage/quota/route');
    handler = mod.GET;
  });

  it('T12a: 认证用户成功获取配额信息', async () => {
    mockGetTenantStorageQuota.mockResolvedValue({
      used: 1073741824,
      total: 5368709120,
      usedMB: 1024,
      totalMB: 5120,
      usagePercent: 20,
    });

    const res = await (handler as (req: NextRequest) => Promise<Response>)(makeGetReq());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toMatchObject({
      usedMB: 1024,
      totalMB: 5120,
      usagePercent: 20,
    });
    expect(mockGetTenantStorageQuota).toHaveBeenCalledWith('tenant_001');
  });

  it('T12b: action 抛出错误时返回 500', async () => {
    mockGetTenantStorageQuota.mockRejectedValue(new Error('DB Error'));

    const res = await (handler as (req: NextRequest) => Promise<Response>)(makeGetReq());
    expect(res.status).toBe(500);
  });

  it('T12c: 未登录用户返回 401', async () => {
    vi.mocked(
      authUtils.getMiniprogramUser as unknown as (req: NextRequest) => Promise<unknown>
    ).mockResolvedValue(null);

    const res = await (handler as (req: NextRequest) => Promise<Response>)(makeGetReq());
    expect(res.status).toBe(401);
  });
});
