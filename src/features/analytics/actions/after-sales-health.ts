"use server";

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { liabilityNotices, afterSalesTickets } from '@/shared/api/schema/after-sales';
import { eq, and, gte, lte, sql, notInArray } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { ANALYTICS_PERMISSIONS } from '../constants';
import { logger } from '@/shared/lib/logger';

const afterSalesHealthSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

/**
 * 获取售后健康度指标 (Get After-Sales Health Metrics)
 * 
 * 综合评估售后环节的健康状况，核心指标包括：
 * 1. 退款率 (Refund Rate): 退款总额 / 销售总额
 * 2. 客诉率 (Complaint Rate): 售后工单数 / 订单总数
 * 3. 责任分布 (Liability Distribution): 按责任方统计定责单数量与金额
 * 结果通过 `unstable_cache` 进行缓存。
 * 
 * 权限要求: ANALYTICS_PERMISSIONS.VIEW
 * 
 * @param params - 查询参数
 * @param params.startDate - 开始日期 (YYYY-MM-DD)，默认为当月 1 号
 * @param params.endDate - 结束日期 (YYYY-MM-DD)，默认为今天
 * @returns 包含各健康度维度、定责分布及健康等级(GOOD/NORMAL/WARNING)的对象
 */
const getAfterSalesHealthAction = createSafeAction(afterSalesHealthSchema, async (params, { session }) => {
    await checkPermission(session, ANALYTICS_PERMISSIONS.VIEW);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            logger.info('售后健康度指标查询开始', { tenantId, startDate, endDate });
            try {
                // 使用 Promise.all 并行获取销售、售后工单和定责统计
                // 对售后和定责表添加 catch 处理，以防表不存在或迁移未就绪
                const [salesStats, asStats, liabilityRaw] = await Promise.all([
                    db.select({
                        totalRevenue: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
                        totalOrders: sql<number>`COUNT(*)`,
                    }).from(orders).where(and(
                        eq(orders.tenantId, tenantId), gte(orders.createdAt, startDate), lte(orders.createdAt, endDate),
                        notInArray(orders.status, ['CANCELLED', 'DRAFT'])
                    )),

                    db.select({
                        count: sql<number>`COUNT(*)`,
                        refundTotal: sql<string>`COALESCE(SUM(CAST(${afterSalesTickets.actualDeduction} AS DECIMAL)), 0)`,
                    }).from(afterSalesTickets).where(and(
                        eq(afterSalesTickets.tenantId, tenantId), gte(afterSalesTickets.createdAt, startDate), lte(afterSalesTickets.createdAt, endDate)
                    )).catch(e => {
                        logger.warn('售后健康度指标 - 获取工单统计失败 (可能表未同步)', { error: e });
                        return [{ count: 0, refundTotal: '0' }];
                    }),

                    db.select({
                        partyType: liabilityNotices.liablePartyType,
                        count: sql<number>`COUNT(*)`,
                        totalAmount: sql<string>`COALESCE(SUM(CAST(${liabilityNotices.amount} AS DECIMAL)), 0)`,
                    }).from(liabilityNotices).where(and(
                        eq(liabilityNotices.tenantId, tenantId), gte(liabilityNotices.createdAt, startDate), lte(liabilityNotices.createdAt, endDate),
                        eq(liabilityNotices.status, 'CONFIRMED')
                    )).groupBy(liabilityNotices.liablePartyType).catch(e => {
                        logger.warn('售后健康度指标 - 获取定责分布失败 (可能表未同步)', { error: e });
                        return [];
                    })
                ]);

                const totalRevenue = Number(salesStats[0]?.totalRevenue || 0);
                const totalOrders = Number(salesStats[0]?.totalOrders || 0);
                const afterSalesCount = Number(asStats[0]?.count || 0);
                const refundAmount = Number(asStats[0]?.refundTotal || 0);

                const liabilityDistribution = liabilityRaw.map(item => ({
                    party: item.partyType || '未知',
                    count: Number(item.count || 0),
                    amount: Number(item.totalAmount || 0),
                }));

                const refundRate = totalRevenue > 0 ? (refundAmount / totalRevenue) * 100 : 0;
                const complaintRate = totalOrders > 0 ? (afterSalesCount / totalOrders) * 100 : 0;

                logger.info('售后健康度指标查询成功', { tenantId, totalOrders, afterSalesCount });
                return {
                    refundRate: refundRate.toFixed(2),
                    refundAmount: refundAmount.toFixed(2),
                    complaintRate: complaintRate.toFixed(2),
                    afterSalesCount,
                    totalRevenue: totalRevenue.toFixed(2),
                    totalOrders,
                    liabilityDistribution,
                    healthLevel: refundRate < 1 && complaintRate < 3 ? 'GOOD'
                        : refundRate < 3 && complaintRate < 5 ? 'NORMAL' : 'WARNING',
                };
            } catch (error) {
                logger.error('售后健康度指标查询失败', { tenantId, error });
                throw error;
            }
        },
        [`after-sales-health-${tenantId}-${startDate.getTime()}-${endDate.getTime()}`],
        { tags: [`analytics-${tenantId}`, 'analytics-after-sales'], revalidate: 3600 }
    )();
});

/**
 * 导出：获取售后健康度指标分析
 * @param params - 查询参数
 */
export async function getAfterSalesHealth(params: z.infer<typeof afterSalesHealthSchema>) {
    return getAfterSalesHealthAction(params);
}
