'use server';

import { db } from "@/shared/api/db";
import {
    approvals,
    approvalTasks
} from "@/shared/api/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/shared/lib/auth";
import { revalidatePath } from "next/cache";
import { logger } from "@/shared/lib/logger";
import { AuditService } from "@/shared/services/audit-service";
import { withdrawApprovalSchema } from "../schema";

/**
 * 撤回处理中的审批申请
 * 
 * L5 升级说明：
 * 1. 增加详细的结构化日志记录
 * 2. 完善审计日志记录 (Audit Trail)
 * 3. 增加输入参数 Zod 校验
 * 4. 修复状态不一致问题，统一使用 CANCELED 状态
 * 
 * @param payload - 撤回参数
 * @returns 撤回结果
 */
export async function withdrawApproval(payload: {
    instanceId: string;
    reason?: string;
}) {
    // 1. 输入校验
    const parsed = withdrawApprovalSchema.safeParse(payload);
    if (!parsed.success) {
        return { success: false, error: '参数校验失败', details: parsed.error.format() };
    }

    const session = await auth();
    if (!session?.user?.id || !session.user.tenantId) {
        return { success: false, error: 'Unauthorized' };
    }

    logger.info(`[Approval-Management] User ${session.user.id} attempting to withdraw approval ${payload.instanceId}`, {
        tenantId: session.user.tenantId,
        reason: payload.reason
    });

    return db.transaction(async (tx) => {
        // 1. 获取审批实例
        const instance = await tx.query.approvals.findFirst({
            where: and(
                eq(approvals.id, payload.instanceId),
                eq(approvals.tenantId, session.user.tenantId)
            ),
        });

        if (!instance) {
            logger.warn(`[Approval-Management] Withdrawal failed: instance ${payload.instanceId} not found`);
            return { success: false, error: '审批实例不存在' };
        }

        // 2. 权限校验 (仅允许发起人撤回)
        if (instance.requesterId !== session.user.id) {
            logger.warn(`[Approval-Management] Unauthorized withdrawal attempt: user ${session.user.id} for instance ${instance.id}`);
            return { success: false, error: '无权撤回此审批' };
        }

        // 3. 状态校验 (仅 PENDING 状态可撤回)
        if (instance.status !== 'PENDING') {
            logger.warn(`[Approval-Management] Withdrawal failed: instance ${instance.id} is in status ${instance.status}`);
            return { success: false, error: '当前状态不可撤回' };
        }

        // 4. 更新实例状态
        await tx.update(approvals)
            .set({
                status: 'CANCELED',
                completedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(approvals.id, payload.instanceId));

        // 5. 取消所有待处理任务
        await tx.update(approvalTasks)
            .set({
                status: 'CANCELED',
                comment: payload.reason ? `[用户撤回] ${payload.reason}` : '[用户撤回]',
                actionAt: new Date(),
            })
            .where(and(
                eq(approvalTasks.approvalId, payload.instanceId),
                eq(approvalTasks.status, 'PENDING')
            ));

        // 6. 审计日志
        await AuditService.log(tx, {
            tableName: 'approvals',
            recordId: instance.id,
            action: 'WITHDRAW',
            userId: session.user.id,
            tenantId: session.user.tenantId,
            details: { reason: payload.reason, previousStatus: instance.status }
        });

        // 7. 回退业务单据状态
        const { revertEntityStatus } = await import("./utils");
        await revertEntityStatus(tx, instance.entityType, instance.entityId, instance.tenantId, 'DRAFT');

        logger.info(`[Approval-Management] Successfully withdrawn approval ${instance.id} for entity ${instance.entityType}:${instance.entityId}`);

        revalidatePath('/approval');
        return { success: true, message: '撤回成功' };
    });
}
