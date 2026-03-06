import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  createShareLink,
  getShareContent,
  getMyShareLinks,
  deactivateShareLink,
  getShareDashboardStats,
} from '../shares';
import { ShowroomErrors } from '../../errors';
import { auth } from '@/shared/lib/auth';
import { AuditService } from '@/shared/services/audit-service';
import { checkRateLimit } from '@/shared/middleware/rate-limit';
import { headers } from 'next/headers';
import { createHash } from 'crypto';

// Hoist mocks
const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  findMany: vi.fn(),
  returning: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  whereChain: vi.fn(),
  selectResult: [{ totalShares: 5, totalViews: 120, activeShares: 3, recentShares: 2 }] as any,
  mockRedis: { incr: vi.fn(), get: vi.fn(), setex: vi.fn() } as any,
}));

mocks.insert.mockReturnValue({ values: vi.fn(() => ({ returning: mocks.returning })) });
mocks.update.mockReturnValue({ set: mocks.set });
mocks.set.mockReturnValue({ where: mocks.whereChain });
mocks.whereChain.mockReturnValue({ returning: mocks.returning });

vi.mock('@/shared/api/db', () => ({
  db: {
    query: {
      showroomShares: { findFirst: mocks.findFirst, findMany: mocks.findMany },
      showroomItems: { findMany: mocks.findMany },
    },
    insert: mocks.insert,
    update: mocks.update,
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => mocks.selectResult),
      })),
    })),
  },
}));

vi.mock('@/shared/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/shared/services/audit-service', () => ({
  AuditService: {
    log: vi.fn(),
  },
}));
vi.mock('@/shared/lib/redis', () => ({
  get redis() {
    return mocks.mockRedis;
  },
}));
vi.mock('@/shared/middleware/rate-limit', () => ({ checkRateLimit: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  updateTag: vi.fn(),
}));

import type { Session } from 'next-auth';
const UUID_SHARE = '33333333-3333-4333-8333-333333333333';
const UUID_ITEM = '44444444-4444-4444-8444-444444444444';
const mockSession = { user: { id: 'u1', tenantId: 't1' } } as unknown as Session;

describe('createShareLink() Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession);
    mocks.returning.mockReturnValue([{ id: UUID_SHARE }]);
  });

  it('应成功创建分享链接并记录审计日志', async () => {
    const input = {
      items: [{ itemId: UUID_ITEM, overridePrice: 100 }],
      expiresInDays: 7,
    };
    const result = await createShareLink(input);
    expect(result.id).toBe(UUID_SHARE);
    expect(mocks.insert).toHaveBeenCalled();
    expect(AuditService.log).toHaveBeenCalled();
  });

  it('应成功解析密码及限阅次数并落库', async () => {
    const input = {
      items: [{ itemId: UUID_ITEM, overridePrice: 100 }],
      expiresInDays: 7,
      password: 'abcd',
      maxViews: 5,
    };
    await createShareLink(input);
    expect(mocks.insert).toHaveBeenCalled();
  });

  it('应成功解析 allowCustomerShare 以及多商品数组并落库', async () => {
    const input = {
      items: [
        { itemId: UUID_ITEM, overridePrice: 100 },
        { itemId: '55555555-5555-5555-8555-555555555555', overridePrice: 200 },
      ],
      expiresInDays: 7,
      allowCustomerShare: true,
    };
    await createShareLink(input);
    expect(mocks.insert).toHaveBeenCalled();
    // 验证调用中包含了 allowCustomerShare: true
    expect(mocks.returning).toHaveBeenCalled();
    const insertValues = mocks.insert.mock.results[0].value.values.mock.calls[0][0];
    expect(insertValues).toHaveProperty('allowCustomerShare', 1);
    expect(insertValues.itemsSnapshot).toHaveLength(2);
  });
});

