import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { getBalanceSheetData } from '@/features/finance';
import { BalanceSheetClient } from './client';
import { Suspense } from 'react';

async function BalanceSheetContent({ tenantId, asOfDate }: { tenantId: string; asOfDate: Date }) {
  const data = await getBalanceSheetData(tenantId, asOfDate);
  return <BalanceSheetClient data={data} initialDate={asOfDate.toISOString()} />;
}

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

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight">财务报表</h1>
      <Suspense
        fallback={
          <div data-loading="true" className="bg-muted h-[600px] w-full animate-pulse rounded-lg" />
        }
      >
        <BalanceSheetContent tenantId={tenantId} asOfDate={asOfDate} />
      </Suspense>
    </div>
  );
}
