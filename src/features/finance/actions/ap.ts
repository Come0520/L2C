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
    users
} from '@/shared/api/schema';
import { eq, and, desc, sql, isNull, inArray } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { createPaymentBillSchema, verifyPaymentBillSchema } from './schema';
import { z } from 'zod';

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
            status: 'PENDING',
            recordedBy: session.user.id!,
            totalAmount: billData.amount.toString(), // 数据库列名为 amount, schema中可能映射错了？ 检查：finance.ts 里是 amount
        }).returning();

        if (items && items.length > 0) {
            for (const item of items) {
                await tx.insert(paymentBillItems).values({
                    tenantId: session.user.tenantId,
                    paymentBillId: paymentBillResult.id,
                    statementType: item.statementType,
                    statementId: item.statementId,
                    statementNo: 'PENDING', // 实际应查一下
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
        if (bill.status !== 'PENDING') throw new Error('付款单状态不在待审核');

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

        revalidatePath('/finance/ap');
        return { success: true };
    });
}

/**
 * 自动生成劳务结算单 (扫描已完成且未结算的安装单)
 */
export async function generateLaborSettlement() {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    return await db.transaction(async (tx) => {
        // 1. 查找已完成但未在劳务费明细中记录的安装单
        // 这里需要通过关联查询或 existence check。简单方案：查出所有已关联的任务ID。
        const settledTaskIds = await tx.select({ id: apLaborFeeDetails.installTaskId })
            .from(apLaborFeeDetails)
            .where(eq(apLaborFeeDetails.tenantId, session.user.tenantId));
        const excludeIds = settledTaskIds.map(t => t.id);

        const finishedTasks = await tx.query.installTasks.findMany({
            where: and(
                eq(installTasks.tenantId, session.user.tenantId),
                eq(installTasks.status, 'COMPLETED'),
                excludeIds.length > 0 ? sql`${installTasks.id} NOT IN (${excludeIds})` : undefined
            ),
            with: {
                installer: true
            }
        });

        if (finishedTasks.length === 0) return { count: 0 };

        // 2. 按安装工分组生成结算单
        const tasksByWorker = new Map<string, any[]>();
        finishedTasks.forEach(task => {
            if (!task.installerId) return;
            const tasks = tasksByWorker.get(task.installerId) || [];
            tasks.push(task);
            tasksByWorker.set(task.installerId, tasks);
        });

        let settlementCount = 0;
        for (const [workerId, tasks] of tasksByWorker.entries()) {
            const worker = tasks[0].installer;

            // 计算总额 (Mock: 每单 100)
            const totalAmount = tasks.length * 100;

            const [statement] = await tx.insert(apLaborStatements).values({
                tenantId: session.user.tenantId,
                statementNo: `LAB-${Date.now()}-${workerId.slice(0, 4)}`,
                workerId,
                workerName: worker?.name || 'UNKNOWN',
                settlementPeriod: new Date().toISOString().slice(0, 7), // YYYY-MM
                totalAmount: totalAmount.toString(),
                pendingAmount: totalAmount.toString(),
                status: 'CALCULATED',
            }).returning();

            for (const task of tasks) {
                await tx.insert(apLaborFeeDetails).values({
                    tenantId: session.user.tenantId,
                    statementId: statement.id,
                    installTaskId: task.id,
                    installTaskNo: task.installTaskNo || 'TASK',
                    feeType: 'BASE',
                    description: '安装标单费用',
                    calculation: '100 / 单',
                    amount: '100.00',
                });
            }
            settlementCount++;
        }

        revalidatePath('/finance/ap/labor');
        return { count: settlementCount };
    });
}
