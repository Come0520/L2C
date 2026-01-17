import { db } from "@/shared/api/db";
import {
    paymentSchedules,
    orders,
    paymentOrders,
    financeAccounts,
    accountTransactions,
    arStatements,
    commissionRecords,
    paymentOrderItems,
    orderItems,
    products
} from "@/shared/api/schema";
import { eq, and, inArray } from "drizzle-orm";
import { Decimal } from "decimal.js";

export interface CreatePaymentOrderData {
    customerId?: string;
    customerName: string;
    customerPhone: string;
    totalAmount: string; // amount
    type: 'PREPAID' | 'NORMAL';
    paymentMethod: string;
    accountId?: string;
    proofUrl: string;
    receivedAt: Date;
    remark?: string;
    items?: {
        orderId: string;
        amount: number;
    }[];
}

export class FinanceService {

    /**
     * Generates payment schedules based on payment terms (e.g., 30-30-40).
     */
    static async generateReceivables(orderId: string, totalAmount: string, tenantId: string, ratios: number[] = [0.6, 0.4]) {
        const total = new Decimal(totalAmount);

        // Validate ratios sum to 1
        const sum = ratios.reduce((a, b) => a + b, 0);
        if (Math.abs(sum - 1) > 0.001) {
            throw new Error("Payment ratios must sum to 1");
        }

        const schedules = [];
        let currentTotal = new Decimal(0);

        for (let i = 0; i < ratios.length; i++) {
            const ratio = ratios[i];
            let amount = total.times(ratio).toDecimalPlaces(2);

            // Adjust last installment to handle rounding errors
            if (i === ratios.length - 1) {
                amount = total.minus(currentTotal);
            } else {
                currentTotal = currentTotal.plus(amount);
            }

            const name = i === 0 ? "预付款/Deposit" : (i === ratios.length - 1 ? "尾款/Balance" : `阶段款/Stage ${i + 1}`);

            schedules.push({
                tenantId,
                orderId,
                name,
                amount: amount.toString(),
                status: 'PENDING' as const,
            });
        }

        return await db.insert(paymentSchedules).values(schedules).returning();
    }

    static validateDownPaymentRatio(downPaymentAmount: string, totalOrderAmount: string, minRatio: number = 0.5): boolean {
        const down = new Decimal(downPaymentAmount);
        const total = new Decimal(totalOrderAmount);

        if (total.isZero()) return true;

        const ratio = down.div(total).toNumber();
        return ratio >= minRatio;
    }

    /**
     * Create a Payment Order (Draft/Pending)
     */
    static async createPaymentOrder(data: CreatePaymentOrderData, tenantId: string, userId: string) {
        return await db.transaction(async (tx) => {
            const paymentNo = `PAY-${Date.now()}`;

            const [paymentOrderResult] = await tx.insert(paymentOrders).values({
                tenantId,
                paymentNo,
                customerId: data.customerId,
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                totalAmount: data.totalAmount,
                usedAmount: '0',
                remainingAmount: data.totalAmount, // Initially full amount remaining (if PREPAID logic applies? keeping simple)
                type: data.type,
                status: 'PENDING',
                paymentMethod: data.paymentMethod as any,
                accountId: data.accountId,
                proofUrl: data.proofUrl,
                receivedAt: data.receivedAt,
                remark: data.remark,
                createdBy: userId,
            }).returning();

            if (data.items && data.items.length > 0) {
                for (const item of data.items) {
                    const orderRecord = await tx.query.orders.findFirst({
                        where: eq(orders.id, item.orderId),
                    });

                    await tx.insert(paymentOrderItems).values({
                        tenantId,
                        paymentOrderId: paymentOrderResult.id,
                        orderId: item.orderId,
                        orderNo: orderRecord?.orderNo || 'UNKNOWN',
                        amount: item.amount.toString(),
                    });
                }
            }
            return paymentOrderResult;
        });
    }

