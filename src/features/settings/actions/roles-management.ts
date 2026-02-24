'use server';

import { db } from '@/shared/api/db';
import { roles, users } from '@/shared/api/schema';
import { ROLES } from '@/shared/config/roles';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS, getAllPermissions } from '@/shared/config/permissions';
import { eq, and, desc, asc, sql } from 'drizzle-orm';

import { revalidatePath } from 'next/cache';
import { AuditService } from '@/shared/services/audit-service';
import { logger } from '@/shared/lib/logger';
import { createRoleSchema, updateRoleSchema } from '../schema';

/**
 * 角色管理 Server Actions
 */

// Schema 已转移至 ../schema.ts

// ==================== 查询操作 ====================

/**
 * 获取租户下的所有角色
 *
 * @description 查询当前租户的所有角色（包含系统角色和自定义角色），
 * 按创建时间升序排序。
 *
 * @returns Promise<Role[]> 角色列表
 * @throws Error 未授权访问时抛出
 */
export async function getRolesAction() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('未授权访问');
  }

  const tenantId = session.user.tenantId;

  return db.query.roles.findMany({
    where: eq(roles.tenantId, tenantId),
    orderBy: [desc(roles.isSystem), asc(roles.code)],
  });
}

// ==================== 系统角色同步 ====================

/**
 * 同步系统预设角色到数据库
 *
 * @description 将代码中定义的预设角色（ROLES）同步至数据库。
 * 如果角色已存在则更新配置，不存在则创建。此操作仅限具有设置管理权限的用户。
 *
 * @returns Promise<{ success: boolean; message: string; details?: string[] }> 同步结果
 */
export async function syncSystemRoles() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { success: false, message: '未授权访问' };
  }

  // 权限校验
  try {
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
  } catch {
    return { success: false, message: '没有权限执行此操作' };
  }

  const tenantId = session.user.tenantId;
  const userId = session.user.id;

  logger.info(`用户 ${userId} 正在启动系统角色同步`, { tenantId });

  try {
    // 使用事务确保原子性
    const results = await db.transaction(async (tx) => {
      const syncResults = [];

      // 遍历所有预设角色
      for (const roleDef of Object.values(ROLES)) {
        // 检查是否存在
        const existing = await tx.query.roles.findFirst({
          where: and(eq(roles.tenantId, tenantId), eq(roles.code, roleDef.code)),
        });

        if (existing) {
          // 更新现有角色
          await tx
            .update(roles)
            .set({
              name: roleDef.name,
              description: roleDef.description,
              permissions: roleDef.permissions,
              isSystem: true,
              updatedAt: new Date(),
            })
            .where(eq(roles.id, existing.id));
          syncResults.push(`更新: ${roleDef.name}`);
        } else {
          // 创建新角色
          await tx.insert(roles).values({
            tenantId,
            code: roleDef.code,
            name: roleDef.name,
            description: roleDef.description,
            permissions: roleDef.permissions,
            isSystem: true,
          });
          syncResults.push(`创建: ${roleDef.name}`);
        }
      }

      return syncResults;
    });

    if (results.length > 0) {
      await AuditService.log(db, {
        tableName: 'roles',
        recordId: 'SYSTEM_SYNC',
        action: 'UPDATE',
        userId: session.user.id,
        tenantId: session.user.tenantId,
        newValues: { syncedRoles: results },
      });
    }

    revalidatePath('/settings/roles');
    revalidatePath('/settings/users');

    return {
      success: true,
      message: `同步完成: ${results.length} 个角色已处理`,
      details: results,
    };
  } catch (error) {
    logger.error('同步系统角色失败:', error);
    return { success: false, message: '同步失败，请查看日志' };
  }
}

// ==================== 角色 CRUD ====================

/**
 * 创建自定义角色
 *
 * @description 创建新的自定义角色并分配权限。包含以下校验：
 * - Zod 输入校验（code 格式、name 长度）
 * - 角色代码唯一性检查
 * - 权限代码合法性验证（与全局权限列表对比）
 *
 * @param data - Zod 校验后的角色数据，包含 code, name, description, permissions
 * @returns Promise<{ success: boolean; error?: string }> 创建结果
 */
export async function createRole(data: {
  code: string;
  name: string;
  description?: string;
  permissions?: string[];
}) {
  const session = await auth();

  // 权限校验
  try {
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
  } catch {
    return { success: false, message: '没有权限执行此操作' };
  }
  if (!session?.user?.tenantId) {
    return { success: false, message: '未授权访问' };
  }

  // Zod 输入校验
  const validated = createRoleSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, message: '输入数据格式错误：' + validated.error.issues[0]?.message };
  }

  // 权限代码合法性校验
  if (validated.data.permissions && validated.data.permissions.length > 0) {
    const allPermissions = getAllPermissions();
    for (const perm of validated.data.permissions) {
      if (!allPermissions.includes(perm) && perm !== '**' && perm !== '*') {
        return { success: false, message: `无效的权限代码: ${perm}` };
      }
    }
  }

  const tenantId = session.user.tenantId;
  const userId = session.user.id;

  logger.info(`用户 ${userId} 正在创建自定义角色: ${data.code}`, { tenantId, name: data.name });

  try {
    await db.transaction(async (tx) => {
      // 检查 Code 是否重复
      const existing = await tx.query.roles.findFirst({
        where: and(eq(roles.tenantId, tenantId), eq(roles.code, validated.data.code)),
      });

      if (existing) {
        throw new Error(`角色代码 ${validated.data.code} 已存在`);
      }

      const [newRole] = await tx
        .insert(roles)
        .values({
          tenantId,
          code: validated.data.code,
          name: validated.data.name,
          description: validated.data.description,
          permissions: validated.data.permissions || [],
          isSystem: false,
        })
        .returning({ id: roles.id });

      // 记录创建日志
      await AuditService.log(tx, {
        tableName: 'roles',
        recordId: newRole.id,
        action: 'CREATE',
        userId: session.user.id,
        tenantId: session.user.tenantId,
        newValues: {
          code: validated.data.code,
          name: validated.data.name,
          permissions: validated.data.permissions,
        },
      });

      return [newRole.id];
    });

    revalidatePath('/settings/roles');
    return { success: true, message: '角色创建成功' };
  } catch (error) {
    logger.error('创建角色失败:', error);
    return { success: false, message: (error as Error).message || '创建失败' };
  }
}

