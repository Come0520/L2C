import { db, type Transaction } from '@/shared/api/db';
import { notifications } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { type NotificationParams, ApprovalStep, ApprovalInstance } from '../schema';
import { logger } from '@/shared/lib/logger';
import { APPROVAL_CONSTANTS } from '../constants';

/**
 * 校验用户是否符合审批步骤的要求
 * @param user - 用户信息
 * @param step - 审批步骤配置
 * @returns 是否匹配
 */
export function checkApproverMatch(user: { id: string; role?: string; roles?: string[] }, step: ApprovalStep): boolean {
    if (step.approverType === 'USER') {
        return step.approverValue === user.id;
    }

    if (step.approverType === 'ROLE') {
        const userRoles = user.roles || (user.role ? [user.role] : []);
        return userRoles.includes(step.approverValue);
    }

    return false;
}

/**
 * 根据角色查找租户内匹配的活跃审批人
 */
export function findApproversByRole(
    allTenantUsers: { id: string; role?: string | null; roles?: string[] | unknown }[],
    approverRole: string
): string[] {
    const targetRole = (APPROVAL_CONSTANTS.ROLE_MAP[approverRole] || approverRole) as string;
    return allTenantUsers
        .filter(u => {
            const userRoles = (u.roles as string[]) || (u.role ? [u.role] : []);
            return userRoles.includes(targetRole);
        })
        .map(u => u.id);
}

/**
 * 通知申请人审批状态变更
 * @param instance - 审批实例
 * @param params - 通知内容参数
 * @param tx - 事务上下文
 */
export async function notifyApplicant(
    instance: ApprovalInstance,
    params: NotificationParams,
    tx?: Transaction
) {
    const { title, content } = params;
    const dbClient = tx || db;

    if (!instance.requesterId) return;

    await dbClient.insert(notifications).values({
        tenantId: instance.tenantId,
        userId: instance.requesterId,
        title,
        content,
        type: 'SYSTEM' as const,
        isRead: false,
        channel: 'IN_APP',
        metadata: { instanceId: instance.id },
    });
}
// ... existing code ...

/**
 * 统一处理实体状态回退（驳回/撤回/超时驳回时调用）
 */
export async function revertEntityStatus(
    tx: Transaction,
    entityType: string,
    entityId: string,
    tenantId: string,
    targetStatus = 'DRAFT'
) {
    // 动态导入 schema 以避免循环依赖
    const schema = await import('@/shared/api/schema');
    const { quotes, orders, paymentBills, receiptBills, measureTasks, orderChanges, leads } = schema;

    switch (entityType) {
        case 'QUOTE':
            await tx.update(quotes)
                // @ts-expect-error — 横切状态回退：targetStatus 由调用方动态传入，无法匹配单一 schema 枚举
                .set({ status: targetStatus })
                .where(and(eq(quotes.id, entityId), eq(quotes.tenantId, tenantId)));
            break;
        case 'ORDER':
            await tx.update(orders)
                .set({ status: targetStatus as typeof orders.$inferInsert.status })
                .where(and(eq(orders.id, entityId), eq(orders.tenantId, tenantId)));
            break;
        case 'PAYMENT_BILL':
            await tx.update(paymentBills)
                .set({ status: targetStatus as typeof paymentBills.$inferInsert.status })
                .where(and(eq(paymentBills.id, entityId), eq(paymentBills.tenantId, tenantId)));
            break;
        case 'RECEIPT_BILL':
            await tx.update(receiptBills)
                .set({ status: targetStatus as typeof receiptBills.$inferInsert.status })
                .where(and(eq(receiptBills.id, entityId), eq(receiptBills.tenantId, tenantId)));
            break;
        case 'MEASURE_TASK':
            // MEASURE_TASK 不支持 DRAFT 状态，映射到 PENDING
            const measureStatus = targetStatus === 'DRAFT' ? 'PENDING' : targetStatus;
            await tx.update(measureTasks)
                .set({ status: measureStatus as typeof measureTasks.$inferInsert.status })
                .where(and(eq(measureTasks.id, entityId), eq(measureTasks.tenantId, tenantId)));
            break;
        case 'ORDER_CHANGE':
            await tx.update(orderChanges)
                .set({ status: targetStatus as typeof orderChanges.$inferInsert.status })
                .where(and(eq(orderChanges.id, entityId), eq(orderChanges.tenantId, tenantId)));
            break;
        case 'LEAD_RESTORE':
            // 若审批被拒绝，回滚至 INVALID；若仅是提交审批（PENDING_APPROVAL），则更新为该状态
            const leadStatus = targetStatus === 'REJECTED' ? 'INVALID' : targetStatus;
            await tx.update(leads)
                .set({ status: leadStatus as typeof leads.$inferInsert.status })
                .where(and(eq(leads.id, entityId), eq(leads.tenantId, tenantId)));
            break;
        case 'ORDER_CANCEL':
            // ORDER_CANCEL handled via other mechanism or orders table directly?
            // For now, log and skip until we clarify the entity table.
            logger.info(`[Approval] Reverting status for ${entityType}: ${entityId} to ${targetStatus}`);
            break;
        default:
            logger.warn(`[Approval] No revert handler for entityType: ${entityType}`);
            break;
    }
}

