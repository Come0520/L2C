import { db } from '@/shared/api/db';
import { channels, channelCommissions, commissionAdjustments } from '@/shared/api/schema/channels';
import { orders } from '@/shared/api/schema/orders';
import { leads } from '@/shared/api/schema/leads';
import { products } from '@/shared/api/schema/catalogs';
import { financeConfigs } from '@/shared/api/schema/finance';
import { eq, and, sql, ne, inArray } from 'drizzle-orm';
import { Decimal } from 'decimal.js';

export type CommissionTriggerMode = 'ORDER_CREATED' | 'ORDER_COMPLETED' | 'PAYMENT_COMPLETED';

interface TieredRate {
    minAmount: number;
    maxAmount?: number;
    rate: number;
}

export interface BasePriceDetail {
    product: string | null;
    retail: number;
    base: number;
    discount: number;
    cost: number;
    qty: number;
    profit: number;
}

export interface CommissionFormula {
    base?: number;
    rate?: number;
    mode?: string;
    calc?: string;
    details?: BasePriceDetail[];
    totalProfit?: number;
}

export interface ChannelCommissionParams {
    cooperationMode?: string | null;
    commissionType?: string | null;
    tieredRates?: unknown;
    commissionRate?: string | number | null;
    level?: string | null;
}

export interface CommissionResult {
    amount: Decimal;
    rate: Decimal; // effective decimal rate
    type: 'COMMISSION' | 'BASE_PRICE';
    formula: CommissionFormula;
    remark: string;
}

/**
 * 核心佣金计算逻辑 (纯计算，不涉及数据库写操作)
 * 可用于自动触发或手动创建
 */
