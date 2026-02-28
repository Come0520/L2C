"use server";

/**
 * 业绩排名 — getLeaderboard
 */

import { db } from '@/shared/api/db';
import { orders, users } from '@/shared/api/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { ANALYTICS_PERMISSIONS } from '../constants';
import { logger } from '@/shared/lib/logger';

const leaderboardSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z.enum(['amount', 'count']).default('amount'),
    limit: z.number().default(10),
});

/**
 * 获取销售排名 (Get Sales Leaderboard)
 * 
 * 获取指定时间范围内销售人员的业绩排名，支持按总销售额或订单数进行排序。
 * 结果通过 `unstable_cache` 进行缓存。
 * 
 * 权限要求: ANALYTICS_PERMISSIONS.VIEW_ALL
 *
 * @param {z.infer<typeof leaderboardSchema>} params - 查询参数，包含排序字段、限制数量和起始/结束日期
 * @returns {Promise<Array>} 返回包含排名信息的销售业绩数组
 * @throws {Error} 如果在执行数据库查询或权限校验时发生错误
 */
const getLeaderboardAction = createSafeAction(leaderboardSchema, async (params, { session }) => {
    await checkPermission(session, ANALYTICS_PERMISSIONS.VIEW_ALL);

    const tenantId = session.user.tenantId;
    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();

    return unstable_cache(
        async () => {
            logger.info('获取销售排名开始 (Starting getLeaderboard)', { tenantId, params });
            try {
                const leaderboard = await db
                    .select({
                        salesId: orders.salesId,
                        salesName: users.name,
                        totalAmount: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
                        orderCount: sql<number>`COUNT(*)`,
                    })
                    .from(orders)
                    .leftJoin(users, eq(orders.salesId, users.id))
                    .where(and(eq(orders.tenantId, tenantId), gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
                    .groupBy(orders.salesId, users.name)
                    .orderBy(params.sortBy === 'amount' ? desc(sql`SUM(CAST(${orders.totalAmount} AS DECIMAL))`) : desc(sql`COUNT(*)`))
                    .limit(params.limit);

                logger.info('获取销售排名成功 (Successfully fetched leaderboard)', { tenantId, resultCount: leaderboard.length });

                return leaderboard.map((item, index) => ({
                    rank: index + 1,
                    salesId: item.salesId,
                    salesName: item.salesName || '未知',
                    totalAmount: item.totalAmount,
                    orderCount: item.orderCount,
                }));
            } catch (error) {
                logger.error('获取销售排名失败 (Failed to fetch leaderboard)', { tenantId, error });
                throw new Error('获取数据失败');
            }
        },
        [`leaderboard-${tenantId}-${params.sortBy}-${params.limit}-${startDate.toDateString()}-${endDate.toDateString()}`],
        { tags: [`analytics-${tenantId}`, 'analytics-leaderboard'], revalidate: 3600 }
    )();
});

export async function getLeaderboard(params: z.infer<typeof leaderboardSchema>) {
    return getLeaderboardAction(params);
}
