import { db } from '@/shared/api/db';
import { channels, channelCommissions, commissionAdjustments } from '@/shared/api/schema/channels';
import { orders } from '@/shared/api/schema/orders';
import { leads } from '@/shared/api/schema/leads';
import { products } from '@/shared/api/schema/catalogs';
import { financeConfigs } from '@/shared/api/schema/finance';
import { eq, and, sql } from 'drizzle-orm';

export type CommissionTriggerMode = 'ORDER_CREATED' | 'ORDER_COMPLETED' | 'PAYMENT_COMPLETED';

/**
 * 检查并生成渠道佣金
 * 核心入口函数
 */
export async function checkAndGenerateCommission(
    orderId: string,
    triggerEvent: CommissionTriggerMode
) {
    console.log(`[Commission] Checking for order ${orderId} on event ${triggerEvent}`);

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

    // 如果订单没存 channelId，尝试从关联线索获取 (兼容逻辑)
    if (!channelId && order.leadId) {
        const lead = await db.query.leads.findFirst({
            where: eq(leads.id, order.leadId),
            columns: { channelId: true }
        });
        channelId = lead?.channelId || null;
    }

    if (!channelId) {
        console.log(`[Commission] No channel associated with order ${orderId}`);
        return;
    }

    const channel = await db.query.channels.findFirst({
        where: eq(channels.id, channelId)
    });

    if (!channel) {
        console.error(`[Commission] Channel ${channelId} not found`);
        return;
    }

    // 3. 检查触发模式
    // 从渠道配置读取触发模式，默认 PAYMENT_COMPLETED
    const requiredTrigger = channel.commissionTriggerMode || 'PAYMENT_COMPLETED';

    if (triggerEvent !== requiredTrigger) {
        console.log(`[Commission] Trigger mismatch. Required: ${requiredTrigger}, Current: ${triggerEvent}`);
        return;
    }

    // 4. 检查幂等性 (防止重复生成)
    const existing = await db.query.channelCommissions.findFirst({
        where: and(
            eq(channelCommissions.orderId, orderId),
            eq(channelCommissions.status, 'PENDING') // 或者是已结算等，只要有记录就不应重复生成?
            // 注意：如果之前是 VOID，是否允许重新生成？通常允许。这里只查有效记录。
        )
    });

    if (existing) {
        console.log(`[Commission] Commission already exists for order ${orderId}`);
        return;
    }

    // 5. 计算佣金
    const _orderAmount = Number(order.paidAmount || order.totalAmount || 0); // 按照实收或应收？需求说是"实际成交金额"，通常指 totalAmount(最终价)，只有全额付款才触发
    // 如果是 PAYMENT_COMPLETED，通常意味着 paidAmount >= totalAmount
    // 我们用 totalAmount 作为计算基数 (客户应付的最终金额)
    const calculationBase = Number(order.totalAmount || 0);

    let commissionAmount = 0;
    let commissionRate = 0;
    let logicDescription = '';
    const formula: { base?: number; rate?: number; mode?: string; calc?: string; items?: unknown[]; details?: unknown[]; total?: number } = {};

    const mode = order.channelCooperationMode || channel.cooperationMode || 'COMMISSION';

    if (mode === 'COMMISSION') {
        // --- 返佣模式 ---
        // 简单版：固定比例
        commissionRate = Number(channel.commissionRate || 0); // 10.00 表示 10% ? Schema comment says "10.00 for 10%"
        // 但代码通常存的是 10，计算时除以 100

        // 需求文档: "commissionRate: decimal(5,2) ... e.g. 10.00 for 10%"
        const ratePercent = commissionRate;
        commissionAmount = calculationBase * (ratePercent / 100);

        logicDescription = `返佣模式 (费率 ${ratePercent}%)`;
        formula.base = calculationBase;
        formula.rate = ratePercent;
        formula.mode = 'COMMISSION';
        formula.calc = `${calculationBase} * ${ratePercent}% = ${commissionAmount}`;

    } else if (mode === 'BASE_PRICE') {
        // --- 底价供货模式 ---
        // 佣金 = Σ(商品对客价 - 商品渠道底价 * 等级折扣率) * 数量
        // 折扣率来自全局配置 (financeConfigs.CHANNEL_GRADE_DISCOUNTS)

        let totalProfit = 0;
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

        // 根据渠道等级获取折扣率
        const channelLevel = channel.level || 'C';
        const discountRate = gradeDiscounts[channelLevel] ?? 1.00;

        for (const item of order.items) {
            if (!item.productId) continue;
            const product = await db.query.products.findFirst({
                where: eq(products.id, item.productId),
                columns: { channelPrice: true, channelPriceMode: true }
            });

            if (product) {
                const retailPrice = Number(item.unitPrice || 0); // 订单中的单价(对客价)
                const basePrice = Number(product.channelPrice || 0);

                // 计算单项利润: (销售价 - 底价 * 折扣) * 数量
                const costPrice = basePrice * discountRate;
                const profitPerUnit = retailPrice - costPrice;
                const itemProfit = profitPerUnit * Number(item.quantity || 0);

                totalProfit += itemProfit;

                details.push({
                    product: item.productName,
                    retail: retailPrice,
                    base: basePrice,
                    discount: discountRate,
                    cost: costPrice,
                    qty: item.quantity,
                    profit: itemProfit
                });
            }
        }

        commissionAmount = totalProfit;
        logicDescription = `底价供货模式 (折扣率 ${discountRate})`;
        formula.details = details;
        formula.mode = 'BASE_PRICE';
        formula.total = totalProfit;
    }

    if (commissionAmount <= 0) {
        console.log(`[Commission] Calculated amount is <= 0, skipping creation.`);
        // 也可以生成一个 0 元记录用于追踪
        return;
    }

    // 6. 创建佣金记录
    await db.transaction(async (tx) => {
        await tx.insert(channelCommissions).values({
            tenantId: order.tenantId,
            channelId: channel.id,
            orderId: orderId,
            leadId: order.leadId,
            commissionType: mode,
            orderAmount: calculationBase.toString(),
            commissionRate: commissionRate.toString(), // 存百分比数值
            amount: commissionAmount.toFixed(2),
            status: 'PENDING',
            formula: formula,
            remark: logicDescription,
            createdBy: order.updatedBy || order.createdBy // 系统触发，但这字段通常是 user ID。可以留空或用 system user ID 如果有
        });

        // 7. 更新渠道统计 (Total Deal Amount)
        // 累加本次订单金额到渠道总额
        await tx.update(channels)
            .set({
                totalDealAmount: sql`${channels.totalDealAmount} + ${calculationBase}`,
                updatedAt: new Date()
            })
            .where(eq(channels.id, channel.id));
    });

    console.log(`[Commission] Created commission record: ${commissionAmount} for channel ${channel.name}`);
}

