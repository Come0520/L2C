import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------
// 极简 Mock 策略
// ---------------------------------------------------------

// Mock next/cache 以绕过 Vitest 环境中缺少 incrementalCache 的问题
vi.mock('next/cache', () => ({
    unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
    revalidateTag: vi.fn(),
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            channels: { findMany: vi.fn(), findFirst: vi.fn() },
            channelContacts: { findMany: vi.fn() }
        },
        $count: vi.fn()
    }
}));

vi.mock('@/shared/api/schema/channels', () => ({
    channels: { id: 'channels.id', tenantId: 'channels.tenantId', createdAt: 'channels.createdAt' },
    channelContacts: { id: 'channelContacts.id', channelId: 'channelContacts.channelId', tenantId: 'channelContacts.tenantId', isMain: 'channelContacts.isMain', createdAt: 'channelContacts.createdAt' }
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

import { getChannels, getChannelTree, getChannelById, getChannelContacts } from '../queries';
import { db } from '@/shared/api/db';
import { auth, checkPermission } from '@/shared/lib/auth';

describe('Channels Queries (Fixed Validated)', () => {
    const mockTenantId = 'test-tenant-id';
    const mockSession = { user: { id: 'u1', tenantId: mockTenantId, roles: ['ADMIN'] } };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(auth).mockResolvedValue(mockSession as any);
        vi.mocked(checkPermission).mockResolvedValue(true);
    });

    describe('getChannels', () => {
        it('成功获取分页列表', async () => {
            const mockData = [{ id: '1', name: 'C1' }];
            vi.mocked(db.query.channels.findMany).mockResolvedValue(mockData as any);
            vi.mocked(db.$count).mockResolvedValue(1);

            const result = await getChannels({ page: 1, pageSize: 10 });

            expect(result.data).toHaveLength(1);
            // 修正字段名：实现中返回的是 totalItems 和 totalPages
            expect(result.totalItems).toBe(1);
            expect(result.totalPages).toBe(1);
        });
    });

    it('getChannelTree 构建嵌套树形结构', async () => {
        const mockAll = [
            { id: 'root', name: 'Root', parentId: null },
            { id: 'child', name: 'Child', parentId: 'root' }
        ];
        vi.mocked(db.query.channels.findMany).mockResolvedValue(mockAll as any);

        const tree = await getChannelTree();
        expect(tree).toHaveLength(1);
        expect(tree[0].children).toHaveLength(1);
    });

    it('getChannelById 根据 ID 获取详情', async () => {
        vi.mocked(db.query.channels.findFirst).mockResolvedValue({ id: 'c1' } as any);
        const result = await getChannelById('c1');
        expect(result?.id).toBe('c1');
    });
});
