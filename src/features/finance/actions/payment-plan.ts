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

/**
 * 创建多节点收款计划
 */
export const createPaymentPlan = createSafeAction(createPaymentPlanSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.FINANCE.MANAGE);

    const { arStatementId, nodes } = params;
    const tenantId = session.user.tenantId;

    // 验证总百分比等于 100
    const totalPercentage = nodes.reduce((sum, n) => sum + n.percentage, 0);
    if (totalPercentage !== 100) {
        return { error: `收款比例总和必须等于 100%，当前为 ${totalPercentage}%` };
    }

    // 获取对账单
    const statement = await db.query.arStatements.findFirst({
        where: and(
            eq(arStatements.id, arStatementId),
            eq(arStatements.tenantId, tenantId)
        )
    });

    if (!statement) {
        return { error: '对账单不存在' };
    }

    // 计算各节点金额
    const totalAmount = parseFloat(statement.totalAmount || '0');
    const planNodes = nodes.map(node => ({
        ...node,
        amount: Math.round(totalAmount * node.percentage / 100 * 100) / 100,
        status: 'PENDING' as const,
    }));

    // TODO: 保存到数据库（需要 paymentPlanNodes 表）
    // 这里返回计划预览
    revalidatePath('/finance/ar');

    return {
        success: true,
        plan: {
            arStatementId,
            totalAmount,
            nodes: planNodes,
        }
    };
});

/**
 * 获取到期提醒的收款节点
 */
const getDueRemindersSchema = z.object({
    daysAhead: z.number().min(0).max(30).default(7),
});

export const getPaymentDueReminders = createSafeAction(getDueRemindersSchema, async (params, { session }) => {
    const { daysAhead } = params;
    const tenantId = session.user.tenantId;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // 查询未收完且有待收金额的账单
    const pendingStatements = await db.query.arStatements.findMany({
        where: and(
            eq(arStatements.tenantId, tenantId),
            lte(arStatements.createdAt, futureDate) // 简化逻辑：创建时间在范围内
        ),
        with: {
            customer: true,
            order: true,
        }
    });

    // 筛选有待收金额的
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
        items: dueItems.slice(0, 20), // 最多返回20条
    };
});

// ============================================================
// [Finance-03] 坏账核销流程
// ============================================================

const submitBadDebtWriteOffSchema = z.object({
    arStatementId: z.string().uuid(),
    writeOffAmount: z.number().min(0),
    reason: z.string().min(1, '请填写坏账原因'),
    evidenceUrls: z.array(z.string()).optional(),
});

/**
 * 提交坏账核销申请（触发审批流程）
 */
export const submitBadDebtWriteOff = createSafeAction(submitBadDebtWriteOffSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.FINANCE.MANAGE);

    const { arStatementId, writeOffAmount, reason, evidenceUrls } = params;
    const tenantId = session.user.tenantId;

    // 获取对账单
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

    // TODO: 集成审批模块，创建 BAD_DEBT_WRITEOFF 审批实例
    // 这里先返回预览信息
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

/**
 * 处理坏账核销审批结果
 */
const processBadDebtApprovalSchema = z.object({
    arStatementId: z.string().uuid(),
    approved: z.boolean(),
    writeOffAmount: z.number().min(0),
    remark: z.string().optional(),
});

export const processBadDebtApproval = createSafeAction(processBadDebtApprovalSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.FINANCE.MANAGE);

    const { arStatementId, approved, writeOffAmount, remark } = params;
    const tenantId = session.user.tenantId;

    if (!approved) {
        return {
            success: true,
            message: '坏账核销申请已拒绝',
            status: 'REJECTED',
        };
    }

    // 更新对账单状态为坏账
    await db.update(arStatements)
        .set({
            status: 'BAD_DEBT',
            pendingAmount: '0', // 核销后待收为0
            // 可以添加 badDebtAmount 字段记录核销金额
        })
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
