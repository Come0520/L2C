'use server';
import { logger } from "@/shared/lib/logger";

import { db } from '@/shared/api/db';
import {
    apSupplierStatements,
    apLaborStatements,
    apLaborFeeDetails,
    paymentBills,
    paymentBillItems,
    financeAccounts,
    accountTransactions,
    installTasks,
    purchaseOrders,
} from '@/shared/api/schema';
import { AuditService } from '@/shared/services/audit-service';

import { eq, and, desc, sql } from 'drizzle-orm';
import { Decimal } from 'decimal.js';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath, unstable_cache, revalidateTag } from 'next/cache';
import { createSafeAction } from '@/shared/lib/server-action';
import { createPaymentBillSchema, verifyPaymentBillSchema } from './schema';
import { z } from 'zod';
import { submitApproval } from '@/features/approval/actions/submission';
import { FinanceApprovalLogic } from '@/features/finance/logic/finance-approval';
import { handleCommissionClawback } from '@/features/channels/logic/commission.service';
import { generateBusinessNo } from '@/shared/lib/generate-no';

/**
 * 获取供应商应付对账单列表
 * 支持基于 `limit` 和 `offset` 参数进行系统分页拉取。
 * 
 * @param params `{ limit?: number, offset?: number }` - 默认获取最新 50 条。
 * @returns 带有嵌套 PO 和 Supplier 实体对象的对账单列表
 */
export async function getAPSupplierStatements(params?: { limit?: number; offset?: number }) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // 权限检查：查看应付数据
    if (!await checkPermission(session, PERMISSIONS.FINANCE.VIEW)) throw new Error('权限不足：需要财务查看权限');

    const limit = params?.limit || 50;
    const offset = params?.offset || 0;
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            console.log('[finance] [CACHE_MISS] 获取供应商应付对账单列表', { tenantId, limit, offset });
            return await db.query.apSupplierStatements.findMany({
                where: eq(apSupplierStatements.tenantId, tenantId),
                with: {
                    purchaseOrder: true,
                    supplier: true,
                },
                orderBy: [desc(apSupplierStatements.createdAt)],
                limit,
                offset
            });
        },
        [`ap-supplier-statements-${tenantId}-${limit}-${offset}`],
        {
            tags: [`finance-ap-supplier-${tenantId}`],
            revalidate: 60,
        }
    )();
}

/**
 * 获取单条供应商应付对账单详情
 * 
 * @param id 应付对账单的唯一标识 UUID
 * @returns 包含特定应付单所有层级信息的实体
 */
export async function getAPSupplierStatement(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // 权限检查：查看应付数据
    if (!await checkPermission(session, PERMISSIONS.FINANCE.VIEW)) throw new Error('权限不足：需要财务查看权限');

    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            console.log('[finance] [CACHE_MISS] 获取单条供应商应付对账单详情', { id, tenantId });
            return await db.query.apSupplierStatements.findFirst({
                where: and(
                    eq(apSupplierStatements.id, id),
                    eq(apSupplierStatements.tenantId, tenantId)
                ),
                with: {
                    purchaseOrder: true,
                    supplier: true,
                }
            });
        },
        [`ap-supplier-statement-${id}`],
        {
            tags: [`finance-ap-supplier-detail-${id}`],
            revalidate: 60,
        }
    )();
}

/**
 * 获取劳务费用的应付对账单列表
 * 增加基于 `limit` 与 `offset` 的列表级返回容量限制。
 * 
 * @param params `{ limit?: number, offset?: number }` - 默认抓取前 50 条最新项
 * @returns Array 包含劳务结算项主记录以及绑定的工人信息的列表
 */
export async function getAPLaborStatements(params?: { limit?: number; offset?: number }) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // 权限检查：查看人工费用
    if (!await checkPermission(session, PERMISSIONS.FINANCE.LABOR_VIEW)) throw new Error('权限不足：需要人工费查看权限');

    const limit = params?.limit || 50;
    const offset = params?.offset || 0;
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            console.log('[finance] [CACHE_MISS] 获取劳务结算单列表', { tenantId, limit, offset });
            return await db.query.apLaborStatements.findMany({
                where: eq(apLaborStatements.tenantId, tenantId),
                with: {
                    worker: true,
                },
                orderBy: [desc(apLaborStatements.createdAt)],
                limit,
                offset
            });
        },
        [`ap-labor-statements-${tenantId}-${limit}-${offset}`],
        {
            tags: [`finance-ap-labor-${tenantId}`],
            revalidate: 60,
        }
    )();
}

/**
 * 获取单条劳务应付对账单的明细数据
 * 
 * @param id 针对单项劳务费用的系统主键 ID 
 * @returns 基于查询主键解析获得的劳务费用以及关联人工明细详情的 JSON 数据
 */
export async function getAPLaborStatement(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // 权限检查：查看人工费用
    if (!await checkPermission(session, PERMISSIONS.FINANCE.LABOR_VIEW)) throw new Error('权限不足：需要人工费查看权限');

    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            console.log('[finance] [CACHE_MISS] 获取单条劳务结算单详情', { id, tenantId });
            return await db.query.apLaborStatements.findFirst({
                where: and(
                    eq(apLaborStatements.id, id),
                    eq(apLaborStatements.tenantId, tenantId)
                ),
                with: {
                    worker: true,
                    feeDetails: true,
                }
            });
        },
        [`ap-labor-statement-${id}`],
        {
            tags: [`finance-ap-labor-detail-${id}`],
            revalidate: 60,
        }
    )();
}

