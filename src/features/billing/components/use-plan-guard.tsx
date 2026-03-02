'use client';

import { useState } from 'react';
import { checkTenantLimitAction } from '../actions/usage-actions';
import { type PlanResource } from '../lib/plan-limits';
import { UpgradeModal } from './upgrade-modal';
import React from 'react';

// Hook：用于需要在点击时发起异步拦截的场景
export function usePlanGuard() {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [loadingResource, setLoadingResource] = useState<PlanResource | null>(null);
  const [modalProps, setModalProps] = useState<{ title?: string; description?: string }>({});

  /**
   * 检查资源是否超限，如果未超限执行 action，超限则弹窗
   * @param resource 资源名称
   * @param action 未超限时要执行的逻辑
   * @param customModalProps （可选）针对此资源的自定义弹窗文案
   */
  const guardAction = async (
    resource: PlanResource,
    action: () => void | Promise<void>,
    customModalProps?: { title?: string; description?: string }
  ) => {
    try {
      setLoadingResource(resource);
      const result = await checkTenantLimitAction(resource);

      if (!result.allowed) {
        // 超限，不出错但弹窗提示升级
        setModalProps(
          customModalProps || {
            title: '额度已满，需要升级',
            description: `当前版本最多允许 ${result.limit}。请升级专业版解锁无限制数量或更多配额。`,
          }
        );
        setIsUpgradeModalOpen(true);
      } else {
        // 未超限，往下执行
        await action();
      }
    } catch (error) {
      console.error('[PlanGuard] 用量检验失败', error);
      alert(error instanceof Error ? error.message : '检查当前用量失败，请稍后刷新重试');
    } finally {
      setLoadingResource(null);
    }
  };

  /** 用于渲染弹窗的组件部分，必须放在组件树中 */
  const UpgradeModalElement = (
    <UpgradeModal
      isOpen={isUpgradeModalOpen}
      onOpenChange={setIsUpgradeModalOpen}
      title={modalProps.title}
      description={modalProps.description}
    />
  );

  return {
    guardAction,
    isGuarding: loadingResource !== null,
    loadingResource,
    UpgradeModalElement,
  };
}
