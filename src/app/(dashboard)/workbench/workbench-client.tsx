'use client';

import React from 'react';
import { Tabs } from '@/components/ui/tabs';
import { DashboardTab } from '@/features/dashboard/components/dashboard-tab';
import { TodoTab } from '@/features/dashboard/components/todo-tab';
import { AlertsTab } from '@/features/dashboard/components/alerts-tab';

const TAB_CONTENT_CLASS =
  'w-full overflow-hidden relative h-full rounded-2xl p-6 bg-white/95 dark:bg-slate-900/95 border border-slate-200/50 dark:border-slate-800/50 shadow-lg';

/**
 * 工作台客户端组件
 * 使用 Aceternity Tabs 展示三个核心模块
 *
 * 设计说明：
 * - Tab 内容区域使用实心背景以保证文字识别度
 * - 内部卡片组件使用 glass-liquid 透明效果
 */
export default function WorkbenchClient() {
  const tabs = [
    {
      title: '仪表盘',
      value: 'dashboard',
      content: (
        <div className={TAB_CONTENT_CLASS}>
          <DashboardTab />
        </div>
      ),
    },
    {
      title: '待办事项',
      value: 'todos',
      content: (
        <div className={TAB_CONTENT_CLASS}>
          <TodoTab />
        </div>
      ),
    },
    {
      title: '报警中心',
      value: 'alerts',
      content: (
        <div className={TAB_CONTENT_CLASS}>
          <AlertsTab />
        </div>
      ),
    },
  ];

  return (
    <div className="relative flex h-[calc(100vh-10rem)] w-full flex-col items-start justify-start perspective-[1000px]">
      <Tabs
        tabs={tabs}
        containerClassName="mb-4"
        activeTabClassName="bg-primary-500/20 dark:bg-primary-500/30"
        tabClassName="text-sm font-medium"
        contentClassName="mt-6"
      />
    </div>
  );
}
