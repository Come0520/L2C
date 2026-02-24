import { describe, it, expect, vi, beforeEach } from 'vitest';

// 使用 vi.hoisted 提升 mock 定义
const mocks = vi.hoisted(() => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
    revalidatePath: vi.fn(),
    logAudit: vi.fn(),
    dbFindFirst: vi.fn(),
    dbFindMany: vi.fn(),
}));

// Mock 依赖
vi.mock('@/shared/lib/auth', () => ({
    auth: mocks.auth,
    checkPermission: mocks.checkPermission,
}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath,
    revalidateTag: vi.fn(),
}));
vi.mock('@/shared/services/audit-service', () => ({
    AuditService: { log: mocks.logAudit },
}));

// Mock ROLES 常量
vi.mock('@/shared/config/roles', () => ({
    ROLES: {
        ADMIN: { code: 'ADMIN', name: '管理员', description: '系统管理员', permissions: ['**'] },
        SALES: { code: 'SALES', name: '销售', description: '销售人员', permissions: ['lead.view'] },
    },
}));

// Mock 权限常量 - 必须包含 PERMISSIONS.SETTINGS.MANAGE 和 PERMISSIONS.GLOBAL.ADMIN
vi.mock('@/shared/config/permissions', () => ({
    PERMISSIONS: {
        SETTINGS: { MANAGE: 'settings.manage' },
        GLOBAL: { ADMIN: '**', VIEW: '*' },
    },
    getAllPermissions: () => [
        'lead.view', 'lead.create', 'lead.edit',
        'settings.manage', 'settings.view',
    ],
}));

// Mock DB
vi.mock('@/shared/api/db', () => {
    const createUpdateChain = () => ({
        set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
        }),
    });
    const createInsertChain = () => ({
        values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'new-role-id' }]),
        }),
    });
    const createDeleteChain = () => ({
        where: vi.fn().mockResolvedValue({}),
    });

    const makeTx = () => ({
        query: {
            roles: { findFirst: mocks.dbFindFirst, findMany: mocks.dbFindMany },
            users: { findFirst: mocks.dbFindFirst },
        },
        update: vi.fn().mockReturnValue(createUpdateChain()),
        insert: vi.fn().mockReturnValue(createInsertChain()),
        delete: vi.fn().mockReturnValue(createDeleteChain()),
    });

    return {
        db: {
            query: {
                roles: { findFirst: mocks.dbFindFirst, findMany: mocks.dbFindMany },
                users: { findFirst: mocks.dbFindFirst },
            },
            update: vi.fn().mockReturnValue(createUpdateChain()),
            insert: vi.fn().mockReturnValue(createInsertChain()),
            delete: vi.fn().mockReturnValue(createDeleteChain()),
            transaction: vi.fn(async (callback) => await callback(makeTx())),
        },
    };
});

// 必须在 vi.mock 之后 import
import { getRolesAction, createRole, updateRole, deleteRole } from '../actions/roles-management';

describe('RolesManagement Actions', () => {
    const mockTenantId = 'tenant-1';
    const mockUserId = 'user-1';
    const mockSession = {
        user: { id: mockUserId, tenantId: mockTenantId, role: 'ADMIN' },
    };

    const mockSystemRole = {
        id: 'role-sys-admin',
        tenantId: mockTenantId,
        code: 'ADMIN',
        name: '管理员',
        permissions: ['**'],
        isSystem: true,
    };

    const mockCustomRole = {
        id: 'role-custom-1',
        tenantId: mockTenantId,
        code: 'SALES_REP',
        name: '销售代表',
        permissions: ['lead.view', 'lead.create'],
        isSystem: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.auth.mockResolvedValue(mockSession);
        mocks.checkPermission.mockResolvedValue(undefined);
    });

    // === getRolesAction 测试 ===
    describe('getRolesAction', () => {
        it('应返回租户下所有角色', async () => {
            mocks.dbFindMany.mockResolvedValue([mockSystemRole, mockCustomRole]);

            const result = await getRolesAction();

            expect(result).toHaveLength(2);
            expect(result[0].code).toBe('ADMIN');
        });

        it('未授权时应抛出错误', async () => {
            mocks.auth.mockResolvedValue(null);

            await expect(getRolesAction()).rejects.toThrow();
        });
    });

    // === createRole 测试 ===
    describe('createRole', () => {
        it('应成功创建自定义角色', async () => {
            // 角色代码不重复 - findFirst 在事务中检查现有角色
            mocks.dbFindFirst.mockResolvedValue(null);

            const result = await createRole({
                code: 'NEW_ROLE',
                name: '新角色',
                description: '测试角色',
                permissions: ['lead.view'],
            });

            expect(result.success).toBe(true);
        });

        it('角色代码重复时应返回错误', async () => {
            // 事务中 findFirst 返回已存在的角色
            mocks.dbFindFirst.mockResolvedValue({ id: 'existing', code: 'EXISTING_ROLE' });

            const result = await createRole({
                code: 'EXISTING_ROLE',
                name: '重复角色',
                permissions: ['lead.view'],
            });

            expect(result.success).toBe(false);
            expect(result.message).toContain('已存在');
        });

        it('无效权限代码应返回错误', async () => {
            mocks.dbFindFirst.mockResolvedValue(null);

            const result = await createRole({
                code: 'NEW_ROLE',
                name: '新角色',
                permissions: ['invalid:permission'],
            });

            expect(result.success).toBe(false);
            expect(result.message).toContain('无效');
        });
    });

    // === updateRole 测试 ===
    describe('updateRole', () => {
        it('应成功更新自定义角色', async () => {
            mocks.dbFindFirst.mockResolvedValue(mockCustomRole);

            const result = await updateRole('role-custom-1', {
                name: '高级销售',
                permissions: ['lead.view', 'lead.create'],
            });

            expect(result.success).toBe(true);
        });

        it('角色不存在时应返回错误', async () => {
            mocks.dbFindFirst.mockResolvedValue(null);

            const result = await updateRole('nonexistent', {
                name: '不存在',
            });

            expect(result.success).toBe(false);
            expect(result.message).toContain('不存在');
        });
    });

    // === deleteRole 测试 ===
    describe('deleteRole', () => {
        it('应成功删除自定义角色', async () => {
            // 第一次 findFirst: 找到角色（非系统角色）
            // 第二次 findFirst: 检查用户是否使用该角色（无用户）
            mocks.dbFindFirst
                .mockResolvedValueOnce(mockCustomRole)  // 查找角色
                .mockResolvedValueOnce(null);             // 无用户使用该角色

            const result = await deleteRole('role-custom-1');

            expect(result.success).toBe(true);
        });

        it('系统角色不能删除', async () => {
            mocks.dbFindFirst.mockResolvedValue(mockSystemRole);

            const result = await deleteRole('role-sys-admin');

            expect(result.success).toBe(false);
            expect(result.message).toContain('系统');
        });
    });
});
