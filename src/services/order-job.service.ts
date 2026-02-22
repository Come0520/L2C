import { db } from "@/shared/api/db";
import { orders } from "@/shared/api/schema/orders";
import { eq, and, lte } from "drizzle-orm";
import { OrderService } from "./order.service";
import { subHours } from "date-fns";
import { logger } from "@/shared/lib/logger";

export class OrderJobService {
    /**
     * 扫描并处理需要自动恢复或强制决策的叫停订单
     * 规则:
     * 1. 叫停超过 48h 且未手动恢复 -> 自动恢复
     * 2. 累计叫停天数 > 7 天 -> 强制恢复并记录
     */
    static async processPausedOrders() {
        const now = new Date();
        const autoResumeThreshold = subHours(now, 48);

        // 1. 查找满足 48h 自动恢复条件的订单
        const autoResumeOrders = await db.query.orders.findMany({
            where: and(
                eq(orders.status, 'HALTED'),
                lte(orders.pausedAt, autoResumeThreshold)
            )
        });

        logger.info(`[OrderJob] 发现 ${autoResumeOrders.length} 个订单满足 48h 自动恢复条件`);

        for (const order of autoResumeOrders) {
            try {
                await OrderService.resumeOrder(order.id, order.tenantId, order.version || 0, 'system');
                logger.info(`[OrderJob] 订单 ${order.orderNo} 已自动恢复`);
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                console.error(`[OrderJob] 自动恢复订单 ${order.orderNo} 失败: ${message}`);
            }
        }

        // 2. 查找累计天数超过 7 天的订单 (针对还在 PAUSED 状态的)
        // 注意：pauseCumulativeDays 是在恢复时累加的，但对于当前正在叫停的订单，
        // 累计天数 = 已有累计天数 + (当前时间 - 叫停时间)
        // 简化逻辑：如果在 PAUSED 状态下，(已有累计天数 + 当前叫停天数) > 7
        const pausedOrders = await db.query.orders.findMany({
            where: eq(orders.status, 'HALTED')
        });

        for (const order of pausedOrders) {
            const currentPauseDays = order.pausedAt
                ? Math.ceil(Math.abs(now.getTime() - order.pausedAt.getTime()) / (1000 * 60 * 60 * 24))
                : 0;
            const totalPauseDays = (order.pauseCumulativeDays || 0) + currentPauseDays;

            if (totalPauseDays >= 7) {
                try {
                    logger.info(`[OrderJob] 订单 ${order.orderNo} 累计叫停 ${totalPauseDays} 天，执行强制恢复`);
                    await OrderService.resumeOrder(order.id, order.tenantId, order.version || 0, 'system');
                    // 可以额外发送预警通知
                } catch (error: unknown) {
                    const message = error instanceof Error ? error.message : String(error);
                    console.error(`[OrderJob] 强制恢复订单 ${order.orderNo} 失败: ${message}`);
                }
            }
        }
    }
}
