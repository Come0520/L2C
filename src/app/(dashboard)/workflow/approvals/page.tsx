import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { approvalTasks } from '@/shared/api/schema';
import { eq, and, desc, ne } from 'drizzle-orm';
import { ApprovalTaskList } from '@/features/approval/components/approval-task-list';

export default async function ApprovalsPage() {
    const session = await auth();
    if (!session?.user?.id) return <div>Unauthorized</div>;

    const tenantId = session.user.tenantId;
    const userId = session.user.id;

    // Parallelize task fetching
    const [pendingTasks, processedTasks] = await Promise.all([
        db.query.approvalTasks.findMany({
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
        }),
        db.query.approvalTasks.findMany({
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
        })
    ]);

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">审批中心</h2>
                    <p className="text-muted-foreground">
                        处理待办审批任务及查看历史记录
                    </p>
                </div>
            </div>
            <div className="grid gap-8">
                <ApprovalTaskList
                    pendingTasks={pendingTasks as any}
                    processedTasks={processedTasks as any}
                />
            </div>
        </div>
    );
}
