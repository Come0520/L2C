'use server';

import { db } from "@/shared/api/db";
import { approvals, approvalTasks, approvalNodes } from "@/shared/api/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { auth } from "@/shared/lib/auth";
import { revalidatePath } from "next/cache";

import { logger } from "@/shared/lib/logger";
import { AuditService } from "@/shared/services/audit-service";
import { revokeApprovalSchema } from "../schema";

/**
 * 撤销审批动作或撤回申请
 * 
 * L5 升级点：
 * 1. 结构化日志输出。
 * 2. 审计日志追踪。
 * 3. Zod 输入校验。
 * 4. 修复类型安全隐患。
 * 
 * @param approvalId - 审批实例 ID
 * @returns 撤销结果
 */
export async function revokeApprovalAction(approvalId: string) {
    // 1. Zod 输入校验
    const parsed = revokeApprovalSchema.safeParse({ approvalId });
    if (!parsed.success) {
        return { success: false, error: '参数校验失败', details: parsed.error.format() };
    }

    const session = await auth();
    if (!session?.user?.id || !session.user.tenantId) {
        logger.warn(`[Approval-Revoke] Unauthorized attempt for approval ${approvalId}`);
        return { success: false, error: 'Unauthorized' };
    }

    logger.info(`[Approval-Revoke] User ${session.user.id} attempting to revoke action for ${approvalId}`);

    return db.transaction(async (tx) => {
        const approval = await tx.query.approvals.findFirst({
            where: and(
                eq(approvals.id, approvalId),
                eq(approvals.tenantId, session.user.tenantId)
            ),
            with: {
                tasks: true
            }
        });

        if (!approval) {
            logger.warn(`[Approval-Revoke] Approval ${approvalId} not found for tenant ${session.user.tenantId}`);
            return { success: false, error: "审批不存在" };
        }

        const isInitiator = approval.requesterId === session.user.id;
        const isApprover = approval.tasks.some(t => t.approverId === session.user.id && t.status === 'APPROVED');

        if (!isInitiator && !isApprover) {
            logger.warn(`[Approval-Revoke] User ${session.user.id} has no permission to revoke ${approvalId}`);
            return { success: false, error: "无权执行撤回操作" };
        }

        const now = new Date();
        const createdAt = new Date(approval.createdAt || now);
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 3600);

        if (isInitiator) {
            // 发起人撤回逻辑
            if (approval.status !== 'PENDING') {
                return { success: false, error: '只能撤回待处理的申请' };
            }
            if (hoursDiff > 24) {
                return { success: false, error: '已超过24小时撤回期限' };
            }

            logger.info(`[Approval-Revoke] Initiator ${session.user.id} revoking approval ${approvalId}`);

            // 执行撤销
            await tx.update(approvals)
                .set({ status: 'CANCELED', completedAt: now, updatedAt: now })
                .where(eq(approvals.id, approvalId));

            // 取消所有待处理任务
            await tx.update(approvalTasks)
                .set({ status: 'CANCELED', actionAt: now })
                .where(and(
                    eq(approvalTasks.approvalId, approvalId),
                    eq(approvalTasks.status, 'PENDING')
                ));

            // 业务回滚
            const { revertEntityStatus } = await import("./utils");
            await revertEntityStatus(tx, approval.entityType, approval.entityId, approval.tenantId, 'DRAFT');

            // 审计日志
            await AuditService.log(tx, {
                tableName: 'approvals',
                recordId: approvalId,
                action: 'REVOKE_INITIATOR',
                userId: session.user.id,
                tenantId: session.user.tenantId,
                details: { type: 'withdrawal', originalStatus: approval.status }
            });

            revalidatePath('/approval');
            return { success: true, message: '发起人已成功撤销申请' };

        } else {
            // 审批人撤回逻辑 (撤销已通过的审批)
            const lastTask = await tx.query.approvalTasks.findFirst({
                where: and(
                    eq(approvalTasks.approvalId, approvalId),
                    eq(approvalTasks.approverId, session.user.id),
                    eq(approvalTasks.status, 'APPROVED')
                ),
                orderBy: [desc(approvalTasks.actionAt)]
            });

            if (!lastTask || !lastTask.actionAt) {
                return { success: false, error: '您尚未审批通过该申请，无法撤回' };
            }

            const minutesSinceAction = (now.getTime() - lastTask.actionAt.getTime()) / (1000 * 60);
            if (minutesSinceAction > 30) {
                return { success: false, error: '审批已超过30分钟，无法撤销' };
            }

            if (approval.status !== 'PENDING') {
                return { success: false, error: '流程已结束或已驳回，无法撤销审批动作' };
            }

            // 检查后续节点是否已经开始处理 (按 sortOrder 判断)
            const lastNode = await tx.query.approvalNodes.findFirst({
                where: eq(approvalNodes.id, lastTask.nodeId!)
            });
            if (!lastNode) {
                logger.error(`[Approval-Revoke] Node ${lastTask.nodeId} not found for task ${lastTask.id}`);
                return { success: false, error: '节点数据异常' };
            }

            const subsequentActionTasks = await tx.query.approvalTasks.findMany({
                where: and(
                    eq(approvalTasks.approvalId, approvalId),
                    inArray(approvalTasks.status, ['APPROVED', 'REJECTED'])
                ),
                with: {
                    node: true
                }
            });

            const othersActed = subsequentActionTasks.some(t =>
                t.node && (t.node.sortOrder || 0) > (lastNode.sortOrder || 0)
            );

            if (othersActed) {
                return { success: false, error: '后续节点已产生审批动作，无法撤回' };
            }

            logger.info(`[Approval-Revoke] Approver ${session.user.id} rolling back task ${lastTask.id} for ${approvalId}`);

            // 执行回滚
            await tx.update(approvals)
                .set({ currentNodeId: lastTask.nodeId, updatedAt: now })
                .where(eq(approvals.id, approvalId));

            await tx.update(approvalTasks)
                .set({
                    status: 'PENDING',
                    actionAt: null,
                    comment: null
                })
                .where(eq(approvalTasks.id, lastTask.id));

            // 删除后续生成的任务
            const allPendingTasks = await tx.query.approvalTasks.findMany({
                where: and(
                    eq(approvalTasks.approvalId, approvalId),
                    eq(approvalTasks.status, 'PENDING')
                )
            });

            const idsToDelete = allPendingTasks
                .filter(t => t.id !== lastTask.id)
                .map(t => t.id);

            if (idsToDelete.length > 0) {
                await tx.delete(approvalTasks).where(inArray(approvalTasks.id, idsToDelete));
            }

            const { revertEntityStatus } = await import("./utils");
            await revertEntityStatus(tx, approval.entityType, approval.entityId, approval.tenantId, 'PENDING_APPROVAL');

            // 审计日志
            await AuditService.log(tx, {
                tableName: 'approvals',
                recordId: approvalId,
                action: 'REVOKE_APPROVER',
                userId: session.user.id,
                tenantId: session.user.tenantId,
                details: { taskId: lastTask.id, nodeId: lastTask.nodeId }
            });

            revalidatePath('/approval');
            return { success: true, message: '审批动作已撤回，流程已回退' };
        }
    });
}

