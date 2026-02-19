import { db } from "@/shared/api/db";
import {
    receiptBills,
    receiptBillItems,
    financeAccounts,
    accountTransactions,
    arStatements,
    tenants
} from "@/shared/api/schema";
import { eq, and } from "drizzle-orm";
import { Decimal } from "decimal.js";
import { submitApproval } from "@/features/approval/actions/submission";
import { checkAndGenerateCommission } from "@/features/channels/logic/commission.service";
import { generateBusinessNo } from "@/shared/lib/generate-no";
import { AuditService } from "@/shared/services/audit-service";

export interface CreateReceiptBillData {
    customerId?: string;
    customerName: string;
    customerPhone: string;
    totalAmount: string;
    type: 'PREPAID' | 'NORMAL';
    paymentMethod: string;
    accountId?: string;
    proofUrl: string;
    receivedAt: Date;
    remark?: string;
    items?: {
        orderId: string;
        orderNo: string;
        amount: string;
        statementId?: string;
        scheduleId?: string;
    }[];
}
interface TenantSettings {
    tenantScale?: 'LARGE' | 'SMALL';
    largeAmountThreshold?: string;
}

export class ReceiptService {

    /**
     * Create a Receipt Bill (Draft/Pending Approval)
     */
    static async createReceiptBill(data: CreateReceiptBillData, tenantId: string, userId: string) {
        return await db.transaction(async (tx) => {
            const receiptNo = generateBusinessNo('REC');

            const totalAmount = new Decimal(data.totalAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

            const [bill] = await tx.insert(receiptBills).values({
                tenantId,
                receiptNo,
                customerId: data.customerId,
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                totalAmount: totalAmount.toFixed(2),
                usedAmount: '0',
                remainingAmount: totalAmount.toFixed(2),
                type: data.type,
                status: 'PENDING',
                paymentMethod: data.paymentMethod,
                accountId: data.accountId,
                proofUrl: data.proofUrl,
                receivedAt: data.receivedAt,
                remark: data.remark,
                createdBy: userId,
            }).returning();

            if (data.items && data.items.length > 0) {
                for (const item of data.items) {
                    const itemAmount = new Decimal(item.amount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

                    await tx.insert(receiptBillItems).values({
                        tenantId,
                        receiptBillId: bill.id,
                        orderId: item.orderId,
                        orderNo: item.orderNo || 'UNKNOWN',
                        amount: itemAmount.toFixed(2),
                        statementId: item.statementId,
                        scheduleId: item.scheduleId,
                    });
                }
            }

            // 审计日志 (Audit Log)
            await AuditService.log(tx, {
                tenantId,
                userId,
                tableName: 'receipt_bills',
                recordId: bill.id,
                action: 'INSERT',
                newValues: bill,
                details: { receiptNo, itemsCount: data.items?.length || 0 }
            });

            return bill;
        });
    }

    /**
     * Submit Receipt Bill for Approval
     */
    static async submitForApproval(id: string, tenantId: string) {
        const bill = await db.query.receiptBills.findFirst({
            where: and(eq(receiptBills.id, id), eq(receiptBills.tenantId, tenantId))
        });

        if (!bill) throw new Error('Receipt bill not found');
        if (bill.status !== 'DRAFT' && bill.status !== 'REJECTED') {
            throw new Error(`Invalid status for submission: ${bill.status}`);
        }

        // Determine Flow Code based on Tenant Scale and Amount
        const flowCode = await this.determineApprovalFlow(tenantId, bill.totalAmount);

        // Submit to Approval Workflow
        const result = await submitApproval({
            entityType: 'PAYMENT_BILL', // Using existing type or map to a new one if needed
            entityId: id,
            flowCode: flowCode,
            comment: '提交收款单审批',
            amount: bill.totalAmount,
        });

        if (result.success) {
            await db.update(receiptBills)
                .set({ status: 'PENDING_APPROVAL' })
                .where(and(
                    eq(receiptBills.id, id),
                    eq(receiptBills.tenantId, tenantId)
                ));
        }

        return result;
    }

    /**
     * Determine which approval flow to use
     */
    private static async determineApprovalFlow(tenantId: string, amount: string): Promise<string> {
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId)
        });

        const settings = (tenant?.settings as unknown as TenantSettings) || {};
        const isLarge = settings.tenantScale === 'LARGE';
        const amountNum = new Decimal(amount);
        const threshold = new Decimal(settings.largeAmountThreshold || '10000');

        if (!isLarge) {
            return 'RECEIPT_SMALL_TENANT';
        }

