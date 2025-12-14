'use client';

import React, { ReactNode } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/shared/types/user';
import { hasPermission } from '@/utils/permissions';

interface RoleGuardProps {
  /** 允许访问的角色，可以是单个角色或角色数组 */
  roles: UserRole | UserRole[];
  /** 有权限时显示的内容 */
  children: ReactNode;
  /** 无权限时显示的内容，默认为 null */
  fallback?: ReactNode;
  /** 是否在加载中显示 fallback，默认为 false */
  showFallbackWhileLoading?: boolean;
}

/**
 * 基础角色守卫组件，根据用户角色控制内容显示
 */
export const RoleGuard = ({
  roles,
  children,
  fallback = null,
  showFallbackWhileLoading = false,
}: RoleGuardProps) => {
  const { user, loading } = useAuth();

  // 加载状态处理
  if (loading) {
    return showFallbackWhileLoading ? fallback : <div className="h-8 w-8 animate-pulse rounded-full bg-gray-200" />;
  }

  // 临时放开权限用于调试 (已禁用，以启用严格权限测试)
  // if (process.env.NODE_ENV === 'development') {
  //   return <>{children}</>;
  // }

  // 检查权限
  const hasAccess = hasPermission(user?.role, roles);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};
