/**
 * 客户来源分布 — getCustomerSourceDistribution
 */

import { db } from '@/shared/api/db';
import { leads, channels } from '@/shared/api/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { ANALYTICS_PERMISSIONS } from '../constants';

const customerSourceSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

/**
 * 获取客户来源分布数据
 * 按渠道分组统计线索来源
 */
const getCustomerSourceDistributionAction = createSafeAction(customerSourceSchema, async (params, { session }) => {
    await checkPermission(session, ANALYTICS_PERMISSIONS.VIEW);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            const sourceStats = await db.select({
                channelId: leads.channelId,
                channelName: channels.name,
                count: sql<number>`COUNT(*)`,
            }).from(leads).leftJoin(channels, eq(leads.channelId, channels.id))
                .where(and(eq(leads.tenantId, tenantId), gte(leads.createdAt, startDate), lte(leads.createdAt, endDate)))
                .groupBy(leads.channelId, channels.name)
                .orderBy(desc(sql`COUNT(*)`))
                .limit(10);

            const noChannelStats = await db.select({ count: sql<number>`COUNT(*)` }).from(leads)
                .where(and(eq(leads.tenantId, tenantId), gte(leads.createdAt, startDate), lte(leads.createdAt, endDate), sql`${leads.channelId} IS NULL`));

            const result = sourceStats.map(item => ({
                name: item.channelName || '未知渠道',
                value: Number(item.count || 0),
            }));

            const noChannelCount = Number(noChannelStats[0]?.count || 0);
            if (noChannelCount > 0) {
                result.push({ name: '直客/未分配', value: noChannelCount });
            }

            return result;
        },
        [`customer-source-${tenantId}-${startDate.getTime()}-${endDate.getTime()}`],
        { tags: [`analytics-${tenantId}`, 'analytics-source'], revalidate: 3600 }
    )();
});

export async function getCustomerSourceDistribution(params: z.infer<typeof customerSourceSchema>) {
    return getCustomerSourceDistributionAction(params);
}
