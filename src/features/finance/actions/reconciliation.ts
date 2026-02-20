'use server';

import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { db } from '@/shared/api/db';
import { reconciliations, arStatements, receiptBills } from '@/shared/api/schema';
import { eq, desc, and, inArray, gte, lte, isNull, or } from 'drizzle-orm';
import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { revalidatePath } from 'next/cache';
import { Decimal } from 'decimal.js';
import { AuditService } from '@/shared/services/audit-service';

// 对账分层定义从 schema.ts 导入
// export { RECONCILIATION_LAYERS, type ReconciliationLayer } from './schema';
// 注意：'use server' 文件不能重新导出，需要直接从 schema.ts 导入

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
    if (!await checkPermission(session, PERMISSIONS.FINANCE.RECONCILE)) throw new Error('权限不足：需要对账权限');

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
    if (!await checkPermission(session, PERMISSIONS.FINANCE.RECONCILE)) throw new Error('权限不足：需要对账权限');

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

    revalidatePath('/finance/reconciliation');

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

/**
 * 生成汇总对账单 (Generate Aggregated Statement)
 * 
 * 根据选定的时间范围和客户列表，汇总并生成一张总的对账数据分析表。
 * 返回各客户的汇总维度，包括总金额、已收金额、待收金额和订单数量。
 * 
 * @param {z.infer<typeof aggregateStatementsSchema>} params - 包含时间范围、可选的客户ID列表及标题
 * @returns {Promise<any>} 返回包含汇总信息的数据包
 * @throws {Error} 未授权或缺少对账权限时抛出错误
 */
