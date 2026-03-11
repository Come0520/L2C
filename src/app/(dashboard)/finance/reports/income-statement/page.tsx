import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { getIncomeStatementData } from '@/features/finance';
import { IncomeStatementClient } from './client';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { Suspense } from 'react';

async function IncomeStatementContent({
  tenantId,
  startDate,
  endDate,
  rawStart,
  rawEnd,
}: {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  rawStart: string;
  rawEnd: string;
}) {
  const data = await getIncomeStatementData(tenantId, startDate, endDate);
  return <IncomeStatementClient data={data} initialStartDate={rawStart} initialEndDate={rawEnd} />;
}

export const metadata = { title: '利润表 - 财务模块' };

export default async function IncomeStatementPage({
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">财务报表</h1>
      <Suspense
        fallback={
          <div data-loading="true" className="bg-muted h-[600px] w-full animate-pulse rounded-lg" />
        }
      >
        <IncomeStatementContent
          tenantId={tenantId}
          startDate={startDate}
          endDate={endDate}
          rawStart={rawStart}
          rawEnd={rawEnd}
        />
      </Suspense>
    </div>
  );
}