/**
 * 更新自定义角色
 *
 * @description 更新角色的名称、描述和权限。系统角色仅可修改名称和描述，
 * 不可修改权限。
 *
 * @param roleId - 目标角色 ID
 * @param data - 更新数据，包含 name, description, permissions
 * @returns Promise<{ success: boolean; error?: string }> 更新结果
 */
export async function updateRole(
  id: string,
  data: {
    name: string;
    description?: string;
    permissions?: string[]; // 仅自定义角色可修改基础权限
  }
) {
  const session = await auth();

  // 权限校验
  try {
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
  } catch {
    return { success: false, message: '没有权限执行此操作' };
  }
  if (!session?.user?.tenantId) {
    return { success: false, message: '未授权访问' };
  }

  // Zod 输入校验
  const validated = updateRoleSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, message: '输入数据格式错误：' + validated.error.issues[0]?.message };
  }

  const tenantId = session.user.tenantId;

  try {
    const role = await db.query.roles.findFirst({
      where: and(eq(roles.id, id), eq(roles.tenantId, tenantId)),
    });

    if (!role) {
      return { success: false, message: '角色不存在' };
    }

    const updateData: Partial<{
      name: string;
      description: string | undefined;
      permissions: string[];
      updatedAt: Date;
    }> = {
      name: validated.data.name,
      description: validated.data.description,
      updatedAt: new Date(),
    };

    // 如果不是系统角色，允许修改权限
    if (!role.isSystem && validated.data.permissions) {
      // 权限代码合法性校验
      const allPermissions = getAllPermissions();
      for (const perm of validated.data.permissions) {
        if (!allPermissions.includes(perm) && perm !== '**' && perm !== '*') {
          return { success: false, message: `无效的权限代码: ${perm}` };
        }
      }
      updateData.permissions = validated.data.permissions;
    }

    await db.update(roles).set(updateData).where(eq(roles.id, id));

    // 记录更新日志
    await AuditService.log(db, {
      tableName: 'roles',
      recordId: id,
      action: 'UPDATE',
      userId: session.user.id,
      tenantId: session.user.tenantId,
      oldValues: { name: role.name, description: role.description, permissions: role.permissions },
      newValues: {
        name: validated.data.name,
        description: validated.data.description,
        permissions: updateData.permissions,
      },
      changedFields: updateData,
    });

    logger.info(`用户 ${session.user.id} 成功更新角色: ${id}`, { tenantId, name: validated.data.name });

    revalidatePath('/settings/roles');
    return { success: true, message: '角色更新成功' };
  } catch (error) {
    logger.error('更新角色失败:', error);
    return { success: false, message: '更新失败' };
  }
}

/**
 * 删除角色
 *
 * @description 仅允许删除非系统预设的自定义角色。删除前会检查是否有用户正在使用该角色。
 *
 * @param id - 待删除角色的 ID
 * @returns Promise<{ success: boolean; message: string }> 删除结果
 */
export async function deleteRole(id: string) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { success: false, message: '未授权访问' };
  }

  // 权限校验
  try {
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
  } catch {
    return { success: false, message: '没有权限执行此操作' };
  }

  const tenantId = session.user.tenantId;
  const userId = session.user.id;

  logger.info(`用户 ${userId} 正在尝试删除角色: ${id}`, { tenantId });

  try {
    await db.transaction(async (tx) => {
      const role = await tx.query.roles.findFirst({
        where: and(eq(roles.id, id), eq(roles.tenantId, tenantId)),
      });

      if (!role) {
        throw new Error('角色不存在');
      }

      if (role.isSystem) {
        throw new Error('无法删除系统预设角色');
      }

      // 检查是否有用户正在使用该角色 (R4-01)
      const userInRole = await tx.query.users.findFirst({
        where: and(
          eq(users.tenantId, tenantId),
          sql`${users.roles} @> ${JSON.stringify([role.code])}::jsonb`
        ),
      });

      if (userInRole) {
        throw new Error(`无法删除角色 ${role.name}：仍有用户在使用该角色`);
      }

      await tx.delete(roles).where(eq(roles.id, id));

      // 记录删除日志
      await AuditService.log(tx, {
        tableName: 'roles',
        recordId: id,
        action: 'DELETE',
        userId: session.user.id,
        tenantId: session.user.tenantId,
        oldValues: { code: role.code, name: role.name },
      });
    });

    revalidatePath('/settings/roles');
    return { success: true, message: '角色已删除' };
  } catch (error) {
    logger.error('删除角色失败:', error);
    return { success: false, message: (error as Error).message || '删除失败' };
  }
}