export async function generateAggregatedStatement(params: z.infer<typeof aggregateStatementsSchema>) {
    // 权限检查：对账
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');
    if (!await checkPermission(session, PERMISSIONS.FINANCE.RECONCILE)) throw new Error('权限不足：需要对账权限');

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

/**
 * 生成周期对账单 (Generate Period Statements)
 * 
 * 根据设定的周期（周、双周、月），从基准时间点倒推，找出期间内所有状态为 PENDING_RECON 或未定义状态的 AR 账单，并进行整理。
 * 主要用于财务人员定期进行的针对特定周期的自动查账任务。
 * 
 * @param {z.infer<typeof generatePeriodStatementsSchema>} params - 包含周期类型（WEEKLY | BIWEEKLY | MONTHLY）及基准时间
 * @returns {Promise<any>} 返回特定周期的待对账单据列表及汇总信息
 * @throws {Error} 未授权或缺少对账权限时抛出错误
 */
export async function generatePeriodStatements(params: z.infer<typeof generatePeriodStatementsSchema>) {
    // 权限检查：对账
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');
    if (!await checkPermission(session, PERMISSIONS.FINANCE.RECONCILE)) throw new Error('权限不足：需要对账权限');

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
    const { receiptId, statementIds, allocations, remark } = params;
    const tenantId = session.user.tenantId;
    const userId = session.user.id!;

    return await db.transaction(async (tx) => {
        // 1. 获取并校验收款单 (Receipt Bill Verification)
        const receipt = await tx.query.receiptBills.findFirst({
            where: and(
                eq(receiptBills.id, receiptId),
                eq(receiptBills.tenantId, tenantId)
            ),
        });

        if (!receipt) {
            return { error: '收款单不存在' };
        }

        // 仅允许 VERIFIED (已核实) 的收款单进行核销
        if (receipt.status !== 'VERIFIED' && receipt.status !== 'PARTIAL_USED') {
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
            return { error: '没有找到要核销的账单' };
        }

        // 校验账单状态：已结算或已关闭的账单不可再次核销
        const invalidStatements = statements.filter(s => s.status === 'PAID' || s.status === 'COMPLETED' || s.status === 'BAD_DEBT');
        if (invalidStatements.length > 0) {
            return { error: `部分账单已结清或不可核销: ${invalidStatements.map(s => s.statementNo).join(', ')}` };
        }

        const receiptAmount = new Decimal(receipt.totalAmount || '0');
        const usedAmountBefore = new Decimal(receipt.usedAmount || '0');
        const availableAmount = receiptAmount.minus(usedAmountBefore);

        if (availableAmount.lte(0)) {
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
        } else {
            // 自动按顺序分配
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

            // 状态流转根据剩余待收判断
            const newStatus = newPending.lte(0) ? 'PAID' : 'PARTIAL';

            await tx.update(arStatements)
                .set({
                    receivedAmount: newReceived.toFixed(2, Decimal.ROUND_HALF_UP),
                    pendingAmount: Decimal.max(0, newPending).toFixed(2, Decimal.ROUND_HALF_UP),
                    status: newStatus,
                    updatedAt: new Date(),
                })
                .where(and(
                    eq(arStatements.id, alloc.statementId),
                    eq(arStatements.tenantId, tenantId)
                ));

            // 记录对账单审计
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

        // 5. 更新收款单使用情况
        const usedAmountAfter = usedAmountBefore.plus(totalWrittenOff).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
        const newReceiptStatus = usedAmountAfter.gte(receiptAmount) ? 'FULLY_USED' : 'PARTIAL_USED';

        await tx.update(receiptBills)
            .set({
                usedAmount: usedAmountAfter.toFixed(2, Decimal.ROUND_HALF_UP),
                status: newReceiptStatus,
                updatedAt: new Date(),
            })
            .where(and(
                eq(receiptBills.id, receiptId),
                eq(receiptBills.tenantId, tenantId)
            ));

        // 记录收款单审计
        await AuditService.log(tx, {
            tenantId,
            userId,
            action: 'UPDATE',
            tableName: 'receipt_bills',
            recordId: receiptId,
            oldValues: { status: receipt.status, usedAmount: receipt.usedAmount },
            newValues: { status: newReceiptStatus, usedAmount: usedAmountAfter.toFixed(2, Decimal.ROUND_HALF_UP) },
            details: { writeOffCount: writeOffResults.length, totalAmount: totalWrittenOff.toFixed(2, Decimal.ROUND_HALF_UP), actionType: 'BATCH_WRITE_OFF' }
        });

        revalidatePath('/finance/reconciliation');
        revalidatePath('/finance/receipt');

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

/**
 * 批量核销 (Batch Write-Off)
 * 
 * 利用指定的收款单 (Receipt Bill) 批量核销多张应收单 (AR Statements)。
 * 可自动按顺序分配金额，或者根据用户指定的自定义金额分配执行。
 * 支持部分核销或完全结清。包含严格的状态前置校验及完整的审计日志记录。
 * 
 * @param {z.infer<typeof batchWriteOffSchema>} params - 包含收款单ID、账单ID列表及可选的自定义金额分配
 * @returns {Promise<any>} 返回实际执行的核销详情与成功状态
 * @throws {Error} 未授权或缺少对账权限时抛出错误
 */
export async function batchWriteOff(params: z.infer<typeof batchWriteOffSchema>) {
    // 权限检查：对账
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');
    if (!await checkPermission(session, PERMISSIONS.FINANCE.RECONCILE)) throw new Error('权限不足：需要对账权限');

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

    revalidatePath('/finance/reconciliation');

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

/**
 * 跨期对账处理 (Cross Period Reconciliation)
 * 
 * 分析原账期中仍处于 PENDING_RECON 或 PARTIAL （未结清）状态的账单，
 * 将其统计并跨期带入下个核算周期中。
 * 
 * @param {z.infer<typeof crossPeriodReconciliationSchema>} params - 跨期的原账期和新账期时间范围
 * @returns {Promise<any>} 返回跨期对账记录摘要和未结清明细分析
 * @throws {Error} 未授权或缺少对账权限时抛出错误
 */
export async function crossPeriodReconciliation(params: z.infer<typeof crossPeriodReconciliationSchema>) {
    // 权限检查：对账
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');
    if (!await checkPermission(session, PERMISSIONS.FINANCE.RECONCILE)) throw new Error('权限不足：需要对账权限');

    return crossPeriodReconciliationActionInternal(params);
}

