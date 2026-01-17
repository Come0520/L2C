import { db } from "@/shared/api/db";
import { afterSalesTickets, liabilityNotices } from "@/shared/api/schema/after-sales";
import { orders, orderItems } from "@/shared/api/schema/orders";
import { purchaseOrders, purchaseOrderItems, suppliers } from "@/shared/api/schema/supply-chain";
import { products } from "@/shared/api/schema/catalogs";
import { eq, and } from "drizzle-orm";
import { format } from "date-fns";
import { randomBytes } from "crypto";

export interface IssueLiabilityParams {
    tenantId: string;
    afterSalesId: string;
    liablePartyType: 'COMPANY' | 'FACTORY' | 'INSTALLER' | 'MEASURER' | 'LOGISTICS' | 'CUSTOMER';
    liablePartyId: string;
    reason: string;
    amount: string;
    sourcePurchaseOrderId?: string;
    sourceInstallTaskId?: string;
}

export interface CreateTicketParams {
    tenantId: string;
    orderId: string;
    customerId: string;
    type: string;
    priority?: string;
    description?: string;
    productId?: string;
    createdBy: string;
}

export class AfterSalesService {

    /**
     * Create After-Sales Ticket
     */
    static async createTicket(params: CreateTicketParams) {
        return await db.transaction(async (tx) => {
            const ticketNo = `AS-${Date.now()}`;
            const [ticket] = await tx.insert(afterSalesTickets).values({
                ...params,
                ticketNo,
                status: 'PENDING'
            }).returning();

            if (params.productId) {
                await this.createRestockPO(ticket, params.productId, params.tenantId, params.createdBy);
            }

            return ticket;
        });
    }

    private static async createRestockPO(ticket: any, productId: string, tenantId: string, userId: string) {
        const poNo = `PO${format(new Date(), 'yyyyMMdd')}${randomBytes(3).toString('hex').toUpperCase()}`;

        const product = await db.query.products.findFirst({
            where: eq(products.id, productId)
        });

        if (!product) {
            throw new Error("Product not found");
        }

        const supplier = await db.query.suppliers.findFirst({
            where: eq(suppliers.id, product.defaultSupplierId!)
        });

        if (!supplier) {
            throw new Error("Default supplier not found for product");
        }

        const [po] = await db.insert(purchaseOrders).values({
            tenantId,
            poNo,
            orderId: ticket.orderId,
            afterSalesId: ticket.id,
            supplierId: supplier.id,
            supplierName: supplier.name,
            type: 'FINISHED',
            status: 'DRAFT',
            totalAmount: product.purchasePrice || '0',
            paymentStatus: 'PENDING',
            createdBy: userId
        }).returning();

        // Find original order item
        const orderItem = await db.query.orderItems.findFirst({
            where: and(
                eq(orderItems.orderId, ticket.orderId),
                eq(orderItems.productId, productId)
            )
        });

        if (!orderItem) {
            throw new Error("Original order item not found for restock");
        }

        await db.insert(purchaseOrderItems).values({
            tenantId,
            poId: po.id,
            orderItemId: orderItem.id,
            productId: product.id,
            productSku: product.sku,
            category: product.category,
            productName: product.name,
            quantity: '1',
            unitPrice: product.purchasePrice || '0',
            subtotal: product.purchasePrice || '0',
            remark: `售后补件 - 工单号: ${ticket.ticketNo}`
        });

        return po;
    }

    /**
     * Issue Liability Notice
     * Charges a party for errors found during after-sales.
     */
    static async issueLiabilityNotice(params: IssueLiabilityParams) {
        return await db.transaction(async (tx) => {
            const noticeNo = `LN-${Date.now()}`;

            const [notice] = await tx.insert(liabilityNotices).values({
                ...params,
                noticeNo,
                status: 'DRAFT'
            }).returning();

            return notice;
        });
    }

    /**
     * Close Ticket
     */
    static async closeTicket(ticketId: string, resolution: string, tenantId: string) {
        const [updated] = await db.update(afterSalesTickets)
            .set({
                status: 'CLOSED',
                resolution,
                closedAt: new Date(),
                updatedAt: new Date()
            })
            .where(and(eq(afterSalesTickets.id, ticketId), eq(afterSalesTickets.tenantId, tenantId)))
            .returning();

        return updated;
    }
}
