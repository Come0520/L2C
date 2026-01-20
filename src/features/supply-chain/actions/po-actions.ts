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

// Receive PO (Wrapper for compatibility)
export async function receivePO(data: { poId: string }) {
    return updatePoStatus({ poId: data.poId, status: 'DELIVERED' });
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
export async function updatePoStatus(data: { poId: string; status: 'DRAFT' | 'IN_PRODUCTION' | 'READY' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' }) {
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

        await tx.update(purchaseOrders)
            .set({
                status: data.status,
                updatedAt: new Date()
            })
            .where(eq(purchaseOrders.id, data.poId));

        // Business Logic Triggers
        if (data.status === 'IN_PRODUCTION' && po.status === 'DRAFT') {
            // Trigger AP Creation when entering Production
            await createApFromPoInternal(po.id, session.user.tenantId);
        }

        // Trigger Status Aggregation
        if (po.orderId) {
            await POStatusAggregator.updateOrderStatusByPOs(po.orderId, session.user.tenantId);
        }

        revalidatePath('/supply-chain/purchase-orders');
        return { success: true };
    });
}

// ============================================================
// [Supply-01] 待采购池优化
// ============================================================

import { inArray, or } from 'drizzle-orm';
import { orders, orderItems } from '@/shared/api/schema';

type PendingItem = {
    productId: string;
    productName: string;
    totalQuantity: number;
    orderIds: string[];
    orderCount: number;
    suggestedSupplierId?: string;
    suggestedSupplierName?: string;
};

/**
 * 获取待采购池 - 汇总所有订单中需要采购的商品
 */
export async function getPendingPurchasePool() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const tenantId = session.user.tenantId;

    // 查询所有已确认但未完成采购的订单项
    // 假设 orderItems 有 isPurchased 或通过关联 PO 来判断
    const pendingItems = await db
        .select({
            productId: orderItems.productId,
            productName: orderItems.productName,
            quantity: orderItems.quantity,
            orderId: orderItems.orderId,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(and(
            eq(orders.tenantId, tenantId),
            // 订单状态为已确认或生产中
            or(
                eq(orders.status, 'SIGNED' as typeof orders.status.enumValues[number]),
                eq(orders.status, 'IN_PRODUCTION' as typeof orders.status.enumValues[number])
            )
        ));

    // 按产品汇总
    const productMap = new Map<string, PendingItem>();

    for (const item of pendingItems) {
        const existing = productMap.get(item.productId);
        const qty = parseFloat(item.quantity || '0');

        if (existing) {
            existing.totalQuantity += qty;
            if (!existing.orderIds.includes(item.orderId)) {
                existing.orderIds.push(item.orderId);
                existing.orderCount++;
            }
        } else {
            productMap.set(item.productId, {
                productId: item.productId,
                productName: item.productName || '未知产品',
                totalQuantity: qty,
                orderIds: [item.orderId],
                orderCount: 1,
            });
        }
    }

    return {
        success: true,
        data: Array.from(productMap.values()).sort((a, b) => b.orderCount - a.orderCount),
        summary: {
            totalProducts: productMap.size,
            totalOrders: new Set(pendingItems.map(i => i.orderId)).size,
        }
    };
}

/**
 * 跨订单合并采购 - 将多个订单的同一产品合并到一个采购单
 */
export async function createMergedPurchaseOrder(data: {
    supplierId: string;
    items: { productId: string; productName: string; quantity: number; unitCost: number }[];
    sourceOrderIds: string[];
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const tenantId = session.user.tenantId;

    return db.transaction(async (tx) => {
        // 验证供应商
        const supplier = await tx.query.suppliers.findFirst({
            where: eq(suppliers.id, data.supplierId)
        });
        if (!supplier) return { success: false, error: '供应商不存在' };

        // 创建合并采购单（不关联单一订单）
        const poNo = `PO-MERGED-${Date.now()}`;
        const total = data.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0).toString();

        const [po] = await tx.insert(purchaseOrders).values({
            tenantId,
            poNo,
            supplierId: data.supplierId,
            supplierName: supplier.name,
            orderId: null, // 合并采购单不关联单一订单
            status: 'DRAFT',
            totalAmount: total,
            createdBy: session.user.id,
            // 可以在 remark 中记录来源订单
        }).returning();

        // 创建采购项
        if (data.items.length > 0) {
            const itemsToInsert = data.items.map(item => ({
                tenantId,
                poId: po.id,
                productName: item.productName,
                quantity: item.quantity.toString(),
                unitPrice: item.unitCost.toString(),
            }));
            await tx.insert(purchaseOrderItems).values(itemsToInsert);
        }

        revalidatePath('/supply-chain/purchase-orders');
        revalidatePath('/supply-chain/pending-pool');

        return {
            success: true,
            data: po,
            message: `已创建合并采购单 ${poNo}，包含 ${data.items.length} 个商品，关联 ${data.sourceOrderIds.length} 个订单`
        };
    });
}

/**
 * 批量更新采购单状态
 */
export async function batchUpdatePoStatus(data: {
    poIds: string[];
    status: 'DRAFT' | 'IN_PRODUCTION' | 'READY' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const tenantId = session.user.tenantId;

    return db.transaction(async (tx) => {
        // 验证所有 PO 存在且属于当前租户
        const existingPos = await tx.query.purchaseOrders.findMany({
            where: and(
                inArray(purchaseOrders.id, data.poIds),
                eq(purchaseOrders.tenantId, tenantId)
            )
        });

        if (existingPos.length !== data.poIds.length) {
            return { success: false, error: `找到 ${existingPos.length}/${data.poIds.length} 个采购单` };
        }

        // 批量更新
        await tx.update(purchaseOrders)
            .set({
                status: data.status,
                updatedAt: new Date()
            })
            .where(and(
                inArray(purchaseOrders.id, data.poIds),
                eq(purchaseOrders.tenantId, tenantId)
            ));

        // 触发业务逻辑
        for (const po of existingPos) {
            if (data.status === 'IN_PRODUCTION' && po.status === 'DRAFT') {
                await createApFromPoInternal(po.id, tenantId);
            }
            if (po.orderId) {
                await POStatusAggregator.updateOrderStatusByPOs(po.orderId, tenantId);
            }
        }

        revalidatePath('/supply-chain/purchase-orders');

        return {
            success: true,
            message: `已批量更新 ${data.poIds.length} 个采购单状态为 ${data.status}`
        };
    });
}

/**
 * 批量删除草稿状态的采购单
 */
export async function batchDeleteDraftPOs(data: { poIds: string[] }) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Unauthorized' };

    const tenantId = session.user.tenantId;

    return db.transaction(async (tx) => {
        // 只能删除草稿状态的 PO
        const draftPos = await tx.query.purchaseOrders.findMany({
            where: and(
                inArray(purchaseOrders.id, data.poIds),
                eq(purchaseOrders.tenantId, tenantId),
                eq(purchaseOrders.status, 'DRAFT')
            )
        });

        if (draftPos.length === 0) {
            return { success: false, error: '没有可删除的草稿采购单' };
        }

        const draftIds = draftPos.map(p => p.id);

        // 先删除采购项
        await tx.delete(purchaseOrderItems).where(inArray(purchaseOrderItems.poId, draftIds));

        // 再删除采购单
        await tx.delete(purchaseOrders).where(inArray(purchaseOrders.id, draftIds));

        revalidatePath('/supply-chain/purchase-orders');

        return {
            success: true,
            deletedCount: draftPos.length,
            message: `已删除 ${draftPos.length} 个草稿采购单`
        };
    });
}
