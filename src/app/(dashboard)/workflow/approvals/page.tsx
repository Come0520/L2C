import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { approvalTasks } from '@/shared/api/schema';
import { eq, and, desc, ne } from 'drizzle-orm';
import { ApprovalTaskList } from '@/features/approval/components/approval-task-list';
import { UrlSyncedTabs } from '@/components/ui/url-synced-tabs';
import { Suspense } from 'react';

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const session = await auth();
    if (!session?.user?.id) return <div>Unauthorized</div>;

    const tenantId = session.user.tenantId;
    const userId = session.user.id;
    const params = await searchParams;
    const tab = params.tab || 'pending';

    let tasks = [];

    if (tab === 'pending') {
        tasks = await db.query.approvalTasks.findMany({
            where: and(
                eq(approvalTasks.tenantId, tenantId),
                eq(approvalTasks.approverId, userId),
                eq(approvalTasks.status, 'PENDING')
            ),
            with: {
                approval: {
                    with: {
                        flow: true,
                        requester: true
                    }
                },
                node: true
            },
            orderBy: [desc(approvalTasks.createdAt)]
        });
    } else {
        tasks = await db.query.approvalTasks.findMany({
            where: and(
                eq(approvalTasks.tenantId, tenantId),
                eq(approvalTasks.approverId, userId),
                ne(approvalTasks.status, 'PENDING')
            ),
            with: {
                approval: {
                    with: {
                        flow: true,
                        requester: true
                    }
                },
                node: true
            },
            orderBy: [desc(approvalTasks.actionAt)],
            limit: 50
        });
    }

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
                        />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}
