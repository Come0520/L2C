"use server";

import { db } from '@/shared/api/db';
import { leads, channels } from '@/shared/api/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { ANALYTICS_PERMISSIONS } from '../constants';
import { logger } from '@/shared/lib/logger';

const customerSourceSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

/**
 * 获取客户来源分布数据 (Get Customer Source Distribution)
 * 
 * 按销售渠道 (Channel) 统计线索来源的构成比例。
 * 帮助业务分析哪些渠道贡献了最多的线索，以及直售与代理的分布情况。
 * 结果通过 `unstable_cache` 进行缓存。
 * 
 * 权限要求: ANALYTICS_PERMISSIONS.VIEW
 * 
 * @param params - 查询参数
 * @param params.startDate - 开始日期 (YYYY-MM-DD)，默认为当月 1 号
 * @param params.endDate - 结束日期 (YYYY-MM-DD)，默认为今天
 * @returns 包含渠道名称(name)和线索数量(value)的数组，按数量降序排列
 */
const getCustomerSourceDistributionAction = createSafeAction(customerSourceSchema, async (params, { session }) => {
    await checkPermission(session, ANALYTICS_PERMISSIONS.VIEW);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            logger.info('客户来源分布查询开始', { tenantId, startDate, endDate });
            try {
                // 并行获取主要渠道统计和无渠道(直客)统计
                const [sourceStats, noChannelStats] = await Promise.all([
                    db.select({
                        channelId: leads.channelId,
                        channelName: channels.name,
                        count: sql<number>`COUNT(*)`,
                    }).from(leads).leftJoin(channels, eq(leads.channelId, channels.id))
                        .where(and(eq(leads.tenantId, tenantId), gte(leads.createdAt, startDate), lte(leads.createdAt, endDate)))
                        .groupBy(leads.channelId, channels.name)
                        .orderBy(desc(sql`COUNT(*)`))
                        .limit(10),

                    db.select({ count: sql<number>`COUNT(*)` }).from(leads)
                        .where(and(eq(leads.tenantId, tenantId), gte(leads.createdAt, startDate), lte(leads.createdAt, endDate), sql`${leads.channelId} IS NULL`))
                ]);

                const result = sourceStats.map(item => ({
                    name: item.channelName || '未知渠道',
                    value: Number(item.count || 0),
                }));

                const noChannelCount = Number(noChannelStats[0]?.count || 0);
                if (noChannelCount > 0) {
                    result.push({ name: '直客/未分配', value: noChannelCount });
                }

                logger.info('客户来源分布查询成功', { tenantId, resultCount: result.length });
                return result;
            } catch (error) {
                logger.error('客户来源分布查询失败', { tenantId, error });
                throw error;
            }
        },
        [`customer-source-${tenantId}-${startDate.toDateString()}-${endDate.toDateString()}`],
        { tags: [`analytics-${tenantId}`, 'analytics-source'], revalidate: 3600 }
    )();
});

/**
 * 导出：获取客户来源分布统计
 * @param params - 查询参数
 */
export async function getCustomerSourceDistribution(params: z.infer<typeof customerSourceSchema>) {
    return getCustomerSourceDistributionAction(params);
}
