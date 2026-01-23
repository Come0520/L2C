import { db } from "@/shared/api/db";
import { orders, orderItems } from "@/shared/api/schema";
import { quotes } from "@/shared/api/schema/quotes";
import { OrderStateMachine } from '@/features/orders/logic/order-state-machine';
import { eq, and } from "drizzle-orm";
import { format } from "date-fns";
import { randomBytes } from "crypto";
import { POSplitService } from "./po-split.service";

export interface CreateOrderOptions {
    paymentProofImg?: string;
    confirmationImg?: string;
    paymentAmount?: string;
    paymentMethod?: 'CASH' | 'WECHAT' | 'ALIPAY' | 'BANK';
    remark?: string;
}

export class OrderService {

    private static async generateOrderNo() {
        const prefix = `ORD${format(new Date(), 'yyyyMMdd')}`;
        const random = randomBytes(3).toString('hex').toUpperCase();
        return `${prefix}${random}`;
    }

    /**
     * Convert a WON Quote to a Draft Order.
     * Strict validation: Quote must be in WON status (or acceptable status).
     */
    static async convertFromQuote(quoteId: string, tenantId: string, userId: string, options?: CreateOrderOptions) {
        return await db.transaction(async (tx) => {
            // 1. Fetch Quote & Items & Customer
            const quote = await tx.query.quotes.findFirst({
                where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
                with: {
                    items: {
                        with: {
                            product: true
                        }
                    },

                    customer: true,
                    lead: true // Fetch Lead info
                }
            });

            if (!quote) throw new Error("Quote not found");

            // 规则 1: 待客户确认状态禁止转化
            if (quote.status === 'PENDING_CUSTOMER') {
                throw new Error('无法转订单：待客户确认的报价单不能直接转订单，请等待客户确认后再操作。');
            }

            // 规则 2: 只有已批准/已接受状态可以转化
            const allowedStatuses = ['APPROVED', 'ACCEPTED'];
            if (!allowedStatuses.includes(quote.status || '')) {
                throw new Error(`无法转订单：报价单状态为 ${quote.status}。只有“已批准”、“已接受”或“待客户确认”状态的报价单可以转订单。`);
            }

            // Check availability
            const existingOrder = await tx.query.orders.findFirst({
                where: eq(orders.quoteId, quoteId)
            });
            if (existingOrder) {
                throw new Error(`Order already exists for this quote: ${existingOrder.orderNo}`);
            }

            // 2. Create Order Header
            const orderNo = await this.generateOrderNo();

            const total = Number(quote.totalAmount || 0);
            const paid = Number(options?.paymentAmount || 0);
            const balance = total - paid;

            // Prepare Snapshot
            const quoteSnapshot = {
                quote: {
                    ...quote,
                    // Ensure items have product details
                    items: quote.items
                },
                customer: quote.customer,
                generatedAt: new Date().toISOString()
            };

            const [newOrder] = await tx.insert(orders).values({
                tenantId,
                orderNo,
                quoteId: quote.id,
                quoteVersionId: quote.id,
                customerId: quote.customerId,
                customerName: quote.customer.name, // Use relation
                customerPhone: quote.customer.phone, // Use relation
                deliveryAddress: options?.paymentProofImg ? undefined : undefined, // Simplify

                // Populate Channel Info from Lead
                channelId: quote.lead?.channelId,
                channelContactId: quote.lead?.channelContactId,
                // channelCooperationMode: We might need to fetch channel to get this default, or leave null to use channel default at runtime

                totalAmount: quote.totalAmount,
                paidAmount: options?.paymentAmount || '0',
                balanceAmount: String(balance),
                settlementType: 'PREPAID',
                status: 'PENDING_PO',

                confirmationImg: options?.confirmationImg,
                paymentProofImg: options?.paymentProofImg,
                paymentMethod: options?.paymentMethod,
                paymentTime: options?.paymentAmount ? new Date() : null,
                remark: options?.remark,

                quoteSnapshot, // Save Deep Snapshot
                snapshotData: {}, // Initialize generic snapshot data

                isLocked: false, // Default false

                salesId: quote.createdBy,
                createdBy: userId,
            }).returning();

            // 3. Create Order Items
            if (quote.items && quote.items.length > 0) {
                const itemsToInsert = quote.items.map(item => ({
                    tenantId,
                    orderId: newOrder.id,
                    quoteItemId: item.id,
                    productId: item.productId!,
                    productName: item.productName,
                    category: item.category as typeof orderItems.$inferSelect.category,
                    quantity: item.quantity,
                    width: item.width,
                    height: item.height,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal,
                    roomName: item.roomName || 'Default',
                    remark: item.remark,
                    status: 'PENDING' as const,
                }));
                await tx.insert(orderItems).values(itemsToInsert);
            }

            return newOrder;
        });
    }

