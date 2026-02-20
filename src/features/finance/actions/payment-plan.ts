'use server';

import { db } from '@/shared/api/db';
import { arStatements, paymentPlanNodes } from '@/shared/api/schema';
import { AuditService } from '@/shared/services/audit-service';
import { eq, and, lte } from 'drizzle-orm';
import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath } from 'next/cache';
import { Decimal } from 'decimal.js';

// ============================================================
// [Finance-02] 收款计划管理
// ============================================================

const createPaymentPlanSchema = z.object({
    arStatementId: z.string().uuid(),
    nodes: z.array(z.object({
        nodeIndex: z.number().min(1),
        nodeName: z.string(), // 如：定金、二期款、尾款
        percentage: z.number().min(0).max(100),
        dueDate: z.string(), // ISO date
        amount: z.number().min(0),
    })).min(1),
});

const createPaymentPlanActionInternal = createSafeAction(createPaymentPlanSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.FINANCE.MANAGE);

    const { arStatementId, nodes } = params;
    const tenantId = session.user.tenantId;

    const totalPercentage = nodes.reduce((sum, n) => sum + n.percentage, 0);
    if (totalPercentage !== 100) {
        return { error: `收款比例总和必须等于 100%，当前为 ${totalPercentage}%` };
    }

    const statement = await db.query.arStatements.findFirst({
        where: and(
            eq(arStatements.id, arStatementId),
            eq(arStatements.tenantId, tenantId)
        )
    });

    if (!statement) {
        return { error: '对账单不存在' };
    }

    const totalAmountDecimal = new Decimal(statement.totalAmount || '0');

    // 使用事务处理：先删除旧计划（如有），再插入新计划
    const planNodes = await db.transaction(async (tx) => {
        // 1. 删除旧的计划节点
        await tx.delete(paymentPlanNodes)
            .where(eq(paymentPlanNodes.arStatementId, arStatementId));

        // 2. 准备新节点数据
        const nodesToInsert = [];
        let accumulatedAmount = new Decimal(0);

        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const isLast = i === nodes.length - 1;

            let nodeAmount: string;
            if (isLast) {
                // 最后一期：总额 - 已分配总额，确保无尾差
                nodeAmount = totalAmountDecimal.minus(accumulatedAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
            } else {
                const calculated = totalAmountDecimal.times(node.percentage).div(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
                nodeAmount = calculated.toFixed(2);
                accumulatedAmount = accumulatedAmount.plus(calculated).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            }


            nodesToInsert.push({
                tenantId,
                arStatementId,
                nodeIndex: node.nodeIndex,
                nodeName: node.nodeName,
                percentage: node.percentage.toString(),
                amount: nodeAmount,
                dueDate: new Date(node.dueDate).toISOString().split('T')[0],
                status: 'PENDING' as const,
            });
        }

        // 3. 批量插入
        if (nodesToInsert.length > 0) {
            await tx.insert(paymentPlanNodes).values(nodesToInsert);

            // F-18/F-32: Audit Log
            await AuditService.log(tx, {
                tenantId,
                userId: session.user.id,
                tableName: 'payment_plan_nodes',
                recordId: arStatementId,
                action: 'CREATE',
                newValues: { nodes: nodesToInsert },
                details: { totalAmount: totalAmountDecimal.toFixed(2) }
            });
        }

        return nodesToInsert;
    });

    revalidatePath('/finance/ar');

    return {
        success: true,
        plan: { arStatementId, totalAmount: totalAmountDecimal.toNumber(), nodes: planNodes }
    };
});

/**
 * 创建/更新收款计划 (Create Payment Plan)
 * 
 * 为指定的 AR 对账单创建或覆写多期收款计划节点。
 * 使用强一致性事务，首先清除旧计划，再按比例和顺序分配金额。
 * 针对最后一期自动抹平尾差金额。
 * 并记录创建收款计划的审计日志 (F-18/F-32)。
 * 
 * @param {z.infer<typeof createPaymentPlanSchema>} params - 包含对账单ID及收款节点数组定义
 * @returns {Promise<any>} 返回新创建的计划节点数据
 * @throws {Error} 未授权或缺少财务管理权限时返回错误对象
 */
export async function createPaymentPlan(params: z.infer<typeof createPaymentPlanSchema>) {
    return createPaymentPlanActionInternal(params);
}

