/**
 * 交付效率统计 — getDeliveryEfficiency
 */

import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { ANALYTICS_PERMISSIONS } from '../constants';

const deliveryEfficiencySchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

/**
 * 获取交付效率数据（测量/安装）
 * 包含：平均周期、按时率、待处理任务数、逾期任务数
 */
const getDeliveryEfficiencyAction = createSafeAction(deliveryEfficiencySchema, async (params, { session }) => {
    await checkPermission(session, ANALYTICS_PERMISSIONS.VIEW);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            const measureStats = await db.select({
                avgDays: sql<number>`AVG(EXTRACT(EPOCH FROM (${measureTasks.completedAt} - ${measureTasks.createdAt})) / 86400)`,
                total: sql<number>`COUNT(*)`,
                onTime: sql<number>`SUM(CASE WHEN ${measureTasks.completedAt} <= ${measureTasks.scheduledAt} THEN 1 ELSE 0 END)`,
            }).from(measureTasks).where(and(
                eq(measureTasks.tenantId, tenantId), gte(measureTasks.createdAt, startDate), lte(measureTasks.createdAt, endDate),
                sql`${measureTasks.status} = 'COMPLETED'`
            ));

            const measureAvgDays = Number(measureStats[0]?.avgDays || 0);
            const measureTotal = Number(measureStats[0]?.total || 0);
            const measureOnTime = Number(measureStats[0]?.onTime || 0);
            const measureOnTimeRate = measureTotal > 0 ? (measureOnTime / measureTotal) * 100 : 0;

            const installStats = await db.select({
                avgDays: sql<number>`AVG(EXTRACT(EPOCH FROM (${installTasks.completedAt} - ${installTasks.createdAt})) / 86400)`,
                total: sql<number>`COUNT(*)`,
                onTime: sql<number>`SUM(CASE WHEN ${installTasks.completedAt} <= ${installTasks.scheduledDate} THEN 1 ELSE 0 END)`,
            }).from(installTasks).where(and(
                eq(installTasks.tenantId, tenantId), gte(installTasks.createdAt, startDate), lte(installTasks.createdAt, endDate),
                sql`${installTasks.status} = 'COMPLETED'`
            ));

            const installAvgDays = Number(installStats[0]?.avgDays || 0);
            const installTotal = Number(installStats[0]?.total || 0);
            const installOnTime = Number(installStats[0]?.onTime || 0);
            const installOnTimeRate = installTotal > 0 ? (installOnTime / installTotal) * 100 : 0;

            const pendingMeasure = await db.select({ count: sql<number>`COUNT(*)` }).from(measureTasks)
                .where(and(eq(measureTasks.tenantId, tenantId), sql`${measureTasks.status} IN ('PENDING', 'SCHEDULED')`));

            const pendingInstall = await db.select({ count: sql<number>`COUNT(*)` }).from(installTasks)
                .where(and(eq(installTasks.tenantId, tenantId), sql`${installTasks.status} IN ('PENDING', 'SCHEDULED')`));

            const overdueMeasure = await db.select({ count: sql<number>`COUNT(*)` }).from(measureTasks)
                .where(and(eq(measureTasks.tenantId, tenantId), sql`${measureTasks.status} IN ('PENDING', 'SCHEDULED')`, lte(measureTasks.scheduledAt, new Date())));

            const overdueInstall = await db.select({ count: sql<number>`COUNT(*)` }).from(installTasks)
                .where(and(eq(installTasks.tenantId, tenantId), sql`${installTasks.status} IN ('PENDING', 'SCHEDULED')`, lte(installTasks.scheduledDate, new Date())));

            return {
                measureAvgDays, measureOnTimeRate,
                installAvgDays, installOnTimeRate,
                totalPendingTasks: Number(pendingMeasure[0]?.count || 0) + Number(pendingInstall[0]?.count || 0),
                overdueTaskCount: Number(overdueMeasure[0]?.count || 0) + Number(overdueInstall[0]?.count || 0),
            }
        },
        [`delivery-efficiency-${tenantId}-${startDate.getTime()}-${endDate.getTime()}`],
        { tags: [`analytics-${tenantId}`, 'analytics-delivery'], revalidate: 3600 }
    )();
});

export async function getDeliveryEfficiency(params: z.infer<typeof deliveryEfficiencySchema>) {
    return getDeliveryEfficiencyAction(params);
}
