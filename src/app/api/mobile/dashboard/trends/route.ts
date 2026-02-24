/**
 * 销售端 - 销售额与订单量趋势
 *
 * @route GET /api/mobile/dashboard/trends
 * @auth JWT Token (销售角色)
 * @query {string} [range='30d'] - 时间范围：7d | 30d | 90d
 * @returns {ApiResponse<TrendItem[]>} 按日分组的销售趋势数据
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { and, eq, gte, sql } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { authenticateMobile, requireSales } from '@/shared/middleware/mobile-auth';
import { createLogger } from '@/shared/lib/logger';
import { dashboardCache } from '@/shared/lib/cache-utils';
import { withTiming } from '@/shared/middleware/api-timing';


const log = createLogger('mobile/dashboard/trends');
export const GET = withTiming(async (request: NextRequest) => {
    const auth = await authenticateMobile(request);
    if (!auth.success) return auth.response;

    const isSales = requireSales(auth.session);
    if (!isSales.allowed) return isSales.response;

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d'; // 7d, 30d, 90d

    const cacheKey = `dashboard:trends:${auth.session.tenantId}:${auth.session.userId}:${range}`;

    // 尝试从缓存获取
    const cachedData = dashboardCache.get(cacheKey);
    if (cachedData) {
        return apiSuccess(cachedData);
    }

    let days = 30;
    if (range === '7d') days = 7;
    if (range === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
        const data = await db
            .select({
                date: sql<string>`to_char(${orders.createdAt}, 'YYYY-MM-DD')`,
                amount: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)::float`,
                count: sql<number>`COUNT(${orders.id})::int`,
            })
            .from(orders)
            .where(
                and(
                    eq(orders.tenantId, auth.session.tenantId),
                    gte(orders.createdAt, startDate)
                )
            )
            .groupBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(sql`to_char(${orders.createdAt}, 'YYYY-MM-DD')`);

        // 补全日期（可选，前端处理也可以，这里简化直接返回有数据的日期）
        // 存入缓存
        dashboardCache.set(cacheKey, data);

        return apiSuccess(data);
    } catch (error) {
        log.error('[Mobile API][dashboard] 趋势查询错误', {}, error);
        return apiError('获取趋势数据失败', 500);
    }
});