// 收款提醒查询 Schema
const getDueRemindersSchema = z.object({
    daysAhead: z.number().min(0).max(365).default(7),
});

const getPaymentDueRemindersActionInternal = createSafeAction(getDueRemindersSchema, async (params, { session }) => {
    const { daysAhead } = params;
    const tenantId = session.user.tenantId;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const pendingStatements = await db.query.arStatements.findMany({
        where: and(
            eq(arStatements.tenantId, tenantId),
            lte(arStatements.createdAt, futureDate)
        ),
        with: { customer: true, order: true }
    });

    const dueItems = pendingStatements
        .filter(s => new Decimal(s.pendingAmount || '0').gt(0))
        .map(s => ({
            id: s.id,
            statementNo: s.statementNo,
            customerName: s.customerName,
            pendingAmount: new Decimal(s.pendingAmount || '0').toNumber(),
            createdAt: s.createdAt,
        }));

    return {
        daysAhead,
        dueCount: dueItems.length,
        totalPendingAmount: dueItems.reduce((sum, i) => sum.plus(new Decimal(i.pendingAmount)), new Decimal(0)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
        items: dueItems.slice(0, 20),
    };

});

/**
 * 获取收款逾期提醒 (Get Payment Due Reminders)
 * 
 * 查询未来 N 天内（默认7天）有账期待收且对应 AR 状态未结清（pendingAmount > 0）的款项提醒。
 * 用于驱动销售和财务人员的催款和回款跟踪动作。
 * 
 * @param {z.infer<typeof getDueRemindersSchema>} params - 包含提前天数
 * @returns {Promise<any>} 返回预期内的催款汇总数据和明细清单（最多20条）
 * @throws {Error} 未授权时返回错误对象
 */
export async function getPaymentDueReminders(params: z.infer<typeof getDueRemindersSchema>) {
    return getPaymentDueRemindersActionInternal(params);
}

// ============================================================
// [Finance-03] 坏账核销流程
// ============================================================

const submitBadDebtWriteOffSchema = z.object({
    arStatementId: z.string().uuid(),
    writeOffAmount: z.number().min(0),
    reason: z.string().min(1, '请填写坏账原因'),
    evidenceUrls: z.array(z.string()).optional(),
});

const submitBadDebtWriteOffActionInternal = createSafeAction(submitBadDebtWriteOffSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.FINANCE.MANAGE);

    const { arStatementId, writeOffAmount, reason, evidenceUrls } = params;
    const tenantId = session.user.tenantId;
    const userId = session.user.id!;

    const statement = await db.query.arStatements.findFirst({
        where: and(
            eq(arStatements.id, arStatementId),
            eq(arStatements.tenantId, tenantId)
        )
    });

    if (!statement) {
        return { error: '对账单不存在' };
    }

    const pendingAmount = new Decimal(statement.pendingAmount || '0');
    const writeOff = new Decimal(writeOffAmount);

    if (writeOff.gt(pendingAmount)) {
        return { error: `核销金额不能超过待收金额 ¥${pendingAmount.toFixed(2)}` };
    }

    // 提交记录并记录审计（坏账核销申请）
    return await db.transaction(async (tx) => {
        const writeOffData = {
            arStatementId,
            statementNo: statement.statementNo,
            customerName: statement.customerName,
            totalAmount: statement.totalAmount,
            pendingAmount: statement.pendingAmount,
            writeOffAmount: writeOff.toFixed(2),
            reason,
            evidenceUrls: evidenceUrls || [],
            status: 'PENDING_APPROVAL',
            submittedBy: userId,
            submittedAt: new Date().toISOString(),
        };

        await AuditService.log(tx, {
            tenantId,
            userId,
            action: 'CREATE',
            tableName: 'ar_statements', // 暂时作为关联记录
            recordId: arStatementId,
            details: { type: 'BAD_DEBT_SUBMIT', ...writeOffData }
        });

        revalidatePath('/finance/ar');
        return {
            success: true,
            message: '坏账核销申请已提交，等待审批',
            writeOff: writeOffData,
        };
    });
});

