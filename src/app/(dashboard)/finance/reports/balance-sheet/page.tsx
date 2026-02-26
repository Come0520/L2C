import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { getBalanceSheetData } from '@/features/finance';
import { BalanceSheetClient } from './client';

export const metadata = { title: '资产负债表 - 财务模块' };

export default async function BalanceSheetPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth();
    const tenantId = session?.user?.tenantId;
    if (!tenantId) redirect('/login');
    const resolvedSearchParams = await searchParams;

    const rawDate = resolvedSearchParams?.date as string;
    const asOfDate = rawDate ? new Date(rawDate) : new Date();

    // 获取报表数据
    const data = await getBalanceSheetData(tenantId, asOfDate);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">财务报表</h1>
            <BalanceSheetClient data={data} initialDate={asOfDate.toISOString()} />
        </div>
    );
}