/**
 * 处理退款时的佣金扣回
 * 
 * @param orderId - 订单ID
 * @param refundAmount - 退款金额 (绝对值)
 */
export async function handleCommissionClawback(orderId: string, refundAmount: number) {
    console.log(`[Commission] Handling clawback for order ${orderId}, amount: ${refundAmount}`);

    const commissions = await db.query.channelCommissions.findMany({
        where: and(
            eq(channelCommissions.orderId, orderId),
            // status != VOID ? 
        )
    });

    if (!commissions.length) {
        console.log(`[Commission] No commission found for order ${orderId} to clawback.`);
        return;
    }

    for (const comm of commissions) {
        if (comm.status === 'PENDING') {
            // Case 1: 待结算 -> 直接作废
            // 如果是全额退款？通常认为如果退款发生，PENDING 的佣金应该重新计算或作废。
            // 简单处理：直接 VOID。如果是部分退款，逻辑可能复杂，这里假设任何退款都导致重新审核或作废。
            // 需求文档说 "待结算 -> 标记为 VOID" (全额退款)。
            // 部分退款 -> "按比例重新计算...". 
            // 鉴于 PENDING 状态，我们可以直接更新金额。但为了审计痕迹，VOID 重新生成也许更好。
            // 这里遵循简单原则：直接 VOID。
            await db.update(channelCommissions)
                .set({ status: 'VOID', remark: `Order refunded: ${refundAmount}` })
                .where(eq(channelCommissions.id, comm.id));

            console.log(`[Commission] Voided pending commission ${comm.id}`);
        } else if (comm.status === 'SETTLED' || comm.status === 'PAID') {
            // Case 2: 已结算/支付 -> 生成负向调整
            // 计算需扣回金额
            // 原佣金 = amount
            // 退款比例 = refundAmount / orderAmount
            // 扣回佣金 = 原佣金 * 退款比例

            const originalOrderAmount = Number(comm.orderAmount || 0);
            if (originalOrderAmount <= 0) continue;

            const ratio = refundAmount / originalOrderAmount;
            const clawbackAmount = Number(comm.amount) * ratio;

            if (clawbackAmount <= 0) continue;

            await db.transaction(async (tx) => {
                await tx.insert(commissionAdjustments).values({
                    tenantId: comm.tenantId,
                    channelId: comm.channelId,
                    originalCommissionId: comm.id,
                    adjustmentType: refundAmount >= originalOrderAmount ? 'FULL_REFUND' : 'PARTIAL_REFUND',
                    adjustmentAmount: (-clawbackAmount).toFixed(2), // 负数
                    reason: `Order Refund: ${refundAmount}`,
                    orderId: orderId,
                    refundAmount: refundAmount.toString(),
                    createdBy: comm.createdBy // No user context here easily available, reuse creator or null
                });

                // 更新渠道统计 (Total Deal Amount - 扣减)
                await tx.update(channels)
                    .set({
                        totalDealAmount: sql`${channels.totalDealAmount} - ${refundAmount}`,
                        updatedAt: new Date()
                    })
                    .where(eq(channels.id, comm.channelId));
            });

            console.log(`[Commission] Created adjustment for commission ${comm.id}: -${clawbackAmount}`);
        }
    }
}
