'use server';

import { db } from '@/shared/api/db';
import { approvalFlows, approvalNodes, approvals, approvalTasks, users } from '@/shared/api/schema';
import { eq, and, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/shared/lib/auth';
import { ApprovalDelegationService } from "@/services/approval-delegation.service";
import { getSetting } from "@/features/settings/actions/system-settings-actions";
import { addDays } from 'date-fns';
import { findApproversByRole } from './utils';
import { logger } from '@/shared/lib/logger';
import { AuditService } from "@/shared/services/audit-service";

// Helper type for Transaction
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

import { evaluateConditions, Condition } from '../utils/condition-evaluator';

/**
 * 提交审批申请
 *
 * 根据流程编码查找租户内活跃的流程定义，
 * 按金额和自定义条件过滤节点，创建审批实例及初始审批任务，
 * 并将业务实体（如报价单）状态更新为“待审批”。
 *
 * @param payload - 提交参数
 * @param payload.flowCode - 流程定义编码
 * @param payload.entityType - 业务实体类型（QUOTE, ORDER 等）
 * @param payload.entityId - 业务实体唯一标识
 * @param payload.amount - 用于条件过滤的业务金额
 * @param payload.comment - 备注说明
 * @param externalTx - 外部事务上下文（用于组合调用）
 * @returns 包含成功标识、实例 ID 和待处理任务 ID 的结果
 */
export async function submitApproval(payload: {
    tenantId?: string;
    requesterId?: string;
    flowCode: string;
    entityType: 'QUOTE' | 'ORDER' | 'PAYMENT_BILL' | 'RECEIPT_BILL' | 'MEASURE_TASK' | 'ORDER_CHANGE' | 'LEAD_RESTORE' | 'ORDER_CANCEL';
    entityId: string;
    amount?: string | number;
    comment?: string;
    [key: string]: unknown; // 支持动态条件字段
}, externalTx?: Transaction) {
    const session = await auth();
    const tenantId = payload.tenantId || session?.user?.tenantId;
    const requesterId = payload.requesterId || session?.user?.id;

    if (!tenantId || !requesterId) return { success: false, error: 'Unauthorized/Missing IDs' };

    const run = async (tx: Transaction) => {
        // 1. Find active flow definition
        const flow = await tx.query.approvalFlows.findFirst({
            where: and(
                eq(approvalFlows.tenantId, tenantId),
                eq(approvalFlows.code, payload.flowCode),
                eq(approvalFlows.isActive, true)
            )
        });

        if (!flow) {
            throw new Error(`审批流程未定义或已禁用: ${payload.flowCode}`);
        }

        // 2. Fetch Nodes
        const allNodes = await tx.query.approvalNodes.findMany({
            where: eq(approvalNodes.flowId, flow.id),
            orderBy: [asc(approvalNodes.sortOrder)]
        });

        // 3. Filter nodes based on conditions
        const activeNodes = allNodes.filter((node) => {
            const amountNum = payload.amount ? parseFloat(payload.amount.toString()) : 0;
            const min = node.minAmount ? parseFloat(node.minAmount.toString()) : 0;
            const max = node.maxAmount ? parseFloat(node.maxAmount.toString()) : Infinity;
            const amountMatch = amountNum >= min && amountNum <= max;
            if (!amountMatch) return false;
            return evaluateConditions(node.conditions as unknown as Condition[], payload);
        });

        const firstNode = activeNodes[0];
        if (!firstNode) {
            throw new Error(`未找到匹配的审批节点，请检查金额或条件配置`);
        }

        // 4. Create Approval Instance
        const [approval] = await tx.insert(approvals).values({
            tenantId,
            flowId: flow.id,
            entityType: payload.entityType,
            entityId: payload.entityId,
            status: 'PENDING',
            requesterId,
            currentNodeId: firstNode.id,
            comment: payload.comment
        }).returning();

        // 5. Create First Node Tasks
        let approverIds: string[] = [];
        if (firstNode.approverUserId) {
            approverIds = [firstNode.approverUserId];
        } else if (firstNode.approverRole) {
            const allTenantUsers = await tx.query.users.findMany({
                where: and(
                    eq(users.tenantId, tenantId),
                    eq(users.isActive, true)
                )
            });
            approverIds = findApproversByRole(allTenantUsers, firstNode.approverRole!);
            if (approverIds.length === 0) {
                throw new Error(`未找到角色 [${firstNode.approverRole}] 对应的有效审批人`);
            }
        }

        let timeoutAt: Date;
        if (firstNode.timeoutHours) {
            const { addHours } = await import("date-fns");
            timeoutAt = addHours(new Date(), firstNode.timeoutHours);
        } else {
            const timeoutDays = (await getSetting('APPROVAL_TIMEOUT_DAYS')) as number || 3;
            timeoutAt = addDays(new Date(), timeoutDays);
        }

        const pendingTaskIds: string[] = [];
        for (const userId of approverIds) {
            const actualApproverId = await ApprovalDelegationService.getEffectiveApprover(userId, flow.id, tenantId);
            const [newTask] = await tx.insert(approvalTasks).values({
                tenantId,
                approvalId: approval.id,
                nodeId: firstNode.id,
                approverId: actualApproverId,
                status: 'PENDING',
                timeoutAt
            }).returning();
            pendingTaskIds.push(newTask.id);
        }

        // 6. Update Business Entity Status
        const { revertEntityStatus } = await import("./utils");
        await revertEntityStatus(tx, payload.entityType, payload.entityId, tenantId, 'PENDING_APPROVAL');

        await AuditService.log(tx, {
            tableName: 'approvals',
            recordId: approval.id,
            action: 'SUBMIT_APPROVAL',
            userId: requesterId,
            tenantId: tenantId,
            details: { flowCode: payload.flowCode, entityType: payload.entityType, entityId: payload.entityId, amount: payload.amount }
        });

        return { success: true, approvalId: approval.id, pendingTaskIds };
    };

    if (externalTx) {
        return await run(externalTx);
    } else {
        return await db.transaction(async (tx) => {
            try {
                const result = await run(tx);
                // 事务外异步发送通知
                if (result.success && result.pendingTaskIds) {
                    import('../services/approval-notification.service').then(({ ApprovalNotificationService }) => {
                        result.pendingTaskIds.forEach(id => {
                            ApprovalNotificationService.notifyNewTask(id, tenantId).catch(err =>
                                logger.error(`[Approval-Notify] Failed to notify task ${id}`, err)
                            );
                        });
                    });
                }
                revalidatePath('/approval');
                return { success: true, approvalId: result.approvalId, message: '审批提交成功' };
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : String(e);
                return { success: false, error: message };
            }
        });
    }
}