/**
 * 面向通用结算台拉取跨业务的应付对象 (Unified Statement API)
 * 该方法自动路由适配至供应链侧供应商采购付款申请或是外包服务工人工费结算。
 * 
 * @param filters 查询结构体，携带目标结算单主键 `{ id: string }`
 * @returns 包含额外类型字段标识（`SUPPLIER` or `LABOR`）及嵌套内容集的合并结算响应
 */
export async function getApStatementById(filters: { id: string }) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // 权限检查：查看应付数据
    if (!await checkPermission(session, PERMISSIONS.FINANCE.VIEW)) throw new Error('权限不足：需要财务查看权限');

    console.log('[finance] 跨业务搜索应付单', { filters });

    const { id } = filters;

    // Try Supplier first
    const supplierStatement = await db.query.apSupplierStatements.findFirst({
        where: and(
            eq(apSupplierStatements.id, id),
            eq(apSupplierStatements.tenantId, session.user.tenantId)
        ),
        with: {
            purchaseOrder: {
                with: {
                    items: true
                }
            },
            supplier: true,
        }
    });

    if (supplierStatement) {
        return {
            success: true,
            data: {
                ...supplierStatement,
                type: 'SUPPLIER',
                items: supplierStatement.purchaseOrder?.items || []
            }
        };
    }

    const laborStatement = await db.query.apLaborStatements.findFirst({
        where: and(
            eq(apLaborStatements.id, id),
            eq(apLaborStatements.tenantId, session.user.tenantId)
        ),
        with: {
            worker: true,
            feeDetails: true, // This maps to items for labor?
        }
    });

    if (laborStatement) {
        return {
            success: true,
            data: {
                ...laborStatement,
                type: 'LABOR',
                // feeDetails 来自 with 查询，类型安全
                items: laborStatement.feeDetails || []
            }
        };
    }

    return { success: false, error: 'Not found' };
}

/**
 * 基于业务上下游申请或系统事件初始化/生成支付流水主账单。
 * 该方法自动管理和串联财务事务的执行机制：若业务超过限制将会开启工作流进行人工干预流转审批，否则将会自动推进进账。
 * 
 * @param data Zod 安全验证后的表单级数据字典
 * @returns Object 执行成果及系统流水生成编号
 */
