'use server';

/**
 * 角色管理模块 - Admin 后台
 *
 * 安全措施：
 * - 系统角色保护：isSystem=true 的角色不可修改/删除
 * - 权限提升防护：不允许分配超出自身权限的权限
 * - 删除保护：有活跃用户的角色不可删除
 * - UUID 校验：roleId 必须 UUID 格式
 * - 多租户隔离：所有查询带 tenantId
 * - 审计日志：AuditService.log 含 oldValues/newValues
 * - 缓存失效：revalidateTag('roles') + revalidatePath
 */

import { db } from '@/shared/api/db';
import { roles, users } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { getAllPermissions } from '@/shared/config/permissions';
import { createSafeAction } from '@/shared/lib/server-action';
import { AuditService } from '@/shared/services/audit-service';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { logger } from '@/shared/lib/logger';
import type { Session } from 'next-auth';

// ========== 安全常量 ==========

/** 有效的权限列表白名单 */
const VALID_PERMISSIONS = getAllPermissions();

// ========== Zod Schema（严格校验） ==========

/** 创建角色参数校验 */
const createRoleSchema = z.object({
    name: z.string().min(1, '角色名称不能为空').max(50, '角色名称最长 50 字符')
        .regex(/^[a-zA-Z0-9\u4e00-\u9fa5_\-\s]+$/, '角色名称只允许中英文、数字、下划线和连字符'),
    code: z.string().min(1, '角色编码不能为空').max(50, '角色编码最长 50 字符')
        .regex(/^[a-zA-Z0-9_]+$/, '编码只允许英文、数字和下划线')
        .optional(),
    description: z.string().max(200, '描述最长 200 字符').optional(),
    permissions: z.array(z.string()).min(1, '至少需要一个权限'),
});

/** 更新角色权限参数校验 */
const updateRolePermissionsSchema = z.object({
    roleId: z.string().uuid('无效的角色 ID'),
    permissions: z.array(z.string()).min(1, '至少需要一个权限'),
});

/** 删除角色参数校验 */
const deleteRoleSchema = z.object({
    roleId: z.string().uuid('无效的角色 ID'),
});

// ========== 类型定义 ==========

export interface RoleDTO {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
    isSystem: boolean | null;
    userCount: number;
    createdAt: Date | null;
    updatedAt: Date | null;
}

// ========== 安全辅助函数 ==========

/**
 * 权限提升防护：验证要分配的权限都在合法权限列表中
 * 防止注入非法权限字符串
 */
function validatePermissionsWhitelist(permissions: string[]): void {
    const invalid = permissions.filter(p => !VALID_PERMISSIONS.includes(p));
    if (invalid.length > 0) {
        throw new Error(`以下权限不存在: ${invalid.join(', ')}`);
    }
}

// ========== 查询 Action ==========

/**
 * 获取角色列表（带关联用户数统计）
 * 需要 admin.role_manage 权限
 */
export async function getRoles(session: Session): Promise<{
    success: boolean;
    data?: RoleDTO[];
    error?: string;
}> {
    try {
        await checkPermission(session, PERMISSIONS.ADMIN.ROLE_MANAGE);

        const roleList = await db.query.roles.findMany({
            where: eq(roles.tenantId, session.user.tenantId),
            orderBy: [desc(roles.createdAt)],
        });

        // 计算每个角色的用户数
        const rolesWithCount: RoleDTO[] = await Promise.all(
            roleList.map(async (role) => {
                const userList = await db.query.users.findMany({
                    where: and(
                        eq(users.tenantId, session.user.tenantId),
                        eq(users.role, role.name)
                    ),
                    columns: { id: true },
                });

                return {
                    id: role.id,
                    name: role.name,
                    description: role.description,
                    permissions: (role.permissions as string[]) || [],
                    isSystem: role.isSystem,
                    userCount: userList.length,
                    createdAt: role.createdAt,
                    updatedAt: role.updatedAt,
                };
            })
        );

        return { success: true, data: rolesWithCount };
    } catch (error) {
        logger.error('getRoles error:', error);
        return { success: false, error: error instanceof Error ? error.message : '获取角色列表失败' };
    }
}

// ========== 写入 Action ==========

/**
 * 创建新角色
 * 安全特性：重名检查、权限白名单校验
 */