    /**
     * Lock Order
     * Prevents further edits to order items.
     */
    static async lockOrder(orderId: string, tenantId: string, userId: string) {
        return await db.transaction(async (tx) => {
            const order = await tx.query.orders.findFirst({
                where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId))
            });

            if (!order) throw new Error("Order not found");
            if (order.isLocked) throw new Error("Order is already locked");

            const [updatedOrder] = await tx.update(orders)
                .set({
                    isLocked: true,
                    lockedAt: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(orders.id, orderId))
                .returning();

            return updatedOrder;
        });
    }

    /**
     * Update Order Status
     * Triggers PO split when order is confirmed
     */
    static async updateOrderStatus(orderId: string, newStatus: string, tenantId: string, userId: string) {
        return await db.transaction(async (tx) => {
            const order = await tx.query.orders.findFirst({
                where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId))
            });

            if (!order) throw new Error("Order not found");

            // 状态机验证
            if (order.status) {
                const isValid = OrderStateMachine.validateTransition(order.status as any, newStatus as any);
                if (!isValid) {
                    throw new Error(`Invalid status transition from ${order.status} to ${newStatus}`);
                }
            }

            const [updatedOrder] = await tx.update(orders)
                .set({
                    status: newStatus as typeof orders.$inferSelect.status,
                    updatedAt: new Date()
                })
                .where(eq(orders.id, orderId))
                .returning();

            // PENDING_PO logic (replaced CONFIRMED which seems invalid)
            if (newStatus === 'PENDING_PO') {
                await POSplitService.splitOrderToPOs(orderId, tenantId, userId);
            }

            return updatedOrder;
        });
    }

    /**
     * Request Order Cancellation
     * Only orders in PENDING_PRODUCTION or IN_PRODUCTION can request cancellation.
     */
    static async requestCancellation(orderId: string, tenantId: string, userId: string, reason: string) {
        const { submitApproval } = await import("@/features/approval/actions/submission");

        return await db.transaction(async (tx) => {
            const order = await tx.query.orders.findFirst({
                where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId))
            });

            if (!order) throw new Error("订单不存在");
            if (order.status !== 'PENDING_PRODUCTION' && order.status !== 'IN_PRODUCTION') {
                throw new Error("只有待生产或生产中的订单可以申请撤单");
            }

            // Trigger Cancellation Approval
            const result = await submitApproval({
                entityType: 'ORDER',
                entityId: orderId,
                flowCode: 'ORDER_CANCELLATION_APPROVAL',
                comment: `申请撤单原因: ${reason}`,
            }, tx);

            if (!result.success) {
                const errorMsg = (result as { error?: string }).error || '未知错误';
                throw new Error(`无法发起撤单审批: ${errorMsg}`);
            }

            // Optional: Lock the order or change status to PENDING_CANCEL
            await tx.update(orders)
                .set({
                    isLocked: true,
                    updatedAt: new Date()
                })
                .where(eq(orders.id, orderId));

            return { success: true, approvalId: (result as { approvalId?: string }).approvalId };
        });
    }

    /**
     * Pause Order
     * Only orders in PENDING_PRODUCTION or IN_PRODUCTION can be paused.
     */
    static async pauseOrder(orderId: string, tenantId: string, reason: string) {
        return await db.transaction(async (tx) => {
            const order = await tx.query.orders.findFirst({
                where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId))
            });

            if (!order) throw new Error("订单不存在");
            if (order.status !== 'PENDING_PRODUCTION' && order.status !== 'IN_PRODUCTION') {
                throw new Error("只有待生产或生产中的订单可以叫停");
            }

            const [updatedOrder] = await tx.update(orders)
                .set({
                    status: 'PAUSED',
                    pausedAt: new Date(),
                    pauseReason: reason,
                    snapshotData: { ...(order.snapshotData as Record<string, unknown> || {}), previousStatus: order.status }, // Store status for resume
                    updatedAt: new Date()
                })
                .where(eq(orders.id, orderId))
                .returning();

            return updatedOrder;
        });
    }

    /**
     * Resume Order
     * Restore original status and update cumulative pause days.
     */
    static async resumeOrder(orderId: string, tenantId: string) {
        return await db.transaction(async (tx) => {
            const order = await tx.query.orders.findFirst({
                where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId))
            });

            if (!order || order.status !== 'PAUSED') throw new Error("订单未处于叫停状态");

            const previousStatus = (order.snapshotData as Record<string, any>)?.previousStatus || 'IN_PRODUCTION';
            const pauseStart = order.pausedAt;
            let addedDays = 0;
            if (pauseStart) {
                const diffTime = Math.abs(new Date().getTime() - pauseStart.getTime());
                addedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }

            const [updatedOrder] = await tx.update(orders)
                .set({
                    status: previousStatus as typeof orders.$inferSelect.status,
                    pausedAt: null,
                    pauseReason: null,
                    pauseCumulativeDays: (order.pauseCumulativeDays || 0) + addedDays,
                    updatedAt: new Date()
                })
                .where(eq(orders.id, orderId))
                .returning();

            return updatedOrder;
        });
    }

    /**
     * Confirm Installation Completed
     * Moves order to INSTALLATION_COMPLETED (or PENDING_CONFIRMATION if configured)
     */
    static async confirmInstallation(orderId: string, tenantId: string, updatedBy: string) {
        return await db.transaction(async (tx) => {
            const [updatedOrder] = await tx.update(orders)
                .set({
                    status: 'INSTALLATION_COMPLETED', // Or PENDING_CONFIRMATION directly? Rules say: Wait for Customer Confirmation
                    // State machine: PENDING_INSTALL -> INSTALLATION_COMPLETED -> PENDING_CONFIRMATION
                    // Let's assume this action moves it to INSTALLATION_COMPLETED.
                    // And then a notification or manual trigger moves it to PENDING_CONFIRMATION?
                    // Or simplified: Mark Installation Done -> PENDING_CONFIRMATION.
                    // Given the requirement "1.2 Wait-for-Customer... triggers: Install Completed". 
                    // Let's go straight to PENDING_CONFIRMATION if that's the desired flow.
                    // ACTUALLY: State machine says PENDING_INSTALL -> INSTALLATION_COMPLETED.
                    // Let's stick to INSTALLATION_COMPLETED first. Then trigger notification which might move it.
                    // But requirement says: "Status Definition... PENDING_CONFIRMATION: Wait for customer acceptance".
                    // "Transition: PENDING_INSTALL -> INSTALLATION_COMPLETED -> PENDING_CONFIRMATION".
                    // So we need actions for each step.
                    updatedAt: new Date()
                })
                .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
                .returning();
            return updatedOrder;
        });
    }

    static async requestCustomerConfirmation(orderId: string, tenantId: string) {
        return await db.update(orders)
            .set({ status: 'PENDING_CONFIRMATION', updatedAt: new Date() })
            .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
            .returning();
    }

    static async customerAccept(orderId: string, tenantId: string) {
        return await db.update(orders)
            .set({ status: 'COMPLETED', completedAt: new Date(), updatedAt: new Date() })
            .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
            .returning();
    }

    static async customerReject(orderId: string, tenantId: string, reason: string) {
        // Record rejection in history logs if possible.
        return await db.update(orders)
            .set({
                status: 'INSTALLATION_REJECTED',
                remark: reason, // Append or overwrite? Simple for now.
                updatedAt: new Date()
            })
            .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)))
            .returning();
    }
}
