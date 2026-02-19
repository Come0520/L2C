
import { z } from 'zod';
import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema/orders';
import { eq, and } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { AuditService } from '@/shared/lib/audit-service';
import { confirmProductionSchema, splitOrderSchema } from '../action-schemas';
import { executeSplitRouting } from '@/features/supply-chain/actions/split-engine';

/**
 * 确认生产开始 Action 类型定义
 */
type ConfirmProductionInput = z.infer<typeof confirmProductionSchema>;

/**
 * 确认生产开始
 */
export async function confirmOrderProduction(input: ConfirmProductionInput) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');
    const tenantId = session.user.tenantId;

    await checkPermission(session, PERMISSIONS.ORDER.MANAGE);

    const validatedInput = confirmProductionSchema.parse(input);
    const { orderId, remark } = validatedInput;

    try {
        // 1. 获取订单，验证状态
        const order = await db.query.orders.findFirst({
            where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)),
        });

        if (!order) throw new Error('Order not found');

        // P2 Fix: Allow MONTHLY orders to start production without full payment
        const isMonthly = order.settlementType === 'MONTHLY';
        if (order.status !== 'PAID' && !isMonthly) {
            throw new Error('Order must be PAID to start production');
        }

        // 2. 更新订单状态
        await db.update(orders)
            .set({
                status: 'IN_PRODUCTION',
                updatedAt: new Date(),
            })
            .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)));

        // 3. 记录审计日志
        await AuditService.record({
            tenantId,
            userId: session.user.id,
            tableName: 'orders',
            recordId: orderId,
            action: 'ORDER_PRODUCTION_STARTED',
            newValues: { status: 'IN_PRODUCTION', remark },
        });

        // 自动触发拆单/排程逻辑
        await executeSplitRouting(orderId, tenantId, session);

        return { success: true };
    } catch (e: unknown) {
        const error = e as Error;
        throw new Error(error.message || '操作失败');
    }
}

/**
 * 拆单操作类型定义
 */
type SplitOrderInput = z.infer<typeof splitOrderSchema>;

/**
 * 拆单操作
 */
export async function splitOrder(input: SplitOrderInput) {
    const session = await auth();
    if (!session) throw new Error('Unauthorized');
    const tenantId = session.user.tenantId;

    await checkPermission(session, PERMISSIONS.ORDER.MANAGE);

    const validatedInput = splitOrderSchema.parse(input);
    const { orderId, items } = validatedInput;

    try {
        // 调用底层的拆单逻辑
        const splitResult = await executeSplitRouting(orderId, tenantId, session);

        // 记录审计日志
        await AuditService.record({
            tenantId,
            userId: session.user.id,
            tableName: 'orders',
            recordId: orderId,
            action: 'ORDER_SPLIT_MANUAL',
            newValues: { itemsCount: items.length, splitResult },
        });

        return { success: true, data: splitResult };
    } catch (e: unknown) {
        const error = e as Error;
        throw new Error(error.message || '拆单失败');
    }
}
