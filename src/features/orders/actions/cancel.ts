'use server';

/**
 * 订单撤单（取消）管理
 * 
 * 功能：
 * 1. 申请撤单 - 提交撤单审批请求
 * 2. 审批通过后执行撤单
 * 3. 撤单后财务处理（退款等）
 */

import { db } from '@/shared/api/db';
import { orders, orderChanges } from '@/shared/api/schema/orders';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { submitApproval } from '@/features/approval/actions/submission';

/**
 * 撤单原因枚举
 */
export const CANCEL_REASONS = [
    '客户主动取消',
    '客户无法联系',
    '产品缺货/无法生产',
    '价格争议',
    '重复下单',
    '其他原因',
] as const;

/**
 * 撤单申请Schema
 */
const cancelOrderSchema = z.object({
    orderId: z.string().uuid(),
    reason: z.enum(CANCEL_REASONS),
    remark: z.string().optional(),
});

/**
 * 申请撤单（提交审批）
 */
export async function requestCancelOrder(input: z.infer<typeof cancelOrderSchema>) {
    const session = await auth();
    const tenantId = session?.user?.tenantId;
    const userId = session?.user?.id;

    if (!tenantId || !userId) {
        return { success: false, error: '未授权' };
    }

    // 验证输入
    const parsed = cancelOrderSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: '参数错误: ' + parsed.error.message };
    }

    const { orderId, reason, remark } = parsed.data;

    try {
        // 1. 查询订单
        const order = await db.query.orders.findFirst({
            where: and(
                eq(orders.id, orderId),
                eq(orders.tenantId, tenantId)
            )
        });

        if (!order) {
            return { success: false, error: '订单不存在' };
        }

        // 2. 检查订单状态是否允许撤单
        const cancelableStatuses = ['PENDING_PURCHASE', 'IN_PRODUCTION', 'PENDING_DELIVERY', 'PENDING_INSTALL'];
        if (!cancelableStatuses.includes(order.status || '')) {
            return { success: false, error: `当前状态 ${order.status} 不允许撤单` };
        }

        // 3. 创建变更记录
        const [changeRecord] = await db.insert(orderChanges).values({
            tenantId,
            orderId,
            type: 'OTHER', // 使用OTHER类型表示撤单
            reason: `[撤单] ${reason}${remark ? ': ' + remark : ''}`,
            status: 'PENDING',
            diffAmount: `-${order.totalAmount}`,
            originalData: { status: order.status, items: [] },
            newData: { status: 'CANCELLED' },
            requestedBy: userId,
        }).returning();

        // 4. 提交审批
        const approvalResult = await submitApproval({
            flowCode: 'ORDER_CANCEL',
            entityType: 'ORDER_CANCEL',
            entityId: changeRecord.id,
            amount: order.totalAmount || '0',
            comment: `${reason}${remark ? ': ' + remark : ''}`,
        });

        if (!approvalResult.success) {
            // 如果没有配置审批流程，直接执行撤单
            const errorMsg = 'error' in approvalResult ? approvalResult.error : '';
            if (errorMsg?.includes('未定义或已禁用')) {
                return await executeCancelOrder(orderId, changeRecord.id, tenantId, userId);
            }
            return { success: false, error: errorMsg || '审批提交失败' };
        }

        revalidatePath('/orders');
        revalidatePath(`/orders/${orderId}`);

        return {
            success: true,
            approvalId: 'approvalId' in approvalResult ? approvalResult.approvalId : undefined,
            message: '撤单申请已提交，等待审批'
        };
    } catch (error) {
        console.error('撤单申请失败:', error);
        return { success: false, error: '撤单申请失败' };
    }
}

/**
 * 执行撤单（审批通过后调用）
 */
async function executeCancelOrder(
    orderId: string,
    changeRecordId: string,
    tenantId: string,
    approverId: string
) {
    try {
        await db.transaction(async (tx) => {
            // 1. 更新订单状态为CANCELLED
            await tx.update(orders)
                .set({
                    status: 'CANCELLED',
                    closedAt: new Date(),
                    updatedBy: approverId,
                    updatedAt: new Date()
                })
                .where(and(
                    eq(orders.id, orderId),
                    eq(orders.tenantId, tenantId)
                ));

            // 2. 更新变更记录状态为APPROVED
            await tx.update(orderChanges)
                .set({
                    status: 'APPROVED',
                    approvedBy: approverId,
                    approvedAt: new Date(),
                    updatedAt: new Date()
                })
                .where(eq(orderChanges.id, changeRecordId));
        });

        revalidatePath('/orders');
        revalidatePath(`/orders/${orderId}`);

        return {
            success: true,
            message: '订单已成功取消'
        };
    } catch (error) {
        console.error('执行撤单失败:', error);
        return { success: false, error: '执行撤单失败' };
    }
}

/**
 * 可撤单的订单状态列表
 */
export const CANCELABLE_STATUSES = ['PENDING_PURCHASE', 'IN_PRODUCTION', 'PENDING_DELIVERY', 'PENDING_INSTALL'];

// 导出常量
export { cancelOrderSchema };
