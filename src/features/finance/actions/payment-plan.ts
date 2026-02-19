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

export async function processBadDebtApproval(params: z.infer<typeof processBadDebtApprovalSchema>) {
    return processBadDebtApprovalActionInternal(params);
}
