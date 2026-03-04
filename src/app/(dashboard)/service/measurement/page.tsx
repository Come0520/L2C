import { Suspense } from 'react';
import {
  getMeasureTasks,
  getAvailableWorkers,
} from '@/features/service/measurement/actions/queries';
import { MeasureTaskTable } from '@/features/service/measurement/components/measure-task-table';
import { MeasurementToolbar } from '@/features/service/measurement/components/measurement-toolbar';
import { CreateMeasureTaskDialog } from '@/features/service/measurement/components/create-measure-task-dialog';
import { UrlSyncedTabs } from '@/shared/ui/url-synced-tabs';
import { Pagination } from '@/shared/ui/pagination';
import { Metadata } from 'next';
import { Skeleton } from '@/shared/ui/skeleton';
import { db } from '@/shared/api/db';
import { users, channels } from '@/shared/api/schema';
import { eq, or, and } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';

export const metadata: Metadata = {
  title: '测量管理 - L2C',
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
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
  const status = params.status || 'ALL';

  // 获取当前用户租户信息 (R2-SEC-02)
  const session = await auth();
  const tenantId = session?.user?.tenantId;

  if (!tenantId) {
    // 如果没有租户 ID，理论上应该重定向或报错，这里简单处理为空数据
    return <div className="text-destructive p-4">未授权访问：无法获取租户信息</div>;
  }

  // 获取筛选选项数据
  const [workersResult, salesList, channelList] = await Promise.all([
    getAvailableWorkers(),
    // 获取销售人员列表 (R2-SEC-02: 增加租户隔离)
    db.query.users.findMany({
      where: and(
        eq(users.tenantId, tenantId),
        or(eq(users.role, 'SALES'), eq(users.role, 'MANAGER'))
      ),
      columns: { id: true, name: true },
    }),
    // 获取渠道列表 (R2-SEC-02: 增加租户隔离)
    db.query.channels
      ?.findMany?.({
        where: eq(channels.tenantId, tenantId),
        columns: { id: true, name: true },
      })
      .catch(() => []) ?? [],
  ]);

  const workerOptions = (workersResult.data || []).map((w) => ({ id: w.id, name: w.name || '' }));
  const salesOptions = salesList.map((s) => ({ id: s.id, name: s.name || '' }));
  const channelOptions = (channelList || []).map((c: { id: string; name: string }) => ({
    id: c.id,
    name: c.name,
  }));

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

  const totalCount = 'total' in tasks ? Number(tasks.total) : 0;
  const totalPages = Math.ceil(totalCount / (Number(params.pageSize) || 10));

  // 定义 Tab 状态，与后端枚举对齐
  const STATUS_TABS = [
    { title: '全部', value: 'ALL' },
    { title: '待审批', value: 'PENDING_APPROVAL' },
    { title: '待测量', value: 'PENDING' },
    { title: '派单中', value: 'DISPATCHING' },
    { title: '待上门', value: 'PENDING_VISIT' },
    { title: '待确认', value: 'PENDING_CONFIRM' },
    { title: '已完成', value: 'COMPLETED' },
    { title: '已取消', value: 'CANCELLED' },
  ];

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <UrlSyncedTabs paramName="status" defaultValue="ALL" tabs={STATUS_TABS} />
        <CreateMeasureTaskDialog />
      </div>

      {/* Main Content */}
      <div className="glass-liquid-ultra flex min-h-0 flex-1 flex-col gap-4 rounded-2xl border border-white/20 p-4">
        <MeasurementToolbar
          workerOptions={workerOptions}
          salesOptions={salesOptions}
          channelOptions={channelOptions}
        />

        <div className="min-h-0 flex-1 overflow-auto">
          <Suspense fallback={<TableSkeleton />}>
            <MeasureTaskTable data={tasks.success && tasks.data ? tasks.data : []} />
          </Suspense>
        </div>

        <Pagination totalPages={totalPages} currentPage={page} />
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
