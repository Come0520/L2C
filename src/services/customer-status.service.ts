'use server';

/**
 * 客户状态流转服务 (Customer Status Service)
 * 负责根据业务事件自动更新客户的生命周期阶段和阶段状态
 */

import { db } from '@/shared/api/db';
import { customers } from '@/shared/api/schema/customers';
import { orders } from '@/shared/api/schema/orders';
import { eq, and, sql } from 'drizzle-orm';

export class CustomerStatusService {

    /**
     * 测量单创建时触发
     * 线索阶段 -> 机会阶段
     */
    static async onMeasurementCreated(customerId: string, tenantId: string) {
        await db.update(customers)
            .set({
                lifecycleStage: 'OPPORTUNITY',
                pipelineStatus: 'PENDING_MEASUREMENT',
                updatedAt: new Date(),
            })
            .where(and(
                eq(customers.id, customerId),
                eq(customers.tenantId, tenantId),
                // 仅当当前处于线索阶段时才升级，避免降级
                eq(customers.lifecycleStage, 'LEAD')
            ));
    }

    /**
     * 报价单发送时触发
     */
    static async onQuoteSent(customerId: string, tenantId: string) {
        await db.update(customers)
            .set({
                pipelineStatus: 'QUOTE_SENT',
                updatedAt: new Date(),
            })
            .where(and(
                eq(customers.id, customerId),
                eq(customers.tenantId, tenantId)
            ));
    }

    /**
     * 订单支付时触发
     * 机会阶段 -> 已成交阶段
     */
    static async onOrderPaid(customerId: string, tenantId: string) {
        await db.update(customers)
            .set({
                lifecycleStage: 'SIGNED',
                pipelineStatus: 'IN_PRODUCTION',
                updatedAt: new Date(),
            })
            .where(and(
                eq(customers.id, customerId),
                eq(customers.tenantId, tenantId)
            ));
    }

    /**
     * 安装任务开始时触发
     */
    static async onInstallationStarted(customerId: string, tenantId: string) {
        await db.update(customers)
            .set({
                pipelineStatus: 'PENDING_INSTALLATION',
                updatedAt: new Date(),
            })
            .where(and(
                eq(customers.id, customerId),
                eq(customers.tenantId, tenantId)
            ));
    }

    /**
     * 订单完成时触发
     */
    static async onOrderCompleted(customerId: string, tenantId: string) {
        // 检查是否还有其他未完成的订单
        const activeOrders = await db.query.orders.findMany({
            where: and(
                eq(orders.customerId, customerId),
                eq(orders.tenantId, tenantId),
                sql`${orders.status} NOT IN ('COMPLETED', 'CANCELLED')`
            ),
        });

        // 如果没有活跃订单，则更新为已交付/完成
        if (activeOrders.length === 0) {
            await db.update(customers)
                .set({
                    lifecycleStage: 'DELIVERED',
                    pipelineStatus: 'COMPLETED',
                    updatedAt: new Date(),
                })
                .where(and(
                    eq(customers.id, customerId),
                    eq(customers.tenantId, tenantId)
                ));
        }
    }

    /**
     * 订单取消时触发
     */
    static async onOrderCancelled(customerId: string, tenantId: string) {
        // 获取该客户最近的有效业务状态进行回退
        // 这是一个简化的逻辑，实际可能需要更复杂的历史回溯
        const activeOrders = await db.query.orders.findMany({
            where: and(
                eq(orders.customerId, customerId),
                eq(orders.tenantId, tenantId),
                sql`${orders.status} NOT IN ('CANCELLED')`
            ),
        });

        if (activeOrders.length === 0) {
            // 如果一个活跃订单都没有了，回退到机会阶段
            await db.update(customers)
                .set({
                    lifecycleStage: 'OPPORTUNITY',
                    pipelineStatus: 'PENDING_QUOTE',
                    updatedAt: new Date(),
                })
                .where(and(
                    eq(customers.id, customerId),
                    eq(customers.tenantId, tenantId)
                ));
        }
    }
}
