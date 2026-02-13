'use server';

import { db } from "@/shared/api/db";
import {
    approvals,
    approvalTasks,
    quotes,
    paymentBills
} from "@/shared/api/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/shared/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * 撤回审批
 * @param instanceId 审批实例 ID
 * @param reason 撤回原因
 */
export async function withdrawApproval(payload: {
    instanceId: string;
    reason?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    return db.transaction(async (tx) => {
        // 1. Get Approval Instance
        const instance = await tx.query.approvals.findFirst({
            where: eq(approvals.id, payload.instanceId),
        });

        if (!instance) {
            return { success: false, error: '审批实例不存在' };
        }

        // 2. Permission Check (Only Requester can withdraw)
        // TODO: Admin might also withdraw? For now, restriction to requester.
        if (instance.requesterId !== session.user.id) {
            return { success: false, error: '无权撤回此审批' };
        }

        // 3. Status Check (Only PENDING can be withdrawn)
        if (instance.status !== 'PENDING') {
            return { success: false, error: '当前状态不可撤回' };
        }

        // 4. Update Instance Status
        await tx.update(approvals)
            .set({
                status: 'WITHDRAWN',
                completedAt: new Date(),
                // Store reason? Schema might not have explicit 'reason' field on instance, 
                // but we can append to logs or similar if needed.
                // For now, simple status update.
            })
            .where(eq(approvals.id, payload.instanceId));

        // 5. Cancel Pending Tasks
        await tx.update(approvalTasks)
            .set({
                status: 'CANCELED',
                comment: payload.reason || 'User Withdrawn',
                actionAt: new Date(),
            })
            .where(and(
                eq(approvalTasks.approvalId, payload.instanceId),
                eq(approvalTasks.status, 'PENDING')
            ));

        // 6. Business Callback (Update Entity Status)
        if (instance.entityType === 'QUOTE') {
            await tx.update(quotes)
                .set({ status: 'DRAFT' })
                .where(eq(quotes.id, instance.entityId));
        } else if (instance.entityType === 'PAYMENT_BILL') {
            await tx.update(paymentBills)
                .set({ status: 'DRAFT' })
                .where(eq(paymentBills.id, instance.entityId));
        }

        revalidatePath('/approval');
        return { success: true, message: '撤回成功' };
    });
}
