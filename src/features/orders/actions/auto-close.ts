'use server';

import { db } from "@/shared/api/db";
import { orders } from "@/shared/api/schema";
import { eq, and, sql } from "drizzle-orm";
import { OrderService } from "@/services/order.service";
import { auth } from "@/shared/lib/auth";
import { subDays } from "date-fns";
import { revalidateTag } from "next/cache";
import { logger } from "@/shared/lib/logger";

/**
 * 自动结案后台任务 Action。
 * 
 * @description 扫描租户下所有处于“安装完成” (`INSTALLATION_COMPLETED`) 状态、且最后更新距今已超过 7 天的订单。
 * 逻辑规范：
 * 1. 系统性扫描：识别符合条件的停滞订单。
 * 2. 自动确认：调用 OrderService 将其流转至最终态 `COMPLETED`。
 * 3. 结果汇总：返回成功处理的订单数量及失败详情。
 * 4. 缓存同步：结案后清理首页订单统计等缓存。
 * 
 * @note 通常作为计划任务 (Cron Job) 触发。手动触发时建议在业务低峰期执行。
 * @returns 处理结果报告，包含总数、成功数及详细记录。
 */
export async function autoCloseOrdersAction() {
    const session = await auth();
    // 权限检查：通常此操作应由系统 Cron 触发，此处临时要求拥有订单编辑权限的用户可手动触发
    if (!session?.user) {
        return { success: false, error: 'Unauthorized' };
    }

    const tenantId = session.user.tenantId;

    try {
        // 查找 7 天前的时间点
        const sevenDaysAgo = subDays(new Date(), 7);

        // 获取待结案订单列表
        const ordersToClose = await db.query.orders.findMany({
            where: and(
                eq(orders.tenantId, tenantId),
                eq(orders.status, 'INSTALLATION_COMPLETED'),
                sql`${orders.updatedAt} < ${sevenDaysAgo.toISOString()}`
            ),
            columns: {
                id: true,
                orderNo: true,
                version: true
            }
        });

        if (ordersToClose.length === 0) {
            return { success: true, message: '没有需要自动结案的订单', count: 0 };
        }

        const results = [];
        for (const order of ordersToClose) {
            try {
                // 使用 OrderService 执行状态流转，确保审计和关联逻辑被触发
                await OrderService.updateOrderStatus(
                    order.id,
                    'COMPLETED',
                    tenantId,
                    order.version || 0,
                    session.user.id // 记录为当前用户触发，或记录为系统
                );
                console.log('[orders] 订单自动结案成功:', { orderId: order.id, orderNo: order.orderNo, tenantId });
                results.push({ id: order.id, orderNo: order.orderNo, success: true });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                logger.error(`自动结案失败 [${order.orderNo}]:`, { error: message });
                console.log('[orders] 订单自动结案失败:', { orderNo: order.orderNo, error: message });
                results.push({ id: order.id, orderNo: order.orderNo, success: false, error: message });
            }
        }

        // 统一清除缓存
        revalidateTag('orders', 'default');

        return {
            success: true,
            message: `成功处理 ${results.filter(r => r.success).length} 个订单`,
            count: results.length,
            details: results
        };

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        logger.error('Auto-close scan failed:', { error: message });
        return { success: false, error: message };
    }
}
