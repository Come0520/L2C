import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/api/db', () => {
    // 在工厂函数内部定义，确保不会被提升报错
    const internalMockSetResult = { where: vi.fn() };
    const internalMockSet = vi.fn().mockReturnValue(internalMockSetResult);
    const internalMockUpdate = vi.fn().mockReturnValue({ set: internalMockSet });

    const mockDb = {
        query: {
            roles: {
                findFirst: vi.fn(),
                findMany: vi.fn(),
            },
            users: {
                findFirst: vi.fn(),
            }
        },
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: vi.fn(() => [{ id: 'new-role-id' }]),
            })),
        })),
        update: internalMockUpdate,
        delete: vi.fn(() => ({
            where: vi.fn(),
        })),
        transaction: vi.fn((callback) => callback(mockDb)),
    };
    return { db: mockDb };
});

import { db } from '@/shared/api/db';
import { roles } from '@/shared/api/schema';
import { auth, checkPermission } from '@/shared/lib/auth';
import { AuditService } from '@/shared/services/audit-service';
import { revalidatePath } from 'next/cache';
import { createRole, updateRole, deleteRole, syncSystemRoles } from '../actions/roles-management';

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

vi.mock('@/shared/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    },
}));

describe('RolesManagementActions', () => {
    const mockTenantId = 'tenant-123';
    const mockUserId = 'user-456';
    const mockSession = {
        user: {
            id: mockUserId,
            tenantId: mockTenantId,
        },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (auth as any).mockResolvedValue(mockSession);
        (checkPermission as any).mockResolvedValue(true);
    });

    describe('createRole', () => {
        const roleData = {
            code: 'TEST_ROLE',
            name: '测试角色',
            description: '这是一个测试角色',
            permissions: ['settings.manage'],
        };

        it('should create a new role with permissions successfully', async () => {
            (db.query.roles.findFirst as any).mockResolvedValue(null);
            const result = await createRole(roleData);
            expect(result.success).toBe(true);
            expect(db.insert).toHaveBeenCalled();
            expect(revalidatePath).toHaveBeenCalledWith('/settings/roles');
        });

        it('should reject duplicate role names', async () => {
            (db.query.roles.findFirst as any).mockResolvedValue({ id: 'existing-id' });
            const result = await createRole(roleData);
            expect(result.success).toBe(false);
            expect(result.message).toContain('已存在');
        });
    });

    describe('updateRole', () => {
        const roleId = 'role-1';
        const updateData = {
            name: '更新后的名称',
            permissions: ['settings.manage'],
        };

        it('should update role permissions successfully', async () => {
            (db.query.roles.findFirst as any).mockResolvedValue({
                id: roleId,
                isSystem: false,
                name: '旧名称',
                permissions: [],
            });

            const result = await updateRole(roleId, updateData);
            expect(result.success).toBe(true);
            expect(db.update).toHaveBeenCalled();
        });

        it('should not allow updating permissions of a system role', async () => {
            (db.query.roles.findFirst as any).mockResolvedValue({
                id: roleId,
                isSystem: true,
                name: '系统管理员',
                permissions: ['*'],
            });

            const result = await updateRole(roleId, updateData);
            expect(result.success).toBe(true);

            // 重要：通过执行 db.update 获取 set 的 Mock 实例
            const updateCallResult = db.update(roles) as any;
            const setArgs = updateCallResult.set.mock.calls[0][0];
            expect(setArgs.permissions).toBeUndefined();
        });
    });

    describe('deleteRole', () => {
        const roleId = 'role-to-delete';

        it('should delete role with no assigned users successfully', async () => {
            (db.query.roles.findFirst as any).mockResolvedValue({
                id: roleId,
                isSystem: false,
                code: 'DELETE_ME',
                name: '待删除角色',
            });
            (db.query.users.findFirst as any).mockResolvedValue(null);

            const result = await deleteRole(roleId);
            expect(result.success).toBe(true);
            expect(db.delete).toHaveBeenCalled();
        });

        it('should reject deletion of system role', async () => {
            (db.query.roles.findFirst as any).mockResolvedValue({ id: roleId, isSystem: true });
            const result = await deleteRole(roleId);
            expect(result.success).toBe(false);
            expect(result.message).toContain('系统预设角色');
        });

        it('should reject deletion of role with assigned users', async () => {
            (db.query.roles.findFirst as any).mockResolvedValue({ id: roleId, isSystem: false, code: 'IN_USE' });
            (db.query.users.findFirst as any).mockResolvedValue({ id: 'user-1' });
            const result = await deleteRole(roleId);
            expect(result.success).toBe(false);
            expect(result.message).toContain('仍有用户在使用');
        });
    });

    describe('syncSystemRoles', () => {
        it('should batch update or insert system roles', async () => {
            const result = await syncSystemRoles();
            expect(result.success).toBe(true);
            expect(db.transaction).toHaveBeenCalled();
        });
    });
});
