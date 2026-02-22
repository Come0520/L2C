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

const leaderboardSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z.enum(['amount', 'count']).default('amount'),
    limit: z.number().default(10),
});

/**
 * 获取业绩排名（仅店长/管理层可见）
 */
const getLeaderboardAction = createSafeAction(leaderboardSchema, async (params, { session }) => {
    await checkPermission(session, ANALYTICS_PERMISSIONS.VIEW_ALL);

    const tenantId = session.user.tenantId;
    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();

    return unstable_cache(
        async () => {
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

            return leaderboard.map((item, index) => ({
                rank: index + 1,
                salesId: item.salesId,
                salesName: item.salesName || '未知',
                totalAmount: item.totalAmount,
                orderCount: item.orderCount,
            }));
        },
        [`leaderboard-${tenantId}-${params.sortBy}-${params.limit}-${startDate.getTime()}-${endDate.getTime()}`],
        { tags: [`analytics-${tenantId}`, 'analytics-leaderboard'], revalidate: 3600 }
    )();
});

export async function getLeaderboard(params: z.infer<typeof leaderboardSchema>) {
    return getLeaderboardAction(params);
}
