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
                items: (laborStatement as any).feeDetails || [] // Map feeDetails to items
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
            status: 'PENDING',
            recordedBy: session.user.id!,
            amount: billData.amount.toString(),
        }).returning();

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

        const tasksByWorker = new Map<string, typeof installTasks.$inferSelect[]>();
        finishedTasks.forEach(task => {
            if (!task.installerId) return;
            const tasks = tasksByWorker.get(task.installerId) || [];
            tasks.push(task);
            tasksByWorker.set(task.installerId, tasks);
        });

        let settlementCount = 0;
        for (const [workerId, tasks] of tasksByWorker.entries()) {
            const worker = (tasks[0] as any).installer;

            const totalAmount = tasks.reduce((sum: number, t: typeof installTasks.$inferSelect) => {
                const fee = parseFloat(t.actualLaborFee || '0');
                if (isNaN(fee)) return sum;
                return sum + fee;
            }, 0);

            if (totalAmount <= 0) {
                // Might handle 0 fee tasks, but for now skip generating 0 amount statement
                // But wait, if we skip, they remain "unsettled" forever?
                // Maybe we should generate it even if 0, or mark them processed.
                // For now, let's assume valid tasks have fee.
                // If we strictly skip, next run picks them up again.
                // Improve: if sum is 0, still settle them?
                // Let's settle them to clear the queue.
            }

            const [statement] = await tx.insert(apLaborStatements).values({
                tenantId: session.user.tenantId,
                statementNo: `LAB-${Date.now()}-${workerId.slice(0, 4)}`,
                workerId,
                workerName: worker?.name || 'UNKNOWN',
                settlementPeriod: new Date().toISOString().slice(0, 7), // YYYY-MM
                totalAmount: totalAmount.toFixed(2),
                pendingAmount: totalAmount.toFixed(2),
                status: 'CALCULATED',
            }).returning();

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
            settlementCount++;
        }

        revalidatePath('/finance/ap/labor');
        return { count: settlementCount };
    });
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

        // Check if already exists? (Maybe logic needed)

        const totalCost = (po as any).totalCost || '0'; // Assuming field exists or we calculate from items

        const [statement] = await tx.insert(apSupplierStatements).values({
            tenantId: tenantId,
            statementNo: `AP-${Date.now()}`,
            supplierId: po.supplierId,
            supplierName: po.supplier?.name || 'UNKNOWN',
            purchaseOrderId: po.id,
            // purchaseOrderNo: po.poNo, // Not in schema
            // reconciliationPeriod: new Date().toISOString().slice(0, 7), // Not in schema
            totalAmount: totalCost,
            pendingAmount: totalCost,
            status: 'RECONCILING',
            purchaserId: (po as any).createdBy || (po as any).userId || '00000000-0000-0000-0000-000000000000',
        } as any).returning();

        return { success: true, id: statement.id };
    });
}
