'use server';

/**
 * 订单叫停（暂停）管理
 * 
 * 功能：
 * 1. 叫停订单（状态变更为 HALTED）
 * 2. 恢复订单（状态恢复为之前的状态） - 从 HALTED 恢复到之前状态
 * 3. 叫停期间提醒机制
 */

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { OrderService } from '@/services/order.service';
import { logger } from '@/shared/lib/logger';

import {
    haltOrderSchema,
    resumeOrderSchema,
    HALT_REASONS
} from '../action-schemas';

/**
 * 叫停订单
 */
export async function haltOrderAction(input: z.infer<typeof haltOrderSchema>) {
    try {
        const data = haltOrderSchema.parse(input);
        const session = await auth();

        if (!session?.user?.tenantId || !session?.user?.id) {
            return { success: false, error: '未授权' };
        }

        // 权限检查
        await checkPermission(session, PERMISSIONS.ORDER.EDIT);

        // 从入参中获取 version 用于乐观并发控制
        const versionNum = 'version' in data ? Number(data.version) : 0;

        const result = await OrderService.haltOrder(
            data.orderId,
            session.user.tenantId,
            versionNum,
            session.user.id,
            JSON.stringify({ reason: data.reason, remark: data.remark })
        );

        revalidatePath('/orders');
        revalidatePath(`/orders/${data.orderId}`);

        return {
            success: true,
            data: {
                orderId: data.orderId,
                orderNo: result.orderNo,
                previousStatus: (result.snapshotData as { previousStatus?: string })?.previousStatus,
                message: '订单已叫停'
            }
        };
    } catch (error) {
        logger.error('叫停订单失败:', error);
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

        if (!session?.user?.tenantId || !session?.user?.id) {
            return { success: false, error: '未授权' };
        }

        // 权限检查
        await checkPermission(session, PERMISSIONS.ORDER.EDIT);

        const versionNum = 'version' in data ? Number(data.version) : 0;

        const result = await OrderService.resumeOrder(
            data.orderId,
            session.user.tenantId,
            versionNum,
            session.user.id
        );

        revalidatePath('/orders');
        revalidatePath(`/orders/${data.orderId}`);

        return {
            success: true,
            data: {
                orderId: data.orderId,
                orderNo: result.orderNo,
                newStatus: result.status,
                daysHalted: 0, // Simplified, logic moved to service
                message: '订单已恢复'
            }
        };
    } catch (error) {
        logger.error('恢复订单失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '恢复失败'
        };
    }
}

/**
 * 获取叫停订单列表（支持分页）
 */
export async function getHaltedOrders(params?: { limit?: number; offset?: number }) {
    const session = await auth();

    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权', data: [], total: 0 };
    }

    // 权限检查：需要订单查看权限
    await checkPermission(session, PERMISSIONS.ORDER.VIEW);

    const tenantId = session.user.tenantId;
    const limit = params?.limit ?? 50;
    const offset = params?.offset ?? 0;

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
        limit,
        offset,
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
            // Try parsing as JSON first (legacy or new structured reason)
            // OrderService.haltOrder stores reason as string, but here we might wrap it?
            // In my update above I wrapped it: JSON.stringify({ reason: data.reason, remark: data.remark })
            // So it IS JSON.
            const pauseInfo = JSON.parse(order.pauseReason || '{}');
            haltInfo.haltReason = pauseInfo.reason || 'OTHER';
        } catch {
            // If not JSON, use raw string
            haltInfo.haltReason = order.pauseReason || 'OTHER';
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
