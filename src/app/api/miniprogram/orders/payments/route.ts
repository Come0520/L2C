/**
 * 付款记录 API
 *
 * POST /api/miniprogram/orders/payments — 提交付款记录
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { orders, paymentSchedules } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { getMiniprogramUser } from '../../auth-utils';
import { SubmitPaymentSchema } from '../../miniprogram-schemas';
import { AuditService } from '@/shared/services/audit-service';
import { IdempotencyGuard, RateLimiter } from '@/shared/services/miniprogram/security.service';

export async function POST(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('未授权', 401);
        }

        const body = await request.json();

        // Zod 输入验证
        const parsed = SubmitPaymentSchema.safeParse(body);
        if (!parsed.success) {
            return apiError(parsed.error.issues[0].message, 400);
        }

        const { scheduleId, actualAmount, proofImg, paymentMethod } = parsed.data;

        // 1. 查询付款计划（含租户隔离）
        const schedule = await db.query.paymentSchedules.findFirst({
            where: and(
                eq(paymentSchedules.id, scheduleId),
                eq(paymentSchedules.tenantId, user.tenantId)
            ),
        });

        if (!schedule) {
            return apiError('付款计划不存在', 404);
        }

        if (schedule.status === 'PAID') {
            return apiError('该笔款项已支付', 400);
        }

        // 频控：单用户针对付款 3秒/次 防快速连击
        if (!RateLimiter.allow(`submit_payment_${user.id}`, 3, 3000)) {
            return apiError('操作太频繁，请稍后再试', 429);
        }

        // 幂等防重放：单个收款单不允许多并发
        const idemKey = `payment:submit:${user.tenantId}:${scheduleId}`;
        const idemRecord = IdempotencyGuard.check(idemKey);

        if (idemRecord) {
            if (idemRecord.status === 'COMPLETED') {
                return apiSuccess(idemRecord.response);
            }
            if (idemRecord.status === 'PROCESSING') {
                return apiError('付款记录正在处理中，请勿重复提交', 409);
            }
        }

        IdempotencyGuard.start(idemKey);

        try {
            await db.transaction(async (tx) => {
                // 2. 更新付款计划
                await tx.update(paymentSchedules)
                    .set({
                        status: 'PAID',
                        actualAmount: String(actualAmount),
                        paymentMethod: paymentMethod,
                        proofImg: proofImg,
                        actualDate: new Date().toISOString(),
                        updatedAt: new Date()
                    })
                    .where(eq(paymentSchedules.id, scheduleId));

                // 3. 更新订单金额
                const order = await tx.query.orders.findFirst({
                    where: eq(orders.id, schedule.orderId)
                });

                if (!order) {
                    throw new Error('关联订单不存在');
                }

                const newPaid = (parseFloat(order.paidAmount as string) + actualAmount).toFixed(2);
                const newBalance = (parseFloat(order.totalAmount as string) - parseFloat(newPaid)).toFixed(2);

                // 状态流转：支付后从待付款变为生产中
                let statusToSet = order.status;
                if ((order.status === 'PENDING_PO' || order.status === 'DRAFT') && parseFloat(newPaid) > 0) {
                    statusToSet = 'IN_PRODUCTION';
                }

                await tx.update(orders)
                    .set({
                        paidAmount: newPaid,
                        balanceAmount: newBalance,
                        status: statusToSet,
                        updatedAt: new Date()
                    })
                    .where(eq(orders.id, schedule.orderId));

                // 4. 审计日志
                await AuditService.log(tx, {
                    tableName: 'payment_schedules',
                    recordId: scheduleId,
                    action: 'SUBMIT_PAYMENT',
                    userId: user.id,
                    tenantId: user.tenantId,
                    details: { orderId: schedule.orderId, amount: actualAmount, method: paymentMethod }
                });

                logger.info('[Payments] 付款记录提交成功', {
                    route: 'orders/payments',
                    scheduleId,
                    orderId: schedule.orderId,
                    amount: actualAmount,
                    userId: user.id,
                    tenantId: user.tenantId,
                });
            });

            IdempotencyGuard.complete(idemKey, null);
            return apiSuccess({ scheduleId });
        } catch (txError: unknown) {
            IdempotencyGuard.fail(idemKey);
            throw txError;
        }

    } catch (error) {
        logger.error('[Payments] 提交付款记录失败', { route: 'orders/payments', error });
        return apiError('由于系统或网络原因，收款款项记录保存失败', 500);
    }
}
