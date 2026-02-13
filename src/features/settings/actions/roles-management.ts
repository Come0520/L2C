'use server';

import { db } from '@/shared/api/db';
import { roles } from '@/shared/api/schema';
import { ROLES } from '@/shared/config/roles';
import { auth } from '@/shared/lib/auth';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

/**
 * 角色管理 Server Actions
 */

// ==================== 系统角色同步 ====================

/**
 * 同步系统预设角色到数据库
 * 将代码中的各角色配置（名称、描述、默认权限）写入数据库
 */
export async function syncSystemRoles() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { success: false, message: '未授权访问' };
  }

  const userRole = session.user.role;
  if (userRole !== 'ADMIN' && userRole !== 'MANAGER' && userRole !== 'OWNER') {
    return { success: false, message: '没有权限执行此操作' };
  }

  const tenantId = session.user.tenantId;

  try {
    const results = [];

    // 遍历所有预设角色
    for (const roleDef of Object.values(ROLES)) {
      // 检查是否存在
      const existing = await db.query.roles.findFirst({
        where: and(eq(roles.tenantId, tenantId), eq(roles.code, roleDef.code)),
      });

      if (existing) {
        // 更新现有角色
        await db
          .update(roles)
          .set({
            name: roleDef.name,
            description: roleDef.description,
            permissions: roleDef.permissions,
            isSystem: true,
            updatedAt: new Date(),
          })
          .where(eq(roles.id, existing.id));
        results.push(`更新: ${roleDef.name}`);
      } else {
        // 创建新角色
        await db.insert(roles).values({
          tenantId,
          code: roleDef.code,
          name: roleDef.name,
          description: roleDef.description,
          permissions: roleDef.permissions,
          isSystem: true,
        });
        results.push(`创建: ${roleDef.name}`);
      }
    }

    revalidatePath('/settings/roles');
    revalidatePath('/settings/users');

    return {
      success: true,
      message: `同步完成: ${results.length} 个角色已处理`,
      details: results,
    };
  } catch (error) {
    console.error('同步系统角色失败:', error);
    return { success: false, message: '同步失败，请查看日志' };
  }
}

// ==================== 角色 CRUD ====================

/**
 * 创建自定义角色
 */
export async function createRole(data: {
  code: string;
  name: string;
  description?: string;
  permissions?: string[];
}) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { success: false, message: '未授权访问' };
  }

  const tenantId = session.user.tenantId;

  try {
    // 检查 Code 是否重复
    const existing = await db.query.roles.findFirst({
      where: and(eq(roles.tenantId, tenantId), eq(roles.code, data.code)),
    });

    if (existing) {
      return { success: false, message: `角色代码 ${data.code} 已存在` };
    }

    await db.insert(roles).values({
      tenantId,
      code: data.code,
      name: data.name,
      description: data.description,
      permissions: data.permissions || [],
      isSystem: false,
    });

    revalidatePath('/settings/roles');
    return { success: true, message: '角色创建成功' };
  } catch (error) {
    console.error('创建角色失败:', error);
    return { success: false, message: '创建失败' };
  }
}

/**
 * 更新角色信息
 * 注意：系统角色的 code 不能修改，且通常不建议修改系统角色的基本信息（应通过 sync 恢复），
 * 但允许修改自定义角色的所有信息。
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
  if (!session?.user?.tenantId) {
    return { success: false, message: '未授权访问' };
  }

  const tenantId = session.user.tenantId;

  try {
    const role = await db.query.roles.findFirst({
      where: and(eq(roles.id, id), eq(roles.tenantId, tenantId)),
    });

    if (!role) {
      return { success: false, message: '角色不存在' };
    }

    const updateData: any = {
      name: data.name,
      description: data.description,
      updatedAt: new Date(),
    };

    // 如果不是系统角色，允许修改权限
    if (!role.isSystem && data.permissions) {
      updateData.permissions = data.permissions;
    }

    await db.update(roles).set(updateData).where(eq(roles.id, id));

    revalidatePath('/settings/roles');
    return { success: true, message: '角色更新成功' };
  } catch (error) {
    console.error('更新角色失败:', error);
    return { success: false, message: '更新失败' };
  }
}

/**
 * 删除角色
 * 仅允许删除非系统角色
 */
export async function deleteRole(id: string) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return { success: false, message: '未授权访问' };
  }

  const tenantId = session.user.tenantId;

  try {
    const role = await db.query.roles.findFirst({
      where: and(eq(roles.id, id), eq(roles.tenantId, tenantId)),
    });

    if (!role) {
      return { success: false, message: '角色不存在' };
    }

    if (role.isSystem) {
      return { success: false, message: '无法删除系统预设角色' };
    }

    await db.delete(roles).where(eq(roles.id, id));

    revalidatePath('/settings/roles');
    return { success: true, message: '角色已删除' };
  } catch (error) {
    console.error('删除角色失败:', error);
    return { success: false, message: '删除失败' };
  }
}
