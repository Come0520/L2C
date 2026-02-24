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

import { submitApprovalSchema } from '../schema';

/**
 * 提交审批申请
 *
 * 根据流程编码查找租户内活跃的流程定义，
 * 按金额和自定义条件过滤节点，创建审批实例及初始审批任务，
 * 并将业务实体（如报价单）状态更新为“待审批”。
 * 
 * L5 改进点：
 * 1. 强制 Zod 输入校验
 * 2. 结构化日志记录 (Attempt/Success/Failure/Warn)
 * 3. 审计日志追踪
 *
 * @param payload - 提交参数，需包含 flowCode, entityType, entityId 等
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
    // 1. Zod 输入校验
    const parsed = submitApprovalSchema.safeParse(payload);
    if (!parsed.success) {
        return { success: false, error: '参数校验失败', details: parsed.error.format() };
    }

    const session = await auth();
    const tenantId = payload.tenantId || session?.user?.tenantId;
    const requesterId = payload.requesterId || session?.user?.id;

    if (!tenantId || !requesterId) {
        logger.warn('[Approval-Submit] Unauthorized attempt to submit approval');
        return { success: false, error: '未授权或缺少必要标识符' };
    }

    logger.info(`[Approval-Submit] User ${requesterId} submitting ${payload.flowCode} for ${payload.entityType}:${payload.entityId}`, {
        tenantId,
        amount: payload.amount
    });

    const run = async (tx: Transaction) => {
        // 1. 查找租户内活跃的流程定义
        const flow = await tx.query.approvalFlows.findFirst({
            where: and(
                eq(approvalFlows.tenantId, tenantId),
                eq(approvalFlows.code, payload.flowCode),
                eq(approvalFlows.isActive, true)
            )
        });

        if (!flow) {
            logger.error(`[Approval-Submit] Flow definition not found or disabled: ${payload.flowCode}, tenant: ${tenantId}`);
            throw new Error(`审批流程未定义或已禁用: ${payload.flowCode}`);
        }

        logger.info(`[Approval-Submit] Found flow: ${flow.name} (${flow.code}) for entity: ${payload.entityType}:${payload.entityId}`);

        // 2. 获取节点定义
        const allNodes = await tx.query.approvalNodes.findMany({
            where: eq(approvalNodes.flowId, flow.id),
            orderBy: [asc(approvalNodes.sortOrder)]
        });

        if (!allNodes.length) {
            logger.error(`[Approval-Submit] No nodes defined for flow ${flow.id}`);
            throw new Error(`流程 [${payload.flowCode}] 未配置审批环节`);
        }

        // 3. 按条件和金额过滤生效节点 (L5: 消除隐式 any)
        const activeNodes = allNodes.filter((node) => {
            const amountNum = payload.amount ? parseFloat(payload.amount.toString()) : 0;
            const min = node.minAmount ? parseFloat(node.minAmount.toString()) : 0;
            const max = node.maxAmount ? parseFloat(node.maxAmount.toString()) : Infinity;

            const amountMatch = amountNum >= min && amountNum <= max;
            if (!amountMatch) {
                logger.info(`[Approval-Submit] Node ${node.name} amount mismatch: ${amountNum} not in [${min}, ${max}]`);
                return false;
            }

            // 评估复杂条件 (Zod 保证了 payload 的结构)
            const nodeConditions = (node.conditions || []) as Condition[];
            return evaluateConditions(nodeConditions, payload as Record<string, unknown>);
        });

        const firstNode = activeNodes[0];
        if (!firstNode) {
            logger.warn(`[Approval-Submit] No matching nodes for flow ${payload.flowCode}, amount: ${payload.amount}`);
            throw new Error(`当前业务金额 [${payload.amount}] 不在任何审批环节范围内`);
        }

        logger.info(`[Approval-Submit] Matched ${activeNodes.length} nodes, starting with node: ${firstNode.name}`);

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

        // 5. 创建首节点审批任务
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
            approverIds = findApproversByRole(allTenantUsers, firstNode.approverRole);
            if (approverIds.length === 0) {
                logger.error(`[Approval-Submit] No active users found for role: ${firstNode.approverRole}`);
                throw new Error(`未找到角色 [${firstNode.approverRole}] 对应的有效审批人`);
            }
        }

        let timeoutAt: Date;
        if (firstNode.timeoutHours) {
            const { addHours } = await import("date-fns");
            timeoutAt = addHours(new Date(), firstNode.timeoutHours);
        } else {
            const timeoutValue = await getSetting('APPROVAL_TIMEOUT_DAYS');
            const timeoutDays = typeof timeoutValue === 'number' ? timeoutValue : 3;
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
            logger.info(`[Approval-Submit] Created task ${newTask.id} for user ${actualApproverId}${actualApproverId !== userId ? ' (Delegated)' : ''}`);
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
