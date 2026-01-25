/**
 * 线索管理页面
 */
import { Suspense } from 'react';
import { getLeads, getChannels } from '@/features/leads/actions';
import { LeadsFilterBar } from '@/features/leads/components/leads-filter-bar';
import { LeadsAdvancedFilter } from '@/features/leads/components/leads-advanced-filter';
import { LeadTable } from '@/features/leads/components/lead-table';
import { CreateLeadDialog } from '@/features/leads/components/create-lead-dialog';
import { ExcelImportDialog } from '@/features/leads/components/excel-import-dialog';
import { auth } from '@/shared/lib/auth';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { TableSkeleton } from '@/shared/ui/skeleton-variants';

export const dynamic = 'force-dynamic';

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  try {
    const [session, resolvedParams] = await Promise.all([auth(), searchParams]);

    const tenantId = session?.user?.tenantId;
    const userId = session?.user?.id;
    const userRole = session?.user?.role || 'SALES';

    if (!tenantId || !userId) redirect('/login');

    // 解析筛选参数
    const page = Number(resolvedParams?.page) || 1;
    const statusParam = resolvedParams?.status;
    const search = resolvedParams?.search as string | undefined;
    const salesFilter = resolvedParams?.salesFilter as string | undefined;
    const intentionLevel = resolvedParams?.intentionLevel as string | undefined;
    const channelId = resolvedParams?.channelId as string | undefined;
    const salesId = resolvedParams?.salesId as string | undefined;
    const dateFrom = resolvedParams?.dateFrom as string | undefined;
    const dateTo = resolvedParams?.dateTo as string | undefined;

    // 状态筛选
    const status =
      statusParam === 'ALL' || !statusParam
        ? undefined
        : Array.isArray(statusParam)
          ? statusParam
          : [statusParam];

    // 归属销售筛选逻辑
    let effectiveSalesId = salesId;
    if (salesFilter === 'MINE') {
      // "我的跟进" Tab：按当前用户筛选
      effectiveSalesId = userId;
    }

    // 日期范围
    const dateRange =
      dateFrom || dateTo
        ? {
            from: dateFrom ? new Date(dateFrom) : undefined,
            to: dateTo ? new Date(dateTo) : undefined,
          }
        : undefined;

    const [leadsResult, channels] = await Promise.all([
      getLeads({
        page,
        pageSize: 10,
        status,
        search,
        salesId: effectiveSalesId,
        intentionLevel: intentionLevel as 'HIGH' | 'MEDIUM' | 'LOW' | undefined,
        sourceCategoryId: channelId,
        dateRange,
      }),
      getChannels(),
    ]);

    return (
      <div className="space-y-6 p-6">
        <PageHeader
          title="线索管理"
          description="管理和追踪所有潜在客户线索"
          action={
            <>
              <ExcelImportDialog userId={userId} tenantId={tenantId} />
              <CreateLeadDialog channels={channels} userId={userId} tenantId={tenantId} />
            </>
          }
        />

        <div className="flex items-center space-x-4">
          <LeadsFilterBar />
          <div className="ml-auto">
            <LeadsAdvancedFilter tenantId={tenantId} />
          </div>
        </div>

        <Suspense fallback={<TableSkeleton />}>
          <LeadTable
            data={leadsResult.data}
            page={page}
            pageSize={10}
            total={leadsResult.total}
            userRole={userRole}
          />
        </Suspense>
      </div>
    );
  } catch (error) {
    console.error('LeadsPage Error:', error);
    return (
      <div className="space-y-6 p-6">
        <PageHeader title="线索管理" description="管理和追踪所有潜在客户线索" />
        <div className="bg-destructive/10 text-destructive rounded-md p-4">
          <h3 className="font-semibold">无法加载线索数据</h3>
          <p className="mt-1 text-sm">{(error as Error).message}</p>
          {(error as any).digest && (
            <p className="text-muted-foreground mt-2 font-mono text-xs">
              Digest: {(error as any).digest}
            </p>
          )}
        </div>
      </div>
    );
  }
}
