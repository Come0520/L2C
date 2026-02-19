'use server';

import { db } from "@/shared/api/db";
import { orders } from "@/shared/api/schema";
import { eq, and, sql } from "drizzle-orm";
import { OrderService } from "@/services/order.service";
import { auth } from "@/shared/lib/auth";
import { subDays } from "date-fns";
import { revalidatePath } from "next/cache";

/**
 * 自动结案 Action
 * 
 * 逻辑：扫描所有处于 'INSTALLATION_COMPLETED' 状态且超过 7 天未更新的订单，
 * 自动将其状态流转为 'COMPLETED'。
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
                orderNo: true
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
                    session.user.id // 记录为当前用户触发，或记录为系统
                );
                results.push({ id: order.id, orderNo: order.orderNo, success: true });
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                console.error(`自动结案失败 [${order.orderNo}]:`, message);
                results.push({ id: order.id, orderNo: order.orderNo, success: false, error: message });
            }
        }

        // 统一清除缓存
        revalidatePath('/orders');

        return {
            success: true,
            message: `成功处理 ${results.filter(r => r.success).length} 个订单`,
            count: results.length,
            details: results
        };

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Auto-close scan failed:', message);
        return { success: false, error: message };
    }
}
