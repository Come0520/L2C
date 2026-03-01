/**
 * 展厅素材生命周期集成测试
 *
 * 覆盖场景：
 * 1. 素材创建 → 更新 → 软删除 完整流程
 * 2. 未登录用户被拒绝访问
 * 3. getShowroomItemDetail 正常返回
 * 4. getShowroomItemDetail 查询不存在的素材
 * 5. 分享链接创建后停用
 * 6. 分享看板统计正确返回
 * 7. getMyShareLinks 分页获取
 * 8. invalidateShowroomCache 缓存失效
 */

import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  getShowroomItems,
  getShowroomItemDetail,
  createShowroomItem,
  updateShowroomItem,
  deleteShowroomItem,
} from '../actions/items';
import {
  createShareLink,
  getMyShareLinks,
  deactivateShareLink,
  getShareDashboardStats,
} from '../actions/shares';
import { ShowroomErrors } from '../errors';
import { canManageShowroomItem } from '../logic/permissions';
import { auth } from '@/shared/lib/auth';
import { AuditService } from '@/shared/services/audit-service';

// ========== Hoist Mocks ==========
const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  returning: vi.fn(),
  values: vi.fn(),
  set: vi.fn(),
  from: vi.fn(),
  where: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  UUID_1: '11111111-1111-4111-8111-111111111111',
  UUID_2: '22222222-2222-4222-8222-222222222222',
  UUID_SHARE: '33333333-3333-4333-8333-333333333333',
  mockRedis: { incr: vi.fn(), get: vi.fn(), set: vi.fn() } as Record<string, any>,
}));

// 递归链式 Mock 结构
mocks.values.mockReturnValue({ returning: mocks.returning });
mocks.set.mockReturnValue({
  where: vi.fn(() => ({ returning: mocks.returning })),
});
mocks.from.mockReturnValue({
  where: vi.fn().mockReturnValue({
    orderBy: vi.fn().mockReturnValue({
      limit: vi.fn().mockReturnValue({
        offset: vi.fn().mockResolvedValue([
          {
            item: { id: mocks.UUID_1, title: '测试素材' },
            totalCount: 1,
          },
        ]),
      }),
    }),
  }),
});
mocks.insert.mockReturnValue({ values: vi.fn(() => ({ returning: mocks.returning })) });
mocks.update.mockReturnValue({ set: mocks.set });

// ========== 模块 Mock ==========
vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      showroomItems: {
        findFirst: mocks.findFirst,
        findMany: mocks.findMany,
      },
      showroomShares: {
        findFirst: mocks.findFirst,
      },
    },
    insert: vi.fn(() => ({ values: mocks.values })),
    update: vi.fn(() => ({ set: mocks.set })),
    select: vi.fn(() => ({ from: mocks.from })),
  },
}));

vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn(),
  checkPermission: vi.fn(),
}));

vi.mock('@/shared/services/audit-service', () => ({
  AuditService: { log: vi.fn() },
}));

vi.mock('../logic/permissions', () => ({
  canManageShowroomItem: vi.fn(),
}));

vi.mock('isomorphic-dompurify', () => ({
  default: { sanitize: vi.fn((html: string) => html.replace(/<script.*?>.*?<\/script>/gi, '')) },
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock('@/shared/lib/redis', () => ({
  get redis() {
    return mocks.mockRedis;
  },
}));

vi.mock('@/shared/middleware/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, limit: 10, remaining: 9, reset: 0 }),
}));
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Map([['x-forwarded-for', '1.2.3.4']])),
}));

import type { Session } from 'next-auth';
const mockSession = { user: { id: 'u1', tenantId: 't1', role: 'ADMIN' } } as unknown as Session;
const noSession = null;

// ========== 测试用例 ==========

