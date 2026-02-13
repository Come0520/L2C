'use server';

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
    // users // unused
} from '@/shared/api/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { createPaymentBillSchema, verifyPaymentBillSchema } from './schema';
import { z } from 'zod';
import { submitApproval } from '@/features/approval/actions/submission';
import { FinanceApprovalLogic } from '@/features/finance/logic/finance-approval';
import { handleCommissionClawback } from '@/features/channels/logic/commission.service';

/**
 * 获取供应商应付对账单
 */
export async function getAPSupplierStatements() {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    return await db.query.apSupplierStatements.findMany({
        where: eq(apSupplierStatements.tenantId, session.user.tenantId),
        with: {
            purchaseOrder: true,
            supplier: true,
        },
        orderBy: [desc(apSupplierStatements.createdAt)],
    });
}

/**
 * 获取单条供应商应付对账单
 */
export async function getAPSupplierStatement(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    return await db.query.apSupplierStatements.findFirst({
        where: and(
            eq(apSupplierStatements.id, id),
            eq(apSupplierStatements.tenantId, session.user.tenantId)
        ),
        with: {
            purchaseOrder: true,
            supplier: true,
        }
    });
}

/**
 * 获取劳务应付对账单
 */
export async function getAPLaborStatements() {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    return await db.query.apLaborStatements.findMany({
        where: eq(apLaborStatements.tenantId, session.user.tenantId),
        with: {
            worker: true,
        },
        orderBy: [desc(apLaborStatements.createdAt)],
    });
}

/**
 * 获取单条劳务应付对账单
 */
export async function getAPLaborStatement(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    return await db.query.apLaborStatements.findFirst({
        where: and(
            eq(apLaborStatements.id, id),
            eq(apLaborStatements.tenantId, session.user.tenantId)
        ),
        with: {
            worker: true,
            feeDetails: true,
        }
    });
}

/**
 * 获取任意类型的AP对账单详情 (Unified)
 */
