import React, { Suspense } from 'react';
import { AceternityTabs } from '@/shared/ui/aceternity-tabs';
import { Skeleton } from '@/shared/ui/skeleton';
import { DashboardTab } from '@/features/dashboard/components/dashboard-tab';
import { TodoTab } from '@/features/dashboard/components/todo-tab';
import { AlertsTab } from '@/features/dashboard/components/alerts-tab';
import { auth } from '@/shared/lib/auth';
import { WorkbenchService } from '@/services/workbench.service';
import { getDefaultDashboardConfig } from '@/features/dashboard/utils';

/**
 * 工作台首页
 * 使用 Aceternity Tabs 组件展示核心模块
 * 注意：平台管理功能已迁移至 /admin/platform 页面
 */
export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id || '';
  const userRole = session?.user?.role || '';

  // 服务端预取仪表盘配置，消除客户端 useEffect 瀑布流
  // WorkbenchService.getDashboardConfig 内部有 unstable_cache（1小时），无额外性能开销
  const initialDashboardConfig = await WorkbenchService.getDashboardConfig(userId, userRole).catch(
    () => getDefaultDashboardConfig(userRole)
  );

  const tabs = [
    {
      title: '仪表盘',
      value: 'dashboard',
      content: (
        <div className="glass-liquid relative h-full w-full overflow-hidden rounded-2xl border border-white/10 p-6">
          <Suspense fallback={<Skeleton className="h-full w-full rounded-2xl" />}>
            {/* 将服务端预取的配置传入，消除客户端二次请求 */}
            <DashboardTab initialConfig={initialDashboardConfig} />
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
    <div className="relative flex min-h-[calc(100vh-8rem)] w-full flex-col items-start justify-start [perspective:1000px]">
      <AceternityTabs
        tabs={tabs}
        containerClassName="mb-4"
        tabClassName="text-sm font-medium"
        contentClassName="mt-6"
      />
    </div>
  );
}
