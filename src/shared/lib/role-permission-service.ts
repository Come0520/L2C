import { db } from '@/shared/api/db';
import { roles, roleOverrides } from '@/shared/api/schema';
import { users } from '@/shared/api/schema/infrastructure';
import { getRoleDefinition } from '@/shared/config/roles';
import { eq, and } from 'drizzle-orm';

/**
 * 角色权限服务
 *
 * 负责合并系统预设权限和租户覆盖配置，计算用户的最终有效权限
 *
 * 增量模式：最终权限 = 系统预设 + 租户增加 - 租户移除
 */
export class RolePermissionService {
  /**
   * 获取角色的有效权限（合并系统预设和租户覆盖）
   *
   * @param tenantId 租户ID
   * @param roleCode 角色代码
   * @returns 有效权限列表
   */
  static async getEffectivePermissions(tenantId: string, roleCode: string): Promise<string[]> {
    // 1. 获取角色定义（从数据库获取，支持系统角色和自定义角色）
    // 系统角色在同步时也会保存到 roles 表中，且 permissions 字段存储其基础权限
    const roleDef = await db.query.roles.findFirst({
      where: and(eq(roles.tenantId, tenantId), eq(roles.code, roleCode)),
    });

    if (!roleDef) {
      // 如果数据库中没有，尝试回退到静态配置（仅用于兜底，如同步前）
      const staticDef = getRoleDefinition(roleCode);
      if (!staticDef) return [];

      const basePermissions = new Set(staticDef.permissions);
      if (staticDef.permissions.includes('**')) return ['**'];
      return Array.from(basePermissions);
    }

    const basePermissionsFromDb = (roleDef.permissions as string[]) || [];

    // 如果是超级管理员权限，直接返回
    if (basePermissionsFromDb.includes('**')) {
      return ['**'];
    }

    const basePermissions = new Set(basePermissionsFromDb);

    // 2. 查询租户覆盖配置
    const override = await db.query.roleOverrides.findFirst({
      where: and(eq(roleOverrides.tenantId, tenantId), eq(roleOverrides.roleCode, roleCode)),
    });

    if (!override) {
      return Array.from(basePermissions);
    }

    // 3. 解析覆盖配置
    const addedPermissions: string[] = JSON.parse(override.addedPermissions || '[]');
    const removedPermissions: string[] = JSON.parse(override.removedPermissions || '[]');

    // 4. 合并权限：基础 + 增加 - 移除
    for (const perm of addedPermissions) {
      basePermissions.add(perm);
    }
    for (const perm of removedPermissions) {
      basePermissions.delete(perm);
    }

    return Array.from(basePermissions);
  }

  /**
   * 检查用户是否拥有指定权限
   *
   * @param userId 用户ID
   * @param permission 权限代码
   * @returns 是否有权限
   */
  static async hasPermission(userId: string, permission: string): Promise<boolean> {
    // 1. 获取用户信息
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.isActive) {
      return false;
    }

    // 2. 平台管理员拥有所有权限
    if (user.isPlatformAdmin) {
      return true;
    }

    // 3. 获取用户角色的有效权限
    const roleCode = user.role || 'SALES';
    const effectivePermissions = await this.getEffectivePermissions(user.tenantId, roleCode);

    // 4. 检查超级管理员权限
    if (effectivePermissions.includes('**')) {
      return true;
    }

    // 5. 检查超级查看权限（仅限 VIEW 类权限）
    if (effectivePermissions.includes('*') && permission.includes('.view')) {
      return true;
    }

    // 6. 检查具体权限
    if (effectivePermissions.includes(permission)) {
      return true;
    }

    // 7. 检查用户直接分配的权限
    const userPermissions = (user.permissions as string[]) || [];
    if (userPermissions.includes(permission)) {
      return true;
    }

    return false;
  }

  /**
   * 检查用户对模块的数据范围权限
   *
   * @param userId 用户ID
   * @param module 模块名（如 'order', 'lead'）
   * @returns 数据范围：'ALL' | 'OWN' | 'NONE'
   */
  static async checkDataScope(userId: string, module: string): Promise<'ALL' | 'OWN' | 'NONE'> {
    // 1. 获取用户信息
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.isActive) {
      return 'NONE';
    }

    // 2. 平台管理员拥有全部数据权限
    if (user.isPlatformAdmin) {
      return 'ALL';
    }

    // 3. 获取有效权限
    const roleCode = user.role || 'SALES';
    const effectivePermissions = await this.getEffectivePermissions(user.tenantId, roleCode);

    // 4. 超级管理员
    if (effectivePermissions.includes('**')) {
      return 'ALL';
    }

    // 5. 检查 ALL 权限
    const allViewPermission = `${module}.all.view`;
    const allEditPermission = `${module}.all.edit`;
    if (
      effectivePermissions.includes(allViewPermission) ||
      effectivePermissions.includes(allEditPermission)
    ) {
      return 'ALL';
    }

    // 6. 检查 OWN 权限
    const ownViewPermission = `${module}.own.view`;
    const ownEditPermission = `${module}.own.edit`;
    if (
      effectivePermissions.includes(ownViewPermission) ||
      effectivePermissions.includes(ownEditPermission)
    ) {
      return 'OWN';
    }

    // 7. 检查通用权限（无数据范围前缀的，如 finance.view）
    const viewPermission = `${module}.view`;
    if (effectivePermissions.includes(viewPermission)) {
      return 'ALL'; // 通用 view 权限默认为 ALL
    }

    return 'NONE';
  }

  /**
   * 获取用户的所有有效权限
   *
   * @param userId 用户ID
   * @returns 权限列表
   */
  static async getAllUserPermissions(userId: string): Promise<string[]> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user || !user.isActive) {
      return [];
    }

    if (user.isPlatformAdmin) {
      return ['**'];
    }

    const roleCode = user.role || 'SALES';
    const rolePermissions = await this.getEffectivePermissions(user.tenantId, roleCode);
    const userPermissions = (user.permissions as string[]) || [];

    // 合并角色权限和用户直接权限
    return [...new Set([...rolePermissions, ...userPermissions])];
  }

  /**
   * 获取租户的角色覆盖配置
   *
   * @param tenantId 租户ID
   * @returns 所有角色的覆盖配置
   */
  static async getTenantRoleOverrides(
    tenantId: string
  ): Promise<Record<string, { added: string[]; removed: string[] }>> {
    const overrides = await db
      .select()
      .from(roleOverrides)
      .where(eq(roleOverrides.tenantId, tenantId));

    const result: Record<string, { added: string[]; removed: string[] }> = {};

    for (const override of overrides) {
      result[override.roleCode] = {
        added: JSON.parse(override.addedPermissions || '[]'),
        removed: JSON.parse(override.removedPermissions || '[]'),
      };
    }

    return result;
  }
}

// 导出便捷函数（保持向后兼容）
export const rolePermissionService = {
  hasPermission: (userId: string, permission: string) =>
    RolePermissionService.hasPermission(userId, permission),
  checkDataScope: (userId: string, module: string) =>
    RolePermissionService.checkDataScope(userId, module),
  getEffectivePermissions: (tenantId: string, roleCode: string) =>
    RolePermissionService.getEffectivePermissions(tenantId, roleCode),
};