        if (amountNum.lt(threshold)) {
            return 'RECEIPT_LARGE_TENANT_SMALL_AMOUNT';
        } else {
            return 'RECEIPT_LARGE_TENANT_LARGE_AMOUNT';
        }
    }

    /**
     * Execute business logic after approval
     */
    static async onApproved(id: string, tenantId: string, userId: string) {
        return await db.transaction(async (tx) => {
            const bill = await tx.query.receiptBills.findFirst({
                where: and(eq(receiptBills.id, id), eq(receiptBills.tenantId, tenantId)),
                with: { items: true }
            });

            if (!bill) throw new Error('Receipt Bill not found');

            // 1. Update status to VERIFIED (Final state in financial sense)
            await tx.update(receiptBills)
                .set({
                    status: 'VERIFIED',
                    verifiedBy: userId,
                    verifiedAt: new Date(),
                })
                .where(and(
                    eq(receiptBills.id, id),
                    eq(receiptBills.tenantId, tenantId)
                ));

            // 2. Update Finance Account Balance
            if (bill.accountId) {
                const account = await tx.query.financeAccounts.findFirst({
                    where: and(
                        eq(financeAccounts.id, bill.accountId),
                        eq(financeAccounts.tenantId, tenantId)
                    ),
                });

                if (account) {
                    const amountNum = new Decimal(bill.totalAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
                    const balanceBefore = new Decimal(account.balance || '0').toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
                    const balanceAfter = balanceBefore.plus(amountNum).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

                    await tx.update(financeAccounts)
                        .set({
                            balance: balanceAfter.toFixed(2, Decimal.ROUND_HALF_UP),
                            updatedAt: new Date()
                        })
                        .where(and(
                            eq(financeAccounts.id, account.id),
                            eq(financeAccounts.tenantId, tenantId),
                            eq(financeAccounts.balance, balanceBefore.toFixed(2, Decimal.ROUND_HALF_UP)) // 乐观锁
                        ));


                    // 3. Create Account Transaction Record
                    const txNo = generateBusinessNo('TX');
                    await tx.insert(accountTransactions).values({
                        tenantId,
                        transactionNo: txNo,
                        accountId: account.id,
                        transactionType: 'INCOME',
                        amount: amountNum.toFixed(2),
                        balanceBefore: balanceBefore.toFixed(2),
                        balanceAfter: balanceAfter.toFixed(2),
                        relatedType: 'RECEIPT_BILL',
                        relatedId: bill.id,
                        remark: `收款单过账: ${bill.receiptNo}`,
                    });

                    // 审计日志 (Audit Log for Account Balance Change)
                    await AuditService.log(tx, {
                        tenantId,
                        userId,
                        tableName: 'finance_accounts',
                        recordId: account.id,
                        action: 'UPDATE',
                        newValues: { balance: balanceAfter.toFixed(2) },
                        oldValues: { balance: balanceBefore.toFixed(2) },
                        details: { relatedId: bill.id, transactionNo: txNo, type: 'RECEIPT_POSTING' }
                    });
                }
            }

            // 4. Update AR Statements
            if (bill.items && bill.items.length > 0) {
                for (const item of bill.items) {
                    const statement = await tx.query.arStatements.findFirst({
                        where: and(
                            eq(arStatements.id, item.statementId!),
                            eq(arStatements.tenantId, tenantId)
                        )
                    });

                    if (statement) {
                        const receivedBefore = new Decimal(statement.receivedAmount || '0');
                        const itemAmount = new Decimal(item.amount);
                        const receivedAfter = receivedBefore.plus(itemAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
                        const total = new Decimal(statement.totalAmount || '0');
                        const pending = total.minus(receivedAfter).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

                        let newStatus = statement.status;
                        if (pending.lte(0)) {
                            newStatus = 'PAID';
                        } else if (receivedAfter.gt(0)) {
                            newStatus = 'PARTIAL';
                        }

                        await tx.update(arStatements)
                            .set({
                                receivedAmount: receivedAfter.toFixed(2, Decimal.ROUND_HALF_UP),
                                pendingAmount: pending.toFixed(2, Decimal.ROUND_HALF_UP),
                                status: newStatus,
                                completedAt: pending.lte(0) ? new Date() : null,
                                updatedAt: new Date()
                            })
                            .where(and(
                                eq(arStatements.id, statement.id),
                                eq(arStatements.tenantId, tenantId),
                                eq(arStatements.receivedAmount, receivedBefore.toFixed(2, Decimal.ROUND_HALF_UP)) // 乐观锁
                            ));

                        // 审计日志 (AR Statement Update)
                        await AuditService.log(tx, {
                            tenantId,
                            userId,
                            tableName: 'ar_statements',
                            recordId: statement.id,
                            action: 'UPDATE',
                            oldValues: { status: statement.status, receivedAmount: receivedBefore.toFixed(2), pendingAmount: statement.pendingAmount },
                            newValues: { status: newStatus, receivedAmount: receivedAfter.toFixed(2), pendingAmount: pending.toFixed(2) },
                            details: { relatedId: bill.id, type: 'RECEIPT_VERIFICATION' }
                        });


                        // 5. 触发渠道佣金结算 (Trigger Commission Calculation)
                        if (pending.lte(0) && item.orderId) {
                            await checkAndGenerateCommission(item.orderId, 'PAYMENT_COMPLETED');
                        }
                    }
                }
            }

            // 6. 后期审计 (Receipt Verified Log)
            await AuditService.log(tx, {
                tenantId,
                userId,
                tableName: 'receipt_bills',
                recordId: id,
                action: 'UPDATE',
                newValues: { status: 'VERIFIED' },
                oldValues: { status: bill.status },
                details: { receiptNo: bill.receiptNo }
            });

            return { success: true };
        });
    }
}
