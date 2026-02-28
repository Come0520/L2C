'use server';

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
 * 请求发货 Action。
 * 
 * @description 将指定订单的状态更新为"待发货" (`PENDING_DELIVERY`)。
 * 包含以下逻辑：
 * 1. 权限检查：需拥有订单管理权限。
 * 2. 状态校验：确保订单处于可发货状态。
 * 3. 乐观锁控制：通过版本号 (`version`) 确保并发安全。
 * 4. 记录审计日志：记录发货申请信息（快递公司、单号、备注）。
 * 
 * @param input 包含订单 ID (`orderId`)、版本号 (`version`) 及快递公司、单号、备注。
 * @returns 操作结果 `{ success: boolean, error?: string }`
 */
export async function requestDelivery(input: RequestDeliveryInput) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');
    const tenantId = session.user.tenantId;

    await checkPermission(session, PERMISSIONS.ORDER.ALL_EDIT);

    const validatedInput = requestDeliverySchema.parse(input);
    const { orderId, company, trackingNo, remark } = validatedInput;

    try {
        // 先查询当前订单获取 version
        const order = await db.query.orders.findFirst({
            where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)),
        });
        if (!order) throw new Error('订单不存在');

        const [updatedOrder] = await db.update(orders)
            .set({
                status: 'PENDING_DELIVERY',
                version: order.version + 1,
                updatedAt: new Date(),
            })
            .where(and(
                eq(orders.id, orderId),
                eq(orders.tenantId, tenantId),
                eq(orders.version, validatedInput.version)
            ))
            .returning({ id: orders.id });

        if (!updatedOrder) {
            throw new Error('订单版本冲突，请刷新后重试');
        }

        await AuditService.record({
            tenantId,
            userId: session.user.id,
            tableName: 'orders',
            recordId: orderId,
            action: 'ORDER_DELIVERY_REQUESTED',
            newValues: { status: 'PENDING_DELIVERY', company, trackingNo, remark },
        });

        console.log('[orders] 订单发货申请成功:', { orderId, tenantId, company, trackingNo });

        return { success: true };
    } catch (e: unknown) {
        const error = e as Error;
        console.log('[orders] 订单发货申请失败:', { orderId, error: error.message });
        return { success: false, error: error.message || '请求发货失败' };
    }
}

/**
 * 更新物流信息 Action 类型定义
 */
type UpdateLogisticsInput = z.infer<typeof updateLogisticsSchema>;

/**
 * 更新物流信息 Action。
 * 
 * @description 调用 LogisticsService 更新指定订单的承运商和运单号。
 * 适用于已发货订单的物流信息修正或补全。
 * 
 * @param input 包含订单 ID (`orderId`)、快递公司 (`company`) 和运单号 (`trackingNo`)。
 * @returns 操作结果 `{ success: boolean, error?: string }`
 */
export async function updateLogistics(input: UpdateLogisticsInput) {
    const session = await auth();
    if (!session) return { success: false, error: 'Unauthorized' };
    const tenantId = session.user.tenantId;

    try {
        await checkPermission(session, PERMISSIONS.ORDER.ALL_EDIT);

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

        console.log('[orders] 订单物流信息更新成功:', { orderId, tenantId, company, trackingNo });

        return { success: true };
    } catch (e: unknown) {
        const error = e as Error;
        console.log('[orders] 订单物流信息更新失败:', { input, error: error.message });
        return { success: false, error: error.message || '更新物流失败' };
    }
}
