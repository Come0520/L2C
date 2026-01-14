import { db } from "@/shared/api/db";
import {
    purchaseOrders,
    purchaseOrderItems,
    productSuppliers,
    suppliers
} from "@/shared/api/schema/supply-chain";
import { orderItems } from "@/shared/api/schema/orders";
import { eq, and } from "drizzle-orm";

export class SupplyChainService {

    /**
     * Create Purchase Orders from an Order
     * Strategy: Split by Supplier (Default)
     */
    static async createPurchaseOrder(orderId: string, tenantId: string, userId: string) {
        return await db.transaction(async (tx) => {
            // 1. Fetch Order Items that are PENDING
            const items = await tx.query.orderItems.findMany({
                where: and(
                    eq(orderItems.orderId, orderId),
                    eq(orderItems.status, 'PENDING')
                )
            });

            if (!items.length) return []; // No items to process

            // 2. Group items by Supplier
            // Logic: Find default supplier for each product. If no default, group into "Unknown Supplier" bucket?
            // Simplified: Assume 1-1 mapping for demo or fetch from product_suppliers

            const supplierGroups = new Map<string, typeof items>();
            const unknownSupplierItems = [];

            for (const item of items) {
                // Find default supplier for product
                const mapping = await tx.query.productSuppliers.findFirst({
                    where: and(
                        eq(productSuppliers.productId, item.productId),
                        eq(productSuppliers.isDefault, true)
                    ),
                    with: {
                        supplier: true
                    }
                });

                if (mapping && mapping.supplier) {
                    // Type guard or explicit access
                    const supplierId = mapping.supplier.id;
                    const existing = supplierGroups.get(supplierId) || [];
                    existing.push(item);
                    supplierGroups.set(supplierId, existing);
                } else {
                    unknownSupplierItems.push(item);
                }
            }

            const createdPOs = [];

            // 3. Create PO for each group
            for (const [supplierId, groupItems] of supplierGroups) {
                // Fetch Supplier Info (Optimization: could have fetched earlier)
                const supplier = await tx.query.suppliers.findFirst({
                    where: eq(suppliers.id, supplierId)
                });

                if (!supplier) continue; // Should not happen

                // Create Header
                const poNo = `PO - ${Date.now()} -${supplier.supplierNo} `;
                const [po] = await tx.insert(purchaseOrders).values({
                    tenantId,
                    poNo,
                    orderId,
                    supplierId: supplier.id,
                    supplierName: supplier.name,
                    status: 'DRAFT',
                    createdBy: userId
                }).returning();

                // Create Items & Update Order Item Status
                for (const item of groupItems) {
                    await tx.insert(purchaseOrderItems).values({
                        tenantId,
                        poId: po.id,
                        productName: item.productName,
                        quantity: item.quantity.toString(),
                        unitPrice: item.unitPrice.toString(), // Cost price? defaulting to sell price for now mocked
                        quoteItemId: item.quoteItemId
                    });

                    // Update Order Item to link to this PO
                    await tx.update(orderItems)
                        .set({
                            status: 'PO_CREATED',
                            poId: po.id,
                            supplierId: supplier.id
                        })
                        .where(eq(orderItems.id, item.id));
                }
                createdPOs.push(po);
            }

            return createdPOs;
        });
    }


}
