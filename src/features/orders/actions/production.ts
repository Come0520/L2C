
import { z } from 'zod';
import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema/orders';
import { eq, and } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { AuditService } from '@/shared/lib/audit-service';
import { confirmProductionSchema, splitOrderSchema } from '../action-schemas';
import { executeSplitRouting } from '@/features/supply-chain/actions/split-engine';
import { logger } from '@/shared/lib/logger';

/**
 * 确认生产开始 Action 类型定义
 */
type ConfirmProductionInput = z.infer<typeof confirmProductionSchema>;

/**
 * 确认生产开始，校验并更新订单状态为 IN_PRODUCTION，触发审计日志和拆单排程逻辑。
 * 
 * @param input 包含将要开始生产的订单 ID (`orderId`) 及其版本号 (`version`) 还有备注信息 (`remark`)
 * @returns 操作成功则返回 `{ success: true }`
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

        // P2 Fix: Allow CREDIT orders to start production without full payment
        const isMonthly = order.settlementType === 'CREDIT';
        if (order.status !== 'PAID' && !isMonthly) {
            throw new Error('Order must be PAID to start production');
        }

        // 2. 更新订单状态（含乐观锁）
        const [updatedOrder] = await db.update(orders)
            .set({
                status: 'IN_PRODUCTION',
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

        logger.info('[orders] 生产已确认开始:', { orderId, tenantId, remark });
        console.log('[orders] 生产已确认开始:', { orderId, tenantId, remark });

        return { success: true };
    } catch (e: unknown) {
        const error = e as Error;
        logger.error('[orders] 生产确认失败:', { error });
        console.log('[orders] 生产确认失败:', { orderId, error: error.message });
        throw new Error(error.message || '操作失败');
    }
}

/**
 * 拆单操作类型定义
 */
type SplitOrderInput = z.infer<typeof splitOrderSchema>;

/**
 * 拆单操作，将一个订单拆分为多个生产或采购子单，并记录审计日志。
 * 
 * @param input 包含指定的订单 ID (`orderId`) 和即将拆分的目标项 (`items`) 等详情
 * @returns 操作成功则返回包含拆单结果的 `{ success: true, data: splitResult }`
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

        logger.info('[orders] 拆单操作成功:', { orderId, tenantId, itemsCount: items.length });
        console.log('[orders] 拆单操作成功:', { orderId, tenantId, itemsCount: items.length });

        return { success: true, data: splitResult };
    } catch (e: unknown) {
        const error = e as Error;
        logger.error('[orders] 拆单失败:', { error });
        console.log('[orders] 拆单失败:', { orderId, error: error.message });
        throw new Error(error.message || '拆单失败');
    }
}
