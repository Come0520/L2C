import { db, type Transaction } from '@/shared/api/db';
import { notifications, users } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { ApprovalStep, ApprovalInstance } from '../schema';

export interface NotificationParams {
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
}

/**
 * Check if a user matches the approver requirements of a step
 */
export function checkApproverMatch(user: { id: string; role?: string }, step: ApprovalStep): boolean {
    if (step.approverType === 'USER') {
        return step.approverValue === user.id;
    }

    if (step.approverType === 'ROLE') {
        return user.role === step.approverValue;
    }

    return false;
}

/**
 * Notify the applicant of an approval status change
 */
export async function notifyApplicant(
    instance: ApprovalInstance,
    params: NotificationParams,
    tx?: Transaction
) {
    const { title, message, type } = params;
    const dbClient = tx || db;

    if (!instance.applicantId) return;

    await dbClient.insert(notifications).values({
        tenantId: instance.tenantId,
        userId: instance.applicantId,
        title,
        content: message,
        type,
        isRead: false,
        channel: 'IN_APP',
        metadata: { instanceId: instance.id },
    });
}