export async function calculateOrderCommission(
    order: {
        totalAmount: string | number | null;
        items: { productId: string | null; unitPrice: string | number | null; quantity: string | number | null; productName?: string | null }[];
        tenantId: string;
        channelCooperationMode?: string | null;
    },
    channel: ChannelCommissionParams
): Promise<CommissionResult | null> {
    const calculationBase = new Decimal(order.totalAmount || 0);

    let commissionAmount = new Decimal(0);
    let commissionRate = new Decimal(0);
    let effectiveRateDecimal = new Decimal(0);
    let logicDescription = '';

    const formula: CommissionFormula = {};

    const mode = order.channelCooperationMode || channel.cooperationMode || 'COMMISSION';

    if (mode === 'COMMISSION') {
        // --- 返佣模式 ---
        if (channel.commissionType === 'TIERED' && channel.tieredRates) {
            // 阶梯费率计算
            let rates: TieredRate[] = [];
            if (typeof channel.tieredRates === 'string') {
                try { rates = JSON.parse(channel.tieredRates); } catch (e) { console.error('Failed to parse tieredRates', e); }
            } else {
                rates = channel.tieredRates as unknown as TieredRate[];
            }

            if (Array.isArray(rates)) {
                // 查找匹配的阶梯
                const matched = rates.find(r => {
                    const min = new Decimal(r.minAmount || 0);
                    const max = r.maxAmount !== undefined && r.maxAmount !== null ? new Decimal(r.maxAmount) : new Decimal(Infinity);
                    return calculationBase.greaterThanOrEqualTo(min) && calculationBase.lessThan(max);
                });

                if (matched) {
                    commissionRate = new Decimal(matched.rate || 0);
                    logicDescription = `阶梯返佣 (金额 ${calculationBase.toNumber()} 命中区间 [${matched.minAmount}, ${matched.maxAmount ?? '∞'}), 费率 ${commissionRate}%)`;
                } else {
                    commissionRate = new Decimal(channel.commissionRate || 0);
                    logicDescription = `阶梯返佣 (金额 ${calculationBase.toNumber()} 未命中任何区间，使用基础费率 ${commissionRate}%)`;
                }
            } else {
                commissionRate = new Decimal(channel.commissionRate || 0);
                logicDescription = `阶梯返佣 (配置无效，使用基础费率 ${commissionRate}%)`;
            }

        } else {
            // 固定比例
            commissionRate = new Decimal(channel.commissionRate || 0);
            logicDescription = `固定返佣 (费率 ${commissionRate}%)`;
        }

        // R4-11 Fix: Smart Commission Rate Detection
        const rawRateVal = commissionRate.toNumber();
        const rateIsDecimal = rawRateVal <= 1 && rawRateVal > 0;
        effectiveRateDecimal = rateIsDecimal ? commissionRate : commissionRate.div(100);

        commissionAmount = calculationBase.mul(effectiveRateDecimal);

        formula.base = calculationBase.toNumber();
        formula.rate = rawRateVal;
        formula.mode = 'COMMISSION';
        formula.calc = `${calculationBase} * ${rateIsDecimal ? (rawRateVal * 100) + '%' : rawRateVal + '%'} = ${commissionAmount.toFixed(2)}`;

    } else if (mode === 'BASE_PRICE') {
        // --- 底价供货模式 ---
        let totalProfit = new Decimal(0);
        const details = [];

        // 获取全局等级折扣配置
        const gradeConfig = await db.query.financeConfigs.findFirst({
            where: and(
                eq(financeConfigs.tenantId, order.tenantId),
                eq(financeConfigs.configKey, 'CHANNEL_GRADE_DISCOUNTS')
            )
        });

        let gradeDiscounts: Record<string, number> = { S: 0.90, A: 0.95, B: 1.00, C: 1.00 };
        if (gradeConfig) {
            try {
                gradeDiscounts = { ...gradeDiscounts, ...JSON.parse(gradeConfig.configValue) };
            } catch {
                console.warn('[Commission] Failed to parse grade discounts config');
            }
        }

        const channelLevel = channel.level || 'C';
        const discountRateVal = gradeDiscounts[channelLevel] ?? 1.00;
        const discountRate = new Decimal(discountRateVal);

        const productIds = order.items
            .map(item => item.productId)
            .filter((id): id is string => !!id);

        if (productIds.length > 0) {
            // Define local type for product query result since schema types are not available to TSC here
            type ProductData = { id: string; channelPrice: string | null; channelPriceMode: string | null; name: string | null };

            const productsList = await db.query.products.findMany({
                where: inArray(products.id, productIds),
                columns: { id: true, channelPrice: true, channelPriceMode: true, name: true }
            }) as unknown as ProductData[];

            const productMap = new Map(productsList.map(p => [p.id, p]));

            for (const item of order.items) {
                if (!item.productId) continue;
                const product = productMap.get(item.productId);

                if (product) {
                    const retailPrice = new Decimal(item.unitPrice || 0);
                    const basePrice = new Decimal(product.channelPrice || 0);
                    const quantity = new Decimal(item.quantity || 0);

                    const costPrice = basePrice.mul(discountRate);
                    const profitPerUnit = retailPrice.minus(costPrice);
                    const itemProfit = profitPerUnit.mul(quantity);

                    totalProfit = totalProfit.plus(itemProfit);

                    details.push({
                        product: item.productName || product.name,
                        retail: retailPrice.toNumber(),
                        base: basePrice.toNumber(),
                        discount: discountRateVal,
                        cost: costPrice.toNumber(),
                        qty: quantity.toNumber(),
                        profit: itemProfit.toNumber()
                    });
                }
            }
        }

        commissionAmount = totalProfit;
        logicDescription = `底价供货模式 (折扣率 ${discountRateVal})`;
        formula.details = details;
        formula.mode = 'BASE_PRICE';
        formula.totalProfit = totalProfit.toNumber();
    }

    if (commissionAmount.lessThanOrEqualTo(0)) {
        return null;
    }

    return {
        amount: commissionAmount,
        rate: effectiveRateDecimal,
        type: mode as 'COMMISSION' | 'BASE_PRICE',
        formula,
        remark: logicDescription
    };
}

/**
 * 检查并生成渠道佣金
 * 核心入口函数
 */