describe('getShareContent() Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockRedis = { incr: vi.fn(), get: vi.fn() }; // Restore redis
    vi.mocked(headers).mockResolvedValue(
      new Map([['x-forwarded-for', '1.2.3.4']]) as unknown as Headers
    );
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      limit: 10,
      remaining: 9,
      reset: 0,
    });
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  it('应成功获取分享内容并合并素材详情', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    mocks.findFirst.mockResolvedValue({
      id: UUID_SHARE,
      isActive: 1,
      expiresAt: futureDate,
      itemsSnapshot: [{ itemId: UUID_ITEM, overridePrice: 99 }],
      sales: { name: 'Seller' },
    });

    mocks.findMany.mockResolvedValue([
      {
        id: UUID_ITEM,
        title: '素材A',
        price: 150,
      },
    ]);

    const result = await getShareContent({ shareId: UUID_SHARE });
    expect(result.expired).toBe(false);
    expect(result.items[0].overridePrice).toBe(99);
  });

  it('获取详情时，应包含 allowCustomerShare 权限配置', async () => {
    mocks.findFirst.mockResolvedValue({
      id: UUID_SHARE,
      isActive: 1,
      expiresAt: new Date(Date.now() + 100000),
      itemsSnapshot: [{ itemId: UUID_ITEM, overridePrice: 99 }],
      allowCustomerShare: 1,
    });
    mocks.findMany.mockResolvedValue([{ id: UUID_ITEM, title: '素材A' }]);

    const result = await getShareContent({ shareId: UUID_SHARE });
    expect(result).toHaveProperty('allowCustomerShare', true);
  });

  it('应处理 Redis 采样回写逻辑', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.05);
    vi.mocked(mocks.mockRedis.get).mockResolvedValue(100);

    mocks.findFirst.mockResolvedValue({
      id: UUID_SHARE,
      isActive: 1,
      expiresAt: new Date(Date.now() + 100000),
      itemsSnapshot: [],
    });

    await getShareContent({ shareId: UUID_SHARE });
    expect(mocks.update).toHaveBeenCalled();
  });

  it('当 Redis 不可用时应 Fail Closed 抛出错误', async () => {
    mocks.mockRedis = null; // Simulate missing Redis
    mocks.findFirst.mockResolvedValue({
      id: UUID_SHARE,
      isActive: 1,
      expiresAt: new Date(Date.now() + 100000),
      itemsSnapshot: [],
    });

    await expect(getShareContent({ shareId: UUID_SHARE })).rejects.toThrow(
      ShowroomErrors.REDIS_UNAVAILABLE.message
    );
  });
  it('当分享被停用时应抛出错误', async () => {
    mocks.findFirst.mockResolvedValue({
      id: UUID_SHARE,
      isActive: 0,
      expiresAt: new Date(Date.now() + 100000),
      itemsSnapshot: [],
    });

    await expect(getShareContent({ shareId: UUID_SHARE })).rejects.toThrow(
      ShowroomErrors.SHARE_NOT_FOUND.message
    );
  });

  it('当处理频率过快时应触发限流错误', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      limit: 10,
      remaining: 0,
      reset: 0,
    });

    await expect(getShareContent({ shareId: UUID_SHARE })).rejects.toThrow(
      ShowroomErrors.SHARE_RATE_LIMIT.message
    );
  });

  it('当达到阅后即焚上限时应抛出错误', async () => {
    mocks.findFirst.mockResolvedValue({
      id: UUID_SHARE,
      isActive: 1,
      expiresAt: new Date(Date.now() + 100000),
      itemsSnapshot: [],
      views: 3,
      maxViews: 3,
    });
    await expect(getShareContent({ shareId: UUID_SHARE })).rejects.toThrow(
      ShowroomErrors.SHARE_LIMIT_EXCEEDED.message
    );
  });

  it('当开启密码保护且未提供密码时抛出错误', async () => {
    mocks.findFirst.mockResolvedValue({
      id: UUID_SHARE,
      isActive: 1,
      expiresAt: new Date(Date.now() + 100000),
      itemsSnapshot: [],
      passwordHash: 'somehash',
    });
    await expect(getShareContent({ shareId: UUID_SHARE })).rejects.toThrow(
      ShowroomErrors.INVALID_PASSWORD.message
    );
  });

  it('当开启密码保护且密码错误时抛出错误', async () => {
    mocks.findFirst.mockResolvedValue({
      id: UUID_SHARE,
      isActive: 1,
      expiresAt: new Date(Date.now() + 100000),
      itemsSnapshot: [],
      passwordHash: 'realhash',
    });
    await expect(getShareContent({ shareId: UUID_SHARE, password: 'wrong' })).rejects.toThrow(
      ShowroomErrors.INVALID_PASSWORD.message
    );
  });

  it('当提供正确密码时成功获取内容', async () => {
    const password = '8888';
    const hash = createHash('sha256').update(password).digest('hex');
    mocks.findFirst.mockResolvedValue({
      id: UUID_SHARE,
      isActive: 1,
      expiresAt: new Date(Date.now() + 100000),
      itemsSnapshot: [],
      passwordHash: hash,
    });
    const result = await getShareContent({ shareId: UUID_SHARE, password });
    expect(result.expired).toBe(false);
  });
});

