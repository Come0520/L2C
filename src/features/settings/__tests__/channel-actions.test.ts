
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getChannelCategories,
    getChannels,
    createChannel,
    deleteChannel
} from '../actions';
import { db } from '@/shared/api/db';
import * as authLib from '@/shared/lib/auth';
import { AuditService } from '@/shared/services/audit-service';
import { revalidatePath } from 'next/cache';

// Mock dependencies
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            marketChannels: {
                findFirst: vi.fn(),
                findMany: vi.fn(),
            },
        },
        insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn() })) })),
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn() })) })) })),
        delete: vi.fn(() => ({ where: vi.fn() })),
    },
}));

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn(),
    },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        SETTINGS: {
            MANAGE: 'settings:manage',
        },
    },
}));

describe('Channel Actions - Task 4: Channel CRUD & Cascade Delete', () => {
    const mockTenantId = 'tenant-1';
    const mockUserId = 'user-1';
    const mockSession = {
        user: {
            id: mockUserId,
            tenantId: mockTenantId,
        },
    };

    beforeEach(() => {
        vi.resetAllMocks();

        // Setup default behaviors
        vi.mocked(authLib.auth).mockResolvedValue(mockSession as authLib.Session);
        vi.mocked(authLib.checkPermission).mockResolvedValue(true);

        // Setup DB defaults
        vi.mocked(db.query.marketChannels.findMany).mockResolvedValue([]);
        vi.mocked(db.query.marketChannels.findFirst).mockResolvedValue(null);

        // Setup Insert default
        const returnMock = vi.fn().mockResolvedValue([{ id: 'new-id' }]);
        const valuesMock = vi.fn().mockReturnValue({ returning: returnMock });
        // @ts-ignore - Drizzle insert chain is complex to mock fully
        vi.mocked(db.insert).mockReturnValue({ values: valuesMock });
    });

    describe('getChannelCategories', () => {
        it('应该返回所有顶级渠道分类', async () => {
            const mockCategories = [
                { id: 'cat1', name: 'Category 1', parentId: null },
                { id: 'cat2', name: 'Category 2', parentId: 'cat1' },
            ];
            vi.mocked(db.query.marketChannels.findMany).mockResolvedValue(mockCategories as unknown as Array<{ id: string; name: string; parentId: string | null }>);

            const result = await getChannelCategories();

            expect(result.success).toBe(true);
            expect(result.data).toHaveLength(1);
            expect(result.data[0].id).toBe('cat1');
        });
    });

    describe('getChannels', () => {
        it('应该返回当前租户的渠道列表', async () => {
            const mockChannels = [
                { id: 'c1', name: 'Channel 1', tenantId: mockTenantId },
                { id: 'c2', name: 'Channel 2', tenantId: mockTenantId },
            ];
            vi.mocked(db.query.marketChannels.findMany).mockResolvedValue(mockChannels as unknown as Array<{ id: string; name: string; tenantId: string }>);

            const result = await getChannels();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockChannels);
        });
    });

    describe('createChannel', () => {
        const newChannelData = {
            name: 'New Channel',
            category: 'Category 1' as const,
            type: 'DIRECT' as const,
            isActive: true,
        };

        it('有效数据应成功创建渠道', async () => {
            const result = await createChannel(newChannelData);
            // Wrapper success
            expect(result.success).toBe(true);
            // Handler success
            expect(result.data).toBeDefined();
            expect(result.data?.success).toBe(true);

            expect(db.insert).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalled();
        });

        it('无权限应返回错误', async () => {
            vi.mocked(authLib.checkPermission).mockRejectedValue(new Error('Unauthorized'));

            const result = await createChannel(newChannelData);

            // Handler catches error and returns { success: false }, so wrapper sees success
            expect(result.success).toBe(true);
            expect(result.data?.success).toBe(false);
            expect(result.data?.error).toMatch(/无权限|Unauthorized/);
        });
    });

    describe('deleteChannel', () => {
        const channelId = 'channel-to-delete';

        it('存在子渠道时应禁止删除', async () => {
            // Mock findFirst sequence:
            // 1. Existing channel check -> returns channel
            // 2. Child channel check -> returns child
            vi.mocked(db.query.marketChannels.findFirst)
                .mockResolvedValueOnce({ id: channelId, tenantId: mockTenantId } as unknown as { id: string; tenantId: string })
                .mockResolvedValueOnce({ id: 'child-1', parentId: channelId } as unknown as { id: string; parentId: string });

            const result = await deleteChannel({ id: channelId });

            expect(result.success).toBe(true);
            expect(result.data?.success).toBe(false);
            expect(result.data?.error).toBe('该渠道下存在子渠道，无法删除');
            expect(db.delete).not.toHaveBeenCalled();
        });

        it('无子渠道且存在时应成功删除', async () => {
            // Mock findFirst sequence:
            // 1. Existing channel check -> returns channel
            // 2. Child channel check -> returns null
            vi.mocked(db.query.marketChannels.findFirst)
                .mockResolvedValueOnce({ id: channelId, tenantId: mockTenantId } as unknown as { id: string; tenantId: string })
                .mockResolvedValueOnce(null);

            const result = await deleteChannel({ id: channelId });

            expect(result.success).toBe(true);
            expect(result.data?.success).toBe(true);
            expect(db.delete).toHaveBeenCalled();
            expect(AuditService.log).toHaveBeenCalledWith(db, expect.objectContaining({
                action: 'DELETE',
                recordId: channelId,
            }));
        });

        it('渠道不存在时应返回错误', async () => {
            // Mock findFirst sequence:
            // 1. Existing channel check -> returns null
            vi.mocked(db.query.marketChannels.findFirst).mockResolvedValueOnce(null);

            const result = await deleteChannel({ id: 'non-existent' });

            expect(result.success).toBe(true);
            expect(result.data?.success).toBe(false);
            expect(result.data?.error).toBe('渠道不存在或无权操作');
        });
    });
});
