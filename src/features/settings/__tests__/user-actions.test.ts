import { describe, it, expect, vi, beforeEach } from 'vitest';

// 使用 vi.hoisted 提升 mock 定义
const mocks = vi.hoisted(() => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
    revalidatePath: vi.fn(),
    logAudit: vi.fn(),
    // 数据库操作 mock 也需要提升
    dbFindFirst: vi.fn(),
    dbFindMany: vi.fn(),
    dbUpdate: vi.fn(),
}));

// Mock 依赖
vi.mock('@/shared/lib/auth', () => ({
    auth: mocks.auth,
    checkPermission: mocks.checkPermission,
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: mocks.logAudit },
}));

// Mock DB
vi.mock('@/shared/api/db', () => {
    const createUpdateChain = () => ({
        set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
        }),
    });
    const createInsertChain = () => ({
        values: vi.fn().mockResolvedValue({}),
    });
    const createDeleteChain = () => ({
        where: vi.fn().mockResolvedValue({}),
    });

    const makeTx = () => ({
        query: {
            users: {
                findFirst: mocks.dbFindFirst,
                findMany: mocks.dbFindMany,
            },
        },
        update: vi.fn().mockReturnValue(createUpdateChain()),
        insert: vi.fn().mockReturnValue(createInsertChain()),
        delete: vi.fn().mockReturnValue(createDeleteChain()),
    });

    return {
        db: {
            query: {
                users: {
                    findFirst: mocks.dbFindFirst,
                    findMany: mocks.dbFindMany,
                },
            },
            update: vi.fn().mockReturnValue(createUpdateChain()),
            transaction: vi.fn(async (callback) => await callback(makeTx())),
        },
    };
});

// 必须在 vi.mock 之后 import
import { updateUser, toggleUserActive, deleteUser } from '../actions/user-actions';

describe('UserActions', () => {
    const mockTenantId = 'tenant-1';
    const mockUserId = 'user-current';
    const mockSession = {
        user: { id: mockUserId, tenantId: mockTenantId, role: 'ADMIN' },
    };

    const mockTargetUser = {
        id: 'user-target',
        tenantId: mockTenantId,
        name: '张三',
        role: 'MEMBER',
        roles: ['MEMBER'],
        isActive: true,
        email: 'test@example.com',
        phone: '13800138000',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.auth.mockResolvedValue(mockSession);
        mocks.checkPermission.mockResolvedValue(undefined);
    });

    // === updateUser 测试 ===
    describe('updateUser', () => {
        it('应成功更新用户名称和角色', async () => {
            mocks.dbFindFirst.mockResolvedValue(mockTargetUser);
            // isLastAdmin 检查 - 有其他管理员
            mocks.dbFindMany.mockResolvedValue([
                { id: 'admin-2', role: 'ADMIN', roles: ['ADMIN'], isActive: true },
            ]);

            const result = await updateUser('user-target', {
                name: '李四',
                roles: ['MEMBER'],
            });

            expect(result.success).toBe(true);
        });

        it('未授权时应返回错误', async () => {
            mocks.auth.mockResolvedValue(null);

            const result = await updateUser('user-target', {
                name: '李四',
                roles: ['MEMBER'],
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('无权限');
        });

        it('无权限时应返回错误', async () => {
            mocks.checkPermission.mockRejectedValue(new Error('权限不足'));

            const result = await updateUser('user-target', {
                name: '李四',
                roles: ['MEMBER'],
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('无权限');
        });

        it('Zod 校验失败时应返回格式错误', async () => {
            const result = await updateUser('user-target', {
                name: '',  // 名称不能为空
                roles: ['MEMBER'],
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('格式错误');
        });

        it('用户不存在时应返回错误', async () => {
            mocks.dbFindFirst.mockResolvedValue(null);

            const result = await updateUser('nonexistent-id', {
                name: '李四',
                roles: ['MEMBER'],
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('不存在');
        });
    });

    // === toggleUserActive 测试 ===
    describe('toggleUserActive', () => {
        it('应成功切换用户状态', async () => {
            mocks.dbFindFirst.mockResolvedValue(mockTargetUser);
            // isLastAdmin 检查 - 还有其他管理员
            mocks.dbFindMany.mockResolvedValue([
                { id: 'admin-2', role: 'ADMIN', roles: ['ADMIN'], isActive: true },
            ]);

            const result = await toggleUserActive('user-target');

            expect(result.success).toBe(true);
        });

        it('不能禁用自己', async () => {
            const result = await toggleUserActive(mockUserId);

            expect(result.success).toBe(false);
            expect(result.error).toContain('自己');
        });

        it('不能禁用最后一个管理员', async () => {
            const adminUser = {
                ...mockTargetUser,
                id: 'admin-only',
                role: 'ADMIN',
                roles: ['ADMIN'],
            };
            mocks.dbFindFirst.mockResolvedValue(adminUser);
            // isLastAdmin 检查 - 没有其他管理员了
            mocks.dbFindMany.mockResolvedValue([]);

            const result = await toggleUserActive('admin-only');

            expect(result.success).toBe(false);
            expect(result.error).toContain('管理员');
        });
    });

    // === deleteUser 测试 ===
    describe('deleteUser', () => {
        it('应执行软删除', async () => {
            mocks.dbFindFirst.mockResolvedValue(mockTargetUser);
            // isLastAdmin 检查 - 有其他管理员
            mocks.dbFindMany.mockResolvedValue([
                { id: 'admin-2', role: 'ADMIN', roles: ['ADMIN'], isActive: true },
            ]);

            const result = await deleteUser('user-target');

            expect(result.success).toBe(true);
        });

        it('不能删除自己', async () => {
            const result = await deleteUser(mockUserId);

            expect(result.success).toBe(false);
            expect(result.error).toContain('自己');
        });

        it('不能删除最后一个管理员', async () => {
            const adminUser = {
                ...mockTargetUser,
                id: 'admin-only',
                role: 'ADMIN',
                roles: ['ADMIN'],
            };
            mocks.dbFindFirst.mockResolvedValue(adminUser);
            // isLastAdmin 检查 - 没有其他管理员
            mocks.dbFindMany.mockResolvedValue([]);

            const result = await deleteUser('admin-only');

            expect(result.success).toBe(false);
            expect(result.error).toContain('管理员');
        });
    });
});
