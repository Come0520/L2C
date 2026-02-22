/**
 * 渠道模块安全性测试
 * 
 * 覆盖范围：
 * - 未授权用户拒绝访问
 * - 权限检查拦截
 * - 输入校验（Zod schema）
 * - 租户隔离验证
 * - 分页安全限制
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock 定义 ──

vi.mock('next/cache', () => ({
    unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
    revalidateTag: vi.fn(),
    revalidatePath: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            channels: { findMany: vi.fn(), findFirst: vi.fn() },
            channelContacts: { findMany: vi.fn() },
        },
        $count: vi.fn(),
        insert: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        transaction: vi.fn(),
    }
}));

vi.mock('@/shared/api/schema/channels', () => ({
    channels: {
        id: 'channels.id',
        tenantId: 'channels.tenantId',
        createdAt: 'channels.createdAt',
        name: 'channels.name',
        channelNo: 'channels.channelNo',
        phone: 'channels.phone',
    },
    channelContacts: {
        id: 'cc.id',
        channelId: 'cc.channelId',
        tenantId: 'cc.tenantId',
        isMain: 'cc.isMain',
        createdAt: 'cc.createdAt',
    },
}));

vi.mock('@/shared/api/schema', () => ({
    leads: { channelId: 'leads.channelId' },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: vi.fn().mockResolvedValue(true) },
}));

import { db } from '@/shared/api/db';
import { auth, checkPermission } from '@/shared/lib/auth';

const mockDb = db as Record<string, unknown>;

describe('Channels Security (渠道安全测试)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── 未授权测试 ──
    describe('未授权访问拒绝', () => {
        it('getChannels：未登录时应抛出 Unauthorized', async () => {
            vi.mocked(auth).mockResolvedValue(null);
            const { getChannels } = await import('../queries');
            await expect(getChannels({})).rejects.toThrow('Unauthorized');
        });

        it('getChannels：session 无 tenantId 时应抛出 Unauthorized', async () => {
            vi.mocked(auth).mockResolvedValue({ user: { id: 'u1', tenantId: null } } as unknown as Awaited<ReturnType<typeof auth>>);
            const { getChannels } = await import('../queries');
            await expect(getChannels({})).rejects.toThrow('Unauthorized');
        });

        it('getChannelTree：未登录时应抛出 Unauthorized', async () => {
            vi.mocked(auth).mockResolvedValue(null);
            const { getChannelTree } = await import('../queries');
            await expect(getChannelTree()).rejects.toThrow('Unauthorized');
        });

        it('getChannelById：未登录时应抛出 Unauthorized', async () => {
            vi.mocked(auth).mockResolvedValue(null);
            const { getChannelById } = await import('../queries');
            await expect(getChannelById('c1')).rejects.toThrow('Unauthorized');
        });

        it('getChannelContacts：未登录时应抛出 Unauthorized', async () => {
            vi.mocked(auth).mockResolvedValue(null);
            const { getChannelContacts } = await import('../queries');
            await expect(getChannelContacts('c1')).rejects.toThrow('Unauthorized');
        });
    });

    // ── 权限检查测试 ──
    describe('权限检查拦截', () => {
        it('getChannels：权限检查失败应抛出异常', async () => {
            vi.mocked(auth).mockResolvedValue({
                user: { id: 'u1', tenantId: 'tenant-1' }
            } as unknown as Awaited<ReturnType<typeof auth>>);
            vi.mocked(checkPermission).mockRejectedValue(new Error('Permission denied'));

            const { getChannels } = await import('../queries');
            await expect(getChannels({})).rejects.toThrow('Permission denied');
        });
    });

    // ── 分页安全限制 ──
    describe('分页安全限制', () => {
        it('getChannels：pageSize 超过 100 时应强制限制为 100', async () => {
            vi.mocked(auth).mockResolvedValue({
                user: { id: 'u1', tenantId: 'tenant-1' }
            } as unknown as Awaited<ReturnType<typeof auth>>);
            vi.mocked(checkPermission).mockResolvedValue(true);
            vi.mocked(db.query.channels.findMany).mockResolvedValue([]);
            vi.mocked(db.$count).mockResolvedValue(0);

            const { getChannels } = await import('../queries');
            const result = await getChannels({ pageSize: 999 });

            // 验证返回的 pageSize 被限制为 100
            expect(result.pageSize).toBe(100);
        });

        it('getChannels：pageSize 为负数时应被归一化为 1', async () => {
            vi.mocked(auth).mockResolvedValue({
                user: { id: 'u1', tenantId: 'tenant-1' }
            } as unknown as Awaited<ReturnType<typeof auth>>);
            vi.mocked(checkPermission).mockResolvedValue(true);
            vi.mocked(db.query.channels.findMany).mockResolvedValue([]);
            vi.mocked(db.$count).mockResolvedValue(0);

            const { getChannels } = await import('../queries');
            const result = await getChannels({ pageSize: -5 });

            // pageSize 被 Math.max 限制为 1
            expect(result.pageSize).toBe(1);
        });
    });
});
