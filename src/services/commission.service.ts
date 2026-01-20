'use server';

/**
 * 渠道佣金服务 (Commission Service)
 * 负责佣金的自动计算、生成和退款处理
 */

import { db } from '@/shared/api/db';
import { channelCommissions, channels, commissionAdjustments } from '@/shared/api/schema/channels';
import { leads } from '@/shared/api/schema/leads';
import { orders } from '@/shared/api/schema/orders';
import { eq, and, sql } from 'drizzle-orm';

export class CommissionService {

    /**
     * 订单完成时生成佣金记录
     * 应在订单状态变为 PAID/COMPLETED 时调用
     */
    static async createCommission(orderId: string, tenantId: string, createdBy: string) {
        // 1. 获取订单信息
        const order = await db.query.orders.findFirst({
            where: and(
                eq(orders.id, orderId),
                eq(orders.tenantId, tenantId)
            ),
        });

        if (!order) {
            throw new Error(`订单不存在: ${orderId}`);
        }

        // 2. 检查订单关联的线索是否有渠道
        const lead = order.leadId ? await db.query.leads.findFirst({
            where: eq(leads.id, order.leadId),
        }) : null;

        if (!lead?.channelId) {
            // 无渠道关联，不生成佣金
            return null;
        }

        // 3. 获取渠道配置
        const channel = await db.query.channels.findFirst({
            where: eq(channels.id, lead.channelId),
        });

        if (!channel) {
            throw new Error(`渠道不存在: ${lead.channelId}`);
        }

        // 4. 计算佣金金额
        const orderAmount = Number(order.totalAmount || 0);
        const commissionRate = Number(channel.commissionRate || 0) / 100; // 转换为小数
        const commissionAmount = orderAmount * commissionRate;

        // 5. 创建佣金记录
        const [commission] = await db.insert(channelCommissions).values({
            tenantId,
            channelId: lead.channelId,
            leadId: lead.id,
            orderId,
            commissionType: channel.cooperationMode,
            orderAmount: orderAmount.toString(),
            commissionRate: commissionRate.toString(),
            amount: commissionAmount.toFixed(2),
            status: 'PENDING',
            formula: {
                orderAmount,
                commissionRate: channel.commissionRate,
                result: commissionAmount,
                mode: channel.cooperationMode,
            },
            createdBy,
        }).returning();

        // 6. 更新渠道累计成交额
        await db.update(channels)
            .set({
                totalDealAmount: sql`COALESCE(${channels.totalDealAmount}, 0) + ${orderAmount}`,
            })
            .where(eq(channels.id, lead.channelId));

        return commission;
    }

    /**
     * 处理全额退款
     * 将佣金标记为作废，或生成负向扣减记录
     */
    static async handleFullRefund(orderId: string, tenantId: string, createdBy: string) {
        // 1. 查找对应的佣金记录
        const commission = await db.query.channelCommissions.findFirst({
            where: and(
                eq(channelCommissions.orderId, orderId),
                eq(channelCommissions.tenantId, tenantId)
            ),
        });

        if (!commission) {
            // 无佣金记录，无需处理
            return null;
        }

        if (commission.status === 'PENDING') {
            // 待结算状态：直接标记为作废
            await db.update(channelCommissions)
                .set({ status: 'VOID' })
                .where(eq(channelCommissions.id, commission.id));
        } else if (commission.status === 'SETTLED' || commission.status === 'PAID') {
            // 已结算或已支付：生成负向扣减记录
            await db.insert(commissionAdjustments).values({
                tenantId,
                channelId: commission.channelId,
                originalCommissionId: commission.id,
                adjustmentType: 'FULL_REFUND',
                adjustmentAmount: (-Number(commission.amount)).toString(),
                reason: '订单全额退款',
                orderId,
                refundAmount: commission.orderAmount,
                createdBy,
            });
        }

        // 3. 更新渠道累计成交额
        await db.update(channels)
            .set({
                totalDealAmount: sql`GREATEST(0, COALESCE(${channels.totalDealAmount}, 0) - ${commission.orderAmount})`,
            })
            .where(eq(channels.id, commission.channelId));

        return commission;
    }

    /**
     * 处理部分退款
     * 按比例计算佣金扣减
     */
    static async handlePartialRefund(
        orderId: string,
        refundAmount: number,
        tenantId: string,
        createdBy: string
    ) {
        // 1. 查找对应的佣金记录
        const commission = await db.query.channelCommissions.findFirst({
            where: and(
                eq(channelCommissions.orderId, orderId),
                eq(channelCommissions.tenantId, tenantId)
            ),
        });

        if (!commission) {
            return null;
        }

        // 2. 计算退款对应的佣金
        const commissionRate = Number(commission.commissionRate || 0);
        const refundCommission = refundAmount * commissionRate;

        // 3. 生成佣金调整记录
        await db.insert(commissionAdjustments).values({
            tenantId,
            channelId: commission.channelId,
            originalCommissionId: commission.id,
            adjustmentType: 'PARTIAL_REFUND',
            adjustmentAmount: (-refundCommission).toFixed(2),
            reason: '订单部分退款',
            orderId,
            refundAmount: refundAmount.toString(),
            createdBy,
        });

        // 4. 更新渠道累计成交额
        await db.update(channels)
            .set({
                totalDealAmount: sql`GREATEST(0, COALESCE(${channels.totalDealAmount}, 0) - ${refundAmount})`,
            })
            .where(eq(channels.id, commission.channelId));

        return commission;
    }
}
