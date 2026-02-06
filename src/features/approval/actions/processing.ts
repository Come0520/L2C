'use server';

import { db } from "@/shared/api/db";
import {
    approvals,
    approvalTasks,
    approvalNodes,
    quotes,
    orders,
    paymentBills,
    receiptBills,
    measureTasks
} from "@/shared/api/schema";
import { users } from "@/shared/api/schema/infrastructure";
import { eq, and, asc, gt } from "drizzle-orm";
import { auth } from "@/shared/lib/auth";
import { revalidatePath } from "next/cache";
import { ApprovalDelegationService } from "@/services/approval-delegation.service";
import { Session } from "next-auth";

/**
 * 审批处理逻辑核心 (支持事务内递归调用)
 */
async function _processApprovalLogic(
    tx: any,
    payload: {
        taskId: string;
        action: 'APPROVE' | 'REJECT';
        comment?: string;
    },
    session: Session
) {
    // 1. Get Task
    const task = await tx.query.approvalTasks.findFirst({
        where: and(
            eq(approvalTasks.id, payload.taskId),
            eq(approvalTasks.tenantId, session.user.tenantId)
        ),
        with: {
            approval: {
                with: {
                    flow: true
                }
            },
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
    // For auto-approve recursion, the session.user might be the previous approver. 
    // If task is assigned to specific user, we strictly check.
    // However, for Auto-Approve, we are creating it as APPROVED directly? 
    // No, we created as APPROVED in the previous step's logic, so we shouldn't be calling process('APPROVE') on it again?
    // Wait, my auto-approve logic was:
    // 1. Insert task as APPROVED.
    // 2. Need to TRIGGER next node finding.

    // IF I insert as APPROVED, `_processApprovalLogic` will fail at `if (task.status !== 'PENDING')`.
    // SO: access logic for "Next Node" is inside the `else` block of `processApproval` (Lines 120+).
    // Specifically `if (proceedToNextNode) ...`

    // REFACTOR STRATEGY ADJUSTMENT:
    // `_processApprovalLogic` handles "I am approving THIS task".
    // It updates status -> checks parallel logic -> finds next node -> creates next tasks.

    // If I want auto-approval:
    // I should Insert the *Next* task as PENDING first?
    // And then calling `_processApprovalLogic` on it?
    // YES.
    // So:
    // 1. `isNextApproverSelf` check.
    // 2. Insert new task as PENDING (standard flow).
    // 3. Immediately call `_processApprovalLogic(tx, { taskId: newTask.id, action: 'APPROVE', comment: 'Auto...' }, session)`.

    // BUT: `_processApprovalLogic` checks `task.approverId === session.user.id`.
    // If I insert it with `approverId = session.user.id` (which I do), this check passes.
    // So this works perfectly.

    // Continuing logic...

    if (task.approverId && task.approverId !== session.user.id) {
        return { success: false, error: '无权处理此任务' };
    }

    // 2. Update Task
    await tx.update(approvalTasks)
        .set({
            status: payload.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            comment: payload.comment,
            actionAt: new Date(),
            approverId: session.user.id,
        })
        .where(eq(approvalTasks.id, payload.taskId));

    // 3. Handle Logic
    if (payload.action === 'REJECT') {
        let shouldRejectWholeFlow = true;

        if (task.node.approverMode === 'MAJORITY') {
            const siblingTasks = await tx.query.approvalTasks.findMany({
                where: and(
                    eq(approvalTasks.approvalId, task.approvalId),
                    eq(approvalTasks.nodeId, task.nodeId!)
                )
            });
            const total = siblingTasks.length;
            const rejected = siblingTasks.filter((t: any) => t.status === 'REJECTED').length;

            if (rejected <= total / 2) {
                shouldRejectWholeFlow = false; // Not enough rejects yet
            }
        }

        if (shouldRejectWholeFlow) {
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
                    .set({ status: 'REJECTED' })
                    .where(eq(quotes.id, task.approval.entityId));
            } else if (task.approval.entityType === 'PAYMENT_BILL') {
                await tx.update(paymentBills)
                    .set({ status: 'REJECTED' })
                    .where(eq(paymentBills.id, task.approval.entityId));
            } else if (task.approval.entityType === 'RECEIPT_BILL') {
                await tx.update(receiptBills)
                    .set({ status: 'REJECTED' })
                    .where(eq(receiptBills.id, task.approval.entityId));
            } else if (task.approval.entityType === 'MEASURE_TASK') {
                await tx.update(measureTasks)
                    .set({ status: 'CANCELLED' })
                    .where(eq(measureTasks.id, task.approval.entityId));
            }
        }

    } else {
        // APPROVE - Check Parallel Logic

        // Check if we need to wait for others (ALL mode)
        let proceedToNextNode = true;

        if (task.node.approverMode === 'ALL') {
            if (!task.nodeId) throw new Error('Task Node ID is missing');
            const pendingTasks = await tx.query.approvalTasks.findMany({
                where: and(
                    eq(approvalTasks.approvalId, task.approvalId),
                    eq(approvalTasks.nodeId, task.nodeId),
                    eq(approvalTasks.status, 'PENDING')
                )
            });

            if (pendingTasks.length > 0) {
                proceedToNextNode = false; // Wait for others
            }
        } else if (task.node.approverMode === 'ANY') {
            if (!task.nodeId) throw new Error('Task Node ID is missing');
            // ANY mode: First approval passes the node.
            await tx.update(approvalTasks)
                .set({ status: 'CANCELED', comment: 'Auto-canceled by parallel approval' })
                .where(and(
                    eq(approvalTasks.approvalId, task.approvalId),
                    eq(approvalTasks.nodeId, task.nodeId),
                    eq(approvalTasks.status, 'PENDING')
                ));
        } else if (task.node.approverMode === 'MAJORITY') {
            if (!task.nodeId) throw new Error('Task Node ID is missing');
            const siblingTasks = await tx.query.approvalTasks.findMany({
                where: and(
                    eq(approvalTasks.approvalId, task.approvalId),
                    eq(approvalTasks.nodeId, task.nodeId)
                )
            });
            const total = siblingTasks.length;
            const approved = siblingTasks.filter((t: any) => t.status === 'APPROVED').length;

            if (approved <= total / 2) {
                proceedToNextNode = false; // Needs more than half
            } else {
                // Auto-cancel remaining pending tasks for this node
                await tx.update(approvalTasks)
                    .set({ status: 'CANCELED', comment: 'Pass by majority' })
                    .where(and(
                        eq(approvalTasks.approvalId, task.approvalId),
                        eq(approvalTasks.nodeId, task.nodeId),
                        eq(approvalTasks.status, 'PENDING')
                    ));
            }
        }

        if (proceedToNextNode) {
            // Find Next Node
            const currentSort = task.node.sortOrder || 0;
            const nextNode = await tx.query.approvalNodes.findFirst({
                where: and(
                    eq(approvalNodes.flowId, task.node.flowId),
                    gt(approvalNodes.sortOrder, currentSort)
                ),
                orderBy: [asc(approvalNodes.sortOrder)]
            });

            if (nextNode) {
                // Create Next Task(s)
                await tx.update(approvals)
                    .set({ currentNodeId: nextNode.id })
                    .where(eq(approvals.id, task.approvalId));

                // Determine Approvers for Next Node
                let nextApprovers: string[] = [];
                if (nextNode.approverUserId) {
                    nextApprovers.push(nextNode.approverUserId);
                } else if (nextNode.approverRole) {
                    const allTenantUsers = await tx.query.users.findMany({
                        where: and(
                            eq(users.tenantId, session.user.tenantId),
                            eq(users.isActive, true)
                        )
                    });

                    const qualifiedUsers = allTenantUsers.filter((u: any) => {
                        const userRoles = (u.roles as string[]) || [u.role];
                        return userRoles.includes(nextNode.approverRole!);
                    });

                    nextApprovers = qualifiedUsers.map((u: any) => u.id);
                }

                // Check Auto-Approval Condition:
                // If there is EXACTLY ONE approver, and it is the current user.
                const isNextApproverSelf = nextApprovers.length === 1 && nextApprovers[0] === session.user.id;

                for (const approver of nextApprovers) {
                    // Check Delegation (Skip if self-approving? No, still check normally, 
                    // but if delegating to self it's same. If delegating to other, isNextApproverSelf check above might be slightly off if we don't resolve delegation BEFORE check.
                    // IMPORTANT: We should resolve delegation BEFORE checking 'isNextApproverSelf'.
                    // Because if I delegate to someone else, I shouldn't auto-approve.

                    const finalApprover = await ApprovalDelegationService.getEffectiveApprover(
                        approver,
                        task.node.flowId
                    );

                    // Insert as PENDING first
                    const [newTask] = await tx.insert(approvalTasks).values({
                        tenantId: session.user.tenantId,
                        approvalId: task.approvalId,
                        nodeId: nextNode.id,
                        approverId: finalApprover,
                        status: 'PENDING',
                    }).returning();

                    // If it was me (and no delegation changed that), Auto Approve
                    if (isNextApproverSelf && finalApprover === session.user.id) {
                        console.log(`[Auto-Approval] Node ${nextNode.name} automatically approved by ${session.user.id}`);
                        // Recursive Call
                        await _processApprovalLogic(tx, {
                            taskId: newTask.id,
                            action: 'APPROVE',
                            comment: '自动通过：审批人与上一节点/发起人相同'
                        }, session);
                    } else {
                        // Notify standard new task
                        const { ApprovalNotificationService } = await import("../services/approval-notification.service");
                        ApprovalNotificationService.notifyNewTask(newTask.id).catch(console.error);
                    }
                }

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
                } else if (task.approval.entityType === 'RECEIPT_BILL') {
                    await tx.update(receiptBills)
                        .set({ status: 'APPROVED' })
                        .where(eq(receiptBills.id, task.approval.entityId));

                    const ReceiptService = (await import("@/services/receipt.service")).ReceiptService;
                    await ReceiptService.onApproved(
                        task.approval.entityId,
                        session.user.tenantId,
                        session.user.id!
                    );
                } else if (task.approval.entityType === 'MEASURE_TASK') {
                    await tx.update(measureTasks)
                        .set({ status: 'PENDING' })
                        .where(eq(measureTasks.id, task.approval.entityId));
                } else if (task.approval.entityType === 'ORDER') {
                    const flowCode = (task.approval as any).flow?.code;
                    if (flowCode === 'ORDER_CANCELLATION_APPROVAL') {
                        await tx.update(orders)
                            .set({
                                status: 'CANCELLED',
                                isLocked: true,
                                updatedAt: new Date()
                            })
                            .where(eq(orders.id, task.approval.entityId));
                    }
                } else if (task.approval.entityType === 'LEAD_RESTORE') {
                    const { leads, leadStatusHistory } = await import('@/shared/api/schema');
                    const { desc } = await import('drizzle-orm');

                    const lastHistory = await tx.query.leadStatusHistory.findFirst({
                        where: and(
                            eq(leadStatusHistory.leadId, task.approval.entityId),
                            eq(leadStatusHistory.newStatus, 'VOID')
                        ),
                        orderBy: desc(leadStatusHistory.changedAt)
                    });

                    const targetStatus = lastHistory?.oldStatus || 'PENDING_ASSIGNMENT';

                    await tx.update(leads)
                        .set({
                            status: targetStatus as any,
                            lostReason: null
                        })
                        .where(eq(leads.id, task.approval.entityId));

                    await tx.insert(leadStatusHistory).values({
                        tenantId: session.user.tenantId,
                        leadId: task.approval.entityId,
                        oldStatus: 'VOID',
                        newStatus: targetStatus,
                        changedBy: 'SYSTEM',
                        reason: '审批通过，自动恢复'
                    });
                }
            }
        } else {
            return { success: true, message: '已批准，等待其他人审批' };
        }
    }

    // 4. Notifications (Only if NOT auto-approved/recursing)
    // Actually, if we are in recursion, we still want to notify the RESULT if it completed the flow.
    // The inner recursive call handles its own notifications.
    // BUT: If I am the top level call, I processed "Approve A". "A" triggers "Auto Approve B". "B" triggers "Complete Flow".
    // Does A need to notify anything?
    // "Approve A" -> "B Created" (No notification needed if B is auto-approved instantly? Or notify "B approved"?)
    // Notification Service usually sends "Approval Result" when flow is Done.
    // My logic above calls notifyResult when flow status updates.

    // In recursive `_processApprovalLogic`:
    // It checks `if (task.approval.status === 'APPROVED')` (via DB query).
    // Should be consistent.

    const { ApprovalNotificationService } = await import("../services/approval-notification.service");
    // Ensure we see latest state
    // We are in transaction. `tx.query` sees updates.
    if (payload.action === 'REJECT') {
        const finalApproval = await tx.query.approvals.findFirst({ where: eq(approvals.id, task.approvalId) });
        if (finalApproval?.status === 'REJECTED') {
            ApprovalNotificationService.notifyResult(task.approvalId).catch(console.error);
        }
    } else if (payload.action === 'APPROVE') {
        const finalApproval = await tx.query.approvals.findFirst({ where: eq(approvals.id, task.approvalId) });
        if (finalApproval?.status === 'APPROVED') {
            ApprovalNotificationService.notifyResult(task.approvalId).catch(console.error);
        } else {
            // If flow not done, we normally notify next tasks.
            // But if we auto-approved next tasks, this block in the recursive call will handle it?
            // NO.
            // In the recursive call (for B), `finalApproval` might be APPROVED. So B notifies result.
            // Here (for A), `finalApproval` is still PENDING.
            // "Not finished yet, notify next approvers".
            // We inserted next task B.
            // If B was auto-approved, it's status is APPROVED.
            // We shouldn't notify B.

            // So: Find PENDING tasks only to notify.
            const nextTasks = await tx.query.approvalTasks.findMany({
                where: and(
                    eq(approvalTasks.approvalId, task.approvalId),
                    eq(approvalTasks.status, 'PENDING')
                )
            });
            for (const nt of nextTasks) {
                // Only notify if not effectively handled? 
                // Duplicate notifications?
                // If I just created B (PENDING) and then recursively approved it.
                // B is now APPROVED.
                // So `nextTasks` query won't find B.
                // So correct: No notification for B.
                ApprovalNotificationService.notifyNewTask(nt.id).catch(console.error);
            }
        }
    }

    return { success: true, message: '处理成功' };
}

export async function processApproval(payload: {
    taskId: string;
    action: 'APPROVE' | 'REJECT';
    comment?: string;
}) {
    const session = await auth();
    if (!session?.user?.tenantId) return { success: false, error: 'Unauthorized' };

    return db.transaction(async (tx) => {
        return _processApprovalLogic(tx, payload, session);
    });
}

/**
 * 加签 (Add Approver)
 * 允许当前审批人动态增加协作审批人员
 */
export async function addApprover(payload: {
    taskId: string;
    targetUserId: string;
    comment?: string;
}) {
    return await db.transaction(async (tx) => {
        // 1. 获取当前任务
        const task = await tx.query.approvalTasks.findFirst({
            where: eq(approvalTasks.id, payload.taskId),
            with: {
                approval: true
            }
        });

        if (!task || task.status !== 'PENDING') {
            return { success: false, error: '任务无效或已处理' };
        }

        // 2. 创建新任务 (加签任务)
        // 使用相同的 approvalId 和 nodeId，标记为 isDynamic
        const [newTask] = await tx.insert(approvalTasks).values({
            tenantId: task.tenantId,
            approvalId: task.approvalId,
            nodeId: task.nodeId,
            approverId: payload.targetUserId,
            status: 'PENDING',
            isDynamic: true,
            parentTaskId: task.id,
            comment: payload.comment ? `[来自加签] ${payload.comment}` : '[加签申请]'
        }).returning();

        // 3. 通知新审批人
        const { ApprovalNotificationService } = await import("../services/approval-notification.service");
        ApprovalNotificationService.notifyNewTask(newTask.id).catch(console.error);

        revalidatePath('/approval');
        return { success: true, message: '加签成功' };
    });
}
