'use server';

import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { reconciliations, arStatements } from '@/shared/api/schema';
import { eq, desc, and, inArray, gte, lte, isNull, or } from 'drizzle-orm';
import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { revalidatePath } from 'next/cache';

// 对账分层定义从 schema.ts 导入
// export { RECONCILIATION_LAYERS, type ReconciliationLayer } from './schema';
// 注意：'use server' 文件不能重新导出，需要直接从 schema.ts 导入

/**
 * 获取对账单列表
 */
export async function getReconciliations() {
    const session = await auth();
    if (!session?.user?.tenantId) return [];

    try {
        const results = await db.query.reconciliations.findMany({
            where: eq(reconciliations.tenantId, session.user.tenantId),
            orderBy: [desc(reconciliations.createdAt)],
            with: {
                // 如果有关联的话可以加上
            }
        });
        return results;
    } catch (error) {
        console.error('Failed to fetch reconciliations:', error);
        return [];
    }
}

/**
 * 获取单条对账单详情
 */
export async function getReconciliation(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) return null;

    try {
        return await db.query.reconciliations.findFirst({
            where: and(
                eq(reconciliations.id, id),
                eq(reconciliations.tenantId, session.user.tenantId)
            ),
            with: {
                details: true,
            }
        });
    } catch (error) {
        console.error('Failed to fetch reconciliation:', error);
        return null;
    }
}

// ============================================================
// [Finance-01] 对账单生成逻辑增强
// ============================================================

const aggregateStatementsSchema = z.object({
    customerIds: z.array(z.string().uuid()).optional(),
    startDate: z.string(), // ISO date
    endDate: z.string(),
    title: z.string().optional(),
});

const generateAggregatedStatementActionInternal = createSafeAction(aggregateStatementsSchema, async (params, { session }) => {
    const { customerIds, startDate, endDate, title } = params;
    const tenantId = session.user.tenantId;

    const conditions = [
        eq(arStatements.tenantId, tenantId),
        gte(arStatements.createdAt, new Date(startDate)),
        lte(arStatements.createdAt, new Date(endDate)),
    ];

    if (customerIds && customerIds.length > 0) {
        conditions.push(inArray(arStatements.customerId, customerIds));
    }

    const statements = await db.query.arStatements.findMany({
        where: and(...conditions),
        with: { customer: true, order: true }
    });

    if (statements.length === 0) {
        return { error: '没有找到符合条件的账单' };
    }

    const customerSummary: Record<string, {
        customerId: string;
        customerName: string;
        totalAmount: number;
        receivedAmount: number;
        pendingAmount: number;
        orderCount: number;
        statementIds: string[];
    }> = {};

    for (const stmt of statements) {
        const cid = stmt.customerId;
        if (!customerSummary[cid]) {
            customerSummary[cid] = {
                customerId: cid,
                customerName: stmt.customerName || '未知客户',
                totalAmount: 0,
                receivedAmount: 0,
                pendingAmount: 0,
                orderCount: 0,
                statementIds: [],
            };
        }
        customerSummary[cid].totalAmount += parseFloat(stmt.totalAmount || '0');
        customerSummary[cid].receivedAmount += parseFloat(stmt.receivedAmount || '0');
        customerSummary[cid].pendingAmount += parseFloat(stmt.pendingAmount || '0');
        customerSummary[cid].orderCount++;
        customerSummary[cid].statementIds.push(stmt.id);
    }

    const periodTitle = title || `${startDate.slice(0, 10)} 至 ${endDate.slice(0, 10)} 对账汇总`;

    revalidatePath('/finance/reconciliation');

    return {
        success: true,
        period: { startDate, endDate },
        title: periodTitle,
        summary: {
            totalAmount: Object.values(customerSummary).reduce((a, b) => a + b.totalAmount, 0),
            receivedAmount: Object.values(customerSummary).reduce((a, b) => a + b.receivedAmount, 0),
            pendingAmount: Object.values(customerSummary).reduce((a, b) => a + b.pendingAmount, 0),
            customerCount: Object.keys(customerSummary).length,
            orderCount: Object.values(customerSummary).reduce((a, b) => a + b.orderCount, 0),
        },
        customers: Object.values(customerSummary),
    };
});

export async function generateAggregatedStatement(params: z.infer<typeof aggregateStatementsSchema>) {
    return generateAggregatedStatementActionInternal(params);
}

const generatePeriodStatementsSchema = z.object({
    period: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
    baseDate: z.string().optional(), // 基准日期，默认今天
});

