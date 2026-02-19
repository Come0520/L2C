import { db, type Transaction } from "@/shared/api/db";
import { afterSalesTickets, liabilityNotices } from "@/shared/api/schema/after-sales";
import { orderItems } from "@/shared/api/schema/orders";
import { purchaseOrders, purchaseOrderItems, suppliers } from "@/shared/api/schema/supply-chain";
import { products } from "@/shared/api/schema/catalogs";
import { eq, and, InferSelectModel } from "drizzle-orm";
import { format } from "date-fns";
import { randomBytes } from "crypto";
import { generateTicketNo, generateNoticeNo } from "@/features/after-sales/utils";

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
     * 创建售后工单
     */
    static async createTicket(params: CreateTicketParams) {
        return await db.transaction(async (tx) => {
            // P1 FIX (R2-05): 透传事务 tx 确保并发安全
            const ticketNo = await generateTicketNo(params.tenantId, tx);
            const [ticket] = await tx.insert(afterSalesTickets).values({
                ...params,
                ticketNo,
                status: 'PENDING'
            }).returning();

            if (params.productId) {
                // P1 FIX (R2-08): 传递 tx 保证事务原子性
                await this.createRestockPO(tx, ticket, params.productId, params.tenantId, params.createdBy);
            }

            return ticket;
        });
    }

    /**
     * 创建售后补件采购单
     */
    private static async createRestockPO(
        tx: Transaction,
        ticket: InferSelectModel<typeof afterSalesTickets>,
        productId: string,
        tenantId: string,
        userId: string
    ) {
        const poNo = `PO${format(new Date(), 'yyyyMMdd')}${randomBytes(3).toString('hex').toUpperCase()}`;

        // P0 FIX (AS-02): 添加租户隔离到产品查询，并使用事务对象 tx
        const product = await tx.query.products.findFirst({
            where: and(eq(products.id, productId), eq(products.tenantId, tenantId))
        });

        if (!product) {
            throw new Error("Product not found");
        }

        // P0 FIX (AS-02): 添加租户隔离到供应商查询
        const supplier = await db.query.suppliers.findFirst({
            where: and(eq(suppliers.id, product.defaultSupplierId!), eq(suppliers.tenantId, tenantId))
        });

        if (!supplier) {
            throw new Error("未找到产品的默认供应商");
        }

        const [po] = await tx.insert(purchaseOrders).values({
            tenantId,
            poNo,
            orderId: ticket.orderId,
            afterSalesId: ticket.id,
            supplierId: supplier.id,
            supplierName: supplier.name,
            type: 'FINISHED',
            status: 'DRAFT',
            totalAmount: (product.purchasePrice || '0').toString(),
            paymentStatus: 'PENDING',
            createdBy: userId
        }).returning();

        // 查找原始订单行项
        const orderItem = await tx.query.orderItems.findFirst({
            where: and(
                eq(orderItems.orderId, ticket.orderId),
                eq(orderItems.productId, productId)
            )
        });

        if (!orderItem) {
            throw new Error("未找到补件对应的原始订单项");
        }

        await tx.insert(purchaseOrderItems).values({
            tenantId,
            poId: po.id,
            orderItemId: orderItem.id,
            productId: product.id,
            productSku: product.sku,
            category: product.category,
            productName: product.name,
            quantity: '1',
            unitPrice: (product.purchasePrice || '0').toString(),
            subtotal: (product.purchasePrice || '0').toString(),
            remark: `售后补件 - 工单号: ${ticket.ticketNo}`
        });

        return po;
    }

    /**
     * 发起定责单
     * 针对售后过程中发现的错误向相关责任方扣款
     */
    static async issueLiability(params: IssueLiabilityParams) {
        return await db.transaction(async (tx) => {
            // P1 FIX (R2-05): 透传事务 tx 确保并发安全
            const noticeNo = await generateNoticeNo(params.tenantId, tx);

            const [notice] = await tx.insert(liabilityNotices).values({
                ...params,
                noticeNo,
                status: 'PENDING_CONFIRM'
            }).returning();

            return notice;
        });
    }

    /**
     * 关闭工单
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
