'use server';

import { db } from '@/shared/api/db';
import { orders, paymentSchedules } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { revalidateTag } from 'next/cache';
import { PERMISSIONS } from '@/shared/config/permissions';
import { AuditService } from '@/shared/lib/audit-service';
import Decimal from 'decimal.js';
import { logger } from '@/shared/lib/logger';

/**
 * 创建订单付款记录 Action
 * 
 * 核心逻辑：记录实际付款金额、上传支付凭证、并更新订单已付金额和状态。
 * 安全机制：权限检查 + 租户隔离 + Decimal.js 精度计算 + 审计日志。
 * 
 * @param data 包含付款详情的数据对象
 * @param data.scheduleId 付款计划 ID
 * @param data.actualAmount 实际付款金额
 * @param data.proofImg 支付凭证图片地址
 * @param data.paymentMethod 支付方式 (例如：'WECHAT', 'ALIPAY', 'BANK')
 * @param data.orderId 关联订单 ID
 * @returns 包含操作结果的对象 `{ success: true }` 或 `{ success: false, error: 错误信息 }`
 */
export async function createOrderPayment(data: {
    scheduleId: string;
    actualAmount: string;
    proofImg: string;
    paymentMethod: string;
    orderId: string;
}) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    // 权限检查
    await checkPermission(session, PERMISSIONS.ORDER.EDIT);

    const tenantId = session.user.tenantId;
    const userId = session.user.id;
    const { scheduleId, actualAmount, proofImg, paymentMethod, orderId } = data;

    if (!scheduleId || !actualAmount || !proofImg || !paymentMethod) {
        return { success: false, error: '缺少必填信息' };
    }

    try {
        return await db.transaction(async (tx) => {
            // 查询付款计划（含租户隔离）
            const schedule = await tx.query.paymentSchedules.findFirst({
                where: and(
                    eq(paymentSchedules.id, scheduleId),
                    eq(paymentSchedules.tenantId, tenantId)
                )
            });

            if (!schedule) throw new Error('付款计划不存在');
            if (schedule.status === 'PAID') throw new Error('该笔已支付');

            // 更新付款计划
            await tx.update(paymentSchedules)
                .set({
                    status: 'PAID',
                    actualAmount: actualAmount,
                    paymentMethod: paymentMethod as "CASH" | "WECHAT" | "ALIPAY" | "BANK",
                    proofImg: proofImg,
                    actualDate: new Date().toISOString(),
                    updatedAt: new Date()
                })
                .where(and(
                    eq(paymentSchedules.id, scheduleId),
                    eq(paymentSchedules.tenantId, tenantId)
                ));

            // 查询订单（含租户隔离）
            const order = await tx.query.orders.findFirst({
                where: and(
                    eq(orders.id, orderId),
                    eq(orders.tenantId, tenantId)
                )
            });

            if (!order) throw new Error('订单不存在');

            // 使用 Decimal.js 做金额计算，避免浮点精度问题
            const newPaid = new Decimal(order.paidAmount as string || '0')
                .plus(actualAmount)
                .toFixed(2);
            const newBalance = new Decimal(order.totalAmount as string || '0')
                .minus(newPaid)
                .toFixed(2);

            const oldStatus = order.status;
            let statusToSet = order.status;
            if (new Decimal(newPaid).greaterThan(0)) {
                if (order.status === 'SIGNED') {
                    statusToSet = 'PAID';
                } else if (order.status === 'PENDING_PO') {
                    statusToSet = 'PENDING_PRODUCTION';
                }
            }

            // 更新订单（含租户隔离）
            await tx.update(orders)
                .set({
                    paidAmount: newPaid,
                    balanceAmount: newBalance,
                    status: statusToSet,
                    updatedAt: new Date()
                })
                .where(and(
                    eq(orders.id, orderId),
                    eq(orders.tenantId, tenantId)
                ));

            // 记录审计日志
            await AuditService.record({
                tenantId,
                userId,
                tableName: 'orders',
                recordId: orderId,
                action: 'UPDATE',
                oldValues: { paidAmount: order.paidAmount, balanceAmount: order.balanceAmount, status: oldStatus },
                newValues: { paidAmount: newPaid, balanceAmount: newBalance, status: statusToSet },
                changedFields: { paidAmount: newPaid, balanceAmount: newBalance, status: statusToSet }
            }, tx);

            logger.info('[orders] 创建订单付款记录成功:', { orderId, scheduleId, tenantId, amount: actualAmount });

            revalidateTag(`order-${orderId}`, {});
            revalidateTag(`orders`, {});

            return { success: true };
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '付款失败';
        logger.error('[Orders] Payment failed:', { error });
        return { success: false, error: message };
    }
}
