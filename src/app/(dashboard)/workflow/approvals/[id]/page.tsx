import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { approvalTasks, approvalNodes } from '@/shared/api/schema';
import { eq, and, asc } from 'drizzle-orm';
import { ApprovalTaskDetails } from '@/features/approval/components/approval-task-details';
import { notFound } from 'next/navigation';

export default async function ApprovalTaskPage({ params }: { params: Promise<{ id: string }> }) {
    const [session, { id }] = await Promise.all([
        auth(),
        params
    ]);

    if (!session?.user?.id) return <div>Unauthorized</div>;

    const task = await db.query.approvalTasks.findFirst({
        where: and(
            eq(approvalTasks.id, id),
            eq(approvalTasks.tenantId, session.user.tenantId)
        ),
        with: {
            approval: {
                with: {
                    flow: true,
                    requester: true,
                    tasks: {
                        with: {
                            approver: true
                        },
                        orderBy: [asc(approvalTasks.createdAt)]
                    }
                }
            },
            node: true
        }
    });

    if (!task || !task.approval || !task.approval.flow || !task.node) return notFound();

    // Fetch all nodes for the flow to show progress
    const flowNodes = await db.query.approvalNodes.findMany({
        where: eq(approvalNodes.flowId, task.approval.flowId!),
        orderBy: [asc(approvalNodes.sortOrder)]
    });

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{task.approval.flow.name}</h2>
                    <p className="text-muted-foreground">
                        环节: {task.node.name} | 申请人: {task.approval.requester?.name}
                    </p>
                </div>
            </div>

            <ApprovalTaskDetails
                task={task as any}
                flowNodes={flowNodes}
            />
        </div>
    );
}