const generatePeriodStatementsActionInternal = createSafeAction(generatePeriodStatementsSchema, async (params, { session }) => {
    const { period, baseDate } = params;
    const tenantId = session.user.tenantId;

    const now = baseDate ? new Date(baseDate) : new Date();
    let startDate: Date;
    const endDate: Date = now;

    switch (period) {
        case 'WEEKLY':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 7);
            break;
        case 'BIWEEKLY':
            startDate = new Date(now);
            startDate.setDate(startDate.getDate() - 14);
            break;
        case 'MONTHLY':
        default:
            startDate = new Date(now);
            startDate.setMonth(startDate.getMonth() - 1);
            break;
    }

    const pendingStatements = await db.query.arStatements.findMany({
        where: and(
            eq(arStatements.tenantId, tenantId),
            gte(arStatements.createdAt, startDate),
            lte(arStatements.createdAt, endDate),
            or(
                eq(arStatements.status, 'PENDING_RECON'),
                isNull(arStatements.status)
            )
        ),
        with: { customer: true }
    });

    const periodLabel = { WEEKLY: '周', BIWEEKLY: '双周', MONTHLY: '月度' }[period];

    return {
        success: true,
        period: periodLabel,
        dateRange: {
            start: startDate.toISOString().slice(0, 10),
            end: endDate.toISOString().slice(0, 10),
        },
        pendingCount: pendingStatements.length,
        totalPendingAmount: pendingStatements.reduce((sum, s) => sum + parseFloat(s.pendingAmount || '0'), 0),
        statements: pendingStatements.map(s => ({
            id: s.id,
            statementNo: s.statementNo,
            customerName: s.customerName,
            totalAmount: parseFloat(s.totalAmount || '0'),
            pendingAmount: parseFloat(s.pendingAmount || '0'),
        })),
    };
});

export async function generatePeriodStatements(params: z.infer<typeof generatePeriodStatementsSchema>) {
    return generatePeriodStatementsActionInternal(params);
}

// ============================================================
// [Finance-01] 多单据核销逻辑
// ============================================================

const batchWriteOffSchema = z.object({
    /** 要核销的账单 ID 列表 */
    statementIds: z.array(z.string().uuid()),
    /** 收款单 ID（用于核销） */
    receiptId: z.string().uuid(),
    /** 核销金额分配（可选，自动分配则留空） */
    allocations: z.array(z.object({
        statementId: z.string().uuid(),
        amount: z.number().positive(),
    })).optional(),
    /** 备注 */
    remark: z.string().optional(),
});

const batchWriteOffActionInternal = createSafeAction(batchWriteOffSchema, async (params, { session }) => {
    const { statementIds, receiptId, allocations, remark } = params;
    const tenantId = session.user.tenantId;

    const { receiptBills } = await import('@/shared/api/schema/finance');
    const receipt = await db.query.receiptBills.findFirst({
        where: and(
            eq(receiptBills.id, receiptId),
            eq(receiptBills.tenantId, tenantId)
        ),
    });

    if (!receipt) {
        return { error: '收款单不存在' };
    }

    const statements = await db.query.arStatements.findMany({
        where: and(
            eq(arStatements.tenantId, tenantId),
            inArray(arStatements.id, statementIds)
        ),
    });

    if (statements.length === 0) {
        return { error: '没有找到要核销的账单' };
    }

    const receiptAmount = parseFloat(receipt.totalAmount || '0');
    const usedAmount = parseFloat(receipt.usedAmount || '0');
    const availableAmount = receiptAmount - usedAmount;

    if (availableAmount <= 0) {
        return { error: '收款单可用金额不足' };
    }

    type AllocationItem = { statementId: string; amount: number; statementNo: string };
    let finalAllocations: AllocationItem[] = [];

    if (allocations && allocations.length > 0) {
        const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
        if (totalAllocated > availableAmount) {
            return { error: `分配金额 (${totalAllocated}) 超出可用金额 (${availableAmount})` };
        }
        finalAllocations = allocations.map(a => ({
            ...a,
            statementNo: statements.find(s => s.id === a.statementId)?.statementNo || '',
        }));
    } else {
        const totalPending = statements.reduce((sum, s) => sum + parseFloat(s.pendingAmount || '0'), 0);
        const remaining = Math.min(availableAmount, totalPending);

        for (const stmt of statements) {
            const pending = parseFloat(stmt.pendingAmount || '0');
            const allocAmount = totalPending > 0
                ? Math.min(pending, (pending / totalPending) * remaining)
                : 0;

            if (allocAmount > 0) {
                finalAllocations.push({
                    statementId: stmt.id,
                    statementNo: stmt.statementNo || '',
                    amount: Math.round(allocAmount * 100) / 100,
                });
            }
        }
    }

    const writeOffResults: { statementId: string; statementNo: string; amount: number; success: boolean }[] = [];

    for (const alloc of finalAllocations) {
        const stmt = statements.find(s => s.id === alloc.statementId);
        if (!stmt) continue;

        const currentReceived = parseFloat(stmt.receivedAmount || '0');
        const newReceived = currentReceived + alloc.amount;
        const newPending = parseFloat(stmt.totalAmount || '0') - newReceived;
        const newStatus = newPending <= 0 ? 'COMPLETED' : 'PARTIAL';

        await db.update(arStatements)
            .set({
                receivedAmount: String(newReceived),
                pendingAmount: String(Math.max(0, newPending)),
                status: newStatus,
                updatedAt: new Date(),
            })
            .where(eq(arStatements.id, alloc.statementId));

        writeOffResults.push({
            statementId: alloc.statementId,
            statementNo: alloc.statementNo,
            amount: alloc.amount,
            success: true,
        });
    }

    const totalWrittenOff = writeOffResults.reduce((sum, r) => sum + r.amount, 0);
    const newUsedAmount = usedAmount + totalWrittenOff;
    const newReceiptStatus = newUsedAmount >= receiptAmount ? 'FULLY_USED' : 'PARTIAL_USED';

    await db.update(receiptBills)
        .set({
            usedAmount: String(newUsedAmount),
            status: newReceiptStatus,
            updatedAt: new Date(),
        })
        .where(eq(receiptBills.id, receiptId));

    revalidatePath('/finance/reconciliation');
    revalidatePath('/finance/receipt');

    return {
        success: true,
        receiptId,
        totalWrittenOff,
        writeOffCount: writeOffResults.length,
        details: writeOffResults,
        remark,
    };
});

