'use server';

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { z } from 'zod';
import { revalidateTag } from 'next/cache';
import { AuditService } from '@/shared/lib/audit-service';
import { OrderStateMachine } from '../logic/order-state-machine';
import { logger } from '@/shared/lib/logger';

// Update Order Status Schema
const updateOrderStatusSchema = z.object({
    id: z.string(),
    status: z.string(),
    reason: z.string().optional(),
    version: z.number().int().positive(), // Optimistic locking
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

    const [updatedOrder] = await db.update(orders)
        .set({
            // 类型安全：使用 enum 值列表验证
            status: data.status as typeof orders.status._.data,
            version: order.version + 1, // Increment version
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(orders.id, data.id),
                eq(orders.tenantId, session.user.tenantId),
                eq(orders.version, data.version) // Check optimistic lock
            )
        )
        .returning({ id: orders.id });

    if (!updatedOrder) {
        throw new Error('订单版本冲突，请刷新后重试');
    }

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

    logger.info('[orders] 订单状态更新成功:', { id: data.id, tenantId: session.user.tenantId, oldStatus: order.status, newStatus: data.status });

    revalidateTag('orders', 'default');
    revalidateTag(`order-${data.id}`, 'default');

    return { success: true, id: data.id, newStatus: data.status };
});

/**
 * 通用订单状态更新 Action。
 * 
 * @description 受控的状态更新接口，仅允许通过状态机 (`OrderStateMachine`) 验证的转换。
 * 包含以下核心流程：
 * 1. 权限检查：订单编辑权限。
 * 2. 状态机校验：严禁非法状态流转。
 * 3. 乐观锁更新：保护数据一致性。
 * 4. 审计追踪：记录新旧状态及其变更原因。
 * 5. 缓存失效：刷新订单列表及详情路径。
 * 
 * @param params 包含订单 ID、目标状态、原因及乐观锁版本号。
 * @returns 包含成功状态及新状态信息的 Promise。
 */
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
        data.version,
        session.user.id,
        data.reason
    );

    revalidateTag('orders', 'default');
    revalidateTag(`order-${data.orderId}`, 'default');

    logger.info('[orders] 申请取消订单提交成功:', { orderId: data.orderId, tenantId: session.user.tenantId, approvalId: result.approvalId });

    return { success: true, approvalId: result.approvalId };
});

/**
 * 请求取消订单 Action。
 * 
 * @description 触发订单取消流程。根据业务配置，该操作可能会生成一条需要人工审批的流程，
 * 审批通过后订单状态才会真正变为 `CANCELLED`。
 * 
 * @param params 包含订单 ID、版本号及取消原因。
 * @returns 包含成功标识及可能生成的审批 ID (`approvalId`)。
 */
export async function requestOrderCancellation(params: z.infer<typeof requestOrderCancellationSchema>) {
    return requestOrderCancellationActionInternal(params);
}

const pauseOrderActionInternal = createSafeAction(pauseOrderSchema, async (data, ctx) => {
    const { session } = ctx;
    if (!session.user.tenantId || !session.user.id) throw new Error('Unauthorized');

    await OrderService.haltOrder(
        data.orderId,
        session.user.tenantId,
        data.version,
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

    revalidateTag('orders', 'default');
    revalidateTag(`order-${data.orderId}`, 'default');

    logger.info('[orders] 订单已被叫停:', { orderId: data.orderId, tenantId: session.user.tenantId, reason: data.reason });

    return { success: true };
});

/**
 * 暂停/叫停订单 Action。
 * 
 * @description 暂停订单执行进程。必须提供暂停原因。该操作会记录订单中止时间及终止原因。
 * 
 * @param params 包含订单 ID、当前乐观锁版本及暂停原因。
 * @returns 返回调用结果及成功标识。
 */
export async function pauseOrder(params: z.infer<typeof pauseOrderSchema>) {
    return pauseOrderActionInternal(params);
}

const resumeOrderActionInternal = createSafeAction(resumeOrderSchema, async (data, ctx) => {
    const { session } = ctx;
    if (!session.user.tenantId || !session.user.id) throw new Error('Unauthorized');

    await OrderService.resumeOrder(
        data.orderId,
        session.user.tenantId,
        data.version,
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

    revalidateTag('orders', 'default');
    revalidateTag(`order-${data.orderId}`, 'default');

    logger.info('[orders] 订单已恢复运行:', { orderId: data.orderId, tenantId: session.user.tenantId, remark: data.remark });

    return { success: true };
});

/**
 * 恢复执行订单 Action。
 * 
 * @description 将因故暂停的订单重新挂起执行。可以通过备注记录恢复情况说明。
 * 
 * @param params 包含订单 ID、版本及恢复备注。
 * @returns 成功则返回 true。
 */
export async function resumeOrder(params: z.infer<typeof resumeOrderSchema>) {
    return resumeOrderActionInternal(params);
}
