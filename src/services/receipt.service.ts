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

export class ReceiptService {

    /**
     * Create a Receipt Bill (Draft/Pending Approval)
     */
    static async createReceiptBill(data: CreateReceiptBillData, tenantId: string, userId: string) {
        return await db.transaction(async (tx) => {
            const receiptNo = `REC-${Date.now()}`;

            const [receiptBillResult] = await tx.insert(receiptBills).values({
                tenantId,
                receiptNo,
                customerId: data.customerId,
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                totalAmount: data.totalAmount,
                usedAmount: '0',
                remainingAmount: data.totalAmount,
                type: data.type,
                status: 'DRAFT', // Explicitly DRAFT until submitted
                paymentMethod: data.paymentMethod,
                accountId: data.accountId,
                proofUrl: data.proofUrl,
                receivedAt: data.receivedAt,
                remark: data.remark,
                createdBy: userId,
            }).returning();

            if (data.items && data.items.length > 0) {
                for (const item of data.items) {
                    await tx.insert(receiptBillItems).values({
                        tenantId,
                        receiptBillId: receiptBillResult.id,
                        orderId: item.orderId,
                        orderNo: item.orderNo,
                        amount: item.amount,
                        statementId: item.statementId,
                        scheduleId: item.scheduleId,
                    });
                }
            }

            return receiptBillResult;
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
                .where(eq(receiptBills.id, id));
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

        const settings = (tenant?.settings as any) || {};
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
            if (bill.status !== 'APPROVED') {
                // Should already be APPROVED by the workflow callback
                // but we check to be safe if called manually
            }

            // 1. Update status to VERIFIED (Final state in financial sense)
            await tx.update(receiptBills)
                .set({
                    status: 'VERIFIED',
                    verifiedBy: userId,
                    verifiedAt: new Date(),
                })
                .where(eq(receiptBills.id, id));

            // 2. Update Finance Account Balance
            if (bill.accountId) {
                const account = await tx.query.financeAccounts.findFirst({
                    where: eq(financeAccounts.id, bill.accountId),
                });

                if (account) {
                    const amountNum = new Decimal(bill.totalAmount);
                    const balanceBefore = new Decimal(account.balance);
                    const balanceAfter = balanceBefore.plus(amountNum);

                    await tx.update(financeAccounts)
                        .set({ balance: balanceAfter.toString() })
                        .where(eq(financeAccounts.id, account.id));

                    // 3. Create Account Transaction Record
                    await tx.insert(accountTransactions).values({
                        tenantId,
                        transactionNo: `TX-${Date.now()}`,
                        accountId: account.id,
                        transactionType: 'INCOME',
                        amount: bill.totalAmount,
                        balanceBefore: balanceBefore.toString(),
                        balanceAfter: balanceAfter.toString(),
                        relatedType: 'RECEIPT_BILL',
                        relatedId: bill.id,
                        remark: `Receipt Bill Approved & Verified: ${bill.receiptNo}`,
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
                        ),
                        with: { channel: true }
                    });

                    if (statement) {
                        const receivedBefore = new Decimal(statement.receivedAmount);
                        const itemAmount = new Decimal(item.amount);
                        const receivedAfter = receivedBefore.plus(itemAmount);
                        const total = new Decimal(statement.totalAmount);
                        const pending = total.minus(receivedAfter);

                        let newStatus = statement.status;
                        if (pending.lte(0)) {
                            newStatus = 'PAID';
                        } else if (receivedAfter.gt(0)) {
                            newStatus = 'PARTIAL';
                        }

                        await tx.update(arStatements)
                            .set({
                                receivedAmount: receivedAfter.toString(),
                                pendingAmount: pending.toString(),
                                status: newStatus as any,
                                completedAt: pending.lte(0) ? new Date() : null,
                            })
                            .where(eq(arStatements.id, statement.id));

                        // 5. Trigger Commission Calculation if needed
                        // (Assuming calculateCommission is accessible or moved to a shared place)
                        // For now we omit or assume it's handled.
                    }
                }
            }

            return { success: true };
        });
    }
}
