'use server';

import { db } from '@/shared/api/db';
import { roleOverrides } from '@/shared/api/schema/role-overrides';
import { roles } from '@/shared/api/schema';
import { PERMISSIONS, getAllPermissions, PERMISSION_GROUPS, PERMISSION_LABELS } from '@/shared/config/permissions';
import { auth, checkPermission } from '@/shared/lib/auth';
import { AuditService } from '@/shared/services/audit-service';
import { getRoleLabel } from '@/shared/config/roles';
import { eq, and, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { RolePermissionService } from '@/shared/lib/role-permission-service';

/**
 * 角色权限覆盖的 Server Actions
 */

// ==================== 类型定义 ====================

export interface RoleOverrideData {
  roleCode: string;
  roleName: string;
  roleDescription: string;
  basePermissions: string[]; // 系统预设权限
  addedPermissions: string[]; // 租户增加的权限
  removedPermissions: string[]; // 租户移除的权限
  effectivePermissions: string[]; // 最终有效权限
}

export interface PermissionMatrixData {
  roles: RoleOverrideData[];
  permissionGroups: {
    key: string;
    label: string;
    description?: string;
    permissions: { code: string; label: string }[];
  }[];
}

// ==================== 查询操作 ====================

/**
 * 获取权限矩阵数据（用于 UI 展示）
 */
export async function getPermissionMatrix(): Promise<PermissionMatrixData> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('未授权访问');
  }

  const tenantId = session.user.tenantId;

  // 获取所有角色的覆盖配置
  const overrides = await RolePermissionService.getTenantRoleOverrides(tenantId);

  // 获取系统中定义的所有角色（包括自定义）
  const dbRoles = await db.query.roles.findMany({
    where: eq(roles.tenantId, tenantId),
    orderBy: asc(roles.code),
  });

  // 构建角色数据
  const rolesData: RoleOverrideData[] = [];

  // 如果数据库没有角色，可能还没有同步，使用空数组
  // UI 层应该提示用户同步
  for (const roleDef of dbRoles) {
    const code = roleDef.code;
    const override = overrides[code] || { added: [], removed: [] };
    // getEffectivePermissions logic might need update if it solely relies on config
    // But RolePermissionService likely relies on config for base permissions.
    // We need to ensure we pass basePermissions correctly if RolePermissionService doesn't know about custom roles.

    // For custom roles, basePermissions are stored in DB.
    // For system roles, we can still refer to config if we want, OR trust DB if we synced it.
    // Let's trust DB 'permissions' field which should be synced.

    // We need to fetch effective permissions.
    // RolePermissionService.getEffectivePermissions might rely on ROLES config.
    // Let's check RolePermissionService later. For now, we manually calculate or assume service is updated?
    // Actually, let's implement effective permission calculation here or ensure service uses DB.

    // TEMPORARY: Use service but it might fail for custom roles if service looks at ROLES config.
    // Let's assume we update RolePermissionService separately or logic is generic.
    // Actually, roleOverrides action uses RolePermissionService.

    // Let's recalculate effective permissions here to be safe:
    // dynamic roles base permissions are in roleDef.permissions
    const basePermissions = (roleDef.permissions as string[]) || [];

    // effective = base + added - removed
    const effective = new Set(basePermissions);
    override.added.forEach((p) => effective.add(p));
    override.removed.forEach((p) => effective.delete(p));

    rolesData.push({
      roleCode: code,
      roleName: roleDef.name,
      roleDescription: roleDef.description || '',
      basePermissions: basePermissions,
      addedPermissions: override.added,
      removedPermissions: override.removed,
      effectivePermissions: Array.from(effective),
    });
  }

  // 构建权限分组数据
  const permissionGroups = PERMISSION_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    description: group.description,
    permissions: Object.entries(group.permissions).map(([, code]) => ({
      code: code as string,
      label: PERMISSION_LABELS[code as string] || (code as string),
    })),
  }));

  return { roles: rolesData, permissionGroups };
}

/**
 * 获取单个角色的权限覆盖配置
 */
