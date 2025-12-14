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
 * 仅允许测量师角色访问的组件
 */
export const MeasurerOnly = ({
  children,
  fallback = null,
}: PermissionComponentProps) => {
  return (
    <RoleGuard roles="SERVICE_MEASURE" fallback={fallback}>
      {children}
    </RoleGuard>
  );
};
