import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkPermission } from '../auth';
import { db } from '@/shared/api/db';
import { roles } from '@/shared/api/schema';
import { Session } from 'next-auth';

vi.mock('next-auth', () => ({
    __esModule: true,
    default: vi.fn(() => ({
        handlers: {},
        auth: vi.fn(),
        signIn: vi.fn(),
        signOut: vi.fn(),
    })),
}));

vi.mock('next-auth/providers/credentials', () => ({
    __esModule: true,
    default: vi.fn(),
}));

vi.mock('next/cache', () => ({
    unstable_cache: (cb: any) => cb,
}));

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            roles: {
                findFirst: vi.fn(),
            },
        },
        insert: vi.fn(() => ({
            values: vi.fn().mockResolvedValue({}),
        })),
    },
}));

vi.mock('../logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

describe('RBAC 权限检查', () => {
    let mockSession: Session;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSession = {
            user: {
                id: 'user-1',
                name: 'Test User',
                email: 'test@example.com',
                role: 'WORKER',
                roles: ['WORKER'],
                tenantId: 'tenant-1',
                isPlatformAdmin: false,
            },
            expires: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        };
    });

    describe('精确匹配', () => {
        it('用户拥有精确权限应返回 true', async () => {
            // Mock 返回的具体权限
            vi.mocked(db.query.roles.findFirst).mockResolvedValue({
                permissions: ['order.view', 'order.edit'],
            } as any);

            const result = await checkPermission(mockSession, 'order.edit');
            expect(result).toBe(true);
        });

        it('用户缺少权限应返回 false', async () => {
            vi.mocked(db.query.roles.findFirst).mockResolvedValue({
                permissions: ['order.view'],
            } as any);

            const result = await checkPermission(mockSession, 'order.edit');
            expect(result).toBe(false);
        });

        it('ADMIN 角色应绕过所有检查', async () => {
            mockSession.user!.roles = ['ADMIN'];
            // ADMIN 不用查库直接返回 true
            const result = await checkPermission(mockSession, 'super.secret.action');
            expect(result).toBe(true);
            expect(db.query.roles.findFirst).not.toHaveBeenCalled();
        });
    });

    describe('通配符匹配', () => {
        it('角色拥有 * 权限应匹配所有', async () => {
            vi.mocked(db.query.roles.findFirst).mockResolvedValue({
                permissions: ['*'],
            } as any);

            const result = await checkPermission(mockSession, 'any.resource.action');
            expect(result).toBe(true);
        });

        it('角色拥有 ** 权限应匹配所有', async () => {
            vi.mocked(db.query.roles.findFirst).mockResolvedValue({
                permissions: ['**'],
            } as any);

            const result = await checkPermission(mockSession, 'another.resource.action');
            expect(result).toBe(true);
        });
    });

    describe('数据范围推导', () => {
        it('order.own.edit 应隐式包含 order.edit', async () => {
            vi.mocked(db.query.roles.findFirst).mockResolvedValue({
                permissions: ['order.own.edit'],
            } as any);

            const result = await checkPermission(mockSession, 'order.edit');
            expect(result).toBe(true);
        });

        it('order.all.edit 应隐式包含 order.edit', async () => {
            vi.mocked(db.query.roles.findFirst).mockResolvedValue({
                permissions: ['order.all.edit'],
            } as any);

            const result = await checkPermission(mockSession, 'order.edit');
            expect(result).toBe(true);
        });

        it('三段权限名不应触发推导逻辑但可被精确匹配', async () => {
            vi.mocked(db.query.roles.findFirst).mockResolvedValue({
                permissions: ['module.sub.action'],
            } as any);

            const result = await checkPermission(mockSession, 'module.sub.action');
            expect(result).toBe(true);

            const failedResult = await checkPermission(mockSession, 'module.action');
            expect(failedResult).toBe(false);
        });
    });

    describe('多角色合并', () => {
        it('多角色的权限应合并为并集', async () => {
            mockSession.user!.roles = ['ROLE_A', 'ROLE_B'];

            // 测试需要按调用顺次返回 mock
            vi.mocked(db.query.roles.findFirst)
                .mockResolvedValueOnce({ permissions: ['perm.A'] } as any)
                .mockResolvedValueOnce({ permissions: ['perm.B'] } as any);

            const resultA = await checkPermission(mockSession, 'perm.A');
            // 注意：重置并重设 mock 以便下一个验证不被缓存困扰（这里是简单测试场景，真实情况可能因 unstable_cache 缓存而不需要二次查询，此为模拟核心逻辑）
            vi.mocked(db.query.roles.findFirst)
                .mockResolvedValueOnce({ permissions: ['perm.A'] } as any)
                .mockResolvedValueOnce({ permissions: ['perm.B'] } as any);

            const resultB = await checkPermission(mockSession, 'perm.B');

            expect(resultA).toBe(true);
            expect(resultB).toBe(true);
        });
    });

    describe('审计日志', () => {
        it('options.audit=true 应写入审计日志', async () => {
            vi.mocked(db.query.roles.findFirst).mockResolvedValue({
                permissions: ['order.edit'],
            } as any);

            await checkPermission(mockSession, 'order.edit', {
                audit: true,
                action: 'UPDATE_ORDER',
                resourceType: 'orders',
                resourceId: 'order-123',
            });

            expect(db.insert).toHaveBeenCalled();
        });

        it('审计写入失败不应影响权限结果', async () => {
            vi.mocked(db.query.roles.findFirst).mockResolvedValue({
                permissions: ['order.edit'],
            } as any);

            // 模拟审计抛出错误
            const mockInsert = vi.fn(() => ({
                values: vi.fn().mockRejectedValue(new Error('Audit DB Down')),
            }));
            (db.insert as any) = mockInsert;

            const result = await checkPermission(mockSession, 'order.edit', {
                audit: true,
            });

            expect(result).toBe(true); // 虽然报错，不应阻断权限许可
        });
    });

    describe('边界情况', () => {
        it('session 为 null 应返回 false', async () => {
            const result = await checkPermission(null, 'order.view');
            expect(result).toBe(false);
        });

        it('roles 为空数组应返回 false', async () => {
            mockSession.user!.roles = [];
            const result = await checkPermission(mockSession, 'order.view');
            expect(result).toBe(false);
        });

        it('数据库错误应返回 false 而非抛出', async () => {
            vi.mocked(db.query.roles.findFirst).mockRejectedValue(new Error('DB connection failed'));

            const result = await checkPermission(mockSession, 'order.view');
            expect(result).toBe(false);
        });
    });
});
