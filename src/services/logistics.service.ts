import { db } from "@/shared/api/db";
import { orders } from "@/shared/api/schema/orders";
import { eq } from "drizzle-orm";
import { queryTracking, TrackingResult } from "@/lib/logistics";

export interface OrderLogisticsData {
    company: string;
    trackingNo: string;
    status: string; // '0'-transit, '1'-pickup, '2'-trouble, '3'-signed, '4'-return, '5'-delivering, '6'-return_signed
    traces: Array<{
        time: string;
        context: string;
        ftime?: string;
    }>;
    lastUpdatedAt: string;
}

export class LogisticsService {
    /**
     * Update logistics info for an order (Carrier & Tracking No)
     * And immediately fetch the latest tracking info.
     */
    static async updateLogisticsInfo(orderId: string, company: string, trackingNo: string) {
        // Query API immediately to get initial status
        let trackingData: TrackingResult | null = null;
        try {
            trackingData = await queryTracking(company, trackingNo);
        } catch (e) {
            console.error("Failed to query tracking info", e);
        }

        const logisticsData: OrderLogisticsData = {
            company,
            trackingNo,
            status: trackingData?.state || 'UNKNOWN',
            traces: trackingData?.data || [],
            lastUpdatedAt: new Date().toISOString()
        };

        // Update DB
        await db.update(orders)
            .set({ logistics: logisticsData })
            .where(eq(orders.id, orderId));

        return logisticsData;
    }

    /**
     * Refresh logistics info for an existing order by Re-querying the API.
     */
    static async refreshLogistics(orderId: string) {
        const order = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            columns: { logistics: true }
        });

        if (!order?.logistics) return null;

        const { company, trackingNo } = order.logistics as OrderLogisticsData;
        if (!company || !trackingNo) return null;

        return this.updateLogisticsInfo(orderId, company, trackingNo);
    }
}
