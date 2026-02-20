'use server';

import { db } from "@/shared/api/db";
import {
    approvals,
    approvalTasks
} from "@/shared/api/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/shared/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * 撤回处理中的审批申请
 * @param payload - 撤回参数
 * @param payload.instanceId - 审批实例 ID
 * @param payload.reason - 撤回原因
 * @returns 撤回结果
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
            where: and(
                eq(approvals.id, payload.instanceId),
                eq(approvals.tenantId, session.user.tenantId)
            ),
        });

        if (!instance) {
            return { success: false, error: '审批实例不存在' };
        }

        // 2. Permission Check (Only Requester can withdraw)
        // 设计选型：当前仅允许发起人撤回，管理员撤回权限可在后续需求变更时扩展
        // （参考 revokeApprovalAction 对审批人撤销动作的处理）
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
                status: 'CANCELED',
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

        // P2-4: 撤回时回退业务单据状态
        const { revertEntityStatus } = await import("./utils");
        await revertEntityStatus(tx, instance.entityType, instance.entityId, instance.tenantId, 'DRAFT');

        revalidatePath('/approval');
        return { success: true, message: '撤回成功' };
    });
}
