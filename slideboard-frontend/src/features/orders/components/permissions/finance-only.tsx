'use client';

import React, { ReactNode } from 'react';

import { RoleGuard } from './role-guard';

interface PermissionComponentProps {
  /** 有权限时显示的内容 */
  children: ReactNode;
  /** 无权限时显示的内容，默认为 null */
  fallback?: ReactNode;
}

/**
 * 仅允许财务相关角色访问的组件
 */
export const FinanceOnly = ({
  children,
  fallback = null,
}: PermissionComponentProps) => {
  return (
    <RoleGuard 
      roles={['OTHER_FINANCE', 'APPROVER_FINANCIAL']} 
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
};
