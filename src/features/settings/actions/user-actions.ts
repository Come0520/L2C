'use server';

import { auth, checkPermission } from '@/shared/lib/auth';
import type { Session } from 'next-auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq, and, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { AuditService } from '@/shared/services/audit-service';
import { updateUserManagementSchema } from '../schema';

import { logger } from '@/shared/lib/logger';

// Schema 已转移至 ../schema.ts

/**
 * 用户信息类型
 */
export interface UserInfo {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  roles: string[];
  isActive: boolean;
}

/**
 * 检查当前用户是否为管理员（使用权限系统）
 *
 * @description 校验会话中的用户是否具有用户管理权限。
 *
 * @param session - 当前用户的 Session 对象
 * @returns Promise<{ isAdmin: boolean; tenantId?: string; currentUserId?: string }> 校验结果及相关 ID
 */
async function checkAdmin(
  session: Session | null
): Promise<{ isAdmin: boolean; tenantId?: string; currentUserId?: string }> {
  if (!session?.user?.tenantId) {
    return { isAdmin: false };
  }

  try {
    await checkPermission(session, PERMISSIONS.SETTINGS.USER_MANAGE);
    return { isAdmin: true, tenantId: session.user.tenantId, currentUserId: session.user.id };
  } catch {
    return { isAdmin: false, tenantId: session.user.tenantId, currentUserId: session.user.id };
  }
}

/**
 * 检查指定用户是否为租户下最后一个活跃的管理员
 *
 * @description 核心安全检查，防止租户失去所有管理员权限。
 *
 * @param tenantId - 租户 ID
 * @param excludeUserId - 要检查（排除）的用户 ID
 * @returns Promise<boolean> 是否为最后一个管理员
 */
async function isLastAdmin(tenantId: string, excludeUserId: string): Promise<boolean> {
  const admins = await db.query.users.findMany({
    where: and(eq(users.tenantId, tenantId), eq(users.isActive, true), ne(users.id, excludeUserId)),
    limit: 500, // [P2防御] 防止异常情况下的数据暴增
  });
  // 检查排除目标用户后，是否还有其他管理员
  const remainingAdmins = admins.filter((u) => {
    const roles = (u.roles as string[]) || [];
    return (
      u.role === 'ADMIN' || u.role === 'OWNER' || roles.includes('ADMIN') || roles.includes('OWNER')
    );
  });
  return remainingAdmins.length === 0;
}

/**
 * 更新用户信息
 *
 * @description 更新指定用户的名称和角色分配。包含以下业务规则：
 * - 不能移除最后一个管理员的 ADMIN 角色
 * - 主角色 (primaryRole) 优先选择 ADMIN，其次 OWNER
 * - 使用事务保证角色更新的原子性
 *
 * @param id - 目标用户 ID
 * @param data - 更新数据，包含 name 和 roles
 * @returns Promise<{ success: boolean; error?: string }> 操作结果
 */
export async function updateUser(
  id: string,
  data: { name: string; roles: string[]; isActive?: boolean }
) {
  const session = await auth();
  const { isAdmin, tenantId, currentUserId } = await checkAdmin(session);
  if (!isAdmin || !tenantId) {
    return { success: false, error: '无权限执行此操作' };
  }

  // 使用导出的 Schema 进行校验
  const validated = updateUserManagementSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: '输入数据格式错误：' + validated.error.issues[0]?.message };
  }

  logger.info(`用户 ${currentUserId} 正在更新用户信息: ${id}`, { tenantId, updateData: data });

  try {
    // 获取原始用户数据
    const existingUser = await db.query.users.findFirst({
      where: and(eq(users.id, id), eq(users.tenantId, tenantId)),
    });

    if (!existingUser) {
      return { success: false, error: '用户不存在' };
    }

    // 保护逻辑：禁止禁用自己
    if (validated.data.isActive === false && id === currentUserId) {
      return { success: false, error: '不能禁用自己的账号' };
    }

    // 防止误删最后一个管理员
    if (currentUserId !== id) {
      const currentRoles = (existingUser.roles as string[]) || [];
      const isRemovingAdmin =
        (currentRoles.includes('ADMIN') || currentRoles.includes('OWNER')) &&
        !(validated.data.roles.includes('ADMIN') || validated.data.roles.includes('OWNER'));

      if (isRemovingAdmin) {
        const adminCount = await db
          .select()
          .from(users)
          .where(and(eq(users.tenantId, tenantId), eq(users.isActive, true), ne(users.id, id)));

        const hasOtherAdmin = adminCount.some(
          (u) => (u.roles as string[]).includes('ADMIN') || (u.roles as string[]).includes('OWNER')
        );
        if (!hasOtherAdmin) {
          return { success: false, error: '无法移除最后一个管理员角色' };
        }
      }
    }

    // 主角色同步逻辑改进：优先选择管理员角色
    let primaryRole = validated.data.roles[0];
    if (validated.data.roles.includes('ADMIN')) {
      primaryRole = 'ADMIN';
    } else if (validated.data.roles.includes('OWNER')) {
      primaryRole = 'OWNER';
    } else if (validated.data.roles.includes('MANAGER')) {
      primaryRole = 'MANAGER';
    }

    // 构建更新数据
    const updateData: Record<string, unknown> = {
      name: validated.data.name,
      roles: validated.data.roles,
      role: primaryRole,
      updatedAt: new Date(),
    };

    if (validated.data.isActive !== undefined) {
      updateData.isActive = validated.data.isActive;
    }

    await db.transaction(async (tx) => {
      await tx.update(users).set(updateData).where(eq(users.id, id));

      // 精确化审计日志：只记录真实变更的字段
      const oldValues: Record<string, unknown> = {};
      const newValues: Record<string, unknown> = {};

      if (existingUser.name !== validated.data.name) {
        oldValues.name = existingUser.name;
        newValues.name = validated.data.name;
      }
      if (JSON.stringify(existingUser.roles) !== JSON.stringify(validated.data.roles)) {
        oldValues.roles = existingUser.roles;
        newValues.roles = validated.data.roles;
        oldValues.role = existingUser.role;
        newValues.role = primaryRole;
      }
      if (
        validated.data.isActive !== undefined &&
        existingUser.isActive !== validated.data.isActive
      ) {
        oldValues.isActive = existingUser.isActive;
        newValues.isActive = validated.data.isActive;
      }

      // 只有真实变更时才记录审计日志
      if (Object.keys(oldValues).length > 0) {
        await AuditService.log(tx, {
          tableName: 'users',
          recordId: id,
          action: 'UPDATE',
          userId: session!.user.id,
          tenantId: session!.user.tenantId,
          oldValues,
          newValues,
        });
      }
    });

    revalidatePath('/settings/users');
    return { success: true };
  } catch (error) {
    logger.error('更新用户失败:', error);
    return { success: false, error: '更新失败' };
  }
}

