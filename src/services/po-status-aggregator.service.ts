import { db } from "@/shared/api/db";
import { purchaseOrders } from "@/shared/api/schema/supply-chain";
import { orders } from "@/shared/api/schema/orders";
import { eq } from "drizzle-orm";

export class POStatusAggregator {

    static async updateOrderStatusByPOs(orderId: string, tenantId: string) {
        const pos = await db.query.purchaseOrders.findMany({
            where: eq(purchaseOrders.orderId, orderId)
        });

        if (!pos || pos.length === 0) {
            return null;
        }

        const finishedPOs = pos.filter(p => p.type === 'FINISHED');
        const fabricPOs = pos.filter(p => p.type === 'FABRIC');
        const stockPOs = pos.filter(p => p.type === 'STOCK');

        const newOrderStatus = await this.determineOrderStatus(finishedPOs, fabricPOs, stockPOs);

        if (newOrderStatus) {
            await db.update(orders)
                .set({
                    status: newOrderStatus as any,
                    updatedAt: new Date()
                })
                .where(eq(orders.id, orderId));
        }

        return newOrderStatus;
    }

    private static async determineOrderStatus(
        finishedPOs: any[],
        fabricPOs: any[],
        stockPOs: any[]
    ): Promise<string | null> {
        const allPOs = [...finishedPOs, ...fabricPOs, ...stockPOs];

        if (allPOs.length === 0) {
            return null;
        }

        if (allPOs.every(p => p.status === 'CANCELLED')) {
            return 'CANCELLED';
        }

        if (finishedPOs.some(p => p.status === 'IN_PRODUCTION')) {
            return 'IN_PRODUCTION';
        }

        if (fabricPOs.some(p => p.status === 'IN_PRODUCTION')) {
            return 'FABRIC_PURCHASING';
        }

        const allFinishedReady = finishedPOs.every(p => ['READY', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(p.status));
        const allFabricStocked = fabricPOs.every(p => ['STOCKED', 'DELIVERED', 'COMPLETED'].includes(p.status));
        const allStockReady = stockPOs.every(p => ['READY', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(p.status));

        if (allFinishedReady && allFabricStocked && allStockReady) {
            return 'PENDING_DELIVERY'; // Production done, ready to ship to customer
        }

        const allShipped = allPOs.every(p => ['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(p.status));
        if (allShipped) {
            return 'SHIPPED';
        }

        const allDelivered = allPOs.every(p => ['DELIVERED', 'COMPLETED'].includes(p.status));
        if (allDelivered) {
            return 'PENDING_INSTALL';
        }

        return null;
    }

    static async updatePOStatus(poId: string, newStatus: string, tenantId: string) {
        const po = await db.query.purchaseOrders.findFirst({
            where: eq(purchaseOrders.id, poId)
        });

        if (!po) {
            throw new Error("PO not found");
        }

        await db.update(purchaseOrders)
            .set({
                status: newStatus as any,
                updatedAt: new Date()
            })
            .where(eq(purchaseOrders.id, poId));

        if (po.orderId) {
            await this.updateOrderStatusByPOs(po.orderId, tenantId);
        }

        return po;
    }
}