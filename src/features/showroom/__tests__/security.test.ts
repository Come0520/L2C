import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getShowroomItems, deleteShowroomItem } from '../actions/items';
import { getShareContent } from '../actions/shares';

// Mock dependencies
vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        SHOWROOM: { VIEW: 'showroom.view' },
    },
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            showroomItems: {
                findFirst: vi.fn(),
                findMany: vi.fn(),
            },
            showroomShares: {
                findFirst: vi.fn(),
            },
        },
        update: vi.fn(() => ({
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            returning: vi.fn(),
        })),
    },
}));

vi.mock('next/headers', () => ({
    headers: vi.fn(() => ({
        get: vi.fn().mockReturnValue('127.0.0.1'),
    })),
}));

vi.mock('@/shared/middleware/rate-limit', () => ({
    checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock('@/shared/lib/redis', () => ({
    redis: {
        get: vi.fn(),
        set: vi.fn(),
        incr: vi.fn(),
        setex: vi.fn(),
    },
}));

import { auth, checkPermission } from '@/shared/lib/auth';

describe('Showroom Module Security Regression Tests', () => {
    const mockTenantId = 'tenant-123';
    const mockUserId = 'user-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('D3-P1-2: getShowroomItems Permission Check', () => {
        it('should reject access if user lacks SHOWROOM.VIEW permission', async () => {
            // 模拟登录用户但无对应模块权限
            (auth as any).mockResolvedValue({
                user: { id: mockUserId, tenantId: mockTenantId },
            });
            (checkPermission as any).mockReturnValue(false);

            await expect(
                getShowroomItems({
                    page: 1,
                    pageSize: 20,
                })
            ).rejects.toThrow('无权操作展厅内容'); // Matches ShowroomErrors.FORBIDDEN
        });

        it('should allow access if user has SHOWROOM.VIEW permission', async () => {
            // 模拟最高权限平台管理或是有配置权限的用户跳过 DB
            (auth as any).mockResolvedValue({
                user: { id: mockUserId, tenantId: '__PLATFORM__' },
            });
            (checkPermission as any).mockReturnValue(true);

            const res = await getShowroomItems({
                page: 1,
                pageSize: 20,
            });

            expect(res.data).toEqual([]); // Platform bypasses query
        });
    });

    describe('D3-006-R7: deleteShowroomItem Cross-Tenant Soft Delete 防御', () => {
        // 主要是为了证明其需要 auth，更深层的 `and()` 被添加到 where 是静态逻辑测试
        it('should require authentication to delete items', async () => {
            (auth as any).mockResolvedValue(null);

            await expect(
                deleteShowroomItem({
                    id: 'item-1',
                })
            ).rejects.toThrow('未登录或会话已过期');
        });
    });

    describe('D6-P2-2: Share Link Password Protection', () => {
        it('should reject access if password hash mismatches', async () => {
            const { db } = await import('@/shared/api/db');

            // Mock 返回一个带有密码保护的分享记录
            (db.query.showroomShares.findFirst as any).mockResolvedValue({
                id: 'share-1',
                isActive: 1,
                passwordHash: 'wrong-hash-example', // 故意设置不同的 hash
            });

            await expect(
                getShareContent({
                    shareId: 'share-1',
                    password: 'my-password', // 此密码的 hash 不会等于 wrong-hash-example
                })
            ).rejects.toThrow('访问密码不正确');
        });

        it('should require password if share is protected', async () => {
            const { db } = await import('@/shared/api/db');

            (db.query.showroomShares.findFirst as any).mockResolvedValue({
                id: 'share-1',
                isActive: 1,
                passwordHash: 'some-hash',
            });

            // 未传递密码
            await expect(
                getShareContent({
                    shareId: 'share-1',
                })
            ).rejects.toThrow('访问密码不正确');
        });
    });
});
