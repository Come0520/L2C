import { ApprovalTaskList } from '@/features/approval/components/approval-task-list';
import { UrlSyncedTabs } from '@/shared/ui/url-synced-tabs';
import { TableSkeleton } from '@/shared/ui/skeleton-variants';
import { Suspense } from 'react';
import { getPendingApprovals, getProcessedApprovals } from '@/features/approval/actions/queries';
import { type ApprovalTask } from '@/features/approval/schema';

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const params = await searchParams;
  const tab = params.tab || 'pending';
  const page = Number(params.page) || 1;

  let result;
  if (tab === 'pending') {
    result = await getPendingApprovals({ page });
  } else {
    result = await getProcessedApprovals({ page });
  }

  const tasks = (result.success ? (result.data?.tasks ?? []) : []) as unknown as ApprovalTask[];
  const pagination = result.success ? result.data?.pagination : undefined;

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <UrlSyncedTabs
          paramName="tab"
          defaultValue="pending"
          tabs={[
            { value: 'pending', title: '待处理' },
            { value: 'processed', title: '已处理' },
          ]}
        />
      </div>

      <div className="glass-liquid-ultra flex min-h-0 flex-1 flex-col gap-4 rounded-2xl border border-white/20 p-4">
        <div className="min-h-0 flex-1 overflow-auto">
          <Suspense fallback={<TableSkeleton />}>
            <ApprovalTaskList tasks={tasks} isPending={tab === 'pending'} pagination={pagination} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
