import { Suspense } from 'react';
import { getMeasureTasks } from '@/features/service/measurement/actions/queries';
import { MeasureTaskTable } from '@/features/service/measurement/components/measure-task-table';
import { MeasurementFilterBar } from '@/features/service/measurement/components/measurement-filter-bar';
import { CreateMeasureTaskDialog } from '@/features/service/measurement/components/create-measure-task-dialog';
import { Metadata } from 'next';
import { Skeleton } from '@/shared/ui/skeleton';

export const metadata: Metadata = {
    title: '测量管理 - L2C',
};

interface PageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        status?: string;
    }>;
}

export default async function MeasurementPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = Number(params.page) || 1;
    const search = params.search || '';
    const status = params.status || '';

    const { data: tasks, total, totalPages } = await getMeasureTasks({
        page,
        search,
        status: status === 'ALL' ? undefined : status, // Filter 'ALL' as undefined
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

            <MeasurementFilterBar />

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
