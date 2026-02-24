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
import { DbTransaction } from "@/shared/api/db";
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
    tx: DbTransaction,
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
        logger.error(`[Approval] Task not found or invalid: ${payload.taskId}, tenant: ${session.user.tenantId}`);
        return { success: false, error: '审批任务不存在' };
    }

    // 锁定审批主记录以顺序化同一审批实例下的并行操作
    await tx.execute(sql`SELECT id FROM approvals WHERE id = ${task.approvalId} FOR UPDATE`);

    // 重新获取任务最新状态（防止在等待锁的过程中该任务被其他并行请求取消或完成）
    const currentTask = await tx.query.approvalTasks.findFirst({
        where: eq(approvalTasks.id, payload.taskId)
    });

    if (!currentTask || currentTask.status !== 'PENDING') {
        logger.warn(`[Approval] Task ${payload.taskId} already processed or canceled. Current status: ${currentTask?.status}`);
        return { success: false, error: '任务已被并行处理或状态已变更' };
    }

    // Verify Approver
    const isSystemCall = session.user.id === SYSTEM_USER_ID;
    if (!isSystemCall) {
        if (task.approverId && task.approverId !== session.user.id) {
            logger.warn(`[Approval] Unauthorized access to task ${payload.taskId} by user ${session.user.id}`);
            return { success: false, error: '无权处理此任务' };
        }
    }

    logger.info(`[Approval] Processing task ${payload.taskId}, action: ${payload.action}, user: ${session.user.id}`);

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
            try {
                await revertEntityStatus(tx, task.approval.entityType, task.approval.entityId, task.tenantId, 'REJECTED');
                logger.info(`[Approval] Flow ${task.approvalId} REJECTED, entity ${task.approval.entityType}:${task.approval.entityId} reverted.`);
            } catch (err) {
                logger.error(`[Approval] Failed to revert entity status for ${task.approvalId}`, err);
                throw err; // Re-throw to rollback DbTransaction
            }
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
                    nextApprovers = findApproversByRole(allTenantUsers, nextNode.approverRole);
                    if (nextApprovers.length === 0) {
                        logger.error(`[Approval-NextNode] No active users found representing role: ${nextNode.approverRole}`);
                    }
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
                try {
                    await completeEntityStatus(tx, task.approval.entityType, task.approval.entityId, task.tenantId);
                    logger.info(`[Approval] Flow ${task.approvalId} fully APPROVED, entity ${task.approval.entityType}:${task.approval.entityId} completed.`);
                } catch (err) {
                    logger.error(`[Approval] Failed to complete entity status for ${task.approvalId}`, err);
                    throw err;
                }
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

import { processApprovalSchema, addApproverSchema } from "../schema";

/**
 * 处理审批任务（通过或驳回）
 * 
 * L5 改进点：
 * 1. 强制 Zod 校验输入
 * 2. 结构化日志记录处理尝试与结果
 * 3. 页面与数据缓存自动刷新
 * 
 * @param payload - 审批参数
 * @param payload.taskId - 待处理的任务 ID
 * @param payload.action - 审批动作：APPROVE (通过) 或 REJECT (驳回)
 * @param payload.comment - 审批意见
 * @returns 处理结果
 */
export async function processApproval(payload: {
    taskId: string;
    action: 'APPROVE' | 'REJECT';
    comment?: string;
}) {
    // 1. Zod 输入校验
    const parsed = processApprovalSchema.safeParse(payload);
    if (!parsed.success) {
        return { success: false, error: '参数校验失败', details: parsed.error.format() };
    }

    const session = await auth();
    if (!session?.user?.tenantId) {
        logger.warn(`[Approval-Process] Unauthorized attempt for task ${payload.taskId}`);
        return { success: false, error: 'Unauthorized' };
    }

    logger.info(`[Approval-Process] User ${session.user.id} attempting ${payload.action} for task ${payload.taskId}`, {
        tenantId: session.user.tenantId,
        comment: payload.comment
    });
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
            logger.info(`[Approval-Process] Successfully processed task ${payload.taskId} (${payload.action})`);
            revalidatePath('/approval');
        } else {
            logger.warn(`[Approval-Process] Failed to process task ${payload.taskId}: ${result.error}`);
        }
        return result;
    });
}

/**
 * 动态加签审批人
 * 
 * L5 改进点：
 * 1. 强制 Zod 校验
 * 2. 权限与状态多重保护
 * 3. 详细审计日志追踪
 * 
 * @param payload - 加签参数
 * @param payload.taskId - 当前任务 ID
 * @param payload.targetUserId - 被加签的目标用户 ID
 * @param payload.comment - 加签缘由
 * @returns 加签结果
 */
export async function addApprover(payload: {
    taskId: string;
    targetUserId: string;
    comment?: string;
}) {
    // 1. Zod 输入校验
    const parsed = addApproverSchema.safeParse(payload);
    if (!parsed.success) {
        return { success: false, error: '参数校验失败', details: parsed.error.format() };
    }

    const session = await auth();
    if (!session?.user?.id || !session.user.tenantId) {
        logger.warn(`[Approval-AddApprover] Unauthorized attempt for task ${payload.taskId}`);
        return { success: false, error: 'Unauthorized' };
    }

    logger.info(`[Approval-AddApprover] User ${session.user.id} adding approver ${payload.targetUserId} for task ${payload.taskId}`);
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
            logger.warn(`[Approval-AddApprover] Task ${payload.taskId} invalid or not pending`);
            return { success: false, error: '任务无效或已处理' };
        }

        if (task.approverId !== session.user.id) {
            logger.warn(`[Approval-AddApprover] User ${session.user.id} unauthorized to add approver to task ${task.id}`);
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
