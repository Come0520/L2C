import { db } from '@/shared/api/db';
import { approvalFlows, approvalNodes, approvals, approvalTasks, quotes, paymentBills, receiptBills, measureTasks } from '@/shared/api/schema';
import { eq, and, asc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { auth } from '@/shared/lib/auth';
import { ApprovalDelegationService } from "@/services/approval-delegation.service";

interface Condition {
    field: string;
    operator: string;
    value: any;
}

/**
 * 评估节点条件是否匹配
 */
function evaluateConditions(conditions: Condition[], payload: Record<string, any>): boolean {
    if (!conditions || !Array.isArray(conditions) || conditions.length === 0) return true;

    return conditions.every(cond => {
        const value = payload[cond.field];
        if (value === undefined) return false; // 字段缺失则不匹配

        switch (cond.operator) {
            case 'eq': return value == cond.value;
            case 'ne': return value != cond.value;
            case 'gt': return Number(value) > Number(cond.value);
            case 'lt': return Number(value) < Number(cond.value);
            case 'in': return Array.isArray(cond.value) && cond.value.includes(value);
            default: return true;
        }
    });
}

/**
 * 提交审批
 * @param payload 
 * @param externalTx 外部事务上下文 (可选)
 */
export async function submitApproval(payload: {
    tenantId?: string;
    requesterId?: string;
    flowCode: string;
    entityType: 'QUOTE' | 'ORDER' | 'PAYMENT_BILL' | 'RECEIPT_BILL' | 'MEASURE_TASK' | 'ORDER_CHANGE' | 'LEAD_RESTORE';
    entityId: string;
    amount?: string | number;
    comment?: string;
    [key: string]: any; // 支持动态条件字段
}, externalTx?: any) { // externalTx is often 'any' from drizzle transaction, but we can try to type it or keep as is if it's too complex
    const session = await auth();
    const tenantId = payload.tenantId || session?.user?.tenantId;
    const requesterId = payload.requesterId || session?.user?.id;

    if (!tenantId || !requesterId) return { success: false, error: 'Unauthorized/Missing IDs' };

    const run = async (tx: any) => {
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

        // 3. Filter nodes based on conditions (Amount, etc)
        const activeNodes = allNodes.filter((node: typeof allNodes[0]) => {
            // Amount Check
            const amountNum = payload.amount ? parseFloat(payload.amount.toString()) : 0;
            const min = node.minAmount ? parseFloat(node.minAmount.toString()) : 0;
            const max = node.maxAmount ? parseFloat(node.maxAmount.toString()) : Infinity;

            const amountMatch = amountNum >= min && amountNum <= max;
            if (!amountMatch) return false;

            // Custom Conditions Check
            return evaluateConditions(node.conditions as any, payload);
        });

        const firstNode = activeNodes[0];

        if (!firstNode) {
            // No matching nodes - possibly auto-approve but for now we follow strict rules
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
        // Find approvers for the first node
        let approverIds: string[] = [];
        if (firstNode.approverUserId) {
            approverIds = [firstNode.approverUserId];
        } else {
            // Placeholder for role-based approver resolution
            // approverIds = await resolveRoleApprovers(firstNode.approverRole, tenantId);
        }

        for (const userId of approverIds) {
            // Check for Delegation
            const actualApproverId = await ApprovalDelegationService.getEffectiveApprover(userId, flow.id);

            await tx.insert(approvalTasks).values({
                tenantId,
                approvalId: approval.id,
                nodeId: firstNode.id,
                approverId: actualApproverId,
                status: 'PENDING'
            });
        }

        // 6. Update Business Entity Status
        await updateEntityStatus(tx, payload.entityType, payload.entityId, 'PENDING_APPROVAL', tenantId);

        // 7. Trigger Notifications
        const { ApprovalNotificationService } = await import("../services/approval-notification.service");
        const tasks = await tx.query.approvalTasks.findMany({
            where: eq(approvalTasks.approvalId, approval.id)
        });
        for (const t of tasks) {
            ApprovalNotificationService.notifyNewTask(t.id).catch(console.error);
        }

        revalidatePath('/approval');
        return { success: true, approvalId: approval.id, message: '审批提交成功' };
    };

    if (externalTx) {
        return await run(externalTx);
    } else {
        return await db.transaction(async (tx) => {
            try {
                return await run(tx);
            } catch (e: any) {
                return { success: false, error: e.message };
            }
        });
    }
}

async function updateEntityStatus(tx: any, type: string, id: string, status: string, tenantId: string) {
    const targetStatus = status;
    const { orderChanges, orders } = await import('@/shared/api/schema');

    switch (type) {
        case 'QUOTE':
            await tx.update(quotes).set({ status: targetStatus }).where(and(eq(quotes.id, id), eq(quotes.tenantId, tenantId)));
            break;
        case 'ORDER':
            await tx.update(orders).set({ status: targetStatus }).where(and(eq(orders.id, id), eq(orders.tenantId, tenantId)));
            break;
        case 'ORDER_CHANGE':
            await tx.update(orderChanges)
                .set({ status: targetStatus, updatedAt: new Date() })
                .where(and(eq(orderChanges.id, id), eq(orderChanges.tenantId, tenantId)));
            break;
        case 'MEASURE_TASK':
            await tx.update(measureTasks).set({ status: targetStatus }).where(and(eq(measureTasks.id, id), eq(measureTasks.tenantId, tenantId)));
            break;
        case 'PAYMENT_BILL':
            await tx.update(paymentBills).set({ status: targetStatus }).where(and(eq(paymentBills.id, id), eq(paymentBills.tenantId, tenantId)));
            break;
        case 'RECEIPT_BILL':
            await tx.update(receiptBills).set({ status: targetStatus }).where(and(eq(receiptBills.id, id), eq(receiptBills.tenantId, tenantId)));
            break;
    }
}
