'use server';

import { logger } from "@/shared/lib/logger";

import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { db } from '@/shared/api/db';
import { reconciliations, arStatements, receiptBills } from '@/shared/api/schema';
import { eq, desc, and, inArray, gte, lte, isNull, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { unstable_cache, revalidateTag } from 'next/cache';
import { Decimal } from 'decimal.js';
import { AuditService } from '@/shared/services/audit-service';

/**
 * 获取对账单列表 (Get Reconciliations)
 * 
 * 获取当前租户下所有的对账单，按创建时间倒序排列。
 * 
 * @returns {Promise<Array<typeof reconciliations.$inferSelect>>} 对账单列表
 * @throws {Error} 未授权或权限不足时抛出错误
 */
export async function getReconciliations() {
    const session = await auth();
    if (!session?.user?.tenantId) return [];

    // 权限检查：对账
    if (!await checkPermission(session, PERMISSIONS.FINANCE.AR_RECONCILE)) throw new Error('权限不足：需要对账权限');

    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            logger.info('[finance] [CACHE_MISS] 获取对账单列表', { tenantId });
            try {
                return await db.query.reconciliations.findMany({
                    where: eq(reconciliations.tenantId, tenantId),
                    orderBy: [desc(reconciliations.createdAt)],
                });
            } catch (error) {
                logger.error('❌ getReconciliations Error:', error);
                return [];
            }
        },
        [`reconciliations-${tenantId}`],
        {
            tags: [`finance-reconciliation-${tenantId}`],
            revalidate: 120,
        }
    )();
}

/**
 * 获取单条对账单详情 (Get Reconciliation Details)
 * 
 * 根据对账单 ID 查询详细信息，包含关联的明细记录。
 * 
 * @param {string} id - 对账单的一级主键 ID
 * @returns {Promise<ReconciliationWithRelations | null>} 对账单详细信息（包含关系数据），未找到则返回 null
 * @throws {Error} 未授权或权限不足时抛出错误
 */
export async function getReconciliation(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) return null;

    // 权限检查：对账
    if (!await checkPermission(session, PERMISSIONS.FINANCE.AR_RECONCILE)) throw new Error('权限不足：需要对账权限');

    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            logger.info('[finance] [CACHE_MISS] 获取单条对账单详情', { id, tenantId });
            try {
                return await db.query.reconciliations.findFirst({
                    where: and(
                        eq(reconciliations.id, id),
                        eq(reconciliations.tenantId, tenantId)
                    ),
                    with: {
                        details: true,
                    }
                });
            } catch (error) {
                logger.error('❌ getReconciliation Error:', error);
                return null;
            }
        },
        [`reconciliation-detail-${id}`],
        {
            tags: [`finance-reconciliation-detail-${id}`],
            revalidate: 120,
        }
    )();
}

const aggregateStatementsSchema = z.object({
    customerIds: z.array(z.string().uuid()).optional(),
    startDate: z.string(), // ISO date
    endDate: z.string(),
    title: z.string().optional(),
});