/**
 * 切换用户启用/禁用状态
 *
 * @description 切换用户的 isActive 状态。包含以下安全检查：
 * - 不能禁用自己的账号
 * - 不能禁用租户下最后一个活跃管理员
 *
 * @param userId - 目标用户 ID
 * @returns Promise<{ success: boolean; error?: string }> 操作结果
 */
export async function toggleUserActive(userId: string) {
  const session = await auth();
  const { isAdmin, tenantId, currentUserId } = await checkAdmin(session);

  if (!isAdmin || !tenantId) {
    return { success: false, error: '无权限操作' };
  }

  // 不能禁用自己
  if (userId === currentUserId) {
    return { success: false, error: '不能禁用自己的账号' };
  }

  logger.info(`用户 ${currentUserId} 正在切换用户状态: ${userId}`, { tenantId });

  try {
    const targetUser = await db.query.users.findFirst({
      where: and(eq(users.id, userId), eq(users.tenantId, tenantId)),
    });

    if (!targetUser) {
      return { success: false, error: '用户不存在' };
    }

    const newActive = !targetUser.isActive;

    // 如果是禁用管理员，检查是否为最后一个
    if (!newActive) {
      const isCurrentlyAdmin =
        targetUser.role === 'ADMIN' ||
        targetUser.role === 'OWNER' ||
        ((targetUser.roles as string[]) || []).includes('ADMIN') ||
        ((targetUser.roles as string[]) || []).includes('OWNER');

      if (isCurrentlyAdmin) {
        const lastAdmin = await isLastAdmin(tenantId, userId);
        if (lastAdmin) {
          return { success: false, error: '不能禁用最后一个管理员' };
        }
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ isActive: newActive, updatedAt: new Date() })
        .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)));

      // 记录状态变更日志
      await AuditService.log(tx, {
        tableName: 'users',
        recordId: userId,
        action: 'UPDATE',
        userId: session!.user.id,
        tenantId: session!.user.tenantId,
        oldValues: { isActive: targetUser.isActive },
        newValues: { isActive: newActive },
        changedFields: { isActive: newActive },
      });
    });

    revalidatePath('/settings/users');
    return {
      success: true,
      isActive: newActive,
      message: newActive ? '已启用该用户' : '已禁用该用户',
    };
  } catch (error) {
    logger.error('切换用户状态失败:', error);
    return { success: false, error: '操作失败' };
  }
}

/**
 * 删除用户（软删除 - 禁用账号）
 *
 * @description 实际上执行的是禁用（isActive = false）操作，以维护数据外键完整性。
 *
 * @param userId - 目标用户 ID
 * @returns Promise<{ success: boolean; message?: string; error?: string }> 操作结果
 */
export async function deleteUser(userId: string) {
  const session = await auth();
  const { isAdmin, tenantId, currentUserId } = await checkAdmin(session);

  if (!isAdmin || !tenantId) {
    return { success: false, error: '无权限操作' };
  }

  if (userId === currentUserId) {
    return { success: false, error: '不能删除自己的账号' };
  }

  logger.info(`用户 ${currentUserId} 正在尝试删除（软删除）用户: ${userId}`, { tenantId });

  try {
    const targetUser = await db.query.users.findFirst({
      where: and(eq(users.id, userId), eq(users.tenantId, tenantId)),
    });

    if (!targetUser) {
      return { success: false, error: '用户不存在' };
    }

    // 检查是否为最后一个管理员
    const isCurrentlyAdmin =
      targetUser.role === 'ADMIN' ||
      targetUser.role === 'OWNER' ||
      ((targetUser.roles as string[]) || []).includes('ADMIN') ||
      ((targetUser.roles as string[]) || []).includes('OWNER');

    if (isCurrentlyAdmin) {
      const lastAdmin = await isLastAdmin(tenantId, userId);
      if (lastAdmin) {
        return { success: false, error: '不能删除最后一个管理员，请先指定其他管理员' };
      }
    }

    // 执行软删除：禁用账号
    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ isActive: false, updatedAt: new Date() })
        .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)));

      // 记录软删除日志
      await AuditService.log(tx, {
        tableName: 'users',
        recordId: userId,
        action: 'DELETE',
        userId: session!.user.id,
        tenantId: session!.user.tenantId,
        oldValues: { name: targetUser.name, role: targetUser.role },
        newValues: { isActive: false },
      });
    });

    revalidatePath('/settings/users');
    return { success: true, message: '已删除（禁用）该用户' };
  } catch (error) {
    logger.error('删除用户失败:', error);
    return { success: false, error: '删除失败' };
  }
}
