'use server';

import { db } from '@/shared/api/db';
import { leads, marketChannels, quotes, orders } from '@/shared/api/schema';
import { eq, and, gte, lte, sql, count } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/shared/lib/auth';
import { analyticsDateRangeSchema } from '../schemas';
import { unstable_cache } from 'next/cache';

export interface LeadChannelROIStats {
    channelId: string;
    channelName: string;
    leadCount: number;
    quoteCount: number;
    orderCount: number;
    conversionRate: number; // Lead to Order %
    totalAmount: number;
    avgOrderValue: number;
    avgCycleDays: number; // [NEW] 平均成交周期（天）
}

/**
 * 获取线索渠道 ROI 统计
 * 关联线索、报价与订单数据，分析各渠道的转化效益
 */
export async function getLeadChannelROIStats(input?: z.infer<typeof analyticsDateRangeSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('Unauthorized: 未登录或缺少租户信息');
    }
    const tenantId = session.user.tenantId;
    const range = input ? analyticsDateRangeSchema.parse(input) : {};

    return unstable_cache(
        async (r) => {
            const whereConditions = [eq(leads.tenantId, tenantId)];
            if (r.from) whereConditions.push(gte(leads.createdAt, r.from));
            if (r.to) whereConditions.push(lte(leads.createdAt, r.to));

            const results = await db
                .select({
                    channelId: leads.sourceChannelId,
                    channelName: marketChannels.name,
                    leadCount: count(leads.id),
                    // 统计关联的报价数
                    quoteCount: sql<number>`(
                        SELECT count(DISTINCT q.id) 
                        FROM ${quotes} q 
                        WHERE q.lead_id IN (
                            SELECT l2.id FROM ${leads} l2 
                            WHERE l2.source_channel_id = ${leads.sourceChannelId}
                            AND l2.tenant_id = ${tenantId}
                            ${r.from ? sql`AND l2.created_at >= ${r.from}` : sql``}
                            ${r.to ? sql`AND l2.created_at <= ${r.to}` : sql``}
                        )
                    )`,
                    // 统计关联的订单数和总金额
                    orderCount: sql<number>`(
                        SELECT count(DISTINCT o.id) 
                        FROM ${orders} o 
                        JOIN ${quotes} q2 ON o.quote_id = q2.id
                        WHERE q2.lead_id IN (
                            SELECT l3.id FROM ${leads} l3 
                            WHERE l3.source_channel_id = ${leads.sourceChannelId}
                            AND l3.tenant_id = ${tenantId}
                            ${r.from ? sql`AND l3.created_at >= ${r.from}` : sql``}
                            ${r.to ? sql`AND l3.created_at <= ${r.to}` : sql``}
                        )
                    )`,
                    totalAmount: sql<number>`COALESCE((
                        SELECT sum(o2.total_amount) 
                        FROM ${orders} o2 
                        JOIN ${quotes} q3 ON o2.quote_id = q3.id
                        WHERE q3.lead_id IN (
                            SELECT l4.id FROM ${leads} l4 
                            WHERE l4.source_channel_id = ${leads.sourceChannelId}
                            AND l4.tenant_id = ${tenantId}
                            ${r.from ? sql`AND l4.created_at >= ${r.from}` : sql``}
                            ${r.to ? sql`AND l4.created_at <= ${r.to}` : sql``}
                        )
                    ), 0)`,
                    // 计算平均成交周期 (仅针对已成交的线索)
                    avgCycleDays: sql<number>`COALESCE((
                        SELECT AVG(EXTRACT(EPOCH FROM (l5.won_at - l5.created_at)) / 86400)
                        FROM ${leads} l5
                        WHERE l5.source_channel_id = ${leads.sourceChannelId}
                        AND l5.tenant_id = ${tenantId}
                        AND l5.status = 'WON'
                        AND l5.won_at IS NOT NULL
                        ${r.from ? sql`AND l5.created_at >= ${r.from}` : sql``}
                        ${r.to ? sql`AND l5.created_at <= ${r.to}` : sql``}
                    ), 0)`,
                })
                .from(leads)
                .leftJoin(marketChannels, eq(leads.sourceChannelId, marketChannels.id))
                .where(and(...whereConditions))
                .groupBy(leads.sourceChannelId, marketChannels.name);

            return results.map(row => {
                const leadCount = Number(row.leadCount || 0);
                const orderCount = Number(row.orderCount || 0);
                const totalAmount = Number(row.totalAmount || 0);

                return {
                    channelId: row.channelId || 'unknown',
                    channelName: row.channelName || '未知渠道',
                    leadCount,
                    quoteCount: Number(row.quoteCount || 0),
                    orderCount,
                    conversionRate: leadCount > 0 ? parseFloat(((orderCount / leadCount) * 100).toFixed(2)) : 0,
                    totalAmount,
                    avgOrderValue: orderCount > 0 ? parseFloat((totalAmount / orderCount).toFixed(2)) : 0,
                    avgCycleDays: parseFloat(Number(row.avgCycleDays || 0).toFixed(1)),
                };
            });
        },
        [`leads-roi-${tenantId}-${JSON.stringify(range)}`],
        {
            tags: [`leads-${tenantId}`, 'leads', 'quotes', 'orders'],
            revalidate: 300, // 5 minutes
        }
    )(range);
}
