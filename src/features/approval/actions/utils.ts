import { db, type Transaction } from '@/shared/api/db';
import { notifications, users } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { ApprovalStep, ApprovalInstance, NotificationParams } from '../schema';

/**
 * 创建系统通知 (Internal Helper)
 */
export async function createSystemNotification(params: NotificationParams) {
    const dbOrTx = params.tx || db;
    await dbOrTx.insert(notifications).values({
        tenantId: params.tenantId,
        userId: params.userId,
        type: 'APPROVAL',
        channel: 'IN_APP',
        title: params.title,
        content: params.content,
        metadata: params.metadata || {},
        isRead: false
    });
}

/**
 * 通知审批�?
 */
export async function notifyApprovers(step: ApprovalStep, instance: ApprovalInstance, tx?: Transaction) {
    let targetUserIds: string[] = [];

    if (step.approverType === 'USER') {
        targetUserIds = [step.approverValue];
    } else if (step.approverType === 'ROLE') {
        const usersWithRole = await (tx || db).query.users.findMany({
            where: and(
                eq(users.tenantId, instance.tenantId),
                eq(users.role, step.approverValue),
                eq(users.isActive, true)
            ),
            columns: { id: true }
        });
        targetUserIds = usersWithRole.map((u) => u.id);
    }
    // TODO: CREATOR_MANAGER logic
    // Placeholder for future implementation

    for (const uid of targetUserIds) {
        await createSystemNotification({
            tenantId: instance.tenantId,
            userId: uid,
            title: '收到新的审批任务',
            content: `您有一个新的审批任�? ${step.name}`,
            metadata: { instanceId: instance.id, entityId: instance.entityId },
            tx
        });
    }
}

/**
 * 通知申请�?
 */
export async function notifyApplicant(instance: ApprovalInstance, title: string, content: string, tx?: Transaction) {
    if (!instance.applicantId) return;
    await createSystemNotification({
        tenantId: instance.tenantId,
        userId: instance.applicantId,
        title,
        content,
        metadata: { instanceId: instance.id },
        tx
    });
}

/**
 * Check if user matches the approver definition
 */
export async function checkIsApprover(user: { id: string, role?: string | null }, step: ApprovalStep) {
    if (step.approverType === 'USER') {
        return step.approverValue === user.id;
    }

    if (step.approverType === 'ROLE') {
        return user.role === step.approverValue;
    }

    return false;
}