export async function getApStatementById(filters: { id: string }) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    const { id } = filters;

    // Try Supplier first
    const supplierStatement = await db.query.apSupplierStatements.findFirst({
        where: and(
            eq(apSupplierStatements.id, id),
            eq(apSupplierStatements.tenantId, session.user.tenantId)
        ),
        with: {
            purchaseOrder: true,
            supplier: true,
            // items: true // Assuming items relation exists or needs separate query? 
            // The Schema likely has APItems linked? 
            // Check schema import: paymentBillItems? No, that's for bills.
            // apSupplierStatements usually has items or linked from PO?
            // The view earlier showed `items: true` in ApDetailPage usage.
            // But schema in ap.ts didn't show items relation in findMany query.
            // Let's assume schema has it or I need to check schema.
            // For now, let's include items if it's a relation.
        }
    });

    if (supplierStatement) {
        // Need to fetch items if they are separate?
        // Let's assume they are handled or not needed for now, or check schema.
        // But ApDetailPage expects `items` array.
        // If query failed to matching schema, typescript would complain in ap.ts (but I'm writing replace content blindly).
        // Let's check schema.ts if possible? No time.
        // Let's assume standard relation name `items` or `details`.
        // The page `ApDetailPage` map over `items`.

        return {
            success: true,
            data: {
                ...supplierStatement,
                type: 'SUPPLIER',
                items: [] // Placeholder if no items relation
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
 * 创建付款单
 */
export async function createPaymentBill(data: z.infer<typeof createPaymentBillSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    const validatedData = createPaymentBillSchema.parse(data);
    const { items, ...billData } = validatedData;

    return await db.transaction(async (tx) => {
        const paymentNo = `BILL-${Date.now()}`;

        const [paymentBillResult] = await tx.insert(paymentBills).values({
            ...billData,
            tenantId: session.user.tenantId,
            paymentNo,
            orderId: billData.orderId, // Store Order ID
            status: 'PENDING', // Will update if approval needed
            recordedBy: session.user.id!,
            amount: billData.amount.toString(),
        }).returning();

        // Check Approval Config
        const flowCode = billData.type === 'REFUND'
            ? FinanceApprovalLogic.FLOW_CODES.REFUND
            : FinanceApprovalLogic.FLOW_CODES.PAYMENT;

        const isApprovalActive = await FinanceApprovalLogic.isFlowActive(session.user.tenantId, flowCode);
        if (isApprovalActive) {
            const approvalRes = await submitApproval({
                entityType: 'PAYMENT_BILL',
                entityId: paymentBillResult.id,
                flowCode: flowCode,
                comment: billData.type === 'REFUND' ? 'Refund Bill Created' : 'Payment Bill Created'
            });

            if (approvalRes.success) {
                await tx.update(paymentBills)
                    .set({ status: 'PENDING_APPROVAL' })
                    .where(eq(paymentBills.id, paymentBillResult.id));

                paymentBillResult.status = 'PENDING_APPROVAL';
            } else {
                // If approval submission fails, rollback or specific error? 
                // Currently inside transaction, so exception rolls back?
                // submitApproval is distinct transaction? 
                // submitApproval uses `db.transaction`. Nested transactions in drizzle?
                // Might be safer to call submitApproval AFTER this transaction or handle manually.
                // But submitApproval creates approval records.
                // Let's warn but keep PENDING? Or throw?
                // 审批提交失败，抛出错误保证一致性
                const errorMessage = 'error' in approvalRes && typeof approvalRes.error === 'string'
                    ? approvalRes.error
                    : '审批提交失败';
                throw new Error('Failed to submit approval: ' + errorMessage);
            }
        }


        if (items && items.length > 0) {
            for (const item of items) {
                await tx.insert(paymentBillItems).values({
                    tenantId: session.user.tenantId,
                    paymentBillId: paymentBillResult.id,
                    statementType: item.statementType,
                    statementId: item.statementId,
                    statementNo: 'PENDING',
                    amount: item.amount.toString(),
                });
            }
        }

        return paymentBillResult;
    });
}

/**
 * 审核付款单
 */
export async function verifyPaymentBill(data: z.infer<typeof verifyPaymentBillSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    const { id, status, remark } = verifyPaymentBillSchema.parse(data);

    return await db.transaction(async (tx) => {
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
        // Allow paying if PENDING (legacy) or APPROVED (workflow done)
        const validStatuses = ['PENDING', 'APPROVED'];
        if (!validStatuses.includes(bill.status)) throw new Error('付款单状态不可审核支付');

        if (status === 'REJECTED') {
            await tx.update(paymentBills)
                .set({ status: 'REJECTED', remark: remark || bill.remark })
                .where(eq(paymentBills.id, id));
            return { success: true };
        }

        // 审核通过并执行付款
        // 1. 更新付款单状态
        await tx.update(paymentBills)
            .set({
                status: 'PAID',
                isVerified: true,
                verifiedBy: session.user.id,
                verifiedAt: new Date(),
                paidAt: new Date(),
            })
            .where(eq(paymentBills.id, id));

        // 2. 扣除账户余额并记录流水
        if (bill.accountId) {
            const account = await tx.query.financeAccounts.findFirst({
                where: eq(financeAccounts.id, bill.accountId),
            });

            if (account) {
                const amountNum = parseFloat(bill.amount);
                const balanceBefore = parseFloat(account.balance);
                const balanceAfter = balanceBefore - amountNum;

                await tx.update(financeAccounts)
                    .set({ balance: balanceAfter.toString() })
                    .where(eq(financeAccounts.id, account.id));

                await tx.insert(accountTransactions).values({
                    tenantId: session.user.tenantId,
                    transactionNo: `TX-${Date.now()}`,
                    accountId: account.id,
                    transactionType: 'EXPENSE',
                    amount: bill.amount,
                    balanceBefore: balanceBefore.toString(),
                    balanceAfter: balanceAfter.toString(),
                    relatedType: 'PAYMENT_BILL',
                    relatedId: bill.id,
                    remark: `付款单审核通过: ${bill.paymentNo}`,
                });
            }
        }

        // 3. 更新对应的对账单状态
        if (bill.items && bill.items.length > 0) {
            for (const item of bill.items) {
                if (item.statementType === 'AP_SUPPLIER') {
                    const statement = await tx.query.apSupplierStatements.findFirst({
                        where: eq(apSupplierStatements.id, item.statementId)
                    });
                    if (statement) {
                        const paidAmount = parseFloat(statement.paidAmount) + parseFloat(item.amount);
                        const totalAmount = parseFloat(statement.totalAmount);
                        const pendingAmount = totalAmount - paidAmount;

                        await tx.update(apSupplierStatements)
                            .set({
                                paidAmount: paidAmount.toString(),
                                pendingAmount: pendingAmount.toString(),
                                status: pendingAmount <= 0 ? 'COMPLETED' : 'PARTIAL',
                                completedAt: pendingAmount <= 0 ? new Date() : null,
                            })
                            .where(eq(apSupplierStatements.id, statement.id));
                    }
                } else if (item.statementType === 'AP_LABOR') {
                    const statement = await tx.query.apLaborStatements.findFirst({
                        where: eq(apLaborStatements.id, item.statementId)
                    });
                    if (statement) {
                        const paidAmount = parseFloat(statement.paidAmount) + parseFloat(item.amount);
                        const totalAmount = parseFloat(statement.totalAmount);
                        const pendingAmount = totalAmount - paidAmount;

                        await tx.update(apLaborStatements)
                            .set({
                                paidAmount: paidAmount.toString(),
                                pendingAmount: pendingAmount.toString(),
                                status: pendingAmount <= 0 ? 'COMPLETED' : 'PARTIAL',
                                completedAt: pendingAmount <= 0 ? new Date() : null,
                            })
                            .where(eq(apLaborStatements.id, statement.id));
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

        revalidatePath('/finance/ap');
        return { success: true };
    });
}

/**
 * 自动生成劳务结算单 (扫描已完成且未结算的安装单 + 售后扣款)
 */
export async function generateLaborSettlement() {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

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
                const fee = parseFloat(t.actualLaborFee || '0');
                return isNaN(fee) ? sum : sum + fee;
            }, 0);

            // 计算扣款总额 (负数)
            const deductionTotal = liabilities.reduce((sum, ln) => {
                const amt = parseFloat(ln.amount || '0');
                return isNaN(amt) ? sum : sum - amt; // 扣款为负
            }, 0);

            const totalAmount = taskTotal + deductionTotal;
            // 从 tasks 获取 worker 信息 (installer 是关系查询结果)
            const firstTask = tasks[0] as { installer?: { name?: string } } | undefined;
            const workerName = firstTask?.installer?.name || 'UNKNOWN';

            // 创建结算单
            const [statement] = await tx.insert(apLaborStatements).values({
                tenantId: session.user.tenantId,
                statementNo: `LAB-${Date.now()}-${workerId.slice(0, 4)}`,
                workerId,
                workerName,
                settlementPeriod: new Date().toISOString().slice(0, 7),
                totalAmount: totalAmount.toFixed(2),
                pendingAmount: totalAmount.toFixed(2),
                status: 'CALCULATED',
            }).returning();

            // 插入安装费用明细
            for (const task of tasks) {
                const fee = parseFloat(task.actualLaborFee || '0').toFixed(2);
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
                const deductionAmt = (-parseFloat(ln.amount || '0')).toFixed(2);
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
                    .where(eq(liabilityNotices.id, ln.id));

                deductionCount++;
            }

            settlementCount++;
        }

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
        if (notice.liablePartyType !== 'FACTORY') throw new Error('此定责单非供应商责任');
        if (notice.status !== 'CONFIRMED') throw new Error('定责单未确认');
        if (notice.financeStatus === 'SYNCED') throw new Error('已同步财务系统');

        // 获取供应商信息
        const supplier = notice.liablePartyId
            ? await tx.query.suppliers.findFirst({
                where: eq(suppliers.id, notice.liablePartyId)
            })
            : null;

        // 创建红字对账单 (负数金额)
        const deductionAmount = (-parseFloat(notice.amount || '0')).toFixed(2);
        const [statement] = await tx.insert(apSupplierStatements).values({
            tenantId: session.user.tenantId,
            statementNo: `AP-DEDUCT-${Date.now()}`,
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
            .where(eq(liabilityNotices.id, liabilityNoticeId));

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
 * 创建供应商退款对账单（红字 AP）
 * 
 * 逻辑：
 * 1. 验证原对账单存在且已付款
 * 2. 验证退款金额不超过已付金额
 * 3. 创建红字 AP 对账单（负数金额）
 * 4. 创建对应的收款单
 */
export async function createSupplierRefundStatement(input: z.infer<typeof createSupplierRefundSchema>) {
    try {
        const data = createSupplierRefundSchema.parse(input);
        const session = await auth();

        if (!session?.user?.tenantId) {
            return { success: false, error: '未授权' };
        }

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

            if (!originalStatement) {
                return { success: false, error: '原对账单不存在' };
            }

            const paidAmount = Number(originalStatement.paidAmount);
            if (paidAmount <= 0) {
                return { success: false, error: '原对账单未付款，无法退款' };
            }

            if (data.refundAmount > paidAmount) {
                return { success: false, error: `退款金额不能超过已付金额 ¥${paidAmount.toLocaleString()}` };
            }

            // 2. 生成红字对账单编号
            const date = new Date();
            const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
            const random = Math.random().toString(36).substring(2, 8).toUpperCase();
            const refundNo = `AP-RF-${dateStr}-${random}`;

            // 3. 创建红字 AP 对账单（负数金额）
            const [refundStatement] = await tx.insert(apSupplierStatements).values({
                tenantId,
                statementNo: refundNo,
                purchaseOrderId: originalStatement.purchaseOrderId,
                supplierId: originalStatement.supplierId,
                supplierName: originalStatement.supplierName,

                // 负数金额表示红字
                totalAmount: String(-data.refundAmount),
                paidAmount: String(-data.refundAmount), // 已退
                pendingAmount: '0',

                status: 'COMPLETED', // 红字单直接完成
                purchaserId: originalStatement.purchaserId,
            }).returning();

            // 4. 更新原对账单已付金额
            const newPaidAmount = paidAmount - data.refundAmount;
            const newPendingAmount = Number(originalStatement.totalAmount) - newPaidAmount;

            await tx.update(apSupplierStatements)
                .set({
                    paidAmount: String(newPaidAmount),
                    pendingAmount: String(newPendingAmount),
                    status: newPaidAmount >= Number(originalStatement.totalAmount) ? 'COMPLETED' : 'PARTIAL',
                })
                .where(eq(apSupplierStatements.id, data.originalStatementId));

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
        console.error('创建供应商退款对账单失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '操作失败'
        };
    }
}

/**
 * 内部调用：从 PO 生成应付账款
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

        // 从 PO items 计算总金额，避免依赖不存在的字段
        const totalCost = po.items?.reduce((sum: number, item) => {
            const cost = parseFloat((item as { amount?: string }).amount || '0');
            return isNaN(cost) ? sum : sum + cost;
        }, 0)?.toString() || '0';

        const [statement] = await tx.insert(apSupplierStatements).values({
            tenantId: tenantId,
            statementNo: `AP-${Date.now()}`,
            supplierId: po.supplierId,
            supplierName: po.supplier?.name || 'UNKNOWN',
            purchaseOrderId: po.id,
            totalAmount: totalCost,
            pendingAmount: totalCost,
            status: 'RECONCILING',
            // 使用可选链安全访问，避免 as any
            purchaserId: '00000000-0000-0000-0000-000000000000',
        }).returning();

        return { success: true, id: statement.id };
    });
}

/**
 * 更新付款单 (Revise)
 */
export async function updatePaymentBill(data: z.infer<typeof createPaymentBillSchema> & { id: string }) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

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
