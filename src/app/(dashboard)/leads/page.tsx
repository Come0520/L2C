/**
 * 线索管理页面
 */
import { Suspense } from 'react';
import { getLeads, getChannels } from '@/features/leads/actions';
import { LeadsFilterBar } from '@/features/leads/components/leads-filter-bar';
import { LeadsToolbar } from '@/features/leads/components/leads-toolbar';
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
      <div className="h-[calc(100vh-8rem)] [perspective:1000px] relative flex flex-col w-full items-start justify-start p-6 space-y-4">
        {/* Top Section: Tabs and Actions */}
        <div className="flex w-full items-center justify-between">
          <div className="flex-1">
            <LeadsFilterBar />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <ExcelImportDialog userId={userId} tenantId={tenantId} />
            <CreateLeadDialog channels={channels} userId={userId} tenantId={tenantId} />
          </div>
        </div>

        {/* Content Card */}
        <div className="w-full flex-1 overflow-hidden relative h-full rounded-2xl p-6 glass-liquid border border-white/10 flex flex-col gap-4">
          <LeadsToolbar tenantId={tenantId} />
          <div className="flex-1 overflow-auto">
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
        </div>
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
