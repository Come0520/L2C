/**
 * 展厅分享 API 路由测试（TDD Red → Green）
 *
 * 覆盖 4 条路由：
 * - POST /api/miniprogram/showroom/share/content      → getShareContent
 * - POST /api/miniprogram/showroom/share/view-stats    → reportViewStats
 * - GET  /api/miniprogram/showroom/share/view-stats/[shareId] → getViewStatsReport
 * - GET  /api/miniprogram/showroom/share/my-links      → getMyShareLinks
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import * as authUtils from '../auth-utils';

// ─── Mock: auth-utils ────────────────────────────────────────
vi.mock('../auth-utils', async () => {
  const actual = await vi.importActual('../auth-utils');
  return {
    ...actual,
    getMiniprogramUser: vi.fn(),
    withMiniprogramAuth: vi.fn((handler) => async (req: NextRequest, ctx?: any) => {
      const user = await (authUtils as any).getMiniprogramUser(req);
      if (!user) {
        return Response.json({ error: '请先登录' }, { status: 401 });
      }
      return handler(req, user, ctx);
    }),
  };
});

// ─── Mock: showroom actions ──────────────────────────────────
const mockGetShareContent = vi.fn();
const mockGetMyShareLinks = vi.fn();
vi.mock('@/features/showroom/actions/shares', () => ({
  getShareContent: (...args: any[]) => mockGetShareContent(...args),
  getMyShareLinks: (...args: any[]) => mockGetMyShareLinks(...args),
}));

const mockReportViewStats = vi.fn();
const mockGetViewStatsReport = vi.fn();
vi.mock('@/features/showroom/actions/view-stats', () => ({
  reportViewStats: (...args: any[]) => mockReportViewStats(...args),
  getViewStatsReport: (...args: any[]) => mockGetViewStatsReport(...args),
}));

// ─── Mock: ShowroomError ─────────────────────────────────────
vi.mock('@/features/showroom/errors', () => {
  class ShowroomError extends Error {
    errorDetail: { code: string; message: string };
    constructor(errDef: { code: string; message: string }) {
      super(errDef.message);
      this.errorDetail = errDef;
      this.name = 'ShowroomError';
    }
  }
  return {
    ShowroomError,
    ShowroomErrors: {
      SHARE_NOT_FOUND: { code: 'SHOWROOM_1201', message: '分享链接不存在或已失效' },
      SHARE_LOCKED: { code: 'SHOWROOM_1207', message: '该链接仅限指定客户访问' },
      UNAUTHORIZED: { code: 'SHOWROOM_1001', message: '未授权' },
      FORBIDDEN: { code: 'SHOWROOM_1002', message: '无权限' },
    },
  };
});

// ─── helpers ─────────────────────────────────────────────────
const MOCK_USER = { id: 'u-sales-001', tenantId: 't-001', role: 'SALES' };

const createPostReq = (url: string, body: unknown) =>
  new NextRequest(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer mock-token', 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const createGetReq = (url: string) =>
  new NextRequest(url, {
    method: 'GET',
    headers: { Authorization: 'Bearer mock-token' },
  });

// ═════════════════════════════════════════════════════════════
describe('展厅分享 API 路由', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authUtils.getMiniprogramUser).mockResolvedValue(MOCK_USER as any);
  });

  // ─────────────── 1. 获取分享内容 ───────────────
  describe('POST /showroom/share/content', () => {
    let handler: any;
    beforeEach(async () => {
      const mod = await import('../showroom/share/content/route');
      handler = mod.POST;
    });

    it('正常获取分享内容（200）', async () => {
      mockGetShareContent.mockResolvedValue({
        expired: false,
        items: [{ id: 'item-1', title: '测试商品' }],
        allowCustomerShare: false,
        sales: { name: '张三' },
      });

      const req = createPostReq('http://localhost/api/miniprogram/showroom/share/content', {
        shareId: '11111111-1111-1111-1111-111111111111',
        visitorUserId: '22222222-2222-2222-2222-222222222222',
      });
      const res = await handler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.items).toHaveLength(1);
      expect(data.data.expired).toBe(false);
    });

    it('分享不存在应返回 404', async () => {
      const { ShowroomError, ShowroomErrors } = await import('@/features/showroom/errors');
      mockGetShareContent.mockRejectedValue(new ShowroomError(ShowroomErrors.SHARE_NOT_FOUND));

      const req = createPostReq('http://localhost/api/miniprogram/showroom/share/content', {
        shareId: '33333333-3333-3333-3333-333333333333',
      });
      const res = await handler(req);

      expect(res.status).toBe(404);
    });

    it('身份锁定应返回 403', async () => {
      const { ShowroomError, ShowroomErrors } = await import('@/features/showroom/errors');
      mockGetShareContent.mockRejectedValue(new ShowroomError(ShowroomErrors.SHARE_LOCKED));

      const req = createPostReq('http://localhost/api/miniprogram/showroom/share/content', {
        shareId: '11111111-1111-1111-1111-111111111111',
        visitorUserId: 'wrong-user-id-00000000-0000-0000',
      });
      const res = await handler(req);

      expect(res.status).toBe(403);
    });

    it('未登录应返回 401', async () => {
      vi.mocked(authUtils.getMiniprogramUser).mockResolvedValue(null);

      const req = createPostReq('http://localhost/api/miniprogram/showroom/share/content', {
        shareId: '11111111-1111-1111-1111-111111111111',
      });
      const res = await handler(req);

      expect(res.status).toBe(401);
    });
  });

  // ─────────────── 2. 上报停留时间 ───────────────
  describe('POST /showroom/share/view-stats', () => {
    let handler: any;
    beforeEach(async () => {
      const mod = await import('../showroom/share/view-stats/route');
      handler = mod.POST;
    });

    it('正常上报（200）', async () => {
      mockReportViewStats.mockResolvedValue({ success: true, recordCount: 2 });

      const req = createPostReq('http://localhost/api/miniprogram/showroom/share/view-stats', {
        shareId: '11111111-1111-1111-1111-111111111111',
        visitorUserId: '22222222-2222-2222-2222-222222222222',
        items: [
          { itemId: 'item-1', durationSeconds: 30 },
          { itemId: 'item-2', durationSeconds: 45 },
        ],
      });
      const res = await handler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.recordCount).toBe(2);
    });

    it('分享不存在应返回 404', async () => {
      const { ShowroomError, ShowroomErrors } = await import('@/features/showroom/errors');
      mockReportViewStats.mockRejectedValue(new ShowroomError(ShowroomErrors.SHARE_NOT_FOUND));

      const req = createPostReq('http://localhost/api/miniprogram/showroom/share/view-stats', {
        shareId: '99999999-9999-9999-9999-999999999999',
        visitorUserId: '22222222-2222-2222-2222-222222222222',
        items: [{ itemId: 'item-1', durationSeconds: 10 }],
      });
      const res = await handler(req);

      expect(res.status).toBe(404);
    });

    it('未登录应返回 401', async () => {
      vi.mocked(authUtils.getMiniprogramUser).mockResolvedValue(null);

      const req = createPostReq('http://localhost/api/miniprogram/showroom/share/view-stats', {
        shareId: '11111111-1111-1111-1111-111111111111',
        visitorUserId: '22222222-2222-2222-2222-222222222222',
        items: [],
      });
      const res = await handler(req);

      expect(res.status).toBe(401);
    });
  });

  // ─────────────── 3. 获取浏览报告 ───────────────
  describe('GET /showroom/share/view-stats/[shareId]', () => {
    let handler: any;
    beforeEach(async () => {
      const mod = await import('../showroom/share/view-stats/[shareId]/route');
      handler = mod.GET;
    });

    it('正常获取报告（200）', async () => {
      mockGetViewStatsReport.mockResolvedValue({
        success: true,
        data: [
          { itemId: 'item-1', title: '商品A', totalDuration: 120, viewCount: 3, avgDuration: 40 },
        ],
      });

      const req = createGetReq(
        'http://localhost/api/miniprogram/showroom/share/view-stats/11111111-1111-1111-1111-111111111111'
      );
      const res = await handler(req, {
        params: Promise.resolve({ shareId: '11111111-1111-1111-1111-111111111111' }),
      });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data.data).toHaveLength(1);
      expect(data.data.data[0].totalDuration).toBe(120);
    });

    it('无权限应返回 403', async () => {
      const { ShowroomError, ShowroomErrors } = await import('@/features/showroom/errors');
      mockGetViewStatsReport.mockRejectedValue(new ShowroomError(ShowroomErrors.FORBIDDEN));

      const req = createGetReq(
        'http://localhost/api/miniprogram/showroom/share/view-stats/11111111-1111-1111-1111-111111111111'
      );
      const res = await handler(req, {
        params: Promise.resolve({ shareId: '11111111-1111-1111-1111-111111111111' }),
      });

      expect(res.status).toBe(403);
    });

    it('未登录应返回 401', async () => {
      vi.mocked(authUtils.getMiniprogramUser).mockResolvedValue(null);

      const req = createGetReq(
        'http://localhost/api/miniprogram/showroom/share/view-stats/11111111-1111-1111-1111-111111111111'
      );
      const res = await handler(req, {
        params: Promise.resolve({ shareId: '11111111-1111-1111-1111-111111111111' }),
      });

      expect(res.status).toBe(401);
    });
  });

  // ─────────────── 4. 我的分享列表 ───────────────
  describe('GET /showroom/share/my-links', () => {
    let handler: any;
    beforeEach(async () => {
      const mod = await import('../showroom/share/my-links/route');
      handler = mod.GET;
    });

    it('正常获取列表（200）', async () => {
      mockGetMyShareLinks.mockResolvedValue([
        { id: 'share-1', isActive: 1, views: 5 },
        { id: 'share-2', isActive: 0, views: 10 },
      ]);

      const req = createGetReq('http://localhost/api/miniprogram/showroom/share/my-links');
      const res = await handler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.data).toHaveLength(2);
    });

    it('未登录应返回 401', async () => {
      vi.mocked(authUtils.getMiniprogramUser).mockResolvedValue(null);

      const req = createGetReq('http://localhost/api/miniprogram/showroom/share/my-links');
      const res = await handler(req);

      expect(res.status).toBe(401);
    });
  });
});