export async function batchWriteOff(params: z.infer<typeof batchWriteOffSchema>) {
    return batchWriteOffActionInternal(params);
}

// ============================================================
// [Finance-01] 跨期对账处理
// ============================================================

const crossPeriodReconciliationSchema = z.object({
    /** 原账期开始日期 */
    originalStartDate: z.string(),
    /** 原账期结束日期 */
    originalEndDate: z.string(),
    /** 新账期结束日期 */
    newEndDate: z.string(),
    /** 客户 ID（可选，不填则处理所有） */
    customerId: z.string().uuid().optional(),
});

const crossPeriodReconciliationActionInternal = createSafeAction(crossPeriodReconciliationSchema, async (params, { session }) => {
    const { originalStartDate, originalEndDate, newEndDate, customerId } = params;
    const tenantId = session.user.tenantId;

    const conditions = [
        eq(arStatements.tenantId, tenantId),
        gte(arStatements.createdAt, new Date(originalStartDate)),
        lte(arStatements.createdAt, new Date(originalEndDate)),
        // 筛选未结清的账单状态：PENDING_RECON（待对账）或 PARTIAL（部分收款）
        or(
            eq(arStatements.status, 'PENDING_RECON'),
            eq(arStatements.status, 'PARTIAL')
        ),
    ];

    if (customerId) {
        conditions.push(eq(arStatements.customerId, customerId));
    }

    const pendingStatements = await db.query.arStatements.findMany({
        where: and(...conditions),
        with: { customer: true }
    });

    if (pendingStatements.length === 0) {
        return { success: true, message: '该账期内无未结清账单', movedCount: 0 };
    }

    const summary = {
        originalPeriod: `${originalStartDate} 至 ${originalEndDate}`,
        newPeriod: `${originalStartDate} 至 ${newEndDate}`,
        movedCount: pendingStatements.length,
        totalPendingAmount: pendingStatements.reduce((sum, s) => sum + parseFloat(s.pendingAmount || '0'), 0),
        customerBreakdown: new Map<string, { name: string; count: number; amount: number }>(),
    };

    for (const stmt of pendingStatements) {
        const cid = stmt.customerId;
        const existing = summary.customerBreakdown.get(cid) || { name: stmt.customerName || '未知', count: 0, amount: 0 };
        existing.count++;
        existing.amount += parseFloat(stmt.pendingAmount || '0');
        summary.customerBreakdown.set(cid, existing);
    }

    revalidatePath('/finance/reconciliation');

    return {
        success: true,
        message: '跨期对账分析完成',
        ...summary,
        customerBreakdown: Array.from(summary.customerBreakdown.entries()).map(([id, data]) => ({
            customerId: id,
            ...data,
        })),
    };
});

export async function crossPeriodReconciliation(params: z.infer<typeof crossPeriodReconciliationSchema>) {
    return crossPeriodReconciliationActionInternal(params);
}