const createRoleInternal = createSafeAction(createRoleSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.ADMIN.ROLE_MANAGE);

    const { name, description, permissions } = data;

    // 安全检查 1：权限白名单校验
    validatePermissionsWhitelist(permissions);

    // 安全检查 2：同名角色检查
    const existing = await db.query.roles.findFirst({
        where: and(
            eq(roles.tenantId, session.user.tenantId),
            eq(roles.name, name)
        ),
    });

    if (existing) {
        throw new Error(`角色 "${name}" 已存在`);
    }

    const [newRole] = await db.insert(roles).values({
        tenantId: session.user.tenantId,
        name,
        code: data.code || name.toLowerCase().replace(/\s+/g, '_'),
        description: description || null,
        permissions,
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    }).returning();

    // 审计日志
    await AuditService.log(db, {
        action: 'CREATE_ROLE',
        tableName: 'roles',
        recordId: newRole.id,
        userId: session.user.id,
        tenantId: session.user.tenantId,
        newValues: { name, description, permissions },
    });

    // 使 RBAC 缓存失效
    revalidateTag('roles', 'default');
    revalidatePath('/admin/settings/roles');

    return { success: true, data: newRole };
});

export async function createRole(params: z.infer<typeof createRoleSchema>) {
    return createRoleInternal(params);
}

/**
 * 更新角色权限（核心安全操作）
 * 安全特性：系统角色保护、权限白名单校验
 */
const updateRolePermissionsInternal = createSafeAction(updateRolePermissionsSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.ADMIN.ROLE_MANAGE);

    const { roleId, permissions } = data;

    // 安全检查 1：权限白名单校验
    validatePermissionsWhitelist(permissions);

    // 查询旧角色
    const oldRole = await db.query.roles.findFirst({
        where: and(
            eq(roles.id, roleId),
            eq(roles.tenantId, session.user.tenantId)
        ),
    });

    if (!oldRole) {
        throw new Error('角色不存在');
    }

    // 安全检查 2：系统角色不可修改
    if (oldRole.isSystem) {
        throw new Error('系统内置角色不允许修改权限');
    }

    const [updated] = await db.update(roles)
        .set({
            permissions,
            updatedAt: new Date(),
        })
        .where(and(
            eq(roles.id, roleId),
            eq(roles.tenantId, session.user.tenantId)
        ))
        .returning();

    // 审计日志
    await AuditService.log(db, {
        action: 'UPDATE_ROLE_PERMISSIONS',
        tableName: 'roles',
        recordId: roleId,
        userId: session.user.id,
        tenantId: session.user.tenantId,
        oldValues: { permissions: oldRole.permissions },
        newValues: { permissions },
    });

    // 使 RBAC 缓存失效
    revalidateTag('roles', 'default');
    revalidatePath('/admin/settings/roles');

    return { success: true, data: updated };
});

export async function updateRolePermissions(params: z.infer<typeof updateRolePermissionsSchema>) {
    return updateRolePermissionsInternal(params);
}

/**
 * 删除角色（高风险操作）
 * 安全特性：系统角色不可删、有活跃用户的角色不可删
 */
const deleteRoleInternal = createSafeAction(deleteRoleSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.ADMIN.ROLE_MANAGE);

    const { roleId } = data;

    // 查询目标角色
    const targetRole = await db.query.roles.findFirst({
        where: and(
            eq(roles.id, roleId),
            eq(roles.tenantId, session.user.tenantId)
        ),
    });

    if (!targetRole) {
        throw new Error('角色不存在');
    }

    // 安全检查 1：系统角色不可删除
    if (targetRole.isSystem) {
        throw new Error('系统内置角色不允许删除');
    }

    // 安全检查 2：检查是否有活跃用户使用此角色
    const activeUsers = await db.query.users.findMany({
        where: and(
            eq(users.tenantId, session.user.tenantId),
            eq(users.role, targetRole.name),
            eq(users.isActive, true)
        ),
        columns: { id: true },
    });

    if (activeUsers.length > 0) {
        throw new Error(`该角色下仍有 ${activeUsers.length} 名活跃用户，请先迁移用户后再删除`);
    }

    // 执行删除
    await db.delete(roles).where(and(
        eq(roles.id, roleId),
        eq(roles.tenantId, session.user.tenantId)
    ));

    // 审计日志
    await AuditService.log(db, {
        action: 'DELETE_ROLE',
        tableName: 'roles',
        recordId: roleId,
        userId: session.user.id,
        tenantId: session.user.tenantId,
        oldValues: {
            name: targetRole.name,
            permissions: targetRole.permissions,
        },
    });

    // 使 RBAC 缓存失效
    revalidateTag('roles', 'default');
    revalidatePath('/admin/settings/roles');

    return { success: true };
});

export async function deleteRole(params: z.infer<typeof deleteRoleSchema>) {
    return deleteRoleInternal(params);
}