/**
 * 统一处理实体状态完成（审批通过时调用）
 */
export async function completeEntityStatus(
    tx: Transaction,
    entityType: string,
    entityId: string,
    tenantId: string
) {
    const schema = await import('@/shared/api/schema');
    const { quotes, orders, paymentBills, receiptBills, measureTasks, orderChanges, leads, leadStatusHistory } = schema;

    switch (entityType) {
        case 'QUOTE':
            await tx.update(quotes)
                .set({ status: 'APPROVED' as typeof quotes.$inferInsert.status })
                .where(and(eq(quotes.id, entityId), eq(quotes.tenantId, tenantId)));
            break;
        case 'ORDER':
            await tx.update(orders)
                .set({ status: 'APPROVED' as typeof orders.$inferInsert.status })
                .where(and(eq(orders.id, entityId), eq(orders.tenantId, tenantId)));
            break;
        case 'PAYMENT_BILL':
            await tx.update(paymentBills)
                .set({ status: 'APPROVED' as typeof paymentBills.$inferInsert.status })
                .where(and(eq(paymentBills.id, entityId), eq(paymentBills.tenantId, tenantId)));
            break;
        case 'RECEIPT_BILL':
            await tx.update(receiptBills)
                .set({ status: 'APPROVED' as typeof receiptBills.$inferInsert.status })
                .where(and(eq(receiptBills.id, entityId), eq(receiptBills.tenantId, tenantId)));
            break;
        case 'MEASURE_TASK':
            await tx.update(measureTasks)
                .set({ status: 'COMPLETED' as typeof measureTasks.$inferInsert.status })
                .where(and(eq(measureTasks.id, entityId), eq(measureTasks.tenantId, tenantId)));
            break;
        case 'ORDER_CHANGE':
            await tx.update(orderChanges)
                .set({ status: 'APPROVED' as typeof orderChanges.$inferInsert.status })
                .where(and(eq(orderChanges.id, entityId), eq(orderChanges.tenantId, tenantId)));
            break;
        case 'LEAD_RESTORE':
            // 查找最近一次变为 INVALID 的记录，获取其前置状态
            const invalidationRecord = await tx.query.leadStatusHistory.findFirst({
                where: and(
                    eq(leadStatusHistory.leadId, entityId),
                    eq(leadStatusHistory.tenantId, tenantId),
                    eq(leadStatusHistory.newStatus, 'INVALID')
                ),
                orderBy: (history, { desc }) => [desc(history.changedAt)]
            });

            const restoreStatus = invalidationRecord?.oldStatus || 'PENDING_ASSIGNMENT';

            // 更新线索状态
            await tx.update(leads)
                .set({
                    // @ts-expect-error — LEAD_RESTORE 恢复到历史状态，枚举不精确匹配
                    status: restoreStatus,
                    updatedAt: new Date()
                })
                .where(and(eq(leads.id, entityId), eq(leads.tenantId, tenantId)));

            // 记录状态变更历史
            await tx.insert(leadStatusHistory).values({
                tenantId,
                leadId: entityId,
                oldStatus: 'PENDING_APPROVAL',
                newStatus: restoreStatus,
                changedAt: new Date(),
                reason: '审批通过自动恢复'
            });

            logger.info(`[Approval] Restored lead ${entityId} to status ${restoreStatus}`);
            break;
        case 'ORDER_CANCEL':
            logger.info(`[Approval] Completing status for ${entityType}: ${entityId}`);
            break;
        default:
            logger.warn(`[Approval] No complete handler for entityType: ${entityType}`);
            break;
    }
}
