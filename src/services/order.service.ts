import { db } from "@/shared/api/db";
import { orders, orderItems } from "@/shared/api/schema/orders";
import { quotes } from "@/shared/api/schema/quotes";
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
                    items: true,
                    customer: true
                }
            });

            if (!quote) throw new Error("Quote not found");

            // Strict Validation
            if (quote.status !== 'WON') {
                throw new Error(`Cannot convert quote with status ${quote.status}. Only WON quotes can be converted.`);
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

            const [newOrder] = await tx.insert(orders).values({
                tenantId,
                orderNo,
                quoteId: quote.id,
                quoteVersionId: quote.id,
                customerId: quote.customerId,
                customerName: quote.customer.name, // Use relation
                customerPhone: quote.customer.phone, // Use relation
                deliveryAddress: options?.paymentProofImg ? undefined : undefined, // Simplify

                totalAmount: quote.totalAmount,
                paidAmount: options?.paymentAmount || '0',
                balanceAmount: String(balance),
                settlementType: 'PREPAID' as any,
                status: 'PENDING_PO' as any,

                confirmationImg: options?.confirmationImg,
                paymentProofImg: options?.paymentProofImg,
                paymentMethod: options?.paymentMethod,
                paymentTime: options?.paymentAmount ? new Date() : null,
                remark: options?.remark,

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
                    category: item.category as any,
                    quantity: item.quantity,
                    width: item.width,
                    height: item.height,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal,
                    roomName: item.roomName || 'Default',
                    remark: item.remark,
                    status: 'PENDING',
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

            const [updatedOrder] = await tx.update(orders)
                .set({
                    status: newStatus as any,
                    updatedAt: new Date()
                })
                .where(eq(orders.id, orderId))
                .returning();

            if (newStatus === 'CONFIRMED') {
                await POSplitService.splitOrderToPOs(orderId, tenantId, userId);
            }

            return updatedOrder;
        });
    }
}
