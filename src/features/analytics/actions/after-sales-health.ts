/**
 * 售后健康度指标 — getAfterSalesHealth
 */

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { liabilityNotices, afterSalesTickets } from '@/shared/api/schema/after-sales';
import { eq, and, gte, lte, sql, notInArray } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { ANALYTICS_PERMISSIONS } from '../constants';

const afterSalesHealthSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

/**
 * 获取售后健康度指标
 * 退款率 = 退款金额 / 总销售额
 * 客诉率 = 客诉工单数 / 总订单数
 * 责任分布 = 按责任方统计的定责单分布
 */
const getAfterSalesHealthAction = createSafeAction(afterSalesHealthSchema, async (params, { session }) => {
    await checkPermission(session, ANALYTICS_PERMISSIONS.VIEW);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            const salesStats = await db.select({
                totalRevenue: sql<string>`COALESCE(SUM(CAST(${orders.totalAmount} AS DECIMAL)), 0)`,
                totalOrders: sql<number>`COUNT(*)`,
            }).from(orders).where(and(
                eq(orders.tenantId, tenantId), gte(orders.createdAt, startDate), lte(orders.createdAt, endDate),
                notInArray(orders.status, ['CANCELLED', 'DRAFT'])
            ));

            const totalRevenue = Number(salesStats[0]?.totalRevenue || 0);
            const totalOrders = Number(salesStats[0]?.totalOrders || 0);

            let afterSalesCount = 0;
            let refundAmount = 0;
            try {
                const asStats = await db.select({
                    count: sql<number>`COUNT(*)`,
                    refundTotal: sql<string>`COALESCE(SUM(CAST(${afterSalesTickets.actualDeduction} AS DECIMAL)), 0)`,
                }).from(afterSalesTickets).where(and(
                    eq(afterSalesTickets.tenantId, tenantId), gte(afterSalesTickets.createdAt, startDate), lte(afterSalesTickets.createdAt, endDate)
                ));
                afterSalesCount = Number(asStats[0]?.count || 0);
                refundAmount = Number(asStats[0]?.refundTotal || 0);
            } catch {
                // 表可能不存在，忽略
            }

            let liabilityDistribution: { party: string; count: number; amount: number }[] = [];
            try {
                const liability = await db.select({
                    partyType: liabilityNotices.liablePartyType,
                    count: sql<number>`COUNT(*)`,
                    totalAmount: sql<string>`COALESCE(SUM(CAST(${liabilityNotices.amount} AS DECIMAL)), 0)`,
                }).from(liabilityNotices).where(and(
                    eq(liabilityNotices.tenantId, tenantId), gte(liabilityNotices.createdAt, startDate), lte(liabilityNotices.createdAt, endDate),
                    eq(liabilityNotices.status, 'CONFIRMED')
                )).groupBy(liabilityNotices.liablePartyType);

                liabilityDistribution = liability.map(item => ({
                    party: item.partyType || '未知',
                    count: Number(item.count || 0),
                    amount: Number(item.totalAmount || 0),
                }));
            } catch {
                // 表可能不存在，忽略
            }

            const refundRate = totalRevenue > 0 ? (refundAmount / totalRevenue) * 100 : 0;
            const complaintRate = totalOrders > 0 ? (afterSalesCount / totalOrders) * 100 : 0;

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
            }
        },
        [`after-sales-health-${tenantId}-${startDate.getTime()}-${endDate.getTime()}`],
        { tags: [`analytics-${tenantId}`, 'analytics-after-sales'], revalidate: 3600 }
    )();
});

export async function getAfterSalesHealth(params: z.infer<typeof afterSalesHealthSchema>) {
    return getAfterSalesHealthAction(params);
}
