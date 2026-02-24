'use server';

import { logger } from "@/shared/lib/logger";

import { db } from '@/shared/api/db';
import { leads, marketChannels, quotes, orders } from '@/shared/api/schema';
import { eq, and, gte, lte, sql, countDistinct } from 'drizzle-orm';
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

    logger.info('[leads] 获取渠道 ROI 统计开始:', { tenantId, range });

    const start = Date.now();
    return unstable_cache(
        async (r) => {
            logger.info('[leads] 执行渠道 ROI 统计缓存查询:', { tenantId, params: r });
            const whereConditions = [eq(leads.tenantId, tenantId)];
            if (r.from) whereConditions.push(gte(leads.createdAt, r.from));
            if (r.to) whereConditions.push(lte(leads.createdAt, r.to));

            const results = await db
                .select({
                    channelId: leads.sourceChannelId,
                    channelName: marketChannels.name,
                    leadCount: countDistinct(leads.id),
                    quoteCount: countDistinct(quotes.id),
                    orderCount: countDistinct(orders.id),
                    totalAmount: sql<number>`COALESCE(SUM(DISTINCT ${orders.totalAmount}), 0)`,
                    avgCycleDays: sql<number>`COALESCE(AVG(CASE WHEN ${leads.status} = 'WON' AND ${leads.wonAt} IS NOT NULL THEN (EXTRACT(EPOCH FROM (${leads.wonAt} - ${leads.createdAt})) / 86400) END), 0)`,
                })
                .from(leads)
                .leftJoin(marketChannels, eq(leads.sourceChannelId, marketChannels.id))
                .leftJoin(quotes, eq(leads.id, quotes.leadId))
                .leftJoin(orders, eq(quotes.id, orders.quoteId))
                .where(and(...whereConditions))
                .groupBy(leads.sourceChannelId, marketChannels.name);

            const durationMs = Date.now() - start;
            logger.info(`getLeadChannelROIStats 执行耗时: ${durationMs}ms`, { resultCount: results.length, tenantId });

            return results.map(row => {
                // ... (保持 Map 逻辑不变)
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
            tags: [`leads-analytics-${tenantId}`, `leads-${tenantId}`, 'leads', 'quotes', 'orders'],
            revalidate: 300, // 5 minutes
        }
    )(range);
}
