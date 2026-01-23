import { db } from '@/shared/api/db';
import { channelCommissions, channels } from '@/shared/api/schema/channels';
import { eq, and } from 'drizzle-orm';

// ==================== 佣金逻辑 (Internal) ====================

/**
 * 内部创建佣金记录（无权限检查，仅业务逻辑）
 */
export async function createCommissionRecordInternal(params: {
    tenantId: string;
    channelId: string;
    leadId?: string;
    orderId: string;
    orderAmount: number;
    commissionRate: number;
    commissionType: 'BASE_PRICE' | 'COMMISSION';
    createdBy: string;
}) {
    const { tenantId, channelId, leadId, orderId, orderAmount, commissionRate, commissionType, createdBy } = params;

    // 验证渠道属于当前租户
    const channel = await db.query.channels.findFirst({
        where: and(eq(channels.id, channelId), eq(channels.tenantId, tenantId))
    });
    if (!channel) throw new Error('Channel not found or unauthorized access in internal logic');

    // 计算佣金金额
    const commissionAmount = orderAmount * (commissionRate / 100);

    const [record] = await db.insert(channelCommissions).values({
        tenantId,
        channelId,
        leadId,
        orderId,
        orderAmount: orderAmount.toString(),
        commissionRate: (commissionRate / 100).toFixed(4),  // 转换为小数
        amount: commissionAmount.toFixed(2),
        commissionType,
        status: 'PENDING',
        formula: {
            orderAmount,
            rate: commissionRate,
            calculated: commissionAmount,
            formula: `${orderAmount} × ${commissionRate}% = ${commissionAmount}`,
        },
        createdBy,
    }).returning();

    return record;
}

/**
 * 处理订单完成时的佣金触发
 * 逻辑：Order -> Quote -> Lead -> Channel -> Commission Config -> Create Record
 * 注意：此函数由系统自动触发，不检查用户权限，只验证 tenantId 指向
 */
export async function processOrderCompletion(orderId: string, tenantId: string) {
    try {
        // 1. 获取订单及关联
        const order = await db.query.orders.findFirst({
            where: (orders, { eq, and }) => and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)),
            with: {
                quote: {
                    with: {
                        lead: {
                            with: {
                                channel: true
                            }
                        }
                    }
                }
            }
        });

        if (!order) {
            console.error('[processOrderCompletion] Order not found:', orderId);
            return;
        }

        // 2. 检查是否有有效渠道关联
        // 路径: Order -> Quote -> Lead -> Channel
        const orderWithRelations = order as typeof order & {
            quote: {
                lead: {
                    channel: typeof channels.$inferSelect | null
                } | null
            } | null
        };

        const channel = orderWithRelations.quote?.lead?.channel;

        if (!channel) {
            console.error('[processOrderCompletion] No channel associated for order:', orderId);
            return;
        }

        // 3. 检查渠道配置
        if (channel.cooperationMode === 'BASE_PRICE') {
            return;
        }

        if (!channel.commissionRate || parseFloat(channel.commissionRate) <= 0) {
            console.warn('[processOrderCompletion] No commission rate configured for channel:', channel.name);
            return;
        }

        // 4. 计算佣金
        const orderAmount = parseFloat(order.totalAmount || '0');
        if (orderAmount <= 0) return;

        const rate = parseFloat(channel.commissionRate);

        // 5. 创建记录 (调用内部逻辑)
        await createCommissionRecordInternal({
            tenantId,
            channelId: channel.id,
            leadId: orderWithRelations.quote?.leadId as string,
            orderId: order.id,
            orderAmount,
            commissionRate: rate,
            commissionType: 'COMMISSION',
            createdBy: 'SYSTEM', // 系统自动触发
        });

    } catch (error) {
        console.error('[processOrderCompletion] Error processing commission:', error);
        // 不抛出错误，以免影响订单流程
    }
}