export async function checkAndGenerateCommission(
    orderId: string,
    triggerEvent: CommissionTriggerMode
) {
    // 1. 获取订单及关联信息
    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
            // 优先使用订单上的渠道信息，如果为空则尝试回溯线索（兼容旧数据）
            items: true,
        }
    });

    if (!order) {
        console.error(`[Commission] Order ${orderId} not found`);
        return;
    }

    // 2. 确定渠道信息
    let channelId = order.channelId;

    if (!channelId && order.leadId) {
        const lead = await db.query.leads.findFirst({
            where: eq(leads.id, order.leadId),
            columns: { channelId: true }
        });
        channelId = lead?.channelId || null;
    }

    if (!channelId) {
        return;
    }

    const channel = await db.query.channels.findFirst({
        where: and(eq(channels.id, channelId), eq(channels.tenantId, order.tenantId))
    });

    if (!channel) {
        console.error(`[Commission] Channel ${channelId} not found`);
        return;
    }

    // 3. 检查触发模式
    const requiredTrigger = channel.commissionTriggerMode || 'PAYMENT_COMPLETED';

    if (triggerEvent !== requiredTrigger) {
        return;
    }

    // 5. 计算佣金 (提取到独立函数)
    const result = await calculateOrderCommission(order, channel);

    if (!result) {
        return;
    }

    // 6. 写入数据库 (事务保障)
    await db.transaction(async (tx) => {
        const existingInTx = await tx.query.channelCommissions.findFirst({
            where: and(
                eq(channelCommissions.orderId, orderId),
                eq(channelCommissions.tenantId, order.tenantId),
                ne(channelCommissions.status, 'VOID')
            )
        });

        if (existingInTx) {
            console.warn(`[Commission] Commission already exists for order ${orderId} (Race condition intercepted)`);
            return;
        }

        const calculationBase = new Decimal(order.totalAmount || 0);

        await tx.insert(channelCommissions).values({
            tenantId: order.tenantId,
            channelId: channelId,
            leadId: order.leadId || undefined,
            orderId: orderId,
            commissionType: result.type,
            orderAmount: calculationBase.toFixed(2),
            commissionRate: (result.type === 'COMMISSION' ? result.rate : new Decimal(0)).toFixed(4),
            amount: result.amount.toFixed(2),
            status: 'PENDING',
            formula: result.formula,
            remark: result.remark,
            createdBy: order.createdBy,
        }).returning();

        // 更新渠道统计
        await tx.update(channels)
            .set({
                totalDealAmount: sql`${channels.totalDealAmount} + ${calculationBase.toFixed(2)}`,
                updatedAt: new Date(),
            })
            .where(and(
                eq(channels.id, channelId),
                eq(channels.tenantId, order.tenantId)
            ));
    });
}

/**
 * 处理退款时的佣金扣回
 * 
 * @param orderId - 订单ID
 * @param refundAmount - 退款金额 (绝对值)
 */
export async function handleCommissionClawback(orderId: string, refundAmount: number) {
    // 0. 获取订单以确定 tenantId
    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        columns: { tenantId: true }
    });

    if (!order) return;

    // 1. 获取该订单关联的所有有效佣金记录
    const commissions = await db.query.channelCommissions.findMany({
        where: and(
            eq(channelCommissions.orderId, orderId),
            eq(channelCommissions.tenantId, order.tenantId),
            ne(channelCommissions.status, 'VOID')
        )
    });

    if (!commissions.length) {
        return;
    }

    // P0 Fix: Use Decimal for refund calculations
    const refundAmountDecimal = new Decimal(refundAmount);

    // 2. 遍历处理每条佣金
    for (const comm of commissions) {
        if (comm.status === 'PENDING') {
            // Case 1: 待结算 -> 直接作废
            await db.update(channelCommissions)
                .set({
                    status: 'VOID',
                    remark: `Order refunded: ${refundAmountDecimal.toFixed(2)} (Original Amount: ${comm.amount})`
                })
                .where(and(
                    eq(channelCommissions.id, comm.id),
                    eq(channelCommissions.tenantId, comm.tenantId) // R4-06 Fix: Add tenantId
                ));

        } else if (['SETTLED', 'PAID'].includes(comm.status || '')) {
            // Case 2: 已结算/支付 -> 生成负向调整记录

            const originalOrderAmount = new Decimal(comm.orderAmount || 0);
            if (originalOrderAmount.lessThanOrEqualTo(0)) continue;

            const ratio = refundAmountDecimal.div(originalOrderAmount);
            const originalCommission = new Decimal(comm.amount || 0);
            const clawbackAmount = originalCommission.mul(ratio);

            if (clawbackAmount.lessThanOrEqualTo(0)) continue;

            await db.transaction(async (tx) => {
                // 插入调整记录
                await tx.insert(commissionAdjustments).values({
                    tenantId: comm.tenantId,
                    channelId: comm.channelId,
                    originalCommissionId: comm.id,
                    adjustmentType: refundAmountDecimal.greaterThanOrEqualTo(originalOrderAmount) ? 'FULL_REFUND' : 'PARTIAL_REFUND',
                    adjustmentAmount: clawbackAmount.negated().toFixed(2), // 负数
                    reason: `Order Refund: ${refundAmountDecimal.toFixed(2)}`,
                    orderId: orderId,
                    refundAmount: refundAmountDecimal.toString(),
                    createdBy: comm.createdBy // 复用原创建者或系统 ID
                });

                // 更新渠道统计 (Total Deal Amount - 扣减)
                await tx.update(channels)
                    .set({
                        totalDealAmount: sql`${channels.totalDealAmount} - ${refundAmountDecimal.toFixed(2)}`,
                        updatedAt: new Date()
                    })
                    .where(and(
                        eq(channels.id, comm.channelId),
                        eq(channels.tenantId, comm.tenantId) // R4-07 Fix: Add tenantId
                    ));
            });
        }
    }
}
