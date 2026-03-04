import React, { Suspense } from 'react';
import { getInstallTasks } from '@/features/service/installation/actions';
import { InstallTaskTable } from '@/features/service/installation/components/install-task-table';
import { InstallationToolbar } from '@/features/service/installation/components/installation-toolbar';
import { UrlSyncedTabs } from '@/shared/ui/url-synced-tabs';
import { CreateInstallTaskDialog } from '@/features/service/installation/components/create-install-task-dialog';
import { Skeleton } from '@/shared/ui/skeleton';

export const dynamic = 'force-dynamic';

export default async function InstallationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search : undefined;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1;

  // 获取安装任务列表
  const result = await getInstallTasks({
    search,
    status: status === 'ALL' ? undefined : status,
    page,
    pageSize: 20,
  });

  const tasks = result.success ? result.data || [] : [];
  const pagination = result.success ? result.pagination : undefined;

  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header Section - Tabs 和新建按钮同一行 */}
      <div className="flex items-center justify-between">
        <UrlSyncedTabs
          paramName="status"
          defaultValue="ALL"
          tabs={[
            { value: 'ALL', title: '全部' },
            { value: 'PENDING_DISPATCH', title: '待分配' },
            { value: 'DISPATCHING', title: '待上门' },
            { value: 'PENDING_CONFIRM', title: '待确认' },
            { value: 'COMPLETED', title: '已完成' },
          ]}
        />
        <CreateInstallTaskDialog />
      </div>

      {/* 主内容区域 - 玻璃态容器 */}
      <div className="glass-liquid-ultra flex min-h-0 flex-1 flex-col gap-4 rounded-3xl border border-white/10 p-4">
        <InstallationToolbar />

        <div className="min-h-0 flex-1 overflow-auto">
          <Suspense fallback={<TableSkeleton />}>
            <InstallTaskTable data={tasks} pagination={pagination} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// InstallationStats 统计组件已移除（getInstallationStats 已废弃）

function TableSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
