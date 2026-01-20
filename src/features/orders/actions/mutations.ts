'use server';

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Update Order Status Schema
const updateOrderStatusSchema = z.object({
    id: z.string(),
    status: z.string(),
    reason: z.string().optional(),
});

import {
    requestOrderCancellationSchema,
    pauseOrderSchema,
    resumeOrderSchema
} from '../action-schemas';
import { OrderService } from '@/services/order.service';

export const updateOrderStatus = createSafeAction(updateOrderStatusSchema, async (data, ctx) => {
    const { session } = ctx;
    if (!session.user.tenantId) throw new Error('Unauthorized');

    // 安全检查：验证订单属于当前租户
    const order = await db.query.orders.findFirst({
        where: and(
            eq(orders.id, data.id),
            eq(orders.tenantId, session.user.tenantId)
        ),
    });
    if (!order) throw new Error('订单不存在或无权操作');

    await db.update(orders)
        .set({
            status: data.status as any, // Cast to enum type if needed
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(orders.id, data.id),
                eq(orders.tenantId, session.user.tenantId)
            )
        );

    revalidatePath('/orders');
    revalidatePath(`/orders/${data.id}`);

    return {
        success: true,
        id: data.id,
        newStatus: data.status
    };
});

// Phase 2: Cancellation & Pause Actions

/**
 * 申请撤单
 */
export const requestOrderCancellation = createSafeAction(requestOrderCancellationSchema, async (data, ctx) => {
    const { session } = ctx;
    if (!session.user.tenantId || !session.user.id) throw new Error('Unauthorized');

    const result = await OrderService.requestCancellation(
        data.orderId,
        session.user.tenantId,
        session.user.id,
        data.reason
    );

    revalidatePath('/orders');
    revalidatePath(`/orders/${data.orderId}`);

    return { success: true, approvalId: result.approvalId };
});

/**
 * 叫停生产
 */
export const pauseOrder = createSafeAction(pauseOrderSchema, async (data, ctx) => {
    const { session } = ctx;
    if (!session.user.tenantId) throw new Error('Unauthorized');

    await OrderService.pauseOrder(
        data.orderId,
        session.user.tenantId,
        data.reason
    );

    revalidatePath('/orders');
    revalidatePath(`/orders/${data.orderId}`);

    return { success: true };
});

/**
 * 恢复生产
 */
export const resumeOrder = createSafeAction(resumeOrderSchema, async (data, ctx) => {
    const { session } = ctx;
    if (!session.user.tenantId) throw new Error('Unauthorized');

    await OrderService.resumeOrder(
        data.orderId,
        session.user.tenantId
    );

    revalidatePath('/orders');
    revalidatePath(`/orders/${data.orderId}`);

    return { success: true };
});