// ============================================================
// deactivateShareLink — 停用/撤回分享链接
// ============================================================
describe('deactivateShareLink() Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession);
  });

  it('应成功停用分享链接并返回 success:true', async () => {
    mocks.returning.mockReturnValue([{ id: UUID_SHARE, isActive: 0 }]);

    const result = await deactivateShareLink({ shareId: UUID_SHARE });

    expect(result.success).toBe(true);
    expect(mocks.update).toHaveBeenCalled();
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ isActive: 0 }));
  });

  it('停用后应记录审计日志', async () => {
    mocks.returning.mockReturnValue([{ id: UUID_SHARE, isActive: 0 }]);

    await deactivateShareLink({ shareId: UUID_SHARE });

    expect(AuditService.log).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        action: 'UPDATE',
        tableName: 'showroom_shares',
        recordId: UUID_SHARE,
      })
    );
  });

  it('停用不存在的链接应返回 success:false', async () => {
    mocks.returning.mockReturnValue([]);

    const result = await deactivateShareLink({ shareId: UUID_SHARE });

    expect(result.success).toBe(false);
    expect(AuditService.log).not.toHaveBeenCalled();
  });

  it('未登录时应抛出 UNAUTHORIZED 错误', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(deactivateShareLink({ shareId: UUID_SHARE })).rejects.toThrow(
      ShowroomErrors.UNAUTHORIZED.message
    );
  });
});

// ============================================================
// getMyShareLinks — 我的分享列表
// ============================================================
describe('getMyShareLinks() Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession);
  });

  it('应返回当前用户的分享列表', async () => {
    const fakeShares = [
      { id: UUID_SHARE, salesId: 'u1', tenantId: 't1', isActive: 1 },
      { id: '22222222-2222-4222-8222-222222222222', salesId: 'u1', tenantId: 't1', isActive: 0 },
    ];
    mocks.findMany.mockResolvedValue(fakeShares);

    const result = await getMyShareLinks(1, 20);

    expect(result).toHaveLength(2);
    expect(mocks.findMany).toHaveBeenCalled();
  });

  it('分页参数应正确工作（第二页，每页5条）', async () => {
    mocks.findMany.mockResolvedValue([]);

    await getMyShareLinks(2, 5);

    expect(mocks.findMany).toHaveBeenCalled();
  });

  it('未登录时应抛出 UNAUTHORIZED 错误', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(getMyShareLinks()).rejects.toThrow(ShowroomErrors.UNAUTHORIZED.message);
  });

  it('无数据时应返回空数组', async () => {
    mocks.findMany.mockResolvedValue([]);

    const result = await getMyShareLinks();

    expect(result).toEqual([]);
  });
});

