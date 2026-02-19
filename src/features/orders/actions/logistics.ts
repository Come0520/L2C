
import { z } from 'zod';
import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema/orders';
import { eq, and } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { AuditService } from '@/shared/lib/audit-service';
import { requestDeliverySchema, updateLogisticsSchema } from '../action-schemas';
import { LogisticsService } from '@/services/logistics.service';

/**
 * 请求发货 Action 类型定义
 */
type RequestDeliveryInput = z.infer<typeof requestDeliverySchema>;

/**
 * 请求发货
 */
export async function requestDelivery(input: RequestDeliveryInput) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');
    const tenantId = session.user.tenantId;

    await checkPermission(session, PERMISSIONS.ORDER.MANAGE);

    const validatedInput = requestDeliverySchema.parse(input);
    const { orderId, company, trackingNo, remark } = validatedInput;

    try {
        await db.update(orders)
            .set({
                status: 'PENDING_DELIVERY',
                updatedAt: new Date(),
            })
            .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)));

        await AuditService.record({
            tenantId,
            userId: session.user.id,
            tableName: 'orders',
            recordId: orderId,
            action: 'ORDER_DELIVERY_REQUESTED',
            newValues: { status: 'PENDING_DELIVERY', company, trackingNo, remark },
        });

        return { success: true };
    } catch (e: unknown) {
        const error = e as Error;
        return { success: false, error: error.message || '请求发货失败' };
    }
}

/**
 * 更新物流信息 Action 类型定义
 */
type UpdateLogisticsInput = z.infer<typeof updateLogisticsSchema>;

/**
 * 更新物流信息
 */
export async function updateLogistics(input: UpdateLogisticsInput) {
    const session = await auth();
    if (!session) return { success: false, error: 'Unauthorized' };
    const tenantId = session.user.tenantId;

    try {
        await checkPermission(session, PERMISSIONS.ORDER.MANAGE);

        const validatedInput = updateLogisticsSchema.parse(input);
        const { orderId, company, trackingNo } = validatedInput;

        await LogisticsService.updateLogisticsInfo(orderId, company, trackingNo);

        await AuditService.record({
            tenantId,
            userId: session.user.id,
            tableName: 'orders',
            recordId: orderId,
            action: 'ORDER_LOGISTICS_UPDATED',
            newValues: { company, trackingNo },
        });

        return { success: true };
    } catch (e: unknown) {
        const error = e as Error;
        return { success: false, error: error.message || '更新物流失败' };
    }
}
