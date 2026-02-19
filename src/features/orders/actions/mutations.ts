'use server';

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { AuditService } from '@/shared/lib/audit-service';
import { OrderStateMachine } from '../logic/order-state-machine';

// Update Order Status Schema
const updateOrderStatusSchema = z.object({
    id: z.string(),
    status: z.string(),
    reason: z.string().optional(),
});

import {
    pauseOrderSchema,
    requestOrderCancellationSchema,
    resumeOrderSchema
} from '../action-schemas';
import { OrderService } from '@/services/order.service';

const updateOrderStatusActionInternal = createSafeAction(updateOrderStatusSchema, async (data, ctx) => {
    const { session } = ctx;
    if (!session.user.tenantId) throw new Error('Unauthorized');

    // 权限检查：需要订单编辑权限
    await checkPermission(session, PERMISSIONS.ORDER.EDIT);

    const order = await db.query.orders.findFirst({
        where: and(
            eq(orders.id, data.id),
            eq(orders.tenantId, session.user.tenantId)
        ),
    });
    if (!order) throw new Error('订单不存在或无权操作');

    // 状态机验证：确保状态转换合法
    if (!order.status) {
        throw new Error('订单状态异常：当前状态为空');
    }
    if (!OrderStateMachine.validateTransition(
        order.status as Parameters<typeof OrderStateMachine.validateTransition>[0],
        data.status as Parameters<typeof OrderStateMachine.validateTransition>[1]
    )) {
        throw new Error(`不允许从 ${order.status} 转换到 ${data.status}`);
    }

    await db.update(orders)
        .set({
            // 类型安全：使用 enum 值列表验证
            status: data.status as typeof orders.status._.data,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(orders.id, data.id),
                eq(orders.tenantId, session.user.tenantId)
            )
        );

    // 记录审计日志
    await AuditService.record({
        tenantId: session.user.tenantId,
        userId: session.user.id,
        tableName: 'orders',
        recordId: data.id,
        action: 'UPDATE',
        oldValues: { status: order.status },
        newValues: { status: data.status },
        changedFields: { status: data.status, reason: data.reason },
    });

    revalidatePath('/orders');
    revalidatePath(`/orders/${data.id}`);

    return { success: true, id: data.id, newStatus: data.status };
});

export async function updateOrderStatus(params: z.infer<typeof updateOrderStatusSchema>) {
    return updateOrderStatusActionInternal(params);
}

// Phase 2: Cancellation & Pause Actions

const requestOrderCancellationActionInternal = createSafeAction(requestOrderCancellationSchema, async (data, ctx) => {
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

export async function requestOrderCancellation(params: z.infer<typeof requestOrderCancellationSchema>) {
    return requestOrderCancellationActionInternal(params);
}

const pauseOrderActionInternal = createSafeAction(pauseOrderSchema, async (data, ctx) => {
    const { session } = ctx;
    if (!session.user.tenantId || !session.user.id) throw new Error('Unauthorized');

    await OrderService.haltOrder(
        data.orderId,
        session.user.tenantId,
        session.user.id,
        data.reason
    );

    await AuditService.record({
        tenantId: session.user.tenantId,
        userId: session.user.id,
        tableName: 'orders',
        recordId: data.orderId,
        action: 'ORDER_PAUSED',
        newValues: { reason: data.reason },
    });

    revalidatePath('/orders');
    revalidatePath(`/orders/${data.orderId}`);

    return { success: true };
});

export async function pauseOrder(params: z.infer<typeof pauseOrderSchema>) {
    return pauseOrderActionInternal(params);
}

const resumeOrderActionInternal = createSafeAction(resumeOrderSchema, async (data, ctx) => {
    const { session } = ctx;
    if (!session.user.tenantId || !session.user.id) throw new Error('Unauthorized');

    await OrderService.resumeOrder(
        data.orderId,
        session.user.tenantId,
        session.user.id,
        data.remark
    );

    await AuditService.record({
        tenantId: session.user.tenantId,
        userId: session.user.id,
        tableName: 'orders',
        recordId: data.orderId,
        action: 'ORDER_RESUMED',
        newValues: { remark: data.remark },
    });

    revalidatePath('/orders');
    revalidatePath(`/orders/${data.orderId}`);

    return { success: true };
});

export async function resumeOrder(params: z.infer<typeof resumeOrderSchema>) {
    return resumeOrderActionInternal(params);
}
