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

        const allFinishedReady = finishedPOs.every(p => p.status === 'READY' || p.status === 'SHIPPED' || p.status === 'DELIVERED');
        const allFabricStocked = fabricPOs.every(p => p.status === 'STOCKED' || p.status === 'DELIVERED');
        const allStockReady = stockPOs.every(p => p.status === 'READY' || p.status === 'SHIPPED' || p.status === 'DELIVERED');

        if (allFinishedReady && allFabricStocked && allStockReady) {
            return 'PENDING_DELIVERY';
        }

        const allShipped = allPOs.every(p => p.status === 'SHIPPED' || p.status === 'DELIVERED');
        if (allShipped) {
            return 'SHIPPED';
        }

        const allDelivered = allPOs.every(p => p.status === 'DELIVERED');
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