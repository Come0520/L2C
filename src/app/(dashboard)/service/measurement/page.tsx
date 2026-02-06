import { Suspense } from 'react';
import { getMeasureTasks, getAvailableWorkers } from '@/features/service/measurement/actions/queries';
import { MeasureTaskTable } from '@/features/service/measurement/components/measure-task-table';
import { MeasurementToolbar } from '@/features/service/measurement/components/measurement-toolbar';
import { CreateMeasureTaskDialog } from '@/features/service/measurement/components/create-measure-task-dialog';
import { UrlSyncedTabs } from '@/components/ui/url-synced-tabs';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { Metadata } from 'next';
import { Skeleton } from '@/shared/ui/skeleton';
import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq, or } from 'drizzle-orm';

export const metadata: Metadata = {
    title: '测量管理 - L2C',
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        status?: string;
        // 扩展筛选参数
        workerId?: string;
        salesId?: string;
        address?: string;
        channel?: string;
        customerName?: string;
        dateFrom?: string;
        dateTo?: string;
    }>;
}

export default async function MeasurementPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const search = params.search || '';
    const status = params.status || '';

    // 获取筛选选项数据
    const [workersResult, salesList, channelList] = await Promise.all([
        getAvailableWorkers(),
        // 获取销售人员列表
        db.query.users.findMany({
            where: or(eq(users.role, 'SALES'), eq(users.role, 'STORE_MANAGER')),
            columns: { id: true, name: true },
        }),
        // 获取渠道列表
        db.query.channels?.findMany?.({
            columns: { id: true, name: true },
        }).catch(() => []) ?? [],
    ]);

    const workerOptions = (workersResult.data || []).map(w => ({ id: w.id, name: w.name || '' }));
    const salesOptions = salesList.map(s => ({ id: s.id, name: s.name || '' }));
    const channelOptions = (channelList || []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }));

    // 调用查询，传递所有筛选参数
    const tasks = await getMeasureTasks({
        page,
        search,
        status: status === 'ALL' ? undefined : status,
        workerId: params.workerId,
        salesId: params.salesId,
        address: params.address,
        channel: params.channel,
        customerName: params.customerName,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
    });

    const totalPages = Math.ceil((tasks.total || 0) / (Number(params.pageSize) || 10));

    return (
        <div className="h-full flex flex-col gap-4 p-4">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <UrlSyncedTabs
                    paramName="status"
                    defaultValue="ALL"
                    layoutId="measurement-status-tabs"
                    tabs={[
                        { value: 'ALL', label: '全部任务' },
                        { value: 'PENDING', label: '待测量' },
                        { value: 'SCHEDULED', label: '已排期' },
                        { value: 'COMPLETED', label: '已完成' },
                        { value: 'CANCELLED', label: '已取消' },
                    ]}
                />
                <CreateMeasureTaskDialog />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-0 glass-liquid-ultra rounded-2xl border border-white/20 p-4 gap-4">
                <MeasurementToolbar
                    workerOptions={workerOptions}
                    salesOptions={salesOptions}
                    channelOptions={channelOptions}
                />

                <div className="flex-1 min-h-0 overflow-auto">
                    <Suspense fallback={<TableSkeleton />}>
                        <MeasureTaskTable data={tasks.data as any} />
                    </Suspense>
                </div>

                <DataTablePagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={tasks.total}
                />
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
