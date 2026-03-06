import { vi, describe, it, expect, beforeEach } from 'vitest';
import { reportViewStats, getViewStatsReport } from '../view-stats';
import { ShowroomErrors } from '../../errors';
import { auth } from '@/shared/lib/auth';

// Hoist mocks
const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  mockSelectResult: [] as any[],
}));

// insert 链式 mock
mocks.insert.mockReturnValue({ values: vi.fn().mockResolvedValue([]) });

vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      showroomShares: { findFirst: mocks.findFirst },
      showroomItems: { findMany: mocks.findMany },
    },
    insert: mocks.insert,
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          groupBy: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              limit: vi.fn().mockResolvedValue(mocks.mockSelectResult),
            })),
          })),
        })),
      })),
    })),
  },
}));

vi.mock('@/shared/lib/auth', () => ({ auth: vi.fn() }));

import type { Session } from 'next-auth';
const UUID_SHARE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const UUID_ITEM_1 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const UUID_ITEM_2 = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const UUID_VISITOR = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const mockSession = { user: { id: 'u1', tenantId: 't1' } } as unknown as Session;

// ============================================================
// reportViewStats — 上报素材停留时间
// ============================================================
describe('reportViewStats() Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.insert.mockReturnValue({ values: vi.fn().mockResolvedValue([]) });
  });

  it('应成功批量写入浏览记录并返回 success:true', async () => {
    mocks.findFirst.mockResolvedValue({ tenantId: 't1', salesId: 'u1' });

    const result = await reportViewStats({
      shareId: UUID_SHARE,
      visitorUserId: UUID_VISITOR,
      items: [
        { itemId: UUID_ITEM_1, durationSeconds: 45 },
        { itemId: UUID_ITEM_2, durationSeconds: 120 },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.recordCount).toBe(2);
    expect(mocks.insert).toHaveBeenCalled();
  });

  it('分享链接不存在时应抛出 SHARE_NOT_FOUND', async () => {
    mocks.findFirst.mockResolvedValue(null);

    await expect(
      reportViewStats({
        shareId: UUID_SHARE,
        visitorUserId: UUID_VISITOR,
        items: [{ itemId: UUID_ITEM_1, durationSeconds: 30 }],
      })
    ).rejects.toThrow(ShowroomErrors.SHARE_NOT_FOUND.message);
  });

  it('停留时间为 0 秒时也应允许上报', async () => {
    mocks.findFirst.mockResolvedValue({ tenantId: 't1', salesId: 'u1' });

    const result = await reportViewStats({
      shareId: UUID_SHARE,
      visitorUserId: UUID_VISITOR,
      items: [{ itemId: UUID_ITEM_1, durationSeconds: 0 }],
    });

    expect(result.success).toBe(true);
    expect(result.recordCount).toBe(1);
  });
});

// ============================================================
// getViewStatsReport — 浏览统计报告
// ============================================================
describe('getViewStatsReport() Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession);
  });

  it('应按停留时长降序返回 Top N 素材报告', async () => {
    // 分享记录存在且归属当前用户
    mocks.findFirst.mockResolvedValue({ id: UUID_SHARE });
    // 聚合统计结果
    mocks.mockSelectResult = [
      { itemId: UUID_ITEM_1, totalDuration: 300, viewCount: 5, avgDuration: 60 },
      { itemId: UUID_ITEM_2, totalDuration: 90, viewCount: 3, avgDuration: 30 },
    ];
    // 素材标题
    mocks.findMany.mockResolvedValue([
      { id: UUID_ITEM_1, title: '爆款窗帘 A' },
      { id: UUID_ITEM_2, title: '遮光帘 B' },
    ]);

    const result = await getViewStatsReport({ shareId: UUID_SHARE });

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].title).toBe('爆款窗帘 A');
    expect(result.data[0].totalDuration).toBe(300);
    expect(result.data[1].title).toBe('遮光帘 B');
  });

  it('未登录时应抛出 UNAUTHORIZED 错误', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(getViewStatsReport({ shareId: UUID_SHARE })).rejects.toThrow(
      ShowroomErrors.UNAUTHORIZED.message
    );
  });

  it('非分享创建者查询时应抛出 FORBIDDEN 错误', async () => {
    // findFirst where salesId !== session.user.id 返回 null
    mocks.findFirst.mockResolvedValue(null);

    await expect(getViewStatsReport({ shareId: UUID_SHARE })).rejects.toThrow(
      ShowroomErrors.FORBIDDEN.message
    );
  });

  it('没有浏览记录时应返回空数组', async () => {
    mocks.findFirst.mockResolvedValue({ id: UUID_SHARE });
    mocks.mockSelectResult = [];
    mocks.findMany.mockResolvedValue([]);

    const result = await getViewStatsReport({ shareId: UUID_SHARE });

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });
});
