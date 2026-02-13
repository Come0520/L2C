'use server';

import { db } from '@/shared/api/db';
import { arStatements } from '@/shared/api/schema';
import { eq, and, lte } from 'drizzle-orm';
import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath } from 'next/cache';

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

    const totalAmount = parseFloat(statement.totalAmount || '0');
    const planNodes = nodes.map(node => ({
        ...node,
        amount: Math.round(totalAmount * node.percentage / 100 * 100) / 100,
        status: 'PENDING' as const,
    }));

    revalidatePath('/finance/ar');

    return {
        success: true,
        plan: { arStatementId, totalAmount, nodes: planNodes }
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
        .filter(s => parseFloat(s.pendingAmount || '0') > 0)
        .map(s => ({
            id: s.id,
            statementNo: s.statementNo,
            customerName: s.customerName,
            pendingAmount: parseFloat(s.pendingAmount || '0'),
            createdAt: s.createdAt,
        }));

    return {
        daysAhead,
        dueCount: dueItems.length,
        totalPendingAmount: dueItems.reduce((sum, i) => sum + i.pendingAmount, 0),
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

    const statement = await db.query.arStatements.findFirst({
        where: and(
            eq(arStatements.id, arStatementId),
            eq(arStatements.tenantId, tenantId)
        )
    });

    if (!statement) {
        return { error: '对账单不存在' };
    }

    const pendingAmount = parseFloat(statement.pendingAmount || '0');
    if (writeOffAmount > pendingAmount) {
        return { error: `核销金额不能超过待收金额 ¥${pendingAmount}` };
    }

    const writeOffData = {
        arStatementId,
        statementNo: statement.statementNo,
        customerName: statement.customerName,
        totalAmount: parseFloat(statement.totalAmount || '0'),
        pendingAmount,
        writeOffAmount,
        reason,
        evidenceUrls: evidenceUrls || [],
        status: 'PENDING_APPROVAL',
        submittedBy: session.user.id,
        submittedAt: new Date().toISOString(),
    };

    revalidatePath('/finance/ar');

    return {
        success: true,
        message: '坏账核销申请已提交，等待审批',
        writeOff: writeOffData,
    };
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

    if (!approved) {
        return { success: true, message: '坏账核销申请已拒绝', status: 'REJECTED' };
    }

    await db.update(arStatements)
        .set({ status: 'BAD_DEBT', pendingAmount: '0' })
        .where(and(
            eq(arStatements.id, arStatementId),
            eq(arStatements.tenantId, tenantId)
        ));

    revalidatePath('/finance/ar');

    return {
        success: true,
        message: `已核销坏账 ¥${writeOffAmount}`,
        status: 'APPROVED',
        remark,
    };
});

export async function processBadDebtApproval(params: z.infer<typeof processBadDebtApprovalSchema>) {
    return processBadDebtApprovalActionInternal(params);
}
