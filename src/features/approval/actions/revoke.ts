'use server';

import { db } from "@/shared/api/db";
import { approvals, approvalTasks } from "@/shared/api/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/shared/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Revoke an approval instance
 * Allowed if:
 * 1. Initiator: Status is PENDING and created within 24 hours.
 * 2. Approver: Status is APPROVED, created within 30 mins, and next node is still PENDING.
 */
export async function revokeApprovalAction(approvalId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    return db.transaction(async (tx) => {
        const approval = await tx.query.approvals.findFirst({
            where: eq(approvals.id, approvalId),
        });

        if (!approval) return { success: false, error: 'Approval not found' };

        const now = new Date();
        const isInitiator = approval.requesterId === session.user.id;

        if (isInitiator) {
            // Rule: Initiator can revoke if PENDING and < 24h
            const hoursSinceCreation = (now.getTime() - approval.createdAt!.getTime()) / (1000 * 60 * 60);

            if (approval.status !== 'PENDING') {
                return { success: false, error: 'Cannot revoke: Approval is not pending' };
            }
            if (hoursSinceCreation > 24) {
                return { success: false, error: 'Cannot revoke: Created more than 24h ago' };
            }

            // Execute Revoke
            await tx.update(approvals)
                .set({ status: 'CANCELED', completedAt: now }) // Using CANCELED to match scheme
                .where(eq(approvals.id, approvalId));

            // Cancel all pending tasks
            await tx.update(approvalTasks)
                .set({ status: 'CANCELED' })
                .where(and(
                    eq(approvalTasks.approvalId, approvalId),
                    eq(approvalTasks.status, 'PENDING')
                ));

            revalidatePath('/approval');
            return { success: true, message: 'Approval revoked by initiator' };
        } else {
            // Check if user is an approver who recently approved
            // Find the task for this user
            const lastTask = await tx.query.approvalTasks.findFirst({
                where: and(
                    eq(approvalTasks.approvalId, approvalId),
                    eq(approvalTasks.approverId, session.user.id),
                    eq(approvalTasks.status, 'APPROVED')
                ),
                orderBy: [desc(approvalTasks.actionAt)]
            });

            if (!lastTask || !lastTask.actionAt) {
                return { success: false, error: 'You have not approved this request or it is not approved by you.' };
            }

            const minutesSinceAction = (now.getTime() - lastTask.actionAt.getTime()) / (1000 * 60);
            if (minutesSinceAction > 30) {
                return { success: false, error: 'Cannot revoke: Approved more than 30m ago' };
            }

            // Check if next node has acted (simplified: check if any subsequent task created or acted upon)
            // Ideally we check if current flow moved past this node. 
            // If strict: Check if any task with sortOrder > current node's sort order exists or is processed.
            // Simplified: If approval status is still PENDING and currentNodeId is essentially next.
            // Actually, if I revoke, I need to Rollback the flow.
            // Rolling back is complex. 
            // Implementation Plan said: "Revoke Rule... next node pending".

            // Let's check if there are any tasks created AFTER this task that are already processed.
            // If any subsequent task is processed, cannot revoke.
            // Ideally we just check if flow is still in the next stage and no one acted yet.

            // Verify current node of approval. If it moved, has anyone acted?
            // If currentNodeId changed, it means flow moved.

            // For now, simpler implementation: Only allow if approval is still PENDING (not completed) 
            // and no *subsequent* node tasks have been acted on.
            // Since we don't easily track "subsequent" without node sort order join, 
            // we can check if `approvals.status` is PENDING.

            if (approval.status !== 'PENDING') {
                return { success: false, error: '无法撤回：流程已结束或已驳回' };
            }

            // 1. 检查后续节点是否已经开始处理
            const subsequentTasks = await tx.query.approvalTasks.findMany({
                where: and(
                    eq(approvalTasks.approvalId, approvalId),
                    eq(approvalTasks.status, 'APPROVED') // 如果有任何任务已通过，说明流程已推进
                )
            });

            // 过滤掉自己的这次审批
            const othersActed = subsequentTasks.some(t => t.id !== lastTask.id);
            if (othersActed) {
                return { success: false, error: '无法撤回：后续节点已产生审批动作' };
            }

            // 2. 执行回滚逻辑
            // a. 将审批实例的当前节点设回本任务所在的节点
            await tx.update(approvals)
                .set({ currentNodeId: lastTask.nodeId })
                .where(eq(approvals.id, approvalId));

            // b. 将当前任务状态重置为 PENDING
            await tx.update(approvalTasks)
                .set({
                    status: 'PENDING',
                    actionAt: null,
                    comment: null,
                    approverId: lastTask.approverId // 保持原审批人
                })
                .where(eq(approvalTasks.id, lastTask.id));

            // c. 删除下一环节已经生成但尚未处理的任务 (PENDING)
            // 注意：排除当前被重置为 PENDING 的任务
            const allPendingTasks = await tx.query.approvalTasks.findMany({
                where: and(
                    eq(approvalTasks.approvalId, approvalId),
                    eq(approvalTasks.status, 'PENDING')
                )
            });

            for (const t of allPendingTasks) {
                if (t.id !== lastTask.id) {
                    await tx.delete(approvalTasks).where(eq(approvalTasks.id, t.id));
                }
            }

            revalidatePath('/approval');
            return { success: true, message: '审批已成功撤回' };
        }
    });
}