export async function getRoleOverride(roleCode: string): Promise<RoleOverrideData | null> {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('未授权访问');
  }

  const tenantId = session.user.tenantId;

  // Fetch role from DB
  const roleDef = await db.query.roles.findFirst({
    where: and(eq(roles.tenantId, tenantId), eq(roles.code, roleCode)),
  });

  if (!roleDef) {
    return null;
  }

  const overrides = await RolePermissionService.getTenantRoleOverrides(tenantId);
  const override = overrides[roleCode] || { added: [], removed: [] };

  // Calculate effective permissions
  // Note: RolePermissionService.getEffectivePermissions might need updates if it uses static config.
  // For now, let's replicate the logic here to be safe and consistent with getPermissionMatrix

  const basePermissions = (roleDef.permissions as string[]) || [];
  const effective = new Set(basePermissions);
  override.added.forEach((p) => effective.add(p));
  override.removed.forEach((p) => effective.delete(p));

  return {
    roleCode,
    roleName: roleDef.name,
    roleDescription: roleDef.description || '',
    basePermissions: basePermissions,
    addedPermissions: override.added,
    removedPermissions: override.removed,
    effectivePermissions: Array.from(effective),
  };
}

// ==================== 修改操作 ====================

/**
 * 保存角色权限覆盖
 *
 * @param roleCode 角色代码
 * @param addedPermissions 新增的权限
 * @param removedPermissions 移除的权限
 */
export async function saveRoleOverride(
  roleCode: string,
  addedPermissions: string[],
  removedPermissions: string[]
): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user?.tenantId || !session?.user?.id) {
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

  // 验证角色代码 (Check DB)
  const roleExists = await db.query.roles.findFirst({
    where: and(eq(roles.tenantId, tenantId), eq(roles.code, roleCode)),
  });

  if (!roleExists) {
    return { success: false, message: `无效的角色代码: ${roleCode}` };
  }

  // 优化通配符处理逻辑 (D-16)
  const finalAdded = addedPermissions.includes('**') ? ['**'] : addedPermissions;
  const finalRemoved = removedPermissions.includes('**') ? ['**'] : removedPermissions;

  try {
    // 使用事务确保原子性
    await db.transaction(async (tx) => {
      // 查找现有记录
      const existing = await tx.query.roleOverrides.findFirst({
        where: and(eq(roleOverrides.tenantId, tenantId), eq(roleOverrides.roleCode, roleCode)),
      });

      if (existing) {
        // 更新现有记录
        await tx
          .update(roleOverrides)
          .set({
            addedPermissions: JSON.stringify(finalAdded),
            removedPermissions: JSON.stringify(finalRemoved),
            updatedAt: new Date(),
            updatedBy: userId,
          })
          .where(eq(roleOverrides.id, existing.id));

        // 记录更新日志
        // 记录更新日志
        await AuditService.log(tx, {
          tableName: 'role_overrides',
          recordId: existing.id,
          action: 'UPDATE',
          userId: session.user.id,
          tenantId: session.user.tenantId,
          oldValues: {
            addedPermissions: JSON.parse(existing.addedPermissions || '[]'),
            removedPermissions: JSON.parse(existing.removedPermissions || '[]')
          },
          newValues: { addedPermissions: finalAdded, removedPermissions: finalRemoved },
          changedFields: { roleCode }
        });
      } else {
        // 创建新记录
        const [newOverride] = await tx.insert(roleOverrides).values({
          tenantId,
          roleCode,
          addedPermissions: JSON.stringify(finalAdded),
          removedPermissions: JSON.stringify(finalRemoved),
          updatedBy: userId,
        }).returning({ id: roleOverrides.id });

        // 记录创建日志
        // 记录创建日志
        await AuditService.log(tx, {
          tableName: 'role_overrides',
          recordId: newOverride.id,
          action: 'CREATE',
          userId: session.user.id,
          tenantId: session.user.tenantId,
          newValues: { roleCode, addedPermissions: finalAdded, removedPermissions: finalRemoved }
        });
      }
    });

    revalidatePath('/settings/roles');

    return {
      success: true,
      message: `角色 ${roleExists.name} 的权限配置已保存`,
    };
  } catch (error) {
    console.error('保存角色覆盖失败:', error);
    return { success: false, message: '保存失败，请稍后重试' };
  }
}

/**
 * 重置角色权限为系统默认
 */