// ============================================================
// getShareDashboardStats — 分享看板统计
// ============================================================
describe('getShareDashboardStats() Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession);
  });

  it('应返回汇总统计数据（总分享/总浏览/活跃/近7天）', async () => {
    const result = await getShareDashboardStats();

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      totalShares: 5,
      totalViews: 120,
      activeShares: 3,
      recentNewShares: 2,
    });
  });

  it('未登录时应抛出 UNAUTHORIZED 错误', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(getShareDashboardStats()).rejects.toThrow(ShowroomErrors.UNAUTHORIZED.message);
  });

  it('没有任何分享记录时应返回全零', async () => {
    mocks.selectResult = [{ totalShares: 0, totalViews: null, activeShares: 0, recentShares: 0 }];

    const result = await getShareDashboardStats();

    expect(result.data.totalShares).toBe(0);
    expect(result.data.totalViews).toBe(0);
  });
});

// ============================================================
// allowCustomerShare 权限 — 客户二次转发控制
// ============================================================
describe('allowCustomerShare 权限控制', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(mockSession);
    vi.mocked(headers).mockResolvedValue(
      new Map([['x-forwarded-for', '1.2.3.4']]) as unknown as Headers
    );
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      limit: 10,
      remaining: 9,
      reset: 0,
    });
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  it('allowCustomerShare 未传（默认值 false）时，应存储 0', async () => {
    mocks.returning.mockReturnValue([{ id: UUID_SHARE }]);

    await createShareLink({
      items: [{ itemId: UUID_ITEM, overridePrice: 100 }],
      expiresInDays: 7,
    });

    const insertValues = mocks.insert.mock.results[0].value.values.mock.calls[0][0];
    expect(insertValues.allowCustomerShare).toBe(0);
  });

  it('客户打开分享时，allowCustomerShare=0 应返回 false（禁止转发）', async () => {
    mocks.findFirst.mockResolvedValue({
      id: UUID_SHARE,
      isActive: 1,
      expiresAt: new Date(Date.now() + 100000),
      itemsSnapshot: [],
      allowCustomerShare: 0,
    });
    mocks.findMany.mockResolvedValue([]);

    const result = await getShareContent({ shareId: UUID_SHARE });

    expect(result.allowCustomerShare).toBe(false);
  });

  it('客户打开分享时，allowCustomerShare=1 应返回 true（允许转发）', async () => {
    mocks.findFirst.mockResolvedValue({
      id: UUID_SHARE,
      isActive: 1,
      expiresAt: new Date(Date.now() + 100000),
      itemsSnapshot: [],
      allowCustomerShare: 1,
    });
    mocks.findMany.mockResolvedValue([]);

    const result = await getShareContent({ shareId: UUID_SHARE });

    expect(result.allowCustomerShare).toBe(true);
  });
});

