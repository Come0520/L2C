import { db } from '@/shared/api/db';
import { purchaseOrders } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface PurchaseOrderDetail {
    id: string;
    poNo: string;
    orderId?: string;
    order?: { id: string; orderNo: string };
    supplierId: string;
    supplierName: string;
    status: string;
    type?: string;
    totalAmount: number;
    logisticsCompany?: string;
    logisticsNo?: string;
    shippedAt?: Date;
    creator?: { id: string; name: string } | null; // Changed to object
    remark?: string;
    items: Array<{
        id: string;
        productId: string;
        productName: string;
        productSku?: string | null; // Added
        quantity: number;
        unitPrice: number;
        subtotal?: number | null; // Added
    }>;
    createdAt: Date;
}

export async function getPoById({ id }: { id: string }): Promise<{ success: boolean; data?: PurchaseOrderDetail; error?: string }> {
    console.log('getPoById', id);
    return { success: false, error: "Not implemented" };
}

export async function updatePoStatus({ poId, status }: { poId: string; status: string }): Promise<{ success: boolean; error?: string }> {
    console.log('updatePoStatus', poId, status);
    return { success: true };
}

export async function addPOLogistics(data: {
    poId: string;
    company: string;
    trackingNo: string;
    shippedAt: Date;
    remark?: string;
}) {
    try {
        await db
            .update(purchaseOrders)
            .set({
                logisticsCompany: data.company,
                logisticsNo: data.trackingNo,
                shippedAt: data.shippedAt,
                remark: data.remark,
                status: 'SHIPPED', // Update status to SHIPPED
                updatedAt: new Date(),
            })
            .where(eq(purchaseOrders.id, data.poId));

        revalidatePath('/supply-chain/purchase-orders');
        return { success: true };
    } catch (error) {
        console.error('Failed to add PO logistics:', error);
        throw error;
    }
}
