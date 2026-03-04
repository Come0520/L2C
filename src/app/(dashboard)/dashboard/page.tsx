import React, { Suspense } from 'react';
import { AceternityTabs } from '@/shared/ui/aceternity-tabs';
import { Skeleton } from '@/shared/ui/skeleton';
import { DashboardTab } from '@/features/dashboard/components/dashboard-tab';
import { TodoTab } from '@/features/dashboard/components/todo-tab';
import { AlertsTab } from '@/features/dashboard/components/alerts-tab';

/**
 * 工作台首页
 * 使用 Aceternity Tabs 组件展示三个核心模块
 */
export default function DashboardPage() {
  const tabs = [
    {
      title: '仪表盘',
      value: 'dashboard',
      content: (
        <div className="glass-liquid relative h-full w-full overflow-hidden rounded-2xl border border-white/10 p-6">
          <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl" />}>
            <DashboardTab />
          </Suspense>
        </div>
      ),
    },
    {
      title: '待办事项',
      value: 'todos',
      content: (
        <div className="glass-liquid relative h-full w-full overflow-hidden rounded-2xl border border-white/10 p-6">
          <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl" />}>
            <TodoTab />
          </Suspense>
        </div>
      ),
    },
    {
      title: '报警中心',
      value: 'alerts',
      content: (
        <div className="glass-liquid relative h-full w-full overflow-hidden rounded-2xl border border-white/10 p-6">
          <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl" />}>
            <AlertsTab />
          </Suspense>
        </div>
      ),
    },
  ];

  return (
    <div className="relative flex h-[calc(100vh-8rem)] w-full flex-col items-start justify-start [perspective:1000px]">
      <AceternityTabs
        tabs={tabs}
        containerClassName="mb-4"
        tabClassName="text-sm font-medium"
        contentClassName="mt-6"
      />
    </div>
  );
}
