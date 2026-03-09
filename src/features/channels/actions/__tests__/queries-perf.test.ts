import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------
// channels 性能行为测试（TDD - RED 阶段）
// 验证两个 P0 问题的修复：
//   P0-1：getChannels 列表查询不应包含 contacts/children 全量 JOIN
//   P0-2：getCachedChannels 应在模块顶层定义，而非每次调用时动态创建
// ---------------------------------------------------------

vi.mock('next/cache', () => ({
    // 关键：让 unstable_cache 记录调用位置，以便测试"是否在函数体内动态创建"
    unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
    revalidateTag: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            channels: {
                findMany: vi.fn().mockResolvedValue([]),
                findFirst: vi.fn(),
            },
        },
        $count: vi.fn().mockResolvedValue(0),
    },
}));

vi.mock('@/shared/api/schema/channels', () => ({
    channels: {
        id: 'channels.id',
        tenantId: 'channels.tenantId',
        createdAt: 'channels.createdAt',
        parentId: 'channels.parentId',
        name: 'channels.name',
        channelNo: 'channels.channelNo',
        phone: 'channels.phone',
        channelType: 'channels.channelType',
    },
    channelContacts: {},
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: vi.fn() },
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { getChannels } from '../queries';
import { db } from '@/shared/api/db';
import { auth } from '@/shared/lib/auth';
import { unstable_cache } from 'next/cache';

describe('getChannels - 列表查询性能行为', () => {
    const mockSession = { user: { id: 'u1', tenantId: 'test-tenant', roles: ['ADMIN'] } };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession as any);
        vi.mocked(db.$count).mockResolvedValue(0);
        vi.mocked(db.query.channels.findMany).mockResolvedValue([]);
    });

    // =========================================================
    // P0-1：列表查询不应包含重关联（contacts / children）
    // =========================================================
    describe('P0-1：列表 with 字段检查', () => {
        it('调用 findMany 时，with 配置不应包含 contacts（避免无效 JOIN）', async () => {
            await getChannels({ page: 1, pageSize: 10 });

            const calls = vi.mocked(db.query.channels.findMany).mock.calls;
            expect(calls.length).toBeGreaterThan(0);

            const withConfig = calls[0][0]?.with as Record<string, unknown> | undefined;
            // contacts 是渠道联系人，与列表卡片展示无关，不应加载
            expect(withConfig?.contacts).toBeUndefined();
        });

        it('调用 findMany 时，with 配置不应包含 children（列表不展示子渠道）', async () => {
            await getChannels({ page: 1, pageSize: 10 });

            const calls = vi.mocked(db.query.channels.findMany).mock.calls;
            const withConfig = calls[0][0]?.with as Record<string, unknown> | undefined;
            // children 全量加载会导致递归数据量爆炸
            expect(withConfig?.children).toBeUndefined();
        });

        it('调用 findMany 时，with 配置不应包含 parent（父渠道名可通过缓存树获取）', async () => {
            await getChannels({ page: 1, pageSize: 10 });

            const calls = vi.mocked(db.query.channels.findMany).mock.calls;
            const withConfig = calls[0][0]?.with as Record<string, unknown> | undefined;
            expect(withConfig?.parent).toBeUndefined();
        });

        it('列表查询应正确传递 pageSize 和 offset', async () => {
            await getChannels({ page: 2, pageSize: 15 });

            const calls = vi.mocked(db.query.channels.findMany).mock.calls;
            expect(calls.length).toBeGreaterThan(0);
            const opts = calls[0][0];
            expect(opts?.limit).toBe(15);
            expect(opts?.offset).toBe(15); // (2-1)*15
        });
    });

    // =========================================================
    // P0-2：unstable_cache 不应在每次函数调用时动态创建
    // 正确做法：在模块顶层定义常量缓存函数（如 orders/queries.ts 的做法）
    // 测试策略：两次调用 getChannels，unstable_cache 的调用次数
    //           应为 0（已提前初始化），或只调用一次（模块加载时）
    // =========================================================
    describe('P0-2：缓存函数不应在调用时动态创建', () => {
        it('多次调用 getChannels，unstable_cache 的创建次数不应随调用次数线性增长', async () => {
            // 重置计数
            vi.mocked(unstable_cache).mockClear();

            await getChannels({ page: 1, pageSize: 10 });
            const callsAfterFirst = vi.mocked(unstable_cache).mock.calls.length;

            await getChannels({ page: 1, pageSize: 10 });
            const callsAfterSecond = vi.mocked(unstable_cache).mock.calls.length;

            // 若缓存在函数体内动态创建：callsAfterSecond = 2（每调用一次 getChannels 就新建一个缓存）
            // 若缓存在模块顶层定义：callsAfterSecond = callsAfterFirst（仅初始化时创建一次）
            // 正确实现时，两次调用不应增加 unstable_cache 的调用次数
            expect(callsAfterSecond).toBe(callsAfterFirst);
        });
    });
});
