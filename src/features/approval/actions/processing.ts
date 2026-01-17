'use server';

import { db } from "@/shared/api/db";
import {
    approvals,
    approvalTasks,
    approvalNodes,
    quotes
} from "@/shared/api/schema";
import { eq, and, asc, gt } from "drizzle-orm";
import { auth } from "@/shared/lib/auth";
import { revalidatePath } from "next/cache";

export async function processApproval(payload: {
    taskId: string;
    action: 'APPROVE' | 'REJECT';
    comment?: string;
}) {
    const session = await auth();
    if (!session?.user?.tenantId) return { success: false, error: 'Unauthorized' };

    return db.transaction(async (tx) => {
        // 1. Get Task
        const task = await tx.query.approvalTasks.findFirst({
            where: and(
                eq(approvalTasks.id, payload.taskId),
                eq(approvalTasks.tenantId, session.user.tenantId)
            ),
            with: {
                approval: true,
                node: true,
            }
        });

        if (!task || !task.approval || !task.node) {
            return { success: false, error: '审批任务不存在' };
        }

        if (task.status !== 'PENDING') {
            return { success: false, error: '任务已处理' };
        }

        // Verify Approver (if assigned)
        if (task.approverId && task.approverId !== session.user.id) {
            // return { success: false, error: '非当前用户审批任务' };
            // For testing ease, assume admin or override can approve? 
            // Let's enforce strictly for now.
            return { success: false, error: '无权处理此任务' };
        }

        // 2. Update Task
        await tx.update(approvalTasks)
            .set({
                status: payload.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
                comment: payload.comment,
                actionAt: new Date(),
                approverId: session.user.id, // Ensure actual actor is recorded (e.g. if pool picked)
            })
            .where(eq(approvalTasks.id, payload.taskId));

        // 3. Handle Logic
        if (payload.action === 'REJECT') {
            // Reject whole flow
            await tx.update(approvals)
                .set({
                    status: 'REJECTED',
                    completedAt: new Date(),
                })
                .where(eq(approvals.id, task.approvalId));

            // Business Callback
            if (task.approval.entityType === 'QUOTE') {
                await tx.update(quotes)
                    .set({ status: 'REJECTED' }) // Or back to DRAFT?
                    .where(eq(quotes.id, task.approval.entityId));
            }

        } else {
            // APPROVE - Find Next Node
            const currentSort = task.node.sortOrder || 0;
            const nextNode = await tx.query.approvalNodes.findFirst({
                where: and(
                    eq(approvalNodes.flowId, task.node.flowId),
                    gt(approvalNodes.sortOrder, currentSort)
                ),
                orderBy: [asc(approvalNodes.sortOrder)]
            });

            if (nextNode) {
                // Create Next Task
                await tx.update(approvals)
                    .set({ currentNodeId: nextNode.id })
                    .where(eq(approvals.id, task.approvalId));

                await tx.insert(approvalTasks).values({
                    tenantId: session.user.tenantId,
                    approvalId: task.approvalId,
                    nodeId: nextNode.id,
                    approverId: nextNode.approverUserId, // or assign logic
                    status: 'PENDING',
                });
            } else {
                // Flow Complete
                await tx.update(approvals)
                    .set({
                        status: 'APPROVED',
                        currentNodeId: null,
                        completedAt: new Date(),
                    })
                    .where(eq(approvals.id, task.approvalId));

                // Business Callback
                if (task.approval.entityType === 'QUOTE') {
                    await tx.update(quotes)
                        .set({ status: 'APPROVED' })
                        .where(eq(quotes.id, task.approval.entityId));
                }
            }
        }

        revalidatePath('/approval');
        return { success: true, message: '处理成功' };
    });
}
