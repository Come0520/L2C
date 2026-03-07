import { describe, expect, it, vi, beforeEach } from 'vitest';

/**
 * TDD 测试 — AI 渲染查询层（queries.ts）
 * 由于依赖 DB + Auth，使用 vi.mock 进行隔离测试
 */

// Mock auth 模块
vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
}));

// Mock DB 模块
vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      aiRenderings: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

import { auth } from '@/shared/lib/auth';
import { getMyRenderingHistory, getCreditBalance, getRenderingById } from '../queries';

const mockAuth = vi.mocked(auth);

describe('getMyRenderingHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未登录时应抛出 Unauthorized 错误', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getMyRenderingHistory()).rejects.toThrow('Unauthorized');
  });

  it('有合法 session 时应正常返回（此处 mock DB 返回空数组）', async () => {
    mockAuth.mockResolvedValue({
      user: { tenantId: 'tenant-123', id: 'user-456' },
    } as Awaited<ReturnType<typeof auth>>);

    const { db } = await import('@/shared/api/db');
    vi.mocked(db.query.aiRenderings.findMany).mockResolvedValue([]);

    const result = await getMyRenderingHistory();
    expect(result).toEqual([]);
  });
});

describe('getCreditBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未登录时应抛出 Unauthorized 错误', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getCreditBalance()).rejects.toThrow('Unauthorized');
  });
});

describe('getRenderingById', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未登录时应抛出 Unauthorized 错误', async () => {
    mockAuth.mockResolvedValue(null);
    await expect(getRenderingById({ id: 'test-id' })).rejects.toThrow('Unauthorized');
  });
});
