'use server';

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema/orders';
import { leads } from '@/shared/api/schema/leads';
import { channels } from '@/shared/api/schema/channels';
import { receiptBills, receiptBillItems } from '@/shared/api/schema/finance';
import { eq, and, sum } from 'drizzle-orm';
import { getTenantBusinessConfig } from '@/features/settings/actions/tenant-config';

/**
 * 安装前收款检查结果类型
 */
export interface PaymentCheckResult {
    passed: boolean;
    reason?: string;
    requiresApproval?: boolean;
    details?: {
        orderAmount: number;
        paidAmount: number;
        remainingAmount: number;
        channelType?: 'MONTHLY' | 'PREPAY';
        creditLimit?: number;
        channelDebt?: number;
    };
}

/**
 * 检查订单是否满足安装条件（收款检查）
 * 
 * 业务逻辑:
 * 1. 月结渠道: 检查渠道已欠款 + 本单金额 ≤ 授信额度
 * 2. 现结渠道: 检查本单是否全款结清，或根据配置决定是否允许欠款安装
 * 
 * @param tenantId - 租户 ID（用于租户隔离验证）
 */
export async function checkPaymentBeforeInstall(orderId: string, tenantId?: string): Promise<PaymentCheckResult> {
    // 获取租户配置
    const config = await getTenantBusinessConfig();
    const arConfig = config.arPayment;

    // 获取订单信息 - 包含租户隔离
    const whereConditions = tenantId
        ? and(eq(orders.id, orderId), eq(orders.tenantId, tenantId))
        : eq(orders.id, orderId);

    const order = await db.query.orders.findFirst({
        where: whereConditions,
        columns: {
            id: true,
            tenantId: true,
            leadId: true,
            totalAmount: true,
        },
    });

    if (!order) {
        return { passed: false, reason: '订单不存在' };
    }

    // 计算已收款金额 (通过 receiptBillItems 关联查询)
    // 注意：receiptBills 已通过 orderId 关联，间接限定租户
    const receipts = await db.select({
        total: sum(receiptBillItems.amount),
    })
        .from(receiptBillItems)
        .innerJoin(receiptBills, eq(receiptBillItems.receiptBillId, receiptBills.id))
        .where(and(
            eq(receiptBillItems.orderId, orderId),
            eq(receiptBills.status, 'VERIFIED')
        ));

    const totalAmount = Number(order.totalAmount) || 0;
    const paidAmount = Number(receipts[0]?.total) || 0;
    const remainingAmount = totalAmount - paidAmount;

    // 如果已全款结清，直接通过
    if (remainingAmount <= 0) {
        return {
            passed: true,
            details: { orderAmount: totalAmount, paidAmount, remainingAmount },
        };
    }

    // 获取订单来源渠道信息
    let channelSettlement: 'MONTHLY' | 'PREPAY' = 'PREPAY';
    let creditLimit = 0;
    let channelDebt = 0;

    if (order.leadId) {
        const lead = await db.query.leads.findFirst({
            where: eq(leads.id, order.leadId),
            columns: { channelId: true },
        });

        if (lead?.channelId) {
            const channel = await db.query.channels.findFirst({
                where: eq(channels.id, lead.channelId),
                columns: { settlementType: true, creditLimit: true },
            });

            if (channel) {
                channelSettlement = channel.settlementType as 'MONTHLY' | 'PREPAY';
                creditLimit = Number(channel.creditLimit) || 0;

                // 计算渠道当前欠款（所有未结清订单的欠款总和）
                if (channelSettlement === 'MONTHLY') {
                    // TODO: 计算渠道所有订单的欠款总和
                    // 这里简化为只检查当前订单
                    channelDebt = 0;
                }
            }
        }
    }

    const details = {
        orderAmount: totalAmount,
        paidAmount,
        remainingAmount,
        channelType: channelSettlement,
        creditLimit,
        channelDebt,
    };

    // 月结渠道检查
    if (channelSettlement === 'MONTHLY') {
        const totalDebt = channelDebt + remainingAmount;
        if (totalDebt <= creditLimit) {
            return { passed: true, details };
        } else {
            return {
                passed: false,
                reason: `超出授信额度，当前欠款 ¥${totalDebt.toFixed(2)}，授信额度 ¥${creditLimit.toFixed(2)}`,
                requiresApproval: true, // 超额可走审批
                details,
            };
        }
    }

    // 现结渠道检查
    if (!arConfig.allowDebtInstallCash) {
        // 不允许欠款安装
        return {
            passed: false,
            reason: `未结清款项 ¥${remainingAmount.toFixed(2)}，现结客户需全款后安装`,
            details,
        };
    }

    // 允许欠款安装，但需审批
    if (arConfig.requireDebtInstallApproval) {
        return {
            passed: false,
            reason: `未结清款项 ¥${remainingAmount.toFixed(2)}，需审批后安装`,
            requiresApproval: true,
            details,
        };
    }

    // 允许欠款安装且不需审批
    return { passed: true, details };
}
