import { describe, it, expect, vi, beforeEach } from 'vitest';

// ========== worker-management 导入 ==========
import { getWorkers, getWorkerById, updateWorker } from '../worker-management/actions';

// ========== role-management 导入 ==========
import {
    getRoles,
    createRole,
    updateRolePermissions,
    deleteRole,
} from '../role-management/actions';

import { auth, checkPermission } from '@/shared/lib/auth';
import { AuditService } from '@/shared/services/audit-service';
import { getAllPermissions } from '@/shared/config/permissions';
import type { Session } from 'next-auth';

// ===== Mock 依赖 =====

vi.mock('@/shared/lib/auth', () => ({
    auth: vi.fn(),
    checkPermission: vi.fn(),
}));

vi.mock('../rate-limiter', () => ({
    AdminRateLimiter: {
        check: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('@/shared/services/audit-service', () => ({
    AuditService: {
        log: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('@/shared/config/permissions', async (importOriginal) => {
    const original = await importOriginal<typeof import('@/shared/config/permissions')>();
    return {
        ...original,
        getAllPermissions: vi.fn(() => ['settings.user', 'settings.role', 'admin.settings', 'lead.view', 'customer.view']),
    };
});

const mockDbFindManyUsers = vi.fn().mockResolvedValue([]);
const mockDbFindFirstUsers = vi.fn().mockResolvedValue(null);
const mockDbFindManyRoles = vi.fn().mockResolvedValue([]);
const mockDbFindFirstRoles = vi.fn().mockResolvedValue(null);
const mockDbUpdateReturning = vi.fn().mockResolvedValue([{ id: 'test-id' }]);
const mockDbInsertReturning = vi.fn().mockResolvedValue([{ id: 'new-role-id', name: '测试角色' }]);
const mockDbDeleteWhere = vi.fn().mockResolvedValue(undefined);

vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            users: {
                findMany: (...args: unknown[]) => mockDbFindManyUsers(...args),
                findFirst: (...args: unknown[]) => mockDbFindFirstUsers(...args),
            },
            roles: {
                findMany: (...args: unknown[]) => mockDbFindManyRoles(...args),
                findFirst: (...args: unknown[]) => mockDbFindFirstRoles(...args),
            },
        },
        select: vi.fn(() => ({
            from: vi.fn(() => ({
                where: vi.fn(() => [{ count: 0 }]),
            })),
        })),
        update: vi.fn(() => ({
            set: vi.fn(() => ({
                where: vi.fn(() => ({
                    returning: mockDbUpdateReturning,
                })),
            })),
        })),
        insert: vi.fn(() => ({
            values: vi.fn(() => ({
                returning: mockDbInsertReturning,
            })),
        })),
        delete: vi.fn(() => ({
            where: mockDbDeleteWhere,
        })),
    },
}));

vi.mock('@/shared/lib/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
    revalidateTag: vi.fn(),
}));

// ===== 测试常量（合法 UUID v4 格式） =====

const TENANT_A = '11111111-1111-4111-a111-111111111111';
const TENANT_B = '22222222-2222-4222-a222-222222222222';
const ADMIN_ID = '33333333-3333-4333-a333-333333333333';
const WORKER_ID = '44444444-4444-4444-a444-444444444444';
const ROLE_ID = '55555555-5555-4555-a555-555555555555';
const INVALID_UUID = 'not-a-uuid';

const makeSession = (role = 'ADMIN', tenantId = TENANT_A, userId = ADMIN_ID): Session => ({
    user: {
        id: userId,
        role,
        roles: [role],
        tenantId,
        name: '管理员',
        permissions: ['settings.user', 'settings.role', 'admin.settings'],
        isPlatformAdmin: role === 'ADMIN_PLATFORM',
    } as any,
    expires: new Date(Date.now() + 3600 * 1000).toISOString(),
});

const mockAuth = vi.mocked(auth);
const mockCheckPermission = vi.mocked(checkPermission);
const mockAuditLog = vi.mocked(AuditService.log);

// =============================================================
// 测试套件
// =============================================================

describe('Admin 模块 L5 安全测试', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(checkPermission).mockResolvedValue(true);
        mockDbFindFirstUsers.mockResolvedValue(null);
        mockDbFindFirstRoles.mockResolvedValue(null);
    });

    // ==========================================
    // 1. getWorkers 分页安全
    // ==========================================
    describe('getWorkers 分页安全', () => {
        it('正常分页参数应成功', async () => {
            const session = makeSession();
            const result = await getWorkers({ page: 1, pageSize: 10 }, session);
            expect(result.data).toBeDefined();
        });

        it('pageSize 超过 100 应抛出校验错误', async () => {
            const session = makeSession();
            await expect(
                getWorkers({ page: 1, pageSize: 999 }, session)
            ).rejects.toThrow();
        });

        it('pageSize 为 0 应抛出校验错误', async () => {
            const session = makeSession();
            await expect(
                getWorkers({ page: 1, pageSize: 0 }, session)
            ).rejects.toThrow();
        });

        it('page 为 0 应抛出校验错误', async () => {
            const session = makeSession();
            await expect(
                getWorkers({ page: 0, pageSize: 10 }, session)
            ).rejects.toThrow();
        });

        it('非管理员无权限应被拒绝', async () => {
            mockCheckPermission.mockRejectedValue(new Error('权限不足'));
            const session = makeSession('sales');
            await expect(
                getWorkers({ page: 1, pageSize: 10 }, session)
            ).rejects.toThrow('权限不足');
        });
    });

    // ==========================================
    // 2. getWorkerById 安全
    // ==========================================
    describe('getWorkerById 安全', () => {
        it('不存在的师傅应抛出错误', async () => {
            const session = makeSession();
            await expect(
                getWorkerById('non-existent-id', session)
            ).rejects.toThrow('未找到该师傅');
        });

        it('返回的数据不应包含 passwordHash', async () => {
            mockDbFindFirstUsers.mockResolvedValue({
                id: WORKER_ID, name: '张师傅', phone: '13800138000',
                isActive: true, role: 'WORKER', avatarUrl: null,
                createdAt: new Date(), updatedAt: new Date(),
                email: null, permissions: [],
            });
            const session = makeSession();
            const result = await getWorkerById(WORKER_ID, session);
            // 确认返回的对象中没有 passwordHash
            expect(result).not.toHaveProperty('passwordHash');
            expect(result.id).toBe(WORKER_ID);
        });
    });

    // ==========================================
    // 3. updateWorker Zod 严格校验
    // ==========================================
    describe('updateWorker Zod 严格校验', () => {
        it('未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null);
            const result = await updateWorker({ id: WORKER_ID, name: '新名字' });
            expect(result.success).toBe(false);
        });

        it('缺少 id 应返回验证失败', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await updateWorker({} as never);
            expect(result.success).toBe(false);
        });

        it('无效 UUID 格式应被拒绝', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await updateWorker({ id: INVALID_UUID, name: '新名字' });
            expect(result.success).toBe(false);
        });

        it('name 超过 50 字符应被拒绝', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const longName = 'A'.repeat(51);
            const result = await updateWorker({ id: WORKER_ID, name: longName });
            expect(result.success).toBe(false);
        });

        it('phone 非手机号格式应被拒绝', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await updateWorker({ id: WORKER_ID, phone: 'abc123' });
            expect(result.success).toBe(false);
        });

        it('avatarUrl 非 URL 格式应被拒绝', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await updateWorker({ id: WORKER_ID, avatarUrl: 'not-a-url' });
            expect(result.success).toBe(false);
        });

        it('合法手机号应通过校验', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            mockDbFindFirstUsers.mockResolvedValue({ name: '老名字', phone: '13800138000', isActive: true, avatarUrl: null });
            mockDbUpdateReturning.mockResolvedValue([{ id: WORKER_ID }]);
            const result = await updateWorker({ id: WORKER_ID, phone: '13912345678' });
            expect(result.success).toBe(true);
        });
    });

    // ==========================================
    // 4. updateWorker 安全防护
    // ==========================================
    describe('updateWorker 安全防护', () => {
        it('自禁保护 - 禁用自己应返回错误', async () => {
            mockAuth.mockResolvedValue(makeSession('ADMIN', TENANT_A, ADMIN_ID));
            const result = await updateWorker({ id: ADMIN_ID, isActive: false });
            expect(result.success).toBe(false);
            expect(result.error).toContain('不能禁用自己的账号');
        });

        it('禁用其他用户应成功', async () => {
            mockAuth.mockResolvedValue(makeSession());
            mockDbFindFirstUsers.mockResolvedValue({ name: '张师傅', phone: '13800138000', isActive: true, avatarUrl: null });
            mockDbUpdateReturning.mockResolvedValue([{ id: WORKER_ID, isActive: false }]);
            const result = await updateWorker({ id: WORKER_ID, isActive: false });
            expect(result.success).toBe(true);
        });

        it('启用用户时审计 action 应为 ENABLE_WORKER', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            mockDbFindFirstUsers.mockResolvedValue({ name: '张师傅', phone: '13800138000', isActive: false, avatarUrl: null });
            mockDbUpdateReturning.mockResolvedValue([{ id: WORKER_ID, isActive: true }]);
            await updateWorker({ id: WORKER_ID, isActive: true });
            expect(mockAuditLog).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ action: 'ENABLE_WORKER' })
            );
        });

        it('禁用用户时审计 action 应为 DISABLE_WORKER', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            mockDbFindFirstUsers.mockResolvedValue({ name: '张师傅', phone: '13800138000', isActive: true, avatarUrl: null });
            mockDbUpdateReturning.mockResolvedValue([{ id: WORKER_ID, isActive: false }]);
            await updateWorker({ id: WORKER_ID, isActive: false });
            expect(mockAuditLog).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ action: 'DISABLE_WORKER' })
            );
        });

        it('AuditService.log 应包含旧值和新值', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            mockDbFindFirstUsers.mockResolvedValue({ name: '老名字', phone: '13800138000', isActive: true, avatarUrl: null });
            mockDbUpdateReturning.mockResolvedValue([{ id: WORKER_ID, name: '新名字' }]);
            await updateWorker({ id: WORKER_ID, name: '新名字' });
            expect(mockAuditLog).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    oldValues: expect.objectContaining({ name: '老名字' }),
                    newValues: expect.objectContaining({ name: '新名字' }),
                })
            );
        });
    });

    // ==========================================
    // 5. createRole 安全
    // ==========================================
    describe('createRole 安全', () => {
        it('未登录应返回 success: false', async () => {
            mockAuth.mockResolvedValue(null);
            const result = await createRole({ name: '测试', permissions: ['settings.user'] });
            expect(result.success).toBe(false);
        });

        it('使用无效权限字符串应被拒绝（权限白名单）', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            const result = await createRole({
                name: '恶意角色',
                permissions: ['hacker.root.access'],
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('不存在');
        });

        it('使用合法权限应创建成功', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            mockDbFindFirstRoles.mockResolvedValue(null); // 无重名
            const result = await createRole({
                name: '客服专员',
                permissions: ['customer.view', 'lead.view'],
            });
            expect(result.success).toBe(true);
        });

        it('重名角色应被拒绝', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            mockDbFindFirstRoles.mockResolvedValue({ id: ROLE_ID, name: '已存在' });
            const result = await createRole({
                name: '已存在',
                permissions: ['settings.user'],
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('已存在');
        });
    });

    // ==========================================
    // 6. updateRolePermissions 安全
    // ==========================================
    describe('updateRolePermissions 安全', () => {
        it('系统角色不可修改权限', async () => {
            mockAuth.mockResolvedValue(makeSession() as never);
            mockDbFindFirstRoles.mockResolvedValue({
                id: ROLE_ID, name: 'ADMIN', isSystem: true,
                permissions: ['*'], tenantId: TENANT_A
            });
            const result = await updateRolePermissions({
                roleId: ROLE_ID,
                permissions: ['settings.user'],
            });
            expect(result.success).toBe(false);
            expect(result.error).toContain('系统内置角色');
        });

        it('非系统角色应可修改权限', async () => {
            mockAuth.mockResolvedValue(makeSession());
            mockDbFindFirstRoles.mockResolvedValue({
                id: ROLE_ID, name: 'CUSTOM', isSystem: false,
                permissions: ['lead.view'], tenantId: TENANT_A
            });
            mockDbUpdateReturning.mockResolvedValue([{ id: ROLE_ID }]);
            const result = await updateRolePermissions({
                roleId: ROLE_ID,
                permissions: ['customer.view', 'lead.view'],
            });
            expect(result.success).toBe(true);
        });

        it('无效 roleId 格式应被拒绝', async () => {
            mockAuth.mockResolvedValue(makeSession());
            const result = await updateRolePermissions({
                roleId: INVALID_UUID,
                permissions: ['settings.user'],
            });
            expect(result.success).toBe(false);
        });
    });

    // ==========================================
    // 7. deleteRole 安全
    // ==========================================
    describe('deleteRole 安全', () => {
        it('系统角色不可删除', async () => {
            mockAuth.mockResolvedValue(makeSession());
            mockDbFindFirstRoles.mockResolvedValue({
                id: ROLE_ID, name: 'ADMIN', isSystem: true,
                tenantId: TENANT_A
            });
            const result = await deleteRole({ roleId: ROLE_ID });
            expect(result.success).toBe(false);
            expect(result.error).toContain('系统内置角色');
        });

        it('有活跃用户的角色不可删除', async () => {
            mockAuth.mockResolvedValue(makeSession());
            mockDbFindFirstRoles.mockResolvedValue({
                id: ROLE_ID, name: 'CUSTOM', isSystem: false,
                tenantId: TENANT_A, permissions: ['lead.view']
            });
            // 返回 2 个活跃用户
            mockDbFindManyUsers.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);
            const result = await deleteRole({ roleId: ROLE_ID });
            expect(result.success).toBe(false);
            expect(result.error).toContain('活跃用户');
        });

        it('无活跃用户的非系统角色应可删除', async () => {
            mockAuth.mockResolvedValue(makeSession());
            mockDbFindFirstRoles.mockResolvedValue({
                id: ROLE_ID, name: 'CUSTOM', isSystem: false,
                tenantId: TENANT_A, permissions: ['lead.view']
            });
            mockDbFindManyUsers.mockResolvedValue([]); // 无活跃用户
            const result = await deleteRole({ roleId: ROLE_ID });
            expect(result.success).toBe(true);
        });

        it('删除角色时应记录审计日志', async () => {
            mockAuth.mockResolvedValue(makeSession());
            mockDbFindFirstRoles.mockResolvedValue({
                id: ROLE_ID, name: '待删除角色', isSystem: false,
                tenantId: TENANT_A, permissions: ['lead.view']
            });
            mockDbFindManyUsers.mockResolvedValue([]);
            await deleteRole({ roleId: ROLE_ID });
            expect(mockAuditLog).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    action: 'DELETE_ROLE',
                    tableName: 'roles',
                    recordId: ROLE_ID,
                })
            );
        });
    });
});
