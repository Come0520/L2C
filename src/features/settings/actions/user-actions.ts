'use server';

import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq, and, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * 角色中文映射
 */
export const ROLE_LABELS: Record<string, string> = {
  OWNER: '企业主',
  ADMIN: '管理员',
  STAFF: '员工',
  SALES: '销售',
  INSTALLER: '安装师傅',
  MEASURER: '量尺师傅',
  DESIGNER: '设计师',
  FINANCE: '财务',
  CUSTOMER_SERVICE: '客服',
};

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
 * 检查当前用户是否为管理员
 */
async function checkAdmin(
  session: any
): Promise<{ isAdmin: boolean; tenantId?: string; currentUserId?: string }> {
  if (!session?.user?.tenantId) {
    return { isAdmin: false };
  }
  const currentUserRole = session.user.role;
  const currentUserRoles = session.user.roles || [];
  const isAdmin =
    currentUserRole === 'ADMIN' ||
    currentUserRole === 'OWNER' ||
    currentUserRoles.includes('ADMIN') ||
    currentUserRoles.includes('OWNER');
  return { isAdmin, tenantId: session.user.tenantId, currentUserId: session.user.id };
}

/**
 * 检查是否为最后一个管理员
 */
async function isLastAdmin(tenantId: string, excludeUserId: string): Promise<boolean> {
  const admins = await db.query.users.findMany({
    where: and(eq(users.tenantId, tenantId), eq(users.isActive, true), ne(users.id, excludeUserId)),
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
 * - 包含租户隔离校验
 * - 禁止操作自身（降级/禁用场景）
 * - 保护最后一个管理员
 */
export async function updateUser(
  userId: string,
  data: {
    name?: string;
    roles?: string[];
    isActive?: boolean;
  }
) {
  const session = await auth();
  const { isAdmin, tenantId, currentUserId } = await checkAdmin(session);

  if (!isAdmin || !tenantId) {
    return { success: false, error: '无权限修改用户信息' };
  }

  try {
    // 租户隔离：确保目标用户属于当前租户
    const targetUser = await db.query.users.findFirst({
      where: and(eq(users.id, userId), eq(users.tenantId, tenantId)),
    });

    if (!targetUser) {
      return { success: false, error: '用户不存在或不属于当前企业' };
    }

    // 保护逻辑：禁止禁用自己
    if (data.isActive === false && userId === currentUserId) {
      return { success: false, error: '不能禁用自己的账号' };
    }

    // 保护逻辑：检查是否为最后一个管理员
    const willLoseAdmin =
      data.isActive === false ||
      (data.roles && !data.roles.includes('ADMIN') && !data.roles.includes('OWNER'));
    const isCurrentlyAdmin =
      targetUser.role === 'ADMIN' ||
      targetUser.role === 'OWNER' ||
      ((targetUser.roles as string[]) || []).includes('ADMIN') ||
      ((targetUser.roles as string[]) || []).includes('OWNER');

    if (willLoseAdmin && isCurrentlyAdmin) {
      const lastAdmin = await isLastAdmin(tenantId, userId);
      if (lastAdmin) {
        return { success: false, error: '不能移除最后一个管理员，请先指定其他管理员' };
      }
    }

    await db
      .update(users)
      .set({
        name: data.name,
        roles: data.roles,
        // 角色兼容：同步主角色字段
        role:
          data.roles && data.roles.length > 0 ? data.roles[0] : data.roles ? 'STAFF' : undefined,
        isActive: data.isActive,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)));

    revalidatePath('/settings/users');
    return { success: true };
  } catch (error) {
    console.error('更新用户失败:', error);
    return { success: false, error: '更新失败' };
  }
}

/**
 * 切换用户启用/禁用状态（软删除）
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

    await db
      .update(users)
      .set({ isActive: newActive, updatedAt: new Date() })
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)));

    revalidatePath('/settings/users');
    return {
      success: true,
      isActive: newActive,
      message: newActive ? '已启用该用户' : '已禁用该用户',
    };
  } catch (error) {
    console.error('切换用户状态失败:', error);
    return { success: false, error: '操作失败' };
  }
}

/**
 * 删除用户（软删除 - 禁用账号）
 * 由于 users 表被 30+ 张表外键引用，物理删除会破坏数据完整性
 * 因此"删除"实际执行的是禁用操作
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
    await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)));

    revalidatePath('/settings/users');
    return { success: true, message: '已删除（禁用）该用户' };
  } catch (error) {
    console.error('删除用户失败:', error);
    return { success: false, error: '删除失败' };
  }
}
