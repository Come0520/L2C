import { db } from "@/shared/api/db";
import {
    purchaseOrders,
    purchaseOrderItems,
    suppliers
} from "@/shared/api/schema/supply-chain";
import { products } from "@/shared/api/schema/catalogs";
import { orders, orderItems } from "@/shared/api/schema/orders";
import { eq, and } from "drizzle-orm";
import { format } from "date-fns";
import { randomBytes } from "crypto";

type POType = 'FINISHED' | 'FABRIC' | 'STOCK';

interface OrderItemWithProduct {
    id: string;
    productId: string;
    productName: string;
    category: string;
    quantity: string;
    width: string | null;
    height: string | null;
    unitPrice: string;
    subtotal: string;
    quoteItemId: string | null;
    product?: {
        id: string;
        isStockable: boolean;
        defaultSupplierId: string | null;
        sku: string;
    };
}

export class POSplitService {

    private static async generatePONo(): Promise<string> {
        const prefix = `PO${format(new Date(), 'yyyyMMdd')}`;
        const random = randomBytes(3).toString('hex').toUpperCase();
        return `${prefix}${random}`;
    }

    static async splitOrderToPOs(orderId: string, tenantId: string, userId: string) {
        return await db.transaction(async (tx) => {
            const order = await tx.query.orders.findFirst({
                where: eq(orders.id, orderId),
                with: {
                    items: {
                        with: {
                            product: true
                        }
                    }
                }
            });

            if (!order) {
                throw new Error("Order not found");
            }

            const items = order.items as unknown as OrderItemWithProduct[];

            if (!items || items.length === 0) {
                return [];
            }

            const itemsBySupplier = this.groupBySupplier(items);
            const createdPOs = [];

            for (const [supplierId, supplierItems] of itemsBySupplier) {
                const po = await this.createPOForSupplier({
                    orderId,
                    tenantId,
                    userId,
                    supplierId,
                    items: supplierItems,
                    type: this.determinePOType(supplierItems),
                });
                createdPOs.push(po);
            }

            return createdPOs;
        });
    }

    private static determinePOType(items: OrderItemWithProduct[]): POType {
        const allItems = items.filter(i => i.product);

        if (allItems.length === 0) {
            return 'FINISHED';
        }

        if (allItems.every(i => i.product?.isStockable)) {
            return 'STOCK';
        }

        if (allItems.some(i => i.category === 'CURTAIN_FABRIC')) {
            return 'FABRIC';
        }

        return 'FINISHED';
    }

    private static groupBySupplier(items: OrderItemWithProduct[]): Map<string, OrderItemWithProduct[]> {
        const grouped = new Map<string, OrderItemWithProduct[]>();

        for (const item of items) {
            const supplierId = item.product?.defaultSupplierId || 'UNKNOWN';

            if (!grouped.has(supplierId)) {
                grouped.set(supplierId, []);
            }

            grouped.get(supplierId)!.push(item);
        }

        return grouped;
    }

    private static async createPOForSupplier(params: {
        orderId: string;
        tenantId: string;
        userId: string;
        supplierId: string;
        items: OrderItemWithProduct[];
        type: POType;
    }) {
        const { orderId, tenantId, userId, supplierId, items, type } = params;

        const supplier = await db.query.suppliers.findFirst({
            where: eq(suppliers.id, supplierId)
        });

        if (!supplier) {
            throw new Error(`Supplier not found: ${supplierId}`);
        }

        const poNo = await this.generatePONo();
        const totalAmount = items.reduce((sum, item) => {
            return sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice));
        }, 0).toFixed(2);

        const [po] = await db.insert(purchaseOrders).values({
            tenantId,
            poNo,
            orderId,
            supplierId: supplier.id,
            supplierName: supplier.name,
            type,
            status: 'DRAFT',
            totalAmount,
            paymentStatus: 'PENDING',
            createdBy: userId
        }).returning();

        for (const item of items) {
            const subtotal = (parseFloat(item.quantity) * parseFloat(item.unitPrice)).toFixed(2);

            await db.insert(purchaseOrderItems).values({
                tenantId,
                poId: po.id,
                orderItemId: item.id,
                productId: item.productId,
                productSku: item.product?.sku,
                category: item.category,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                width: item.width,
                height: item.height,
                subtotal,
                quoteItemId: item.quoteItemId
            });

            await db.update(orderItems)
                .set({
                    poId: po.id,
                    supplierId: supplier.id
                })
                .where(eq(orderItems.id, item.id));
        }

        return po;
    }
}