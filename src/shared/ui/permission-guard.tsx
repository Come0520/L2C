'use client';

import { useSession } from 'next-auth/react';
import { ROLES } from '@/shared/config/roles';
import type { ReactNode } from 'react';

/**
 * 权限守卫组件 Props
 */
interface PermissionGuardProps {
  /**
   * 所需权限（模块.操作 格式，如 'order.approve'）
   * 可传单个字符串或数组（数组表示"满足任意一个即可"）
   */
  permission: string | string[];

  /**
   * 匹配模式
   * - 'any'（默认）：拥有任意一个权限即显示
   * - 'all'：必须拥有全部权限才显示
   */
  mode?: 'any' | 'all';

  /**
   * 有权限时渲染的子组件
   */
  children: ReactNode;

  /**
   * 无权限时的备选渲染（可选）
   */
  fallback?: ReactNode;
}

/**
 * 前端权限守卫组件
 *
 * 根据当前用户的角色权限，控制子组件的显示/隐藏。
 * 常用于按钮级权限控制，如"提交审批"、"删除"等操作按钮。
 *
 * @example
 * ```tsx
 * // 单权限检查
 * <PermissionGuard permission="order.approve">
 *   <Button>审批订单</Button>
 * </PermissionGuard>
 *
 * // 多权限（任意一个满足即可）
 * <PermissionGuard permission={['quote.own.edit', 'quote.all.edit']}>
 *   <Button>编辑报价</Button>
 * </PermissionGuard>
 *
 * // 多权限（全部满足）
 * <PermissionGuard permission={['finance.view', 'finance.approve']} mode="all">
 *   <Button>审批并查看财务</Button>
 * </PermissionGuard>
 *
 * // 带 fallback
 * <PermissionGuard permission="settings.user" fallback={<span>无权操作</span>}>
 *   <Button>邀请用户</Button>
 * </PermissionGuard>
 * ```
 */
export function PermissionGuard({
  permission,
  mode = 'any',
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { data: session } = useSession();

  // 用户未登录，不渲染
  if (!session?.user) {
    return <>{fallback}</>;
  }

  const userRoles = session.user.roles || [session.user.role || 'SALES'];
  const permissions = Array.isArray(permission) ? permission : [permission];

  const hasAccess = checkPermissions(userRoles, permissions, mode);

  return <>{hasAccess ? children : fallback}</>;
}

/**
 * 权限检查 Hook
 *
 * 在需要编程式权限检查时使用（非 UI 渲染场景）。
 *
 * @example
 * ```tsx
 * const canApprove = usePermission('order.approve');
 * const canEditOrView = usePermission(['quote.own.edit', 'quote.all.edit']);
 * ```
 */
export function usePermission(permission: string | string[], mode: 'any' | 'all' = 'any'): boolean {
  const { data: session } = useSession();

  if (!session?.user) return false;

  const userRoles = session.user.roles || [session.user.role || 'SALES'];
  const permissions = Array.isArray(permission) ? permission : [permission];

  return checkPermissions(userRoles, permissions, mode);
}

/**
 * 检查用户角色是否拥有指定权限
 *
 * 逻辑：遍历用户的所有角色，合并其权限集，然后检查目标权限。
 * 支持通配符：'**' = 超级管理员（全部权限），'*' = 超级查看权限。
 */
function checkPermissions(
  userRoles: string[],
  requiredPermissions: string[],
  mode: 'any' | 'all'
): boolean {
  // 收集用户所有角色的权限
  const allPermissions = new Set<string>();

  for (const roleCode of userRoles) {
    // ADMIN 角色拥有 ** 通配符
    if (roleCode === 'ADMIN') {
      return true;
    }

    const roleDef = ROLES[roleCode];
    if (!roleDef) continue;

    for (const perm of roleDef.permissions) {
      allPermissions.add(perm);
    }
  }

  // 超级管理员通配符
  if (allPermissions.has('**')) return true;

  // 检查具体权限
  const checker = (perm: string) => {
    if (allPermissions.has(perm)) return true;
    // '*' 通配符仅匹配 .view 类权限
    if (allPermissions.has('*') && perm.includes('.view')) return true;
    return false;
  };

  if (mode === 'any') {
    return requiredPermissions.some(checker);
  } else {
    return requiredPermissions.every(checker);
  }
}
