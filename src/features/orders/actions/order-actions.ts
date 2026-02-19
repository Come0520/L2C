'use server';

import { db } from '@/shared/api/db';
import { orders, paymentSchedules } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { PERMISSIONS } from '@/shared/config/permissions';
import { AuditService } from '@/shared/lib/audit-service';
import Decimal from 'decimal.js';

/**
 * 创建订单付款记录
 *
 * 安全: 权限检查 + 租户隔离 + Decimal.js 精度计算 + 审计日志
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

            revalidatePath(`/orders/${orderId}`);
            revalidatePath(`/orders`);

            return { success: true };
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '付款失败';
        console.error('订单付款失败:', error);
        return { success: false, error: message };
    }
}
