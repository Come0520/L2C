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
            let shouldRejectWholeFlow = true;

            if (task.node.approverMode === 'MAJORITY') {
                const siblingTasks = await tx.query.approvalTasks.findMany({
                    where: and(
                        eq(approvalTasks.approvalId, task.approvalId),
                        eq(approvalTasks.nodeId, task.nodeId!)
                    )
                });
                const total = siblingTasks.length;
                const rejected = siblingTasks.filter(t => t.status === 'REJECTED').length;

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
                        // We just updated current task, so it won't be PENDING
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
                const approved = siblingTasks.filter(t => t.status === 'APPROVED').length;

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

                    // Determine Approvers for Next Node (Similar logic to submission)
                    let nextApprovers: string[] = [];
                    if (nextNode.approverUserId) {
                        nextApprovers.push(nextNode.approverUserId);
                    } else if (nextNode.approverRole) {
                        const roleUsers = await tx.query.users.findMany({
                            where: and(
                                eq(users.tenantId, session.user.tenantId),
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                eq(users.role, nextNode.approverRole as any)
                            )
                        });
                        nextApprovers = roleUsers.map(u => u.id);
                    }

                    // If no approvers found? Use Admin fallback or just hang?
                    // For safety if logic fails, default to Admin or error log? 
                    // Let's assume configuration is valid for now.

                    for (const approver of nextApprovers) {
                        // Check Delegation
                        const finalApprover = await ApprovalDelegationService.getEffectiveApprover(
                            approver,
                            task.node.flowId
                        );

                        await tx.insert(approvalTasks).values({
                            tenantId: session.user.tenantId,
                            approvalId: task.approvalId,
                            nodeId: nextNode.id,
                            approverId: finalApprover,
                            status: 'PENDING',
                        });
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
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            .set({ status: 'APPROVED' as any })
                            .where(eq(quotes.id, task.approval.entityId));
                    } else if (task.approval.entityType === 'RECEIPT_BILL') {
                        // Workflow approved -> Mark as APPROVED
                        await tx.update(receiptBills)
                            .set({ status: 'APPROVED' })
                            .where(eq(receiptBills.id, task.approval.entityId));

                        // Execute business logic (Accounts, AR)
                        // Requirement: Usually done after the final approval step.
                        const ReceiptService = (await import("@/services/receipt.service")).ReceiptService;
                        await ReceiptService.onApproved(
                            task.approval.entityId,
                            session.user.tenantId,
                            session.user.id!
                        );
                    } else if (task.approval.entityType === 'MEASURE_TASK') {
                        // Workflow approved -> Mark as PENDING (Ready for dispatch)
                        await tx.update(measureTasks)
                            .set({ status: 'PENDING' })
                            .where(eq(measureTasks.id, task.approval.entityId));
                    } else if (task.approval.entityType === 'ORDER') {
                        // Handle Order cancellation or other order-level approvals
                        const flowCode = (task.approval as { flow?: { code: string } }).flow?.code;
                        if (flowCode === 'ORDER_CANCELLATION_APPROVAL') {
                            await tx.update(orders)
                                .set({
                                    status: 'CANCELLED',
                                    isLocked: true, // Keep locked
                                    updatedAt: new Date()
                                })
                                .where(eq(orders.id, task.approval.entityId));
                        }
                    } else if (task.approval.entityType === 'LEAD_RESTORE') {
                        // Workflow approved -> Restore Lead
                        const { leads, leadStatusHistory } = await import('@/shared/api/schema');
                        const { desc } = await import('drizzle-orm');

                        // Find last status
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
                            changedBy: 'SYSTEM', // Approval System
                            reason: '审批通过，自动恢复'
                        });
                    }
                }
            } else {
                return { success: true, message: '已批准，等待其他人审批' };
            }
        }

        // 4. Notifications
        const { ApprovalNotificationService } = await import("../services/approval-notification.service");
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
                // Not finished yet, notify next approvers
                const nextTasks = await tx.query.approvalTasks.findMany({
                    where: and(
                        eq(approvalTasks.approvalId, task.approvalId),
                        eq(approvalTasks.status, 'PENDING')
                    )
                });
                for (const nt of nextTasks) {
                    ApprovalNotificationService.notifyNewTask(nt.id).catch(console.error);
                }
            }
        }

        revalidatePath('/approval');
        return { success: true, message: '处理成功' };
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
