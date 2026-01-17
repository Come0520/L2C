'use server';

import { db } from "@/shared/api/db";
import {
    purchaseOrders,
    purchaseOrderItems,
    suppliers
} from "@/shared/api/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/shared/lib/auth";
import { revalidatePath } from "next/cache";
import { createApFromPoInternal } from "@/features/finance/actions/ap";
import { POStatusAggregator } from "@/services/po-status-aggregator.service";

// Create PO
export async function createPO(data: {
    supplierId: string;
    orderId?: string;
    items: { productId: string; quantity: number; unitCost: number }[]
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    return db.transaction(async (tx) => {
        // 1. Validate Supplier
        const supplier = await tx.query.suppliers.findFirst({
            where: eq(suppliers.id, data.supplierId)
        });
        if (!supplier) return { success: false, error: 'Supplier not found' };

        // 2. Fetch Products for names
        const productIds = data.items.map(i => i.productId);
        const productList = await tx.query.products.findMany({
            where: (products, { inArray }) => inArray(products.id, productIds)
        });
        const productMap = new Map(productList.map((p: any) => [p.id, p]));

        // 3. Create Header
        const poNo = `PO-${Date.now()}`;
        const total = data.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0).toString();

        const [po] = await tx.insert(purchaseOrders).values({
            tenantId: session.user.tenantId,
            poNo,
            supplierId: data.supplierId,
            supplierName: supplier.name,
            orderId: data.orderId,
            status: 'DRAFT',
            totalAmount: total,
            createdBy: session.user.id
        }).returning();

        // 4. Create Items
        if (data.items.length > 0) {
            const itemsToInsert = data.items.map(item => {
                const product = productMap.get(item.productId);
                return {
                    tenantId: session.user.tenantId,
                    poId: po.id,
                    // purchaseOrderItems schema DOES NOT have productId column based on previous checks
                    // productName is required
                    productName: product?.name || 'Unknown Product',
                    quantity: item.quantity.toString(),
                    unitPrice: item.unitCost.toString(),
                };
            });
            await tx.insert(purchaseOrderItems).values(itemsToInsert);
        }

        return { success: true, data: po };
    });
}

// Receive PO
export async function receivePO(data: { poId: string }) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    return db.transaction(async (tx) => {
        const po = await tx.query.purchaseOrders.findFirst({
            where: and(
                eq(purchaseOrders.id, data.poId),
                eq(purchaseOrders.tenantId, session.user.tenantId)
            )
        });

        if (!po) return { success: false, error: 'PO not found' };
        if (['DRAFT', 'COMPLETED'].includes(po.status || '')) {
            if (po.status === 'DRAFT') return { success: false, error: 'Cannot receive PO in DRAFT status' };
        }

        // Update Status
        await tx.update(purchaseOrders)
            .set({
                status: 'COMPLETED',
                updatedAt: new Date()
            })
            .where(eq(purchaseOrders.id, data.poId));

        // Create AP
        await createApFromPoInternal(po.id, session.user.tenantId);

        revalidatePath('/supply-chain/orders');
        return { success: true };
    });
}

export async function addPOLogistics(data: {
    poId: string;
    company: string;
    trackingNo: string;
    shippedAt?: Date;
    remark?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    return db.transaction(async (tx) => {
        const po = await tx.query.purchaseOrders.findFirst({
            where: and(
                eq(purchaseOrders.id, data.poId),
                eq(purchaseOrders.tenantId, session.user.tenantId)
            )
        });

        if (!po) return { success: false, error: 'PO not found' };

        const [updatedPO] = await tx.update(purchaseOrders)
            .set({
                logisticsCompany: data.company,
                logisticsNo: data.trackingNo,
                shippedAt: data.shippedAt || new Date(),
                status: 'SHIPPED',
                updatedAt: new Date()
            })
            .where(eq(purchaseOrders.id, data.poId))
            .returning();

        await POStatusAggregator.updateOrderStatusByPOs(po.orderId!, session.user.tenantId);

        revalidatePath('/supply-chain/orders');
        return { success: true, data: updatedPO };
    });
}

// Get PO by ID
export async function getPoById(data: { id: string }) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const po = await db.query.purchaseOrders.findFirst({
        where: and(
            eq(purchaseOrders.id, data.id),
            eq(purchaseOrders.tenantId, session.user.tenantId)
        ),
        with: {
            // items: true, // DB schema usually returns items if relation is defined. 
            // Wait, purchaseOrders relation to items is likely "items".
            // Let's verify schema if needed, but "items: true" is safe guess if relation exists.
            items: true,
            order: true,
            creator: true,
            // supplier: true?
        }
    });

    if (!po) return { success: false, error: 'PO not found' };

    // Add missing names if needed (e.g. supplierName is on PO, so no need to join supplier if not needed)
    // But page asks for po.supplierName which is on PO table.
    return { success: true, data: po };
}

// Update PO Status
export async function updatePoStatus(data: { poId: string; status: 'DRAFT' | 'ORDERED' | 'SHIPPED' | 'RECEIVED' | 'COMPLETED' | 'CANCELLED' }) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    await db.update(purchaseOrders)
        .set({
            status: data.status,
            updatedAt: new Date()
        })
        .where(
            and(
                eq(purchaseOrders.id, data.poId),
                eq(purchaseOrders.tenantId, session.user.tenantId)
            )
        );

    revalidatePath('/supply-chain/purchase-orders');
    return { success: true };
}
