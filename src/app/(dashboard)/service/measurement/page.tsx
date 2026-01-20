import { Suspense } from 'react';
import { getMeasureTasks, getAvailableWorkers } from '@/features/service/measurement/actions/queries';
import { MeasureTaskTable } from '@/features/service/measurement/components/measure-task-table';
import { MeasurementFilterBar } from '@/features/service/measurement/components/measurement-filter-bar';
import { CreateMeasureTaskDialog } from '@/features/service/measurement/components/create-measure-task-dialog';
import { Metadata } from 'next';
import { Skeleton } from '@/shared/ui/skeleton';
import { db } from '@/shared/api/db';
import { users, channels } from '@/shared/api/schema';
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
    const { data: tasks } = await getMeasureTasks({
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

    return (
        <div className="flex h-full flex-col gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">测量管理</h1>
                    <p className="text-muted-foreground">
                        管理测量任务、派单及审核测量数据。
                    </p>
                </div>
                <CreateMeasureTaskDialog />
            </div>

            <MeasurementFilterBar
                workerOptions={workerOptions}
                salesOptions={salesOptions}
                channelOptions={channelOptions}
            />

            <Suspense fallback={<TableSkeleton />}>
                <MeasureTaskTable data={tasks as any} />
                {/* Pagination TODO */}
            </Suspense>
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
