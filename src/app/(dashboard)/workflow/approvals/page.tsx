import { ApprovalTaskList } from '@/features/approval/components/approval-task-list';
import { UrlSyncedTabs } from '@/components/ui/url-synced-tabs';
import { Suspense } from 'react';
import { getPendingApprovals, getProcessedApprovals } from '@/features/approval/actions/queries';
import { type ApprovalTask } from '@/features/approval/schema';

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string }> }) {
    const params = await searchParams;
    const tab = params.tab || 'pending';
    const page = Number(params.page) || 1;

    let result;
    if (tab === 'pending') {
        result = await getPendingApprovals({ page });
    } else {
        result = await getProcessedApprovals({ page });
    }

    const tasks = (result.success ? result.data?.tasks ?? [] : []) as unknown as ApprovalTask[];
    const pagination = result.success ? result.data?.pagination : undefined;

    return (
        <div className="flex h-full flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
                <UrlSyncedTabs
                    paramName="tab"
                    defaultValue="pending"
                    layoutId="approval-tabs"
                    tabs={[
                        { value: 'pending', label: '待处理' },
                        { value: 'processed', label: '已处理' },
                    ]}
                />
            </div>

            <div className="flex-1 flex flex-col min-h-0 glass-liquid-ultra rounded-2xl border border-white/20 p-4 gap-4">
                <div className="flex-1 min-h-0 overflow-auto">
                    <Suspense fallback={<div>Loading...</div>}>
                        <ApprovalTaskList
                            tasks={tasks}
                            isPending={tab === 'pending'}
                            pagination={pagination}
                        />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