const generateAggregatedStatementActionInternal = createSafeAction(aggregateStatementsSchema, async (params, { session }) => {
    const { customerIds, startDate, endDate, title } = params;
    const tenantId = session.user.tenantId;

    logger.info('[finance] 开始生成汇总对账单', { customerIdsCount: customerIds?.length, startDate, endDate });

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
        logger.info('[finance] 未找到符合条件的对账单', { params });
        return { error: '没有找到符合条件的账单' };
    }

    const customerSummary: Record<string, {
        customerId: string;
        customerName: string;
        totalAmount: Decimal;
        receivedAmount: Decimal;
        pendingAmount: Decimal;
        orderCount: number;
        statementIds: string[];
    }> = {};

    for (const stmt of statements) {
        const cid = stmt.customerId;
        if (!customerSummary[cid]) {
            customerSummary[cid] = {
                customerId: cid,
                customerName: stmt.customerName || '未知客户',
                totalAmount: new Decimal(0),
                receivedAmount: new Decimal(0),
                pendingAmount: new Decimal(0),
                orderCount: 0,
                statementIds: [],
            };
        }
        customerSummary[cid].totalAmount = customerSummary[cid].totalAmount.plus(stmt.totalAmount || '0');
        customerSummary[cid].receivedAmount = customerSummary[cid].receivedAmount.plus(stmt.receivedAmount || '0');
        customerSummary[cid].pendingAmount = customerSummary[cid].pendingAmount.plus(stmt.pendingAmount || '0');
        customerSummary[cid].orderCount++;
        customerSummary[cid].statementIds.push(stmt.id);
    }

    const periodTitle = title || `${startDate.slice(0, 10)} 至 ${endDate.slice(0, 10)} 对账汇总`;

    logger.info('[finance] 汇总对账单生成成功', { customerCount: Object.keys(customerSummary).length });

    revalidateTag(`finance-reconciliation-${session.user.tenantId}`, {});

    return {
        success: true,
        period: { startDate, endDate },
        title: periodTitle,
        summary: {
            totalAmount: Object.values(customerSummary).reduce((a, b) => a.plus(b.totalAmount), new Decimal(0)).toFixed(2, Decimal.ROUND_HALF_UP),
            receivedAmount: Object.values(customerSummary).reduce((a, b) => a.plus(b.receivedAmount), new Decimal(0)).toFixed(2, Decimal.ROUND_HALF_UP),
            pendingAmount: Object.values(customerSummary).reduce((a, b) => a.plus(b.pendingAmount), new Decimal(0)).toFixed(2, Decimal.ROUND_HALF_UP),
            customerCount: Object.keys(customerSummary).length,
            orderCount: Object.values(customerSummary).reduce((a, b) => a + b.orderCount, 0),
        },
        customers: Object.values(customerSummary).map(c => ({
            ...c,
            totalAmount: c.totalAmount.toFixed(2, Decimal.ROUND_HALF_UP),
            receivedAmount: c.receivedAmount.toFixed(2, Decimal.ROUND_HALF_UP),
            pendingAmount: c.pendingAmount.toFixed(2, Decimal.ROUND_HALF_UP),
        })),
    };
});

export async function generateAggregatedStatement(params: z.infer<typeof aggregateStatementsSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');
    if (!await checkPermission(session, PERMISSIONS.FINANCE.AR_RECONCILE)) throw new Error('权限不足：需要对账权限');

    logger.info('[finance] generateAggregatedStatement 入口', { params });

    try {
        return generateAggregatedStatementActionInternal(params);
    } catch (error) {
        logger.info('[finance] generateAggregatedStatement 失败', { error, params });
        logger.error('❌ generateAggregatedStatement Error:', error);
        throw error;
    }
}

const generatePeriodStatementsSchema = z.object({
    period: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
    baseDate: z.string().optional(),
});

