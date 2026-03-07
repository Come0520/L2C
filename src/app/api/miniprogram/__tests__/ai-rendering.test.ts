/**
 * TDD 测试 — 小程序 AI 渲染 API Route
 * 覆盖 POST /api/miniprogram/ai-rendering 和 GET /api/miniprogram/ai-rendering/history
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---- Mock withMiniprogramAuth（绕过认证，直接传入 user） ----
vi.mock('../auth-utils', () => ({
  withMiniprogramAuth: vi.fn(
    (
      handler: (req: NextRequest, user: Record<string, unknown>) => Promise<Response>,
      _roles: string[]
    ) => {
      // 返回一个函数，直接用 mockUser 调用 handler
      return async (req: NextRequest) => {
        const mockUser = {
          id: 'user-001',
          tenantId: 'tenant-001',
          role: 'SALES',
          planType: 'pro',
          tenantName: '测试门店',
        };
        return handler(req, mockUser);
      };
    }
  ),
}));

// ---- Mock Core Server Actions ----
vi.mock('@/features/ai-rendering/actions/generate', () => ({
  generateAiRendering: vi.fn(),
}));

vi.mock('@/features/ai-rendering/actions/queries', () => ({
  getMyRenderingHistory: vi.fn(),
  getCreditBalance: vi.fn(),
}));

import { POST, GET } from '../ai-rendering/route';
import { generateAiRendering } from '@/features/ai-rendering/actions/generate';
import { getMyRenderingHistory, getCreditBalance } from '@/features/ai-rendering/actions/queries';

const mockGenerate = vi.mocked(generateAiRendering);
const mockHistory = vi.mocked(getMyRenderingHistory);
const mockBalance = vi.mocked(getCreditBalance);

// ==================== POST 测试 ====================

describe('POST /api/miniprogram/ai-rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('缺少 originalImageBase64 时应返回 400', async () => {
    const req = new NextRequest('http://localhost/api/miniprogram/ai-rendering', {
      method: 'POST',
      body: JSON.stringify({
        curtainStyleId: 'track_double',
        fabricDescription: '米白色棉麻',
        fabricSource: 'showroom',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it('调用 generateAiRendering 成功时应返回 200 和效果图', async () => {
    mockGenerate.mockResolvedValue({
      success: true,
      renderingId: 'rend-001',
      resultImageBase64: 'data:image/png;base64,abc',
      creditsUsed: 2,
    });

    const req = new NextRequest('http://localhost/api/miniprogram/ai-rendering', {
      method: 'POST',
      body: JSON.stringify({
        originalImageBase64: 'base64data',
        curtainStyleId: 'track_double',
        fabricDescription: '米白色棉麻',
        fabricSource: 'showroom',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.renderingId).toBe('rend-001');
    expect(body.data.creditsUsed).toBe(2);
  });

  it('generateAiRendering 返回 success:false 时应返回 422', async () => {
    mockGenerate.mockResolvedValue({
      success: false,
      error: '积分不足：当月剩余 0 点',
    });

    const req = new NextRequest('http://localhost/api/miniprogram/ai-rendering', {
      method: 'POST',
      body: JSON.stringify({
        originalImageBase64: 'base64data',
        curtainStyleId: 'track_double',
        fabricDescription: '米白色棉麻',
        fabricSource: 'showroom',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain('积分不足');
  });
});

// ==================== GET 测试 ====================

describe('GET /api/miniprogram/ai-rendering/history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('成功时返回历史列表和积分余额', async () => {
    mockHistory.mockResolvedValue([
      { id: 'rend-001', status: 'completed', createdAt: new Date() } as any,
    ]);
    mockBalance.mockResolvedValue({
      total: 30,
      used: 4,
      remaining: 26,
      planType: 'pro',
    });

    const req = new NextRequest('http://localhost/api/miniprogram/ai-rendering/history');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.history).toHaveLength(1);
    expect(body.data.credits.remaining).toBe(26);
  });
});
