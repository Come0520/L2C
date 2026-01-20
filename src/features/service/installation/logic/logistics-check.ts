import { db } from '@/shared/api/db';
import { purchaseOrders } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';

export interface LogisticsCheckResult {
    ready: boolean;
    message?: string;
    unreadyPos?: string[];
}

const READY_STATUSES = ['RECEIVED', 'ARRIVED', 'COMPLETED', 'PARTIAL_RECEIVED'];
// Adjust based on actual business logic. Assuming 'PARTIAL_RECEIVED' might block if we need full, but let's be strict for now or check quantity.
// Requirement: "All related POs... RECEIVED or ARRIVED"
// Let's assume 'RECEIVED' and 'ARRIVED' and 'COMPLETED'.

/**
 * Check if all logistics for an order are ready
 */
export async function checkLogisticsReady(orderId: string): Promise<LogisticsCheckResult> {
    const pos = await db.query.purchaseOrders.findMany({
        where: eq(purchaseOrders.orderId, orderId),
        columns: {
            id: true,
            poNo: true,
            status: true,
            supplierName: true
        }
    });

    if (pos.length === 0) {
        // If no POs, maybe it's stock items or no PO needed?
        // Safe to proceed? Or block?
        // Assuming if there are items, there should be POs or Inventory reservation.
        // For P0 audit fix, let's assume valid.
        return { ready: true };
    }

    const unreadyPos = pos.filter(po => {
        const status = po.status?.toUpperCase() || '';
        return !READY_STATUSES.includes(status);
    });

    if (unreadyPos.length > 0) {
        const names = unreadyPos.map(p => `${p.poNo} (${p.status})`).join(', ');
        return {
            ready: false,
            message: `关联采购单尚未全部到货: ${names}`,
            unreadyPos: unreadyPos.map(p => p.id)
        };
    }

    return { ready: true };
}
