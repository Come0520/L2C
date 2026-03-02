'use client';

import React, { ReactElement } from 'react';
import { usePlanGuard } from './use-plan-guard';
import { type PlanResource } from '../lib/plan-limits';

interface PlanGuardProps {
  children: ReactElement;
  resource: PlanResource;
  action: () => void | Promise<void>;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

/**
 * 声明式组件拦截器
 * 拦截包裹的元素的 onClick 事件，先通过服务端校验额度，若通过再往下执行
 *
 * @example
 * <PlanGuard resource="max_employees" action={() => setAddUserDialog(true)}>
 *   <Button>添加员工</Button>
 * </PlanGuard>
 */
export function PlanGuard({
  children,
  resource,
  action,
  fallbackTitle,
  fallbackDescription,
}: PlanGuardProps) {
  const { guardAction, isGuarding, UpgradeModalElement } = usePlanGuard();

  const handleInterceptClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await guardAction(resource, action, { title: fallbackTitle, description: fallbackDescription });
  };

  // 克隆子组件并劫持 onClick，合并 disabled 状态
  const clonedChild = React.cloneElement(children as any, {
    onClick: handleInterceptClick,
    disabled: (children.props as any).disabled || isGuarding,
  });

  return (
    <>
      {clonedChild}
      {UpgradeModalElement}
    </>
  );
}