export const createPaymentBill = createSafeAction(createPaymentBillSchema, async (data, { session }) => {
    // 权限检查：创建收付款
    if (!await checkPermission(session, PERMISSIONS.FINANCE.CREATE)) throw new Error('权限不足：需要财务创建权限');

    console.log('[finance] 创建付款单', { data });

    const { items, ...billData } = data;

    const paymentBill = await db.transaction(async (tx) => {
        const paymentNo = generateBusinessNo('BILL');

        const [paymentBillResult] = await tx.insert(paymentBills).values({
            ...billData,
            tenantId: session.user.tenantId,
            paymentNo,
            orderId: billData.orderId, // Store Order ID
            status: 'PENDING', // Will update if approval needed
            recordedBy: session.user.id!,
            amount: new Decimal(billData.amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
        }).returning();

        if (items && items.length > 0) {
            await Promise.all(items.map(async (item) => {
                await tx.insert(paymentBillItems).values({
                    tenantId: session.user.tenantId,
                    paymentBillId: paymentBillResult.id,
                    statementType: item.statementType,
                    statementId: item.statementId,
                    statementNo: 'PENDING',
                    amount: item.amount.toString(),
                });
            }));
        }

        // F-18: Audit Log
        await AuditService.log(tx, {
            tenantId: session.user.tenantId,
            userId: session.user.id,
            tableName: 'payment_bills',
            recordId: paymentBillResult.id,
            action: 'CREATE',
            newValues: { ...billData, paymentNo, amount: billData.amount.toString() }
        });

        return paymentBillResult;
    });

    // 2. Handle Approval Logic (Outside Transaction)
    if (billData.amount > 0) {
        // Check Approval Config
        const flowCode = billData.type === 'REFUND'
            ? FinanceApprovalLogic.FLOW_CODES.REFUND
            : FinanceApprovalLogic.FLOW_CODES.PAYMENT;

        try {
            const isApprovalActive = await FinanceApprovalLogic.isFlowActive(session.user.tenantId, flowCode);
            if (isApprovalActive) {
                const approvalRes = await submitApproval({
                    entityType: 'PAYMENT_BILL',
                    entityId: paymentBill.id,
                    flowCode: flowCode,
                    comment: billData.type === 'REFUND' ? 'Refund Bill Created' : 'Payment Bill Created',
                    amount: billData.amount, // Pass amount for logic
                });

                if (approvalRes.success) {
                    console.log('[finance] 付款单提交审批成功', { billId: paymentBill.id, flowCode });
                    await db.update(paymentBills)
                        .set({ status: 'PENDING_APPROVAL' })
                        .where(eq(paymentBills.id, paymentBill.id));

                    // 添加审批提交审计
                    await AuditService.log(db, {
                        tenantId: session.user.tenantId,
                        userId: session.user.id!,
                        tableName: 'payment_bills',
                        recordId: paymentBill.id,
                        action: 'UPDATE',
                        oldValues: { status: 'PENDING' },
                        newValues: { status: 'PENDING_APPROVAL' },
                        details: { action: 'SUBMIT_APPROVAL', flowCode }
                    });
                }
            }
        } catch (error) {
            logger.error('Failed to submit approval:', error);
            // Don't fail the creation, just log error. Or should we?
            // Usually if logic requires approval, failure to start approval is critical.
            // But for now let's keep it non-blocking or re-throw if strict.
        }
    }

    revalidatePath('/finance/ap');
    return paymentBill;
});

/**
 * 审核付款单
 */
export const verifyPaymentBill = createSafeAction(verifyPaymentBillSchema, async (data, { session }) => {
    // 权限检查：审批财务
    if (!await checkPermission(session, PERMISSIONS.FINANCE.APPROVE)) throw new Error('权限不足：需要财务审批权限');

    console.log('[finance] 审核付款单', { data });

    const { id, status, remark } = data;

    return await db.transaction(async (tx) => {
        // 1. 获取并锁定付款单
        const bill = await tx.query.paymentBills.findFirst({
            where: and(
                eq(paymentBills.id, id),
                eq(paymentBills.tenantId, session.user.tenantId)
            ),
            with: {
                items: true,
            }
        });

        if (!bill) throw new Error('付款单不存在');
        console.log('[finance] 正在审核付款单', { billId: id, status: bill.status });

        // Allow paying if PENDING (legacy) or APPROVED (workflow done)
        const validStatuses = ['PENDING', 'APPROVED'];
        if (!validStatuses.includes(bill.status)) throw new Error('付款单状态不可审核支付');

        if (status === 'REJECTED') {
            await tx.update(paymentBills)
                .set({ status: 'REJECTED', remark: remark || bill.remark })
                .where(and(
                    eq(paymentBills.id, id),
                    eq(paymentBills.tenantId, session.user.tenantId)
                ));

            await AuditService.log(tx, {
                tenantId: session.user.tenantId,
                userId: session.user.id!,
                tableName: 'payment_bills',
                recordId: id,
                action: 'UPDATE',
                oldValues: { status: bill.status, remark: bill.remark },
                newValues: { status: 'REJECTED', remark: remark || bill.remark }
            });

            console.log('[finance] 付款单审核完成', { billId: id, newStatus: status });
            return { success: true };
        }

        // 审核通过并执行付款
        const amount = new Decimal(bill.amount);

        // 3. 扣减账户余额 (增加安全性校验 F-22)
        const [updatedBill] = await tx.update(paymentBills)
            .set({
                status: 'PAID',
                isVerified: true,
                verifiedBy: session.user.id,
                verifiedAt: new Date(),
                paidAt: new Date(),
                payeeId: session.user.id!,
                updatedAt: new Date(),
            })
            .where(and(
                eq(paymentBills.id, id),
                eq(paymentBills.tenantId, session.user.tenantId)
            ))
            .returning();

        if (!updatedBill) throw new Error('付款单更新失败或租户隔离校验失败');

        // 3. 扣减账户余额 (增加安全性校验 F-22)
        const account = await tx.query.financeAccounts.findFirst({
            where: and(
                eq(financeAccounts.id, bill.accountId!),
                eq(financeAccounts.tenantId, session.user.tenantId)
            )
        });

        if (!account) throw new Error('结算账户不存在');
        const currentBalance = new Decimal(account.balance || '0');
        if (currentBalance.lt(amount)) {
            throw new Error(`账户余额不足。当前余额: ¥${currentBalance.toFixed(2, Decimal.ROUND_HALF_UP)}, 需付: ¥${amount.toFixed(2, Decimal.ROUND_HALF_UP)}`);
        }

        // 使用乐观锁原子扣减
        const updateResult = await tx.update(financeAccounts)
            .set({
                balance: sql`CAST(${financeAccounts.balance} AS DECIMAL) - ${amount.toFixed(2, Decimal.ROUND_HALF_UP)}`,
                updatedAt: new Date()
            })
            .where(and(
                eq(financeAccounts.id, bill.accountId!),
                eq(financeAccounts.tenantId, session.user.tenantId),
                sql`CAST(${financeAccounts.balance} AS DECIMAL) >= ${amount.toFixed(2, Decimal.ROUND_HALF_UP)}`
            ));

        if (updateResult.length === 0) {
            throw new Error('并发更新导致余额失效，请稍后重试');
        }

        // 4. 创建账户流水
        const txNo = generateBusinessNo('TX');
        await tx.insert(accountTransactions).values({
            tenantId: session.user.tenantId,
            transactionNo: txNo,
            accountId: bill.accountId!,
            transactionType: 'EXPENSE',
            amount: amount.toFixed(2, Decimal.ROUND_HALF_UP),
            balanceBefore: currentBalance.toFixed(2, Decimal.ROUND_HALF_UP),
            balanceAfter: currentBalance.minus(amount).toFixed(2, Decimal.ROUND_HALF_UP),
            relatedType: 'PAYMENT_BILL',
            relatedId: id,
            remark: `支出: ${bill.paymentNo}`,
        });

        // 记录审计日志 F-32
        await AuditService.log(tx, {
            tenantId: session.user.tenantId,
            userId: session.user.id!,
            tableName: 'payment_bills',
            recordId: id,
            action: 'UPDATE',
            newValues: { status: 'PAID', payeeId: session.user.id, paidAt: new Date() },
            oldValues: { status: bill.status },
            details: { billNo: bill.paymentNo, amount: amount.toFixed(2, Decimal.ROUND_HALF_UP), transactionNo: txNo }
        });

        // 5. 更新账户变动的审计记录
        await AuditService.log(tx, {
            tenantId: session.user.tenantId,
            userId: session.user.id!,
            tableName: 'finance_accounts',
            recordId: bill.accountId!,
            action: 'UPDATE',
            oldValues: { balance: currentBalance.toFixed(2, Decimal.ROUND_HALF_UP) },
            newValues: { balance: currentBalance.minus(amount).toFixed(2, Decimal.ROUND_HALF_UP) },
            details: { type: 'BILL_PAYMENT', relatedId: id, transactionNo: txNo }
        });

        // 3. 更新对应的对账单状态
        if (bill.items && bill.items.length > 0) {
            for (const item of bill.items) {
                if (item.statementType === 'AP_SUPPLIER') {
                    const statement = await tx.query.apSupplierStatements.findFirst({
                        where: and(
                            eq(apSupplierStatements.id, item.statementId),
                            eq(apSupplierStatements.tenantId, session.user.tenantId)
                        )
                    });
                    if (statement) {
                        const paidAmount = new Decimal(statement.paidAmount || '0').plus(new Decimal(item.amount));
                        const totalAmount = new Decimal(statement.totalAmount || '0');
                        const pendingAmount = totalAmount.minus(paidAmount);
                        const newStatus = pendingAmount.lte(0) ? 'COMPLETED' : 'PARTIAL';

                        await tx.update(apSupplierStatements)
                            .set({
                                paidAmount: paidAmount.toFixed(2, Decimal.ROUND_HALF_UP),
                                pendingAmount: pendingAmount.toFixed(2, Decimal.ROUND_HALF_UP),
                                status: newStatus,
                                completedAt: pendingAmount.lte(0) ? new Date() : null,
                            })
                            .where(and(
                                eq(apSupplierStatements.id, statement.id),
                                eq(apSupplierStatements.tenantId, session.user.tenantId)
                            ));

                        await AuditService.log(tx, {
                            tenantId: session.user.tenantId,
                            userId: session.user.id!,
                            tableName: 'ap_supplier_statements',
                            recordId: statement.id,
                            action: 'UPDATE',
                            oldValues: { paidAmount: statement.paidAmount, status: statement.status },
                            newValues: { paidAmount: paidAmount.toFixed(2, Decimal.ROUND_HALF_UP), status: newStatus },
                            details: { paymentBillId: id, amount: item.amount }
                        });
                    }
                } else if (item.statementType === 'AP_LABOR') {
                    const statement = await tx.query.apLaborStatements.findFirst({
                        where: and(
                            eq(apLaborStatements.id, item.statementId),
                            eq(apLaborStatements.tenantId, session.user.tenantId)
                        )
                    });
                    if (statement) {
                        const paidAmount = new Decimal(statement.paidAmount || '0').plus(new Decimal(item.amount));
                        const totalAmount = new Decimal(statement.totalAmount || '0');
                        const pendingAmount = totalAmount.minus(paidAmount);
                        const newStatus = pendingAmount.lte(0) ? 'COMPLETED' : 'PARTIAL';

                        await tx.update(apLaborStatements)
                            .set({
                                paidAmount: paidAmount.toFixed(2, Decimal.ROUND_HALF_UP),
                                pendingAmount: pendingAmount.toFixed(2, Decimal.ROUND_HALF_UP),
                                status: newStatus,
                                completedAt: pendingAmount.lte(0) ? new Date() : null,
                            })
                            .where(and(
                                eq(apLaborStatements.id, statement.id),
                                eq(apLaborStatements.tenantId, session.user.tenantId)
                            ));

                        await AuditService.log(tx, {
                            tenantId: session.user.tenantId,
                            userId: session.user.id!,
                            tableName: 'ap_labor_statements',
                            recordId: statement.id,
                            action: 'UPDATE',
                            oldValues: { paidAmount: statement.paidAmount, status: statement.status },
                            newValues: { paidAmount: paidAmount.toFixed(2, Decimal.ROUND_HALF_UP), status: newStatus },
                            details: { paymentBillId: id, amount: item.amount }
                        });
                    }
                }
            }
        }

        // 4. 触发佣金扣回 (如果关联了 Order 且是 Refund)
        if (bill.type === 'REFUND' && bill.orderId) {
            // 注意：这里已经审核通过并支付 (balance deducted)，确认会退款
            // 异步或同步调用？同步较好，保证一致性
            await handleCommissionClawback(bill.orderId, Number(bill.amount));
        }

        // F-18: Audit Log (This was already handled above for both REJECTED and PAID)
        // Removed duplicate audit log here.

        revalidateTag(`finance-ap-supplier-${session.user.tenantId}`);
        revalidatePath('/finance/ap');
        console.log('[finance] verifyPaymentBill 执行成功', { id, newStatus: status });
        return { success: true };
    });
});

/**
 * 自动生成劳务结算单 (扫描已完成且未结算的安装单 + 售后扣款)
 */
export async function generateLaborSettlement() {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // 权限检查：财务管理（批量操作）
    if (!await checkPermission(session, PERMISSIONS.FINANCE.MANAGE)) throw new Error('权限不足：需要财务管理权限');

    console.log('[finance] 开始生成劳务结算单');

    // 导入 liabilityNotices 表
    const { liabilityNotices } = await import('@/shared/api/schema');

    return await db.transaction(async (tx) => {
        const settledTaskIds = await tx.select({ id: apLaborFeeDetails.installTaskId })
            .from(apLaborFeeDetails)
            .where(and(
                eq(apLaborFeeDetails.tenantId, session.user.tenantId),
                sql`${apLaborFeeDetails.installTaskId} IS NOT NULL`
            ));
        const excludeIds = settledTaskIds.map(t => t.id).filter(Boolean) as string[];

        const finishedTasks = await tx.query.installTasks.findMany({
            where: and(
                eq(installTasks.tenantId, session.user.tenantId),
                eq(installTasks.status, 'COMPLETED'),
                excludeIds.length > 0 ? sql`${installTasks.id} NOT IN (${sql.join(excludeIds.map(id => sql`${id}`), sql`,`)})` : undefined
            ),
            with: {
                installer: true
            }
        });

        // 查询待同步的安装工定责单 (INSTALLER 类型, CONFIRMED 状态, financeStatus=PENDING)
        const pendingLiabilities = await tx.query.liabilityNotices.findMany({
            where: and(
                eq(liabilityNotices.tenantId, session.user.tenantId),
                eq(liabilityNotices.liablePartyType, 'INSTALLER'),
                eq(liabilityNotices.status, 'CONFIRMED'),
                eq(liabilityNotices.financeStatus, 'PENDING')
            )
        });

        // 按工人分组任务
        const tasksByWorker = new Map<string, typeof installTasks.$inferSelect[]>();
        finishedTasks.forEach(task => {
            if (!task.installerId) return;
            const tasks = tasksByWorker.get(task.installerId) || [];
            tasks.push(task);
            tasksByWorker.set(task.installerId, tasks);
        });

        // 按工人分组扣款
        const liabilitiesByWorker = new Map<string, typeof pendingLiabilities>();
        pendingLiabilities.forEach(ln => {
            if (!ln.liablePartyId) return;
            const existing = liabilitiesByWorker.get(ln.liablePartyId) || [];
            existing.push(ln);
            liabilitiesByWorker.set(ln.liablePartyId, existing);
        });

        // 合并所有涉及的工人ID
        const allWorkerIds = new Set([...tasksByWorker.keys(), ...liabilitiesByWorker.keys()]);
        if (allWorkerIds.size === 0) return { count: 0, deductionCount: 0 };

        let settlementCount = 0;
        let deductionCount = 0;

        for (const workerId of allWorkerIds) {
            const tasks = tasksByWorker.get(workerId) || [];
            const liabilities = liabilitiesByWorker.get(workerId) || [];

            // 如果没有任务也没有扣款，跳过
            if (tasks.length === 0 && liabilities.length === 0) continue;

            // 计算安装费用总额
            const taskTotal = tasks.reduce((sum, t) => {
                return sum.plus(new Decimal(t.actualLaborFee || '0'));
            }, new Decimal(0));

            // 计算扣款总额 (负数)
            const deductionTotal = liabilities.reduce((sum, ln) => {
                return sum.minus(new Decimal(ln.amount || '0'));
            }, new Decimal(0));

            const totalAmount = taskTotal.plus(deductionTotal);
            // 从 tasks 获取 worker 信息 (installer 是关系查询结果)
            const firstTask = tasks[0] as { installer?: { name?: string } } | undefined;
            const workerName = firstTask?.installer?.name || 'UNKNOWN';

            // 创建结算单
            const [statement] = await tx.insert(apLaborStatements).values({
                tenantId: session.user.tenantId,
                statementNo: generateBusinessNo('LAB'),
                workerId,
                workerName,
                settlementPeriod: new Date().toISOString().slice(0, 7),
                totalAmount: totalAmount.toFixed(2, Decimal.ROUND_HALF_UP),
                pendingAmount: totalAmount.toFixed(2, Decimal.ROUND_HALF_UP),
                status: 'CALCULATED',
            }).returning();

            // 插入安装费用明细
            for (const task of tasks) {
                const fee = new Decimal(task.actualLaborFee || '0').toFixed(2, Decimal.ROUND_HALF_UP);
                await tx.insert(apLaborFeeDetails).values({
                    tenantId: session.user.tenantId,
                    statementId: statement.id,
                    installTaskId: task.id,
                    installTaskNo: task.taskNo || 'TASK',
                    feeType: 'BASE',
                    description: '安装标单费用',
                    calculation: `实发: ${fee}`,
                    amount: fee,
                });
            }

            // 插入售后扣款明细 (负数金额)
            for (const ln of liabilities) {
                const deductionAmt = new Decimal(ln.amount || '0').negated().toFixed(2, Decimal.ROUND_HALF_UP);
                await tx.insert(apLaborFeeDetails).values({
                    tenantId: session.user.tenantId,
                    statementId: statement.id,
                    liabilityNoticeId: ln.id,
                    liabilityNoticeNo: ln.noticeNo,
                    feeType: 'DEDUCTION',
                    description: `售后扣款: ${ln.reason?.slice(0, 50) || '定责扣款'}`,
                    calculation: `扣款: -${ln.amount}`,
                    amount: deductionAmt,
                });

                // 更新定责单财务状态
                await tx.update(liabilityNotices)
                    .set({
                        financeStatus: 'SYNCED',
                        financeStatementId: statement.id,
                        financeSyncedAt: new Date(),
                        updatedAt: new Date(),
                    })
                    .where(and(
                        eq(liabilityNotices.id, ln.id),
                        eq(liabilityNotices.tenantId, session.user.tenantId)
                    ));

                deductionCount++;
            }

            await AuditService.log(tx, {
                tenantId: session.user.tenantId,
                userId: session.user.id!,
                tableName: 'ap_labor_statements',
                recordId: statement.id,
                action: 'CREATE',
                newValues: statement,
                details: { taskCount: tasks.length, deductionCount: liabilities.length }
            });

            console.log('[finance] 劳务结算单项处理完成', { statementId: statement.id, totalAmount: totalAmount.toFixed(2) });

            settlementCount++;
        }

        console.log('[finance] 劳务结算单生成完成', { settlementCount, deductionCount });

        revalidatePath('/finance/ap/labor');
        return { count: settlementCount, deductionCount };
    });
}

/**
 * 创建供应商定责扣款对账单 (红字冲账)
 * 用于处理 SUPPLIER 类型的售后定责
 */
export async function createSupplierLiabilityStatement(liabilityNoticeId: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // 权限检查：创建收付款
    if (!await checkPermission(session, PERMISSIONS.FINANCE.CREATE)) throw new Error('权限不足：需要财务创建权限');

    console.log('[finance] 创建供应商定责扣款对账单', { liabilityNoticeId });

    const { liabilityNotices, suppliers } = await import('@/shared/api/schema');

    return await db.transaction(async (tx) => {
        // 获取定责单详情
        const notice = await tx.query.liabilityNotices.findFirst({
            where: and(
                eq(liabilityNotices.id, liabilityNoticeId),
                eq(liabilityNotices.tenantId, session.user.tenantId)
            )
        });

        if (!notice) throw new Error('定责单不存在');
        if (notice.liablePartyType !== 'FACTORY') throw new Error('此定责单非供应商(工厂)责任');
        if (notice.status !== 'CONFIRMED') throw new Error('定责单未确认');
        if (notice.financeStatus === 'SYNCED') throw new Error('已同步财务系统');

        // 获取供应商信息
        const supplier = notice.liablePartyId
            ? await tx.query.suppliers.findFirst({
                where: and(
                    eq(suppliers.id, notice.liablePartyId),
                    eq(suppliers.tenantId, session.user.tenantId)
                )
            })
            : null;

        // 创建红字对账单 (负数金额)
        const deductionDecimal = new Decimal(notice.amount || '0').negated();
        const deductionAmount = deductionDecimal.toFixed(2, Decimal.ROUND_HALF_UP);
        const [statement] = await tx.insert(apSupplierStatements).values({
            tenantId: session.user.tenantId,
            statementNo: generateBusinessNo('AP-DED'),
            purchaseOrderId: notice.sourcePurchaseOrderId || '00000000-0000-0000-0000-000000000000',
            supplierId: notice.liablePartyId || '00000000-0000-0000-0000-000000000000',
            supplierName: supplier?.name || '未知供应商',
            totalAmount: deductionAmount,
            paidAmount: '0',
            pendingAmount: deductionAmount,
            status: 'RECONCILING',
            purchaserId: session.user.id!,
        }).returning();

        // 更新定责单财务状态
        await tx.update(liabilityNotices)
            .set({
                financeStatus: 'SYNCED',
                financeStatementId: statement.id,
                financeSyncedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(and(
                eq(liabilityNotices.id, liabilityNoticeId),
                eq(liabilityNotices.tenantId, session.user.tenantId)
            ));

        await AuditService.log(tx, {
            tenantId: session.user.tenantId,
            userId: session.user.id!,
            tableName: 'liability_notices',
            recordId: liabilityNoticeId,
            action: 'UPDATE',
            newValues: { financeStatus: 'SYNCED', financeStatementId: statement.id },
            oldValues: { financeStatus: notice.financeStatus },
            details: { statementNo: statement.statementNo, amount: deductionAmount }
        });

        await AuditService.log(tx, {
            tenantId: session.user.tenantId,
            userId: session.user.id!,
            tableName: 'ap_supplier_statements',
            recordId: statement.id,
            action: 'CREATE',
            newValues: statement,
            details: { liabilityNoticeId }
        });

        revalidatePath('/finance/ap');
        return { success: true, statementId: statement.id };
    });
}

// ==================== 供应商退款流程 (Supplier Refund) ====================

const createSupplierRefundSchema = z.object({
    originalStatementId: z.string().uuid('请选择原对账单'),
    refundAmount: z.number().positive('退款金额必须大于0'),
    reason: z.string().min(1, '请填写退款原因'),
    remark: z.string().optional(),
});

/**
 * 针对供应链模块发起的针对供应商退款业务。
 * 
 * 生成并创建对应的供应商退款对账单（也就是财务常说的“红字 AP”冲转单）。
 * 其处理逻辑包含：
 * 1. 验证原对账单存在且已付款；
 * 2. 验证当前需要发起退款金额不超过已付金额（防超退）；
 * 3. 产生对应带有 UUID/No.的红字 AP 冲量单（为负数金额）。
 * @param input `{ originalStatementId: string, refundAmount: number, reason: string, remark?: string }`
 * @returns Object 包装成功状态及被创建红字单的所有结构内容。
 */
export async function createSupplierRefundStatement(input: z.infer<typeof createSupplierRefundSchema>) {
    try {
        const data = createSupplierRefundSchema.parse(input);
        const session = await auth();

        if (!session?.user?.id) return { success: false, error: '未授权' };
        if (!await checkPermission(session, PERMISSIONS.FINANCE.CREATE)) return { success: false, error: '权限不足：需要财务创建权限' };

        const tenantId = session.user.tenantId;

        return await db.transaction(async (tx) => {
            // 1. 获取原对账单
            const originalStatement = await tx.query.apSupplierStatements.findFirst({
                where: and(
                    eq(apSupplierStatements.id, data.originalStatementId),
                    eq(apSupplierStatements.tenantId, tenantId)
                ),
                with: {
                    supplier: true,
                }
            });

            if (!originalStatement) return { success: false, error: '原对账单不存在' };

            const paidAmount = new Decimal(originalStatement.paidAmount || '0');
            const refundAmount = new Decimal(data.refundAmount);

            if (paidAmount.lte(0)) return { success: false, error: '原对账单未付款，无法退款' };
            if (refundAmount.gt(paidAmount)) return { success: false, error: `退款金额不能超过已付金额 ¥${paidAmount.toFixed(2, Decimal.ROUND_HALF_UP)}` };

            // 2. 生成红字对账单编号 F-24
            const refundNo = generateBusinessNo('RFD');

            // 3. 创建红字 AP 对账单（负数金额）
            const [refundStatement] = await tx.insert(apSupplierStatements).values({
                tenantId,
                statementNo: refundNo,
                purchaseOrderId: originalStatement.purchaseOrderId,
                supplierId: originalStatement.supplierId,
                supplierName: originalStatement.supplierName,

                // 负数金额表示红字
                totalAmount: refundAmount.negated().toFixed(2, Decimal.ROUND_HALF_UP),
                paidAmount: refundAmount.negated().toFixed(2, Decimal.ROUND_HALF_UP), // 已退
                pendingAmount: '0',

                status: 'COMPLETED', // 红字单直接完成
                purchaserId: originalStatement.purchaserId,
            }).returning();

            // 4. 更新原对账单已付金额
            const newPaidAmount = paidAmount.minus(refundAmount);
            const totalAmtObj = new Decimal(originalStatement.totalAmount || '0');
            const newPendingAmount = totalAmtObj.minus(newPaidAmount);
            const newStatus = newPaidAmount.gte(totalAmtObj) ? 'COMPLETED' : 'PARTIAL';

            await tx.update(apSupplierStatements)
                .set({
                    paidAmount: newPaidAmount.toFixed(2, Decimal.ROUND_HALF_UP),
                    pendingAmount: newPendingAmount.toFixed(2, Decimal.ROUND_HALF_UP),
                    status: newStatus,
                })
                .where(and(
                    eq(apSupplierStatements.id, data.originalStatementId),
                    eq(apSupplierStatements.tenantId, tenantId)
                ));

            await AuditService.log(tx, {
                tenantId,
                userId: session.user.id!,
                tableName: 'ap_supplier_statements',
                recordId: data.originalStatementId,
                action: 'UPDATE',
                oldValues: { paidAmount: originalStatement.paidAmount, status: originalStatement.status },
                newValues: { paidAmount: newPaidAmount.toFixed(2, Decimal.ROUND_HALF_UP), status: newStatus },
                details: { refundNo, refundAmount: data.refundAmount }
            });

            await AuditService.log(tx, {
                tenantId,
                userId: session.user.id!,
                tableName: 'ap_supplier_statements',
                recordId: refundStatement.id,
                action: 'CREATE',
                newValues: refundStatement,
                details: { originalStatementId: data.originalStatementId, reason: data.reason }
            });

            revalidatePath('/finance/ap');

            return {
                success: true,
                data: {
                    refundStatementId: refundStatement.id,
                    refundNo,
                    refundAmount: data.refundAmount,
                    originalStatementNo: originalStatement.statementNo,
                    message: '供应商退款对账单创建成功'
                }
            };
        });
    } catch (error) {
        logger.error('创建供应商退款对账单失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '操作失败'
        };
    }
}

/**
 * 【仅供内部系统调用】接收来自于采购订单 PO 的流转并转化将其初始化为财务侧可见的应付账款。
 * 该行为为服务端纯事务性，依赖传入的安全上下文 TenantId 和当前已存储或新生成的订单编号执行同步结转动作。
 * 
 * @param poId 被结转转化和确认完结的当前系统层级（DB中存在）的采购订单主要建 ID。
 * @param tenantId 当前跨边界结转的安全租户。
 * @returns 结转执行情况并包揽系统新产生的结单 Statement ID
 */
export async function createApFromPoInternal(poId: string, tenantId: string) {
    return await db.transaction(async (tx) => {
        const po = await tx.query.purchaseOrders.findFirst({
            where: and(
                eq(purchaseOrders.id, poId),
                eq(purchaseOrders.tenantId, tenantId)
            ),
            with: {
                supplier: true,
                items: true
            }
        });

        if (!po) throw new Error('Purchase Order not found');

        // F-35: 从 PO items 计算总金额，使用 Decimal.js 确保精度
        const totalCost = (po.items || []).reduce((sum, item) => {
            const itemAmount = new Decimal((item as { amount?: string }).amount || '0').toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
            return sum.plus(itemAmount);
        }, new Decimal(0)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

        const [statement] = await tx.insert(apSupplierStatements).values({
            tenantId: tenantId,
            statementNo: generateBusinessNo('AP'),
            supplierId: po.supplierId,
            supplierName: po.supplier?.name || 'UNKNOWN',
            purchaseOrderId: po.id,
            totalAmount: totalCost.toFixed(2),
            pendingAmount: totalCost.toFixed(2),
            status: 'RECONCILING',
            // 使用 PO 创建人作为 purchaserId，如果为空需要 fallback (但 schema 要求 uuid)
            purchaserId: po.createdBy || '00000000-0000-0000-0000-000000000000',
        }).returning();

        // F-32: 记录采购转应付审计日志
        await AuditService.log(tx, {
            tenantId,
            userId: po.createdBy ?? undefined, // 使用采购人作为操作触发者
            tableName: 'ap_supplier_statements',
            recordId: statement.id,
            action: 'CREATE',
            newValues: statement,
            details: {
                type: 'PO_TO_AP',
                poId,
                poNo: po.poNo
            }
        });

        return { success: true, id: statement.id };

    });
}

/**
 * 发起对现有应付账款、付款单等关联业务的事务修改申请 (Revise)
 * 如果单子当前处于需要被外部人员退回或正在处于 DRAFT 可修正状态时适用。
 * 在每次提交变更之后所有挂载状态将会重置并按设定尝试挂靠新一次关联（可复用相同的 Workflow）。
 * 
 * @param data 包含了主验证 ID 及基于 Schema 提供所有重新修改（金额、事项明细及对象引用）字段的提交对象
 * @returns Object 执行成果及系统流水生成编号
 */
export async function updatePaymentBill(data: z.infer<typeof createPaymentBillSchema> & { id: string }) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // 权限检查：编辑财务记录
    if (!await checkPermission(session, PERMISSIONS.FINANCE.EDIT)) throw new Error('权限不足：需要财务编辑权限');

    const validatedData = createPaymentBillSchema.parse(data); // Re-validate
    const { items, ...billData } = validatedData;
    const { id } = data;

    return await db.transaction(async (tx) => {
        // 1. Check Existence & Status
        const existingBill = await tx.query.paymentBills.findFirst({
            where: and(
                eq(paymentBills.id, id),
                eq(paymentBills.tenantId, session.user.tenantId)
            )
        });

        if (!existingBill) throw new Error('付款单不存在');

        const editableStatuses = ['DRAFT', 'REJECTED', 'WITHDRAWN'];
        if (!editableStatuses.includes(existingBill.status)) {
            throw new Error('当前状态不可修改');
        }

        // 2. Update Bill
        const [updatedBill] = await tx.update(paymentBills)
            .set({
                ...billData,
                amount: billData.amount.toString(),
                updatedAt: new Date(),
                status: 'PENDING',
            })
            .where(eq(paymentBills.id, id))
            .returning();

        // 3. Update Items (Delete and Re-insert is simplest)
        await tx.delete(paymentBillItems).where(eq(paymentBillItems.paymentBillId, id));

        if (items && items.length > 0) {
            for (const item of items) {
                await tx.insert(paymentBillItems).values({
                    tenantId: session.user.tenantId,
                    paymentBillId: id,
                    statementType: item.statementType,
                    statementId: item.statementId,
                    statementNo: 'PENDING', // Should fetch actual No? createPaymentBill used 'PENDING' too.
                    amount: item.amount.toString(),
                });
            }
        }

        // 4. Trigger Approval (if configured)
        const flowCode = billData.type === 'REFUND'
            ? FinanceApprovalLogic.FLOW_CODES.REFUND
            : FinanceApprovalLogic.FLOW_CODES.PAYMENT;

        const isApprovalActive = await FinanceApprovalLogic.isFlowActive(session.user.tenantId, flowCode);


        if (isApprovalActive) {
            // Check if there is an active approval? existingBill status check ensures we are not active.
            // Submit new approval
            const approvalRes = await submitApproval({
                entityType: 'PAYMENT_BILL',
                entityId: id,
                flowCode: flowCode,
                comment: billData.type === 'REFUND' ? 'Refund Bill Revised' : 'Payment Bill Revised'
            });

            if (approvalRes.success) {
                await tx.update(paymentBills)
                    .set({ status: 'PENDING_APPROVAL' })
                    .where(eq(paymentBills.id, id));

                updatedBill.status = 'PENDING_APPROVAL';
            } else {
                // 审批提交失败，抛出错误
                const errorMessage = 'error' in approvalRes && typeof approvalRes.error === 'string'
                    ? approvalRes.error
                    : '审批提交失败';
                throw new Error('Failed to submit approval: ' + errorMessage);
            }
        }

        revalidatePath('/finance/ap');
        return updatedBill;
    });
}