export async function resetRoleOverride(
  roleCode: string
): Promise<{ success: boolean; message: string }> {
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

  try {
    // 使用事务确保原子性
    await db.transaction(async (tx) => {
      // 获取要删除的记录以便记录日志
      const existing = await tx.query.roleOverrides.findFirst({
        where: and(eq(roleOverrides.tenantId, tenantId), eq(roleOverrides.roleCode, roleCode))
      });

      if (existing) {
        // 删除覆盖记录
        await tx
          .delete(roleOverrides)
          .where(and(eq(roleOverrides.tenantId, tenantId), eq(roleOverrides.roleCode, roleCode)));

        // 记录日志
        // 记录日志
        await AuditService.log(tx, {
          tableName: 'role_overrides',
          recordId: existing.id,
          action: 'DELETE',
          userId: session.user.id,
          tenantId: session.user.tenantId,
          oldValues: {
            roleCode: existing.roleCode,
            addedPermissions: existing.addedPermissions,
            removedPermissions: existing.removedPermissions,
          }
        });
      }
    });

    revalidatePath('/settings/roles');

    const roleLabel = getRoleLabel(roleCode);
    return {
      success: true,
      message: `角色 ${roleLabel} 已重置为系统默认`,
    };
  } catch (error) {
    console.error('重置角色覆盖失败:', error);
    return { success: false, message: '重置失败，请稍后重试' };
  }
}

/**
 * 批量保存多个角色的权限覆盖
 */
export async function saveAllRoleOverrides(
  overrides: Array<{
    roleCode: string;
    addedPermissions: string[];
    removedPermissions: string[];
  }>
): Promise<{ success: boolean; message: string }> {
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

  try {
    // 使用单个大事务确保批量操作的原子性
    await db.transaction(async (tx) => {
      for (const override of overrides) {
        const { roleCode, addedPermissions, removedPermissions } = override;

        // 验证权限代码
        const allPermissions = getAllPermissions();
        for (const perm of [...addedPermissions, ...removedPermissions]) {
          if (!allPermissions.includes(perm) && perm !== '**' && perm !== '*') {
            throw new Error(`无效的权限代码: ${perm}`);
          }
        }

        // 优化通配符处理逻辑 (D-16)
        const finalAdded = addedPermissions.includes('**') ? ['**'] : addedPermissions;
        const finalRemoved = removedPermissions.includes('**') ? ['**'] : removedPermissions;

        const existing = await tx.query.roleOverrides.findFirst({
          where: and(eq(roleOverrides.tenantId, tenantId), eq(roleOverrides.roleCode, roleCode)),
        });

        if (existing) {
          await tx
            .update(roleOverrides)
            .set({
              addedPermissions: JSON.stringify(finalAdded),
              removedPermissions: JSON.stringify(finalRemoved),
              updatedAt: new Date(),
              updatedBy: userId,
            })
            .where(eq(roleOverrides.id, existing.id));

          await AuditService.log(tx, {
            tableName: 'role_overrides',
            recordId: existing.id,
            action: 'UPDATE',
            userId: session.user.id,
            tenantId: session.user.tenantId,
            oldValues: {
              addedPermissions: existing.addedPermissions,
              removedPermissions: existing.removedPermissions,
            },
            newValues: { addedPermissions: finalAdded, removedPermissions: finalRemoved },
            changedFields: { roleCode }
          });
        } else {
          const [newOverride] = await tx.insert(roleOverrides).values({
            tenantId,
            roleCode,
            addedPermissions: JSON.stringify(finalAdded),
            removedPermissions: JSON.stringify(finalRemoved),
            updatedBy: userId,
          }).returning({ id: roleOverrides.id });

          await AuditService.log(tx, {
            tableName: 'role_overrides',
            recordId: newOverride.id,
            action: 'CREATE',
            userId: session.user.id,
            tenantId: session.user.tenantId,
            newValues: { roleCode, addedPermissions: finalAdded, removedPermissions: finalRemoved }
          });
        }
      }
    });

    revalidatePath('/settings/roles');
    return { success: true, message: '所有角色权限配置已保存' };
  } catch (error) {
    console.error('批量保存角色覆盖失败:', error);
    return { success: false, message: (error as Error).message || '保存失败，请稍后重试' };
  }
}
