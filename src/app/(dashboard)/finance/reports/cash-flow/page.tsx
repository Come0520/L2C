import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { getCashFlowData } from '@/features/finance';
import { CashFlowClient } from './client';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export const metadata = { title: '现金流量表 - 财务模块' };

export default async function CashFlowPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth();
    const tenantId = session?.user?.tenantId;
    if (!tenantId) redirect('/login');
    const resolvedSearchParams = await searchParams;

    const today = new Date();
    const defaultStart = format(startOfMonth(today), 'yyyy-MM-dd');
    const defaultEnd = format(endOfMonth(today), 'yyyy-MM-dd');

    const rawStart = (resolvedSearchParams?.startDate as string) || defaultStart;
    const rawEnd = (resolvedSearchParams?.endDate as string) || defaultEnd;

    const startDate = new Date(rawStart);
    const endDate = new Date(rawEnd);

    // 获取报表数据
    const data = await getCashFlowData(tenantId, startDate, endDate);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">财务报表</h1>
            <CashFlowClient data={data} initialStartDate={rawStart} initialEndDate={rawEnd} />
        </div>
    );
}