    /**
     * Verify Payment Order
     * - Updates status
     * - Updates Finance Account Balance
     * - Updates AR Statements
     * - Triggers Commission Calculation
     */
    static async verifyPaymentOrder(id: string, status: 'VERIFIED' | 'REJECTED', tenantId: string, userId: string, remark?: string) {
        return await db.transaction(async (tx) => {
            const order = await tx.query.paymentOrders.findFirst({
                where: and(
                    eq(paymentOrders.id, id),
                    eq(paymentOrders.tenantId, tenantId)
                ),
                with: {
                    items: true,
                }
            });

            if (!order) throw new Error('Payment Order not found');
            if (order.status !== 'PENDING') throw new Error('Payment Order not in PENDING status');

            if (status === 'REJECTED') {
                await tx.update(paymentOrders)
                    .set({ status: 'REJECTED', remark: remark || order.remark })
                    .where(eq(paymentOrders.id, id));
                return { success: true };
            }

            // VERIFIED
            await tx.update(paymentOrders)
                .set({
                    status: 'VERIFIED',
                    verifiedBy: userId,
                    verifiedAt: new Date(),
                })
                .where(eq(paymentOrders.id, id));

            // Update Finance Account
            if (order.accountId) {
                const account = await tx.query.financeAccounts.findFirst({
                    where: eq(financeAccounts.id, order.accountId),
                });

                if (account) {
                    const amountNum = new Decimal(order.totalAmount);
                    const balanceBefore = new Decimal(account.balance);
                    const balanceAfter = balanceBefore.plus(amountNum);

                    await tx.update(financeAccounts)
                        .set({ balance: balanceAfter.toString() })
                        .where(eq(financeAccounts.id, account.id));

                    await tx.insert(accountTransactions).values({
                        tenantId,
                        transactionNo: `TX-${Date.now()}`,
                        accountId: account.id,
                        transactionType: 'INCOME',
                        amount: order.totalAmount,
                        balanceBefore: balanceBefore.toString(),
                        balanceAfter: balanceAfter.toString(),
                        relatedType: 'PAYMENT_ORDER',
                        relatedId: order.id,
                        remark: `Payment Order Verified: ${order.paymentNo}`,
                    });
                }
            }

            // Update AR Statements
            if (order.items && order.items.length > 0) {
                for (const item of order.items) {
                    const statement = await tx.query.arStatements.findFirst({
                        where: and(
                            eq(arStatements.orderId, item.orderId),
                            eq(arStatements.tenantId, tenantId)
                        ),
                        with: {
                            channel: true,
                            order: true,
                        } // Need strict typing or relations
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

                        // Calculate Commission if newly PAID
                        if (newStatus === 'PAID' && statement.channelId) {
                            await this.calculateCommission(tx, statement, tenantId);
                        }
                    }
                }
            }
            return { success: true };
        });
    }

    private static async calculateCommission(tx: any, statement: any, tenantId: string) {
        if (!statement.channelId || !statement.channel) return;

        const mode = statement.channel.cooperationMode || 'REBATE';
        const rate = new Decimal(statement.channel.commissionRate || '0.1');
        const orderAmount = new Decimal(statement.totalAmount);
        let commissionAmount = new Decimal(0);

        if (mode === 'REBATE') {
            commissionAmount = orderAmount.times(rate);
        } else if (mode === 'BASE_PRICE') {
            // Fetch order items to calculate base cost
            const items = await tx.query.orderItems.findMany({
                where: eq(orderItems.orderId, statement.orderId),
            });

            if (items.length > 0) {
                const productIds = items.map((i: any) => i.productId);
                // Ensure unique IDs
                const uniqueProductIds = [...new Set(productIds)];

                if (uniqueProductIds.length > 0) {
                    // Cast array to any to avoid type check issues for now
                    const productList = await tx.query.products.findMany({
                        where: inArray(products.id, uniqueProductIds as string[])
                    });
                    const productMap = new Map(productList.map((p: any) => [p.id, p]));

                    let totalBasePrice = new Decimal(0);
                    for (const item of items) {
                        const product = productMap.get((item as any).productId);
                        if (product) {
                            // Use floorPrice if available, otherwise purchasePrice, fallback to 0
                            const base = new Decimal((product as any).floorPrice || (product as any).purchasePrice || 0);
                            const qty = new Decimal((item as any).quantity || 0);
                            totalBasePrice = totalBasePrice.plus(base.times(qty));
                        }
                    }

                    // Commission = (OrderAmount - TotalBase) * Rate
                    // Ensure non-negative
                    const profit = orderAmount.minus(totalBasePrice);
                    if (profit.gt(0)) {
                        commissionAmount = profit.times(rate);
                    }
                }
            }
        }

        if (commissionAmount.gt(0)) {
            await tx.insert(commissionRecords).values({
                tenantId,
                commissionNo: `COMM-${Date.now()}`,
                arStatementId: statement.id,
                orderId: statement.orderId,
                channelId: statement.channelId,
                channelName: statement.channel.name,
                cooperationMode: mode,
                orderAmount: statement.totalAmount,
                commissionRate: rate.toString(),
                commissionAmount: commissionAmount.toString(),
                status: 'CALCULATED',
                calculatedAt: new Date(),
            });

            await tx.update(arStatements)
                .set({
                    commissionRate: rate.toString(),
                    commissionAmount: commissionAmount.toString(),
                    commissionStatus: 'CALCULATED',
                })
                .where(eq(arStatements.id, statement.id));
        }
    }
}
