import React, { Suspense } from 'react';
import { getInstallTasks } from '@/features/service/installation/actions';
import { InstallTaskTable } from '@/features/service/installation/components/install-task-table';
import { InstallationToolbar } from '@/features/service/installation/components/installation-toolbar';
import { UrlSyncedTabs } from '@/components/ui/url-synced-tabs';
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

    const result = await getInstallTasks({
        search,
        status: status === 'ALL' ? undefined : status,
    });
    const tasks = result.success ? (result.data || []) : [];

    return (
        <div className="h-full flex flex-col gap-4 p-4">
            {/* Header Section - Tabs 和新建按钮同一行 */}
            <div className="flex items-center justify-between">
                <UrlSyncedTabs
                    paramName="status"
                    defaultValue="ALL"
                    layoutId="install-status-tabs"
                    tabs={[
                        { value: 'ALL', label: '全部' },
                        { value: 'PENDING_DISPATCH', label: '待分配' },
                        { value: 'DISPATCHING', label: '待上门' },
                        { value: 'PENDING_CONFIRM', label: '待确认' },
                        { value: 'COMPLETED', label: '已完成' },
                    ]}
                />
                <CreateInstallTaskDialog />
            </div>

            {/* 主内容区域 - 玻璃态容器 */}
            <div className="flex-1 flex flex-col min-h-0 glass-liquid-ultra rounded-2xl border border-white/20 p-4 gap-4">
                <InstallationToolbar />

                <div className="flex-1 min-h-0 overflow-auto">
                    <Suspense fallback={<TableSkeleton />}>
                        <InstallTaskTable data={tasks} />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
        </div>
    );
}


