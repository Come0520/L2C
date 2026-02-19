import { db } from "@/shared/api/db";
import { approvalTasks, approvals } from "@/shared/api/schema";
import { eq, and } from "drizzle-orm";
import { notificationService } from "@/features/notifications/service";
import { logger } from "@/shared/lib/logger";

export class ApprovalNotificationService {
    /**
     * Notify approver about a new task
     */
    static async notifyNewTask(taskId: string, tenantId?: string) {
        try {
            const task = await db.query.approvalTasks.findFirst({
                where: and(
                    eq(approvalTasks.id, taskId),
                    tenantId ? eq(approvalTasks.tenantId, tenantId) : undefined
                ),
                with: {
                    approval: true,
                    approver: true,
                    node: true,
                }
            });

            if (!task || !task.approverId) return;

            await notificationService.send({
                tenantId: task.tenantId,
                userId: task.approverId,
                title: '待审批任务提醒',
                content: `您有一个新的审批任务: [${task.node?.name || '审批'}]`,
                type: 'SYSTEM',
                metadata: {
                    type: 'APPROVAL_TASK',
                    id: task.id,
                    approvalId: task.approvalId
                }
            });
        } catch (error) {
            logger.error(`[ApprovalNotification] Failed to notify new task: ${taskId}`, error);
        }
    }

    /**
     * Notify requester about approval result
     */
    static async notifyResult(approvalId: string, tenantId?: string) {
        try {
            const approval = await db.query.approvals.findFirst({
                where: and(
                    eq(approvals.id, approvalId),
                    tenantId ? eq(approvals.tenantId, tenantId) : undefined
                ),
                with: {
                    requester: true
                }
            });

            if (!approval || !approval.requesterId) return;

            const statusText = approval.status === 'APPROVED' ? '通过' : '驳回';

            await notificationService.send({
                tenantId: approval.tenantId,
                userId: approval.requesterId,
                title: '审批结果提醒',
                content: `您的申请 [${approval.entityType}] 已处理，结果为: ${statusText}`,
                type: 'SYSTEM',
                metadata: {
                    type: 'APPROVAL_RESULT',
                    id: approval.id,
                    status: approval.status
                }
            });
        } catch (error) {
            logger.error(`[ApprovalNotification] Failed to notify result: ${approvalId}`, error);
        }
    }
}