const generatePeriodStatementsActionInternal = createSafeAction(generatePeriodStatementsSchema, async (params, { session }) => {
    const { period, baseDate } = params;
    const tenantId = session.user.tenantId;

    logger.info('[finance] 开始生成周期对账单', { period, baseDate });

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

    logger.info('[finance] 周期对账单查询完成', { count: pendingStatements.length });

    const periodLabel = { WEEKLY: '周', BIWEEKLY: '双周', MONTHLY: '月度' }[period];

    return {
        success: true,
        period: periodLabel,
        dateRange: {
            start: startDate.toISOString().slice(0, 10),
            end: endDate.toISOString().slice(0, 10),
        },
        pendingCount: pendingStatements.length,
        totalPendingAmount: pendingStatements.reduce((sum, s) => sum.plus(new Decimal(s.pendingAmount || '0')), new Decimal(0)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
        statements: pendingStatements.map(s => ({
            id: s.id,
            statementNo: s.statementNo,
            customerName: s.customerName,
            totalAmount: new Decimal(s.totalAmount || '0').toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
            pendingAmount: new Decimal(s.pendingAmount || '0').toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
        })),
    };
});

export async function generatePeriodStatements(params: z.infer<typeof generatePeriodStatementsSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');
    if (!await checkPermission(session, PERMISSIONS.FINANCE.AR_RECONCILE)) throw new Error('权限不足：需要对账权限');

    logger.info('[finance] generatePeriodStatements 入口', { params });

    try {
        return generatePeriodStatementsActionInternal(params);
    } catch (error) {
        logger.info('[finance] generatePeriodStatements 失败', { error, params });
        logger.error('❌ generatePeriodStatements Error:', error);
        throw error;
    }
}

const batchWriteOffSchema = z.object({
    statementIds: z.array(z.string().uuid()),
    receiptId: z.string().uuid(),
    allocations: z.array(z.object({
        statementId: z.string().uuid(),
        amount: z.number().positive(),
    })).optional(),
    remark: z.string().optional(),
});

const batchWriteOffActionInternal = createSafeAction(batchWriteOffSchema, async (params, { session }) => {
    const { receiptId, statementIds, allocations, remark } = params;
    const tenantId = session.user.tenantId;
    const userId = session.user.id!;

    logger.info('[finance] 开始批量核销分析', { receiptId, statementIdsCount: statementIds.length });

    return await db.transaction(async (tx) => {
        // 1. 获取并校验收款单 (Receipt Bill Verification)
        const receipt = await tx.query.receiptBills.findFirst({
            where: and(
                eq(receiptBills.id, receiptId),
                eq(receiptBills.tenantId, tenantId)
            ),
        });

        if (!receipt) {
            logger.info('[finance] 批量核销失败：收款单不存在', { receiptId });
            return { error: '收款单不存在' };
        }

        if (receipt.status !== 'VERIFIED' && receipt.status !== 'PARTIAL_USED') {
            logger.info('[finance] 批量核销失败：收款单状态不可用', { receiptNo: receipt.receiptNo, status: receipt.status });
            return { error: `收款单当前状态为 ${receipt.status}，不可核销。请确保已核实。` };
        }

        // 2. 获取并校验待核销账单 (AR Statements Verification)
        const statements = await tx.query.arStatements.findMany({
            where: and(
                eq(arStatements.tenantId, tenantId),
                inArray(arStatements.id, statementIds)
            ),
        });

        if (statements.length === 0) {
            logger.info('[finance] 批量核销失败：待核销账单不存在', { statementIds });
            return { error: '没有找到要核销的账单' };
        }

        const invalidStatements = statements.filter(s => s.status === 'PAID' || s.status === 'COMPLETED' || s.status === 'BAD_DEBT');
        if (invalidStatements.length > 0) {
            logger.info('[finance] 批量核销失败：部分账单不可核销', { invalidStatements: invalidStatements.map(s => s.statementNo) });
            return { error: `部分账单已结清或不可核销: ${invalidStatements.map(s => s.statementNo).join(', ')}` };
        }

        const receiptAmount = new Decimal(receipt.totalAmount || '0');
        const usedAmountBefore = new Decimal(receipt.usedAmount || '0');
        const availableAmount = receiptAmount.minus(usedAmountBefore);

        if (availableAmount.lte(0)) {
            logger.info('[finance] 批量核销失败：收款单可用金额不足', { receiptNo: receipt.receiptNo, availableAmount: availableAmount.toFixed(2) });
            return { error: '收款单可用余额不足' };
        }

        // 3. 计算核销分配 (Allocation Logic)
        type AllocationItem = { statementId: string; amount: Decimal; statementNo: string };
        let finalAllocations: AllocationItem[] = [];

        if (allocations && allocations.length > 0) {
            const totalAllocated = allocations.reduce((sum, a) => sum.plus(new Decimal(a.amount)), new Decimal(0)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            if (totalAllocated.gt(availableAmount)) {
                return { error: `分配金额 (${totalAllocated.toFixed(2, Decimal.ROUND_HALF_UP)}) 超出可用金额 (${availableAmount.toFixed(2, Decimal.ROUND_HALF_UP)})` };
            }
            finalAllocations = allocations.map(a => ({
                statementId: a.statementId,
                amount: new Decimal(a.amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
                statementNo: statements.find(s => s.id === a.statementId)?.statementNo || '',
            }));
            logger.info('[finance] 批量核销使用指定分配', { totalAllocated: totalAllocated.toFixed(2) });
        } else {
            let remainingToAlloc = availableAmount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            for (const stmt of statements) {
                if (remainingToAlloc.lte(0)) break;
                const pending = new Decimal(stmt.pendingAmount || '0').toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
                const allocAmount = Decimal.min(pending, remainingToAlloc);
                if (allocAmount.gt(0)) {
                    finalAllocations.push({
                        statementId: stmt.id,
                        statementNo: stmt.statementNo || '',
                        amount: allocAmount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP),
                    });
                    remainingToAlloc = remainingToAlloc.minus(allocAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
                }
            }
            logger.info('[finance] 批量核销使用自动分配', { allocationsCount: finalAllocations.length });
        }

        // 4. 执行核销逻辑 (Execution)
        const writeOffResults: { statementId: string; statementNo: string; amount: string; success: boolean }[] = [];
        let totalWrittenOff = new Decimal(0);

        for (const alloc of finalAllocations) {
            const stmt = statements.find(s => s.id === alloc.statementId);
            if (!stmt) continue;

            const currentReceived = new Decimal(stmt.receivedAmount || '0').toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            const newReceived = currentReceived.plus(alloc.amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            const totalStmtAmount = new Decimal(stmt.totalAmount || '0').toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            const newPending = totalStmtAmount.minus(newReceived).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            const newStatus = newPending.lte(0) ? 'PAID' : 'PARTIAL';

            const [updatedStmt] = await tx.update(arStatements)
                .set({
                    receivedAmount: newReceived.toFixed(2, Decimal.ROUND_HALF_UP),
                    pendingAmount: Decimal.max(0, newPending).toFixed(2, Decimal.ROUND_HALF_UP),
                    status: newStatus,
                    version: sql`${arStatements.version} + 1`,
                    updatedAt: new Date(),
                })
                .where(and(
                    eq(arStatements.id, alloc.statementId),
                    eq(arStatements.tenantId, tenantId),
                    eq(arStatements.version, stmt.version)
                ))
                .returning({ id: arStatements.id });

            if (!updatedStmt) {
                throw new Error(`并发冲突：对账单 ${stmt.statementNo} 已被其他人修改，请刷新后重试`);
            }

            await AuditService.log(tx, {
                tenantId,
                userId,
                action: 'UPDATE',
                tableName: 'ar_statements',
                recordId: alloc.statementId,
                oldValues: { status: stmt.status, receivedAmount: stmt.receivedAmount },
                newValues: { status: newStatus, receivedAmount: newReceived.toFixed(2, Decimal.ROUND_HALF_UP) },
                details: { receiptId, amount: alloc.amount.toFixed(2, Decimal.ROUND_HALF_UP), reason: 'RECON_WRITE_OFF' }
            });

            writeOffResults.push({
                statementId: alloc.statementId,
                statementNo: alloc.statementNo,
                amount: alloc.amount.toFixed(2, Decimal.ROUND_HALF_UP),
                success: true,
            });
            totalWrittenOff = totalWrittenOff.plus(alloc.amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        }

        const usedAmountAfter = usedAmountBefore.plus(totalWrittenOff).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        const newReceiptStatus = usedAmountAfter.gte(receiptAmount) ? 'FULLY_USED' : 'PARTIAL_USED';

        const [updatedReceipt] = await tx.update(receiptBills)
            .set({
                usedAmount: usedAmountAfter.toFixed(2, Decimal.ROUND_HALF_UP),
                status: newReceiptStatus,
                version: sql`${receiptBills.version} + 1`,
                updatedAt: new Date(),
            })
            .where(and(
                eq(receiptBills.id, receiptId),
                eq(receiptBills.tenantId, tenantId),
                eq(receiptBills.version, receipt.version)
            ))
            .returning({ id: receiptBills.id });

        if (!updatedReceipt) {
            throw new Error(`并发冲突：收款单 ${receipt.receiptNo} 已被其他人修改，请刷新后重试`);
        }

        await AuditService.log(tx, {
            tenantId,
            userId,
            action: 'UPDATE',
            tableName: 'receipt_bills',
            recordId: receiptId,
            oldValues: { status: receipt.status, usedAmount: receipt.usedAmount },
            newValues: { status: newReceiptStatus, usedAmount: usedAmountAfter.toFixed(2, Decimal.ROUND_HALF_UP) },
            details: { writeOffCount: writeOffResults.length, totalAmount: totalWrittenOff.toFixed(2, Decimal.ROUND_HALF_UP) }
        });

        logger.info('[finance] 批量核销执行完成', { totalWrittenOff: totalWrittenOff.toFixed(2) });

        revalidateTag(`finance-reconciliation-${tenantId}`, {});

        return {
            success: true,
            receiptId,
            totalWrittenOff: totalWrittenOff.toFixed(2, Decimal.ROUND_HALF_UP),
            writeOffCount: writeOffResults.length,
            details: writeOffResults,
            remark,
        };
    });
});

export async function batchWriteOff(params: z.infer<typeof batchWriteOffSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');
    if (!await checkPermission(session, PERMISSIONS.FINANCE.AR_RECONCILE)) throw new Error('权限不足：需要对账权限');

    logger.info('[finance] batchWriteOff 入口', { params });

    try {
        return batchWriteOffActionInternal(params);
    } catch (error) {
        logger.info('[finance] batchWriteOff 失败', { error, params });
        logger.error('❌ batchWriteOff Error:', error);
        throw error;
    }
}

const crossPeriodReconciliationSchema = z.object({
    originalStartDate: z.string(),
    originalEndDate: z.string(),
    newEndDate: z.string(),
    customerId: z.string().uuid().optional(),
});

const crossPeriodReconciliationActionInternal = createSafeAction(crossPeriodReconciliationSchema, async (params, { session }) => {
    const { originalStartDate, originalEndDate, newEndDate, customerId } = params;
    const tenantId = session.user.tenantId;

    logger.info('[finance] 开始跨期对账处理', { originalStartDate, originalEndDate, newEndDate });

    const conditions = [
        eq(arStatements.tenantId, tenantId),
        gte(arStatements.createdAt, new Date(originalStartDate)),
        lte(arStatements.createdAt, new Date(originalEndDate)),
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
        logger.info('[finance] 跨期对账：此期间无未结清账单');
        return { success: true, message: '该账期内无未结清账单', movedCount: 0 };
    }

    const summary = {
        originalPeriod: `${originalStartDate} 至 ${originalEndDate}`,
        newPeriod: `${originalStartDate} 至 ${newEndDate}`,
        movedCount: pendingStatements.length,
        totalPendingAmount: pendingStatements.reduce((sum, s) => sum.plus(s.pendingAmount || '0'), new Decimal(0)).toFixed(2),
        customerBreakdown: new Map<string, { name: string; count: number; amount: Decimal }>(),
    };

    for (const stmt of pendingStatements) {
        const cid = stmt.customerId;
        const existing = summary.customerBreakdown.get(cid) || { name: stmt.customerName || '未知', count: 0, amount: new Decimal(0) };
        existing.count++;
        existing.amount = existing.amount.plus(stmt.pendingAmount || '0');
        summary.customerBreakdown.set(cid, existing);
    }

    logger.info('[finance] 跨期对账分析完成', { movedCount: summary.movedCount });

    revalidateTag(`finance-reconciliation-${session.user.tenantId}`, {});

    return {
        success: true,
        message: '跨期对账分析完成',
        ...summary,
        customerBreakdown: Array.from(summary.customerBreakdown.entries()).map(([id, data]) => ({
            customerId: id,
            ...data,
            amount: data.amount.toFixed(2),
        })),
    };
});

export async function crossPeriodReconciliation(params: z.infer<typeof crossPeriodReconciliationSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');
    if (!await checkPermission(session, PERMISSIONS.FINANCE.AR_RECONCILE)) throw new Error('权限不足：需要对账权限');

    logger.info('[finance] crossPeriodReconciliation 入口', { params });

    return crossPeriodReconciliationActionInternal(params);
}
