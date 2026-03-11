import { ROLES } from '@/shared/config/roles';

/**
 * 检查角色是否拥有某模块的任意权限
 * @param roles 用户角色列表
 * @param modulePrefix 模块权限前缀（如 'lead', 'order', 'finance', 'admin', '__PLATFORM__'）
 * @returns 是否有权限访问该模块
 */
export function hasModuleAccess(roles: string[], modulePrefix: string): boolean {
  // 特殊控制：只有超级管理员能进入平台管理（__PLATFORM__ 前缀）
  if (modulePrefix === '__PLATFORM__') {
    return roles.includes('SUPER_ADMIN') || roles.includes('PLATFORM_ADMIN');
  }

  // 超级权限角色（BOSS/ADMIN/SUPER_ADMIN/PLATFORM_ADMIN）拥有全部常规业务模块访问权限，提前返回避免不必要的循环
  const SUPER_ROLES = ['ADMIN', 'BOSS', 'SUPER_ADMIN', 'PLATFORM_ADMIN'];
  if (roles.some((r) => SUPER_ROLES.includes(r))) return true;

  // 从 ROLES 配置中检查用户的任一角色是否拥有该模块的某个权限
  for (const roleCode of roles) {
    const roleDef = ROLES[roleCode];
    if (!roleDef) continue;

    // 检查该角色是否拥有以 modulePrefix 开头的任意权限
    // perm === '**' 或 '*' 表示全局超级权限（兜底保护，理论上已被上方提前处理）
    const hasPermission = (roleDef.permissions as string[]).some(
      (perm: string) => perm === '**' || perm === '*' || perm.startsWith(`${modulePrefix}.`)
    );
    if (hasPermission) return true;
  }
  return false;
}
