'use server';

import { db } from "@/shared/api/db";
import {
    approvals,
    approvalNodes,
    approvalTasks,
    users
} from "@/shared/api/schema";
import { eq, and, asc, gt, sql } from "drizzle-orm";
import { auth } from "@/shared/lib/auth";
import { revalidatePath } from "next/cache";
import { ApprovalDelegationService } from "@/services/approval-delegation.service";
import { Session } from "next-auth";
import { type SystemSession } from "../schema";

/**
 * 审批处理逻辑核心 (支持事务内递归调用)
 */
import { Transaction } from "@/shared/api/db";
import { revertEntityStatus, completeEntityStatus, findApproversByRole } from "./utils";
import { logger } from "@/shared/lib/logger";
import { SYSTEM_USER_ID } from "../constants";
import { AuditService } from "@/shared/services/audit-service";

const MAX_AUTO_APPROVE_DEPTH = 10;

interface PendingNotification {
    type: 'newTask' | 'result';
    id: string;
}

/**
 * 审批处理逻辑核心 (支持事务内递归调用)
 */
export async function _processApprovalLogic(
    tx: Transaction,
    payload: {
        taskId: string;
        action: 'APPROVE' | 'REJECT';
        comment?: string;
    },
    session: Session | SystemSession,
    depth: number = 0
): Promise<{ success: boolean; message?: string; error?: string; pendingNotifications?: PendingNotification[] }> {
    const notifications: PendingNotification[] = [];
    if (depth > MAX_AUTO_APPROVE_DEPTH) {
        logger.warn(`[Approval] 自动审批递归超过 ${MAX_AUTO_APPROVE_DEPTH} 层，中断`);
        return { success: true, message: '已达自动审批上限，需人工处理后续节点', pendingNotifications: [] };
    }

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

    // 锁定审批主记录以顺序化同一审批实例下的并行操作
    await tx.execute(sql`SELECT id FROM approvals WHERE id = ${task.approvalId} FOR UPDATE`);

    // 重新获取任务最新状态（防止在等待锁的过程中该任务被其他并行请求取消或完成）
    const currentTask = await tx.query.approvalTasks.findFirst({
        where: eq(approvalTasks.id, payload.taskId)
    });

    if (!currentTask || currentTask.status !== 'PENDING') {
        return { success: false, error: '任务已被并行处理或状态已变更' };
    }

    // Verify Approver
    const isSystemCall = session.user.id === SYSTEM_USER_ID;
    if (!isSystemCall) {
        if (task.approverId && task.approverId !== session.user.id) {
            return { success: false, error: '无权处理此任务' };
        }
    }

    // 2. Update Task
    await tx.update(approvalTasks)
        .set({
            status: payload.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            comment: payload.comment,
            actionAt: new Date(),
            // Only set approverId if not a system action (preserve original if it's a re-run/system check)
            ...(!isSystemCall ? { approverId: session.user.id } : {}),
        })
        .where(eq(approvalTasks.id, payload.taskId));

    await AuditService.log(tx, {
        tableName: 'approval_tasks',
        recordId: task.id,
        action: payload.action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        userId: !isSystemCall ? session.user.id : undefined,
        tenantId: session.user.tenantId,
        details: { comment: payload.comment }
    });

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
            const rejectedCount = siblingTasks.filter(t => t.status === 'REJECTED').length;

            if (rejectedCount < Math.ceil(total / 2)) {
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

            await AuditService.log(tx, {
                tableName: 'approvals',
                recordId: task.approvalId,
                action: 'FLOW_REJECTED',
                userId: !isSystemCall ? session.user.id : undefined,
                tenantId: session.user.tenantId,
                details: { taskId: task.id, comment: payload.comment }
            });

            // Business Callback (Unified)
            await revertEntityStatus(tx, task.approval.entityType, task.approval.entityId, task.tenantId, 'REJECTED');
        }

    } else {
        // APPROVE - Check Parallel Logic
        let proceedToNextNode = true;

        if (task.node.approverMode === 'ALL') {
            const pendingTasks = await tx.query.approvalTasks.findMany({
                where: and(
                    eq(approvalTasks.approvalId, task.approvalId),
                    eq(approvalTasks.nodeId, task.nodeId!),
                    eq(approvalTasks.status, 'PENDING')
                )
            });

            if (pendingTasks.length > 0) {
                proceedToNextNode = false; // Wait for others
            }
        } else if (task.node.approverMode === 'ANY') {
            // ANY mode: First approval passes the node.
            await tx.update(approvalTasks)
                .set({ status: 'CANCELED', comment: 'Auto-canceled by parallel approval' })
                .where(and(
                    eq(approvalTasks.approvalId, task.approvalId),
                    eq(approvalTasks.nodeId, task.nodeId!),
                    eq(approvalTasks.status, 'PENDING')
                ));
        } else if (task.node.approverMode === 'MAJORITY') {
            const siblingTasks = await tx.query.approvalTasks.findMany({
                where: and(
                    eq(approvalTasks.approvalId, task.approvalId),
                    eq(approvalTasks.nodeId, task.nodeId!)
                )
            });
            const total = siblingTasks.length;
            const approvedCount = siblingTasks.filter(t => t.status === 'APPROVED').length;

            if (approvedCount < Math.ceil(total / 2)) {
                proceedToNextNode = false;
            } else {
                // Auto-cancel remaining pending tasks for this node
                await tx.update(approvalTasks)
                    .set({ status: 'CANCELED', comment: 'Pass by majority' })
                    .where(and(
                        eq(approvalTasks.approvalId, task.approvalId),
                        eq(approvalTasks.nodeId, task.nodeId!),
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
                    nextApprovers = findApproversByRole(allTenantUsers, nextNode.approverRole!);
                }

                // Check Auto-Approval Condition:
                // If there is EXACTLY ONE approver, and it is the current user.
                const isNextApproverSelf = nextApprovers.length === 1 && nextApprovers[0] === session.user.id;

                for (const approver of nextApprovers) {
                    const finalApprover = await ApprovalDelegationService.getEffectiveApprover(
                        approver,
                        task.node.flowId,
                        task.tenantId
                    );

                    // Insert as PENDING first
                    const [newTask] = await tx.insert(approvalTasks).values({
                        tenantId: session.user.tenantId,
                        approvalId: task.approvalId,
                        nodeId: nextNode.id,
                        approverId: finalApprover,
                        status: 'PENDING',
                    }).returning();

                    // If it was me, Auto Approve
                    if (isNextApproverSelf && finalApprover === session.user.id) {
                        logger.info(`[Auto-Approval] Node ${nextNode.name} automatically approved by ${session.user.id}`);
                        const subResult = await _processApprovalLogic(tx, {
                            taskId: newTask.id,
                            action: 'APPROVE',
                            comment: '自动通过：审批人与上一节点/发起人相同'
                        }, session, depth + 1);
                        if (subResult.pendingNotifications) {
                            notifications.push(...subResult.pendingNotifications);
                        }
                    } else {
                        // 收集待发送通知
                        notifications.push({ type: 'newTask', id: newTask.id });
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

                await AuditService.log(tx, {
                    tableName: 'approvals',
                    recordId: task.approvalId,
                    action: 'FLOW_APPROVED',
                    userId: !isSystemCall ? session.user.id : undefined,
                    tenantId: session.user.tenantId,
                    details: { taskId: task.id }
                });

                // Business Callback
                await completeEntityStatus(tx, task.approval.entityType, task.approval.entityId, task.tenantId);
            }
        } else {
            return { success: true, message: '已批准，等待其他人审批', pendingNotifications: notifications };
        }
    }

    // 4. Notifications for Result
    if (payload.action === 'REJECT') {
        const finalApproval = await tx.query.approvals.findFirst({ where: eq(approvals.id, task.approvalId) });
        if (finalApproval?.status === 'REJECTED') {
            notifications.push({ type: 'result', id: task.approvalId });
        }
    } else if (payload.action === 'APPROVE') {
        const finalApproval = await tx.query.approvals.findFirst({ where: eq(approvals.id, task.approvalId) });
        if (finalApproval?.status === 'APPROVED') {
            notifications.push({ type: 'result', id: task.approvalId });
        }
    }

    return { success: true, message: '处理成功', pendingNotifications: notifications };
}

/**
 * 处理审批任务（通过或驳回）
 *
 * @param payload - 处理参数
 * @param payload.taskId - 审批任务 ID
 * @param payload.action - 操作：'APPROVE' 或 'REJECT'
 * @param payload.comment - 审批备注
 * @returns 处理结果
 */
export async function processApproval(payload: {
    taskId: string;
    action: 'APPROVE' | 'REJECT';
    comment?: string;
}) {
    const session = await auth();
    if (!session?.user?.tenantId) return { success: false, error: 'Unauthorized' };

    return db.transaction(async (tx) => {
        const result = await _processApprovalLogic(tx, payload, session);
        if (result.success) {
            // 事务提交成功后，再实际发起异步通知
            if (result.pendingNotifications?.length) {
                import("../services/approval-notification.service").then(({ ApprovalNotificationService }) => {
                    result.pendingNotifications?.forEach(notif => {
                        if (notif.type === 'newTask') {
                            ApprovalNotificationService.notifyNewTask(notif.id).catch(err => {
                                logger.error(`[Approval-Notify] Failed send newTask for ${notif.id}`, err);
                            });
                        } else {
                            ApprovalNotificationService.notifyResult(notif.id).catch(err => {
                                logger.error(`[Approval-Notify] Failed send result for ${notif.id}`, err);
                            });
                        }
                    });
                });
            }
            revalidatePath('/approval');
        }
        return result;
    });
}

/**
 * 加签 (Add Approver)
 */
/**
 * 为指定任务添加额外审批人（动态加签）
 *
 * @param payload - 加签参数
 * @param payload.taskId - 当前任务 ID
 * @param payload.targetUserId - 被加签用户 ID
 * @param payload.comment - 加签备注
 * @returns 操作结果
 */
export async function addApprover(payload: {
    taskId: string;
    targetUserId: string;
    comment?: string;
}) {
    const session = await auth();
    if (!session?.user?.id || !session.user.tenantId) return { success: false, error: 'Unauthorized' };

    return await db.transaction(async (tx) => {
        const task = await tx.query.approvalTasks.findFirst({
            where: and(
                eq(approvalTasks.id, payload.taskId),
                eq(approvalTasks.tenantId, session.user.tenantId)
            ),
            with: {
                approval: true
            }
        });

        if (!task || task.status !== 'PENDING') {
            return { success: false, error: '任务无效或已处理' };
        }

        if (task.approverId !== session.user.id) {
            return { success: false, error: '仅当前审批人可加签' };
        }

        const targetUser = await tx.query.users.findFirst({
            where: and(
                eq(users.id, payload.targetUserId),
                eq(users.tenantId, session.user.tenantId),
                eq(users.isActive, true)
            )
        });
        if (!targetUser) {
            return { success: false, error: '目标审批人不存在或不可用' };
        }

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

        await AuditService.log(tx, {
            tableName: 'approval_tasks',
            recordId: task.id,
            action: 'ADD_APPROVER',
            userId: session.user.id,
            tenantId: session.user.tenantId,
            details: { targetUserId: payload.targetUserId, comment: payload.comment, newTaskCreated: newTask.id }
        });

        // 加签通知 (事务后)
        import("../services/approval-notification.service").then(({ ApprovalNotificationService }) => {
            ApprovalNotificationService.notifyNewTask(newTask.id).catch(err => {
                logger.error('[Approval] Failed to notify new task (dynamic)', err);
            });
        });

        revalidatePath('/approval');
        return { success: true, message: '加签成功' };
    });
}
