import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createShareLink, getShareContent } from '../shares';
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
    mockRedis: { incr: vi.fn(), get: vi.fn() } as any,
}));

mocks.insert.mockReturnValue({ values: vi.fn(() => ({ returning: mocks.returning })) });
mocks.update.mockReturnValue({ set: mocks.set });
mocks.set.mockReturnValue({ where: vi.fn() });

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            showroomShares: { findFirst: mocks.findFirst },
            showroomItems: { findMany: mocks.findMany },
        },
        insert: mocks.insert,
        update: mocks.update,
    },
}));

vi.mock('@/shared/lib/auth', () => ({ auth: vi.fn() }));
vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn(),
    }
}));
vi.mock('@/shared/lib/redis', () => ({
    get redis() { return mocks.mockRedis; }
}));
vi.mock('@/shared/middleware/rate-limit', () => ({ checkRateLimit: vi.fn() }));
vi.mock('next/headers', () => ({ headers: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

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
            expiresInDays: 7
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
            maxViews: 5
        };
        await createShareLink(input);
        expect(mocks.insert).toHaveBeenCalled();
    });
});

describe('getShareContent() Action', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.mockRedis = { incr: vi.fn(), get: vi.fn() }; // Restore redis
        vi.mocked(headers).mockResolvedValue(new Map([['x-forwarded-for', '1.2.3.4']]) as unknown as Headers);
        vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, limit: 10, remaining: 9, reset: 0 });
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
            sales: { name: 'Seller' }
        });

        mocks.findMany.mockResolvedValue([{
            id: UUID_ITEM,
            title: '素材A',
            price: 150
        }]);

        const result = await getShareContent({ shareId: UUID_SHARE });
        expect(result.expired).toBe(false);
        expect(result.items[0].overridePrice).toBe(99);
    });

    it('应处理 Redis 采样回写逻辑', async () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.05);
        vi.mocked(mocks.mockRedis.get).mockResolvedValue(100);

        mocks.findFirst.mockResolvedValue({
            id: UUID_SHARE,
            isActive: 1,
            expiresAt: new Date(Date.now() + 100000),
            itemsSnapshot: []
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
            itemsSnapshot: []
        });

        await expect(getShareContent({ shareId: UUID_SHARE })).rejects.toThrow(ShowroomErrors.REDIS_UNAVAILABLE.message);
    });
    it('当分享被停用时应抛出错误', async () => {
        mocks.findFirst.mockResolvedValue({
            id: UUID_SHARE,
            isActive: 0,
            expiresAt: new Date(Date.now() + 100000),
            itemsSnapshot: []
        });

        await expect(getShareContent({ shareId: UUID_SHARE })).rejects.toThrow(ShowroomErrors.SHARE_NOT_FOUND.message);
    });

    it('当处理频率过快时应触发限流错误', async () => {
        vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, limit: 10, remaining: 0, reset: 0 });

        await expect(getShareContent({ shareId: UUID_SHARE })).rejects.toThrow(ShowroomErrors.SHARE_RATE_LIMIT.message);
    });

    it('当达到阅后即焚上限时应抛出错误', async () => {
        mocks.findFirst.mockResolvedValue({
            id: UUID_SHARE,
            isActive: 1,
            expiresAt: new Date(Date.now() + 100000),
            itemsSnapshot: [],
            views: 3,
            maxViews: 3
        });
        await expect(getShareContent({ shareId: UUID_SHARE })).rejects.toThrow(ShowroomErrors.SHARE_LIMIT_EXCEEDED.message);
    });

    it('当开启密码保护且未提供密码时抛出错误', async () => {
        mocks.findFirst.mockResolvedValue({
            id: UUID_SHARE,
            isActive: 1,
            expiresAt: new Date(Date.now() + 100000),
            itemsSnapshot: [],
            passwordHash: 'somehash'
        });
        await expect(getShareContent({ shareId: UUID_SHARE })).rejects.toThrow(ShowroomErrors.INVALID_PASSWORD.message);
    });

    it('当开启密码保护且密码错误时抛出错误', async () => {
        mocks.findFirst.mockResolvedValue({
            id: UUID_SHARE,
            isActive: 1,
            expiresAt: new Date(Date.now() + 100000),
            itemsSnapshot: [],
            passwordHash: 'realhash'
        });
        await expect(getShareContent({ shareId: UUID_SHARE, password: 'wrong' })).rejects.toThrow(ShowroomErrors.INVALID_PASSWORD.message);
    });

    it('当提供正确密码时成功获取内容', async () => {
        const password = '8888';
        const hash = createHash('sha256').update(password).digest('hex');
        mocks.findFirst.mockResolvedValue({
            id: UUID_SHARE,
            isActive: 1,
            expiresAt: new Date(Date.now() + 100000),
            itemsSnapshot: [],
            passwordHash: hash
        });
        const result = await getShareContent({ shareId: UUID_SHARE, password });
        expect(result.expired).toBe(false);
    });
});
