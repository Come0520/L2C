'use client';

import React, { ReactNode } from 'react';

import { RoleGuard } from './RoleGuard';

interface PermissionComponentProps {
  /** 有权限时显示的内容 */
  children: ReactNode;
  /** 无权限时显示的内容，默认为 null */
  fallback?: ReactNode;
}

/**
 * 仅允许派单员角色访问的组件
 */
export const ServiceDispatchOnly = ({
  children,
  fallback = null,
}: PermissionComponentProps) => {
  return (
    <RoleGuard roles="SERVICE_DISPATCH" fallback={fallback}>
      {children}
    </RoleGuard>
  );
};
