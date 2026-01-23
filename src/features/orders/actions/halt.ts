'use server';

/**
 * 订单叫停（暂停）管理
 * 
 * 功能：
 * 1. 叫停订单 - 将订单状态改为 PAUSED
 * 2. 恢复订单 - 从 PAUSED 恢复到之前状态
 * 3. 叫停期间提醒机制
 */

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// 叫停原因枚举
const HALT_REASONS = [
    'CUSTOMER_REQUEST',    // 客户要求
    'PAYMENT_ISSUE',       // 付款问题
    'PRODUCTION_ISSUE',    // 生产问题
    'LOGISTICS_ISSUE',     // 物流问题
    'MATERIAL_SHORTAGE',   // 材料短缺
    'OTHER',               // 其他
] as const;

// 叫停请求 Schema
const haltOrderSchema = z.object({
    orderId: z.string().uuid(),
    reason: z.enum(HALT_REASONS),
    remark: z.string().optional(),
});

// 恢复请求 Schema
const resumeOrderSchema = z.object({
    orderId: z.string().uuid(),
    remark: z.string().optional(),
});

/**
 * 叫停订单
 * 
 * 使用 orders schema 中的暂停字段：pausedAt、pauseReason、pauseCumulativeDays
 */
export async function haltOrderAction(input: z.infer<typeof haltOrderSchema>) {
    try {
        const data = haltOrderSchema.parse(input);
        const session = await auth();

        if (!session?.user?.tenantId) {
            return { success: false, error: '未授权' };
        }

        const tenantId = session.user.tenantId;

        // 查询订单
        const order = await db.query.orders.findFirst({
            where: and(
                eq(orders.id, data.orderId),
                eq(orders.tenantId, tenantId)
            ),
            columns: {
                id: true,
                status: true,
                orderNo: true,
                remark: true,
            }
        });

        if (!order) {
            return { success: false, error: '订单不存在' };
        }

        // 检查状态是否允许叫停
        const HALTABLE_STATUSES: string[] = [
            'SIGNED', 'PAID', 'PENDING_PO', 'PENDING_PRODUCTION',
            'IN_PRODUCTION', 'PENDING_DELIVERY', 'PENDING_INSTALL'
        ];

        if (!order.status || !HALTABLE_STATUSES.includes(order.status)) {
            return {
                success: false,
                error: `当前状态 (${order.status}) 不允许叫停`
            };
        }

        if (order.status === 'PAUSED' || order.status === 'HALTED') {
            return { success: false, error: '订单已处于暂停/叫停状态' };
        }

        // 构建暂停原因（包含原始状态以便恢复）
        const pauseReasonJson = JSON.stringify({
            reason: data.reason,
            previousStatus: order.status,
            remark: data.remark,
        });

        // 更新订单状态
        await db.update(orders)
            .set({
                status: 'HALTED',
                pausedAt: new Date(),
                pauseReason: pauseReasonJson,
            })
            .where(eq(orders.id, data.orderId));

        revalidatePath('/orders');
        revalidatePath(`/orders/${data.orderId}`);

        return {
            success: true,
            data: {
                orderId: data.orderId,
                orderNo: order.orderNo,
                previousStatus: order.status,
                message: '订单已叫停'
            }
        };
    } catch (error) {
        console.error('叫停订单失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '叫停失败'
        };
    }
}

/**
 * 恢复订单
 */
export async function resumeOrderAction(input: z.infer<typeof resumeOrderSchema>) {
    try {
        const data = resumeOrderSchema.parse(input);
        const session = await auth();

        if (!session?.user?.tenantId) {
            return { success: false, error: '未授权' };
        }

        const tenantId = session.user.tenantId;

        // 查询订单
        const order = await db.query.orders.findFirst({
            where: and(
                eq(orders.id, data.orderId),
                eq(orders.tenantId, tenantId)
            ),
            columns: {
                id: true,
                status: true,
                orderNo: true,
                pausedAt: true,
                pauseReason: true,
                pauseCumulativeDays: true,
            }
        });

        if (!order) {
            return { success: false, error: '订单不存在' };
        }

        if (order.status !== 'PAUSED' && order.status !== 'HALTED') {
            return { success: false, error: '订单不在暂停/叫停状态' };
        }

        // 解析暂停原因获取原始状态
        let previousStatus = 'SIGNED'; // 默认恢复到已签约
        try {
            const pauseInfo = JSON.parse(order.pauseReason || '{}');
            if (pauseInfo.previousStatus) {
                previousStatus = pauseInfo.previousStatus;
            }
        } catch {
            // 解析失败使用默认值
        }

        // 计算暂停天数
        let daysToAdd = 0;
        if (order.pausedAt) {
            daysToAdd = Math.floor(
                (Date.now() - order.pausedAt.getTime()) / (1000 * 60 * 60 * 24)
            );
        }

        // 更新订单状态 - 添加租户隔离
        await db.update(orders)
            .set({
                status: previousStatus as typeof orders.$inferSelect.status,
                pausedAt: null,
                pauseReason: null,
                pauseCumulativeDays: (order.pauseCumulativeDays || 0) + daysToAdd,
            })
            .where(and(eq(orders.id, data.orderId), eq(orders.tenantId, tenantId)));

        revalidatePath('/orders');
        revalidatePath(`/orders/${data.orderId}`);

        return {
            success: true,
            data: {
                orderId: data.orderId,
                orderNo: order.orderNo,
                newStatus: previousStatus,
                daysHalted: daysToAdd,
                message: '订单已恢复'
            }
        };
    } catch (error) {
        console.error('恢复订单失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '恢复失败'
        };
    }
}

/**
 * 获取叫停订单列表
 */
export async function getHaltedOrders() {
    const session = await auth();

    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权', data: [] };
    }

    const tenantId = session.user.tenantId;

    const haltedOrders = await db.query.orders.findMany({
        where: and(
            eq(orders.tenantId, tenantId),
            inArray(orders.status, ['PAUSED', 'HALTED'])
        ),
        columns: {
            id: true,
            orderNo: true,
            totalAmount: true,
            pausedAt: true,
            pauseReason: true,
            updatedAt: true,
        },
        with: {
            customer: {
                columns: {
                    name: true,
                    phone: true,
                }
            }
        },
        orderBy: (orders, { desc }) => [desc(orders.updatedAt)],
    });

    // 解析暂停信息
    const enrichedOrders = haltedOrders.map(order => {
        const haltInfo = {
            haltReason: 'OTHER',
            daysHalted: 0,
            alertLevel: 'NONE', // NONE, WARNING
        };

        if (order.pausedAt) {
            haltInfo.daysHalted = Math.floor(
                (Date.now() - order.pausedAt.getTime()) / (1000 * 60 * 60 * 24)
            );

            // 自动恢复提醒 / 预警
            if (haltInfo.daysHalted > 7) {
                haltInfo.alertLevel = 'WARNING';
            }
        }

        try {
            const pauseInfo = JSON.parse(order.pauseReason || '{}');
            haltInfo.haltReason = pauseInfo.reason || 'OTHER';
        } catch {
            // 忽略解析错误
        }

        return {
            ...order,
            ...haltInfo,
        };
    });

    return { success: true, data: enrichedOrders };
}

// 导出类型和常量
export { HALT_REASONS, haltOrderSchema, resumeOrderSchema };