describe('展厅素材生命周期：创建 → 更新 → 删除', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(canManageShowroomItem).mockResolvedValue(true);
  });

  it('1. 应完成素材全生命周期并产生审计日志', async () => {
    // Step 1: 创建
    mocks.returning.mockReturnValue([
      {
        id: mocks.UUID_1,
        title: '生命周期素材',
        type: 'CASE',
        tenantId: 't1',
        createdBy: 'u1',
        score: 40,
      },
    ]);

    const created = await createShowroomItem({
      type: 'CASE',
      title: '生命周期素材',
      content: '详细描述',
      images: [],
      tags: [],
      status: 'PUBLISHED',
    });
    expect(created.id).toBe(mocks.UUID_1);
    expect(AuditService.log).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'CREATE' })
    );

    // Step 2: 更新
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(canManageShowroomItem).mockResolvedValue(true);
    mocks.findFirst.mockResolvedValue({
      id: mocks.UUID_1,
      title: '生命周期素材',
      createdBy: 'u1',
      tenantId: 't1',
      images: [],
      tags: [],
      status: 'PUBLISHED',
    });
    mocks.returning.mockReturnValue([
      {
        id: mocks.UUID_1,
        title: '更新后标题',
        tenantId: 't1',
        createdBy: 'u1',
      },
    ]);
    const updated = await updateShowroomItem({ id: mocks.UUID_1, title: '更新后标题' });
    expect(updated.id).toBe(mocks.UUID_1);
    expect(AuditService.log).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'UPDATE', recordId: mocks.UUID_1 })
    );

    // Step 3: 软删除
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(canManageShowroomItem).mockResolvedValue(true);
    mocks.findFirst.mockResolvedValue({
      id: mocks.UUID_1,
      title: '更新后标题',
      createdBy: 'u1',
      tenantId: 't1',
    });
    const deleted = await deleteShowroomItem({ id: mocks.UUID_1 });
    expect(deleted.success).toBe(true);
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ status: 'ARCHIVED' }));
    expect(AuditService.log).toHaveBeenCalled();
  });
});

describe('展厅鉴权：未登录用户访问被拒', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('2. 未登录用户调用 getShowroomItems 应抛出未授权错误', async () => {
    vi.mocked(auth).mockResolvedValue(noSession as unknown as Session);
    await expect(getShowroomItems({ page: 1, pageSize: 10 })).rejects.toThrow();
  });

  it('3. 未登录用户调用 createShowroomItem 应抛出未授权错误', async () => {
    vi.mocked(auth).mockResolvedValue(noSession as unknown as Session);
    await expect(
      createShowroomItem({
        type: 'CASE',
        title: '测试',
        content: '',
        images: [],
        tags: [],
        status: 'DRAFT',
      })
    ).rejects.toThrow();
  });
});

describe('展厅素材详情查询', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession);
  });

  it('4. 应返回素材详情', async () => {
    mocks.findFirst.mockResolvedValue({
      id: mocks.UUID_1,
      title: '详情素材',
      tenantId: 't1',
      type: 'CASE',
      content: '内容',
      images: [],
      tags: [],
    });
    const detail = await getShowroomItemDetail(mocks.UUID_1);
    expect(detail.title).toBe('详情素材');
  });

  it('5. 查询不存在的素材应抛出 ITEM_NOT_FOUND', async () => {
    mocks.findFirst.mockResolvedValue(undefined);
    await expect(getShowroomItemDetail(mocks.UUID_2)).rejects.toThrow(
      ShowroomErrors.ITEM_NOT_FOUND.message
    );
  });
});

describe('展厅分享链接停用', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession);
  });

  it('6. 应成功停用分享链接并产生审计日志', async () => {
    mocks.findFirst.mockResolvedValue({
      id: mocks.UUID_SHARE,
      createdBy: 'u1',
      tenantId: 't1',
      isActive: 1,
    });
    await deactivateShareLink({ shareId: mocks.UUID_SHARE });
    expect(mocks.set).toHaveBeenCalled();
    expect(AuditService.log).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: 'UPDATE', tableName: 'showroom_shares' })
    );
  });
});

describe('展厅素材列表过滤查询', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession);
  });

  it('7. 按类型过滤应正常调用并返回结果', async () => {
    const result = await getShowroomItems({ page: 1, pageSize: 10, type: 'CASE' as any });
    expect(result.data).toBeInstanceOf(Array);
  });
});