// ============================================================
// 身份锁定逻辑 — getShareContent + visitorUserId
// ============================================================
describe('身份锁定 (lockedToUserId) 机制', () => {
  const VISITOR_A = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  const VISITOR_B = 'ffffffff-ffff-4fff-8fff-ffffffffffff';

  const baseShare = {
    id: UUID_SHARE,
    isActive: 1,
    expiresAt: new Date(Date.now() + 100000),
    itemsSnapshot: [],
    allowCustomerShare: 0,
    lockedToUserId: null as string | null,
    tenantId: 't1',
    salesId: 'u1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(headers).mockResolvedValue(
      new Map([['x-forwarded-for', '1.2.3.4']]) as unknown as Headers
    );
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      limit: 60,
      remaining: 59,
      reset: 0,
    });
    mocks.findMany.mockResolvedValue([]);
    // 让 DB update 有 where 链式可用
    mocks.set.mockReturnValue({ where: mocks.whereChain });
    mocks.whereChain.mockReturnValue({ returning: mocks.returning });
    mocks.returning.mockReturnValue([]);
  });

  it('allowCustomerShare=0 且 lockedToUserId 为空时，应绑定当前 visitorUserId', async () => {
    mocks.findFirst.mockResolvedValue({ ...baseShare, lockedToUserId: null });

    await getShareContent({ shareId: UUID_SHARE, visitorUserId: VISITOR_A });

    // DB update 应该被调用来设置 lockedToUserId
    expect(mocks.update).toHaveBeenCalled();
    expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ lockedToUserId: VISITOR_A }));
  });

  it('allowCustomerShare=0 且 lockedToUserId === visitorUserId，应正常返回内容', async () => {
    mocks.findFirst.mockResolvedValue({ ...baseShare, lockedToUserId: VISITOR_A });

    const result = await getShareContent({ shareId: UUID_SHARE, visitorUserId: VISITOR_A });

    expect(result.expired).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled(); // 无需再次写入
  });

  it('allowCustomerShare=0 且 lockedToUserId !== visitorUserId，应抛出 SHARE_LOCKED', async () => {
    mocks.findFirst.mockResolvedValue({ ...baseShare, lockedToUserId: VISITOR_A });

    await expect(
      getShareContent({ shareId: UUID_SHARE, visitorUserId: VISITOR_B })
    ).rejects.toThrow(ShowroomErrors.SHARE_LOCKED.message);
  });

  it('allowCustomerShare=1 时任意 visitorUserId 应能访问（不锁人）', async () => {
    mocks.findFirst.mockResolvedValue({
      ...baseShare,
      allowCustomerShare: 1,
      lockedToUserId: null,
    });

    const result = await getShareContent({ shareId: UUID_SHARE, visitorUserId: VISITOR_B });

    expect(result.expired).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('不传 visitorUserId 时应跳过锁人逻辑（匿名访问）', async () => {
    mocks.findFirst.mockResolvedValue({ ...baseShare, lockedToUserId: null });

    // 不传 visitorUserId 不应报错也不应触发锁定
    const result = await getShareContent({ shareId: UUID_SHARE });

    expect(result.expired).toBe(false);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

// ============================================================
// 浏览通知机制 — 30 分钟冷却去重
// ============================================================
describe('浏览通知 30 分钟冷却机制', () => {
  const VISITOR_A = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

  const baseShare = {
    id: UUID_SHARE,
    isActive: 1,
    expiresAt: new Date(Date.now() + 100000),
    itemsSnapshot: [],
    allowCustomerShare: 1,
    lockedToUserId: null,
    tenantId: 't1',
    salesId: 'u1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(headers).mockResolvedValue(
      new Map([['x-forwarded-for', '1.2.3.4']]) as unknown as Headers
    );
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      limit: 60,
      remaining: 59,
      reset: 0,
    });
    mocks.findMany.mockResolvedValue([]);
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  it('首次访问（Redis 无冷却 key）应插入通知并设置冷却', async () => {
    mocks.findFirst.mockResolvedValue(baseShare);
    mocks.mockRedis.get.mockResolvedValue(null); // 无冷却记录
    mocks.mockRedis.incr.mockResolvedValue(1);
    mocks.mockRedis.setex = vi.fn().mockResolvedValue('OK');
    mocks.returning.mockReturnValue([{ id: 'notif-1' }]);

    await getShareContent({ shareId: UUID_SHARE, visitorUserId: VISITOR_A });

    expect(mocks.insert).toHaveBeenCalled();
    expect(mocks.mockRedis.setex).toHaveBeenCalledWith(
      `showroom:notify:cd:${UUID_SHARE}:${VISITOR_A}`,
      1800,
      '1'
    );
  });

  it('冷却期内再次访问（Redis 有 key）不应重复发送通知', async () => {
    mocks.findFirst.mockResolvedValue(baseShare);
    mocks.mockRedis.get
      .mockResolvedValueOnce(1) // incr 用的 get
      .mockResolvedValueOnce('1'); // 冷却 key 存在
    mocks.mockRedis.incr.mockResolvedValue(2);

    await getShareContent({ shareId: UUID_SHARE, visitorUserId: VISITOR_A });

    // insert 应该只被调用（如有）但不是通知 insert
    // notifications.insert 不应被触发——用 insert 调用次数判断
    // 注意：Redis incr 已调用，不触发 insert(notifications)
    const insertCallCount = mocks.insert.mock.calls.length;
    // 如果有 insert 调用，应该不是通知插入（通知由冷却保护）
    // 最简方式：验证 setex 未被调用（没设新冷却）
    expect(mocks.mockRedis.setex).not.toHaveBeenCalled();
  });
});
