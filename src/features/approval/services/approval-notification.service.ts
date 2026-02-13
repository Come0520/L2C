import { db } from "@/shared/api/db";
import { approvalTasks, approvals } from "@/shared/api/schema";
import { eq } from "drizzle-orm";
import { notificationService } from "@/features/notifications/service";

export class ApprovalNotificationService {
    /**
     * Notify approver about a new task
     */
    static async notifyNewTask(taskId: string) {
        const task = await db.query.approvalTasks.findFirst({
            where: eq(approvalTasks.id, taskId),
            with: {
                approval: {
                    with: {
                        flow: true
                    }
                },
                node: true
            }
        });

        if (!task || !task.approverId) return;

        await notificationService.send({
            tenantId: task.tenantId,
            userId: task.approverId,
            type: 'APPROVAL',
            title: `待审批: ${task.approval.flow?.name || '未知审批流'}`,
            content: `您有一个新的审批任务: [${task.node?.name || '未知环节'}] - 关联单据: ${task.approval.entityType} (${task.approval.entityId})`,
            metadata: {
                link: `/approval/tasks/${task.id}`,
                entityType: task.approval.entityType,
                entityId: task.approval.entityId,
                approvalId: task.approvalId,
                taskId: task.id
            }
        });
    }

    /**
     * Notify requester about approval result
     */
    static async notifyResult(approvalId: string) {
        const approval = await db.query.approvals.findFirst({
            where: eq(approvals.id, approvalId),
            with: {
                flow: true
            }
        });

        if (!approval || !approval.requesterId) return;

        const statusText = approval.status === 'APPROVED' ? '通过' : '驳回';

        await notificationService.send({
            tenantId: approval.tenantId,
            userId: approval.requesterId,
            type: 'APPROVAL',
            title: `审批结果: ${approval.flow?.name || '未知审批流'} - ${statusText}`,
            content: `您的审批申请 [${approval.flow?.name || '未知审批流'}] 已被${statusText}。`,
            metadata: {
                link: `/approval/my-requests`,
                entityType: approval.entityType,
                entityId: approval.entityId,
                approvalId: approval.id
            }
        });
    }
}