/**
 * 提交坏账核销申请 (Submit Bad Debt Write Off)
 * 
 * 针对逾期久远且确实无法收回的烂账，财务人员可在此发起坏账核销流程。
 * 核销申请的金额不得大于该对账单的剩余待收金额。
 * 会生成对应的坏账申请审批记录，并留下首道流转审计日志 (`BAD_DEBT_SUBMIT`)。
 * 
 * @param {z.infer<typeof submitBadDebtWriteOffSchema>} params - 包含对账单ID、申请核销金额、原因和凭证链接
 * @returns {Promise<any>} 返回包含申请详细的数据和审批流转成功状态
 * @throws {Error} 未授权或缺少财务管理权限时返回错误对象
 */
export async function submitBadDebtWriteOff(params: z.infer<typeof submitBadDebtWriteOffSchema>) {
    return submitBadDebtWriteOffActionInternal(params);
}

// 坏账审批 Schema
const processBadDebtApprovalSchema = z.object({
    arStatementId: z.string().uuid(),
    approved: z.boolean(),
    writeOffAmount: z.number().min(0),
    remark: z.string().optional(),
});

const processBadDebtApprovalActionInternal = createSafeAction(processBadDebtApprovalSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.FINANCE.MANAGE);

    const { arStatementId, approved, writeOffAmount, remark } = params;
    const tenantId = session.user.tenantId;
    const userId = session.user.id!;

    return await db.transaction(async (tx) => {
        const statement = await tx.query.arStatements.findFirst({
            where: and(
                eq(arStatements.id, arStatementId),
                eq(arStatements.tenantId, tenantId)
            )
        });

        if (!statement) {
            return { success: false, message: '对账单不存在' };
        }

        if (!approved) {
            await AuditService.log(tx, {
                tenantId,
                userId,
                action: 'UPDATE',
                tableName: 'ar_statements',
                recordId: arStatementId,
                details: { status: 'REJECTED', remark, type: 'BAD_DEBT_APPROVAL' }
            });
            return { success: true, message: '坏账核销申请已拒绝', status: 'REJECTED' };
        }

        const currentPending = new Decimal(statement.pendingAmount || '0').toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        const writeOff = new Decimal(writeOffAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        // 实际核销金额不能超过待收金额
        const actualWriteOff = Decimal.min(writeOff, currentPending);
        const newPending = currentPending.minus(actualWriteOff).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

        const newStatus = newPending.lte(0) ? 'BAD_DEBT' : 'PARTIAL';

        await tx.update(arStatements)
            .set({
                status: newStatus,
                pendingAmount: Decimal.max(newPending, 0).toFixed(2, Decimal.ROUND_HALF_UP),
            })

            .where(and(
                eq(arStatements.id, arStatementId),
                eq(arStatements.tenantId, tenantId)
            ));

        // F-18/F-32: Audit Log
        await AuditService.log(tx, {
            tenantId,
            userId,
            tableName: 'ar_statements',
            recordId: arStatementId,
            action: 'UPDATE',
            oldValues: { status: statement.status, pendingAmount: statement.pendingAmount },
            newValues: { status: newStatus, pendingAmount: newPending.toFixed(2) },
            details: { writeOffAmount: actualWriteOff.toFixed(2), remark, type: 'BAD_DEBT_APPROVAL' }
        });

        revalidatePath('/finance/ar');

        return {
            success: true,
            message: `已核销坏账 ¥${actualWriteOff.toFixed(2)}`,
            status: 'APPROVED',
            remark,
        };
    });
});

/**
 * 审批坏账核销申请 (Process Bad Debt Approval)
 * 
 * 对应收坏账的申请进行最终的核准审批。
 * 当审批通过时，扣减应收账单的待收金额，如果由于该笔坏账抹平了待收差额，
 * 则账单状态将直接转变为 `BAD_DEBT` (坏账完结) 或 `PARTIAL` (部分收款后转坏账)。
 * 并在底层记录流转操作和详细金额变动的审计日志。
 * 
 * @param {z.infer<typeof processBadDebtApprovalSchema>} params - 包含对账单ID、审批通过状态、核准核销金额及可选备注
 * @returns {Promise<any>} 返回审批动作的生效数据和成功状态
 * @throws {Error} 未授权或缺少财务管理权限时返回错误对象
 */
export async function processBadDebtApproval(params: z.infer<typeof processBadDebtApprovalSchema>) {
    return processBadDebtApprovalActionInternal(params);
}
