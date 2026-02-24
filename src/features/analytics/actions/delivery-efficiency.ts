"use server";

import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { logger } from '@/shared/lib/logger';
import { ANALYTICS_PERMISSIONS } from '../constants';

const deliveryEfficiencySchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

/**
 * 获取交付效率分析数据 (Get Delivery Efficiency Analysis)
 * 
 * 统计分析测量和安装两个核心环节的交付效率。
 * 包含平均交付周期 (Avg Days)、按时完成率 (On-time Rate)、当前待执行任务数和逾期任务数。
 * 结果通过 `unstable_cache` 进行缓存，用于仪表盘和效率分析报表。
 * 
 * 权限要求: ANALYTICS_PERMISSIONS.VIEW
 * 
 * @param params - 查询参数
 * @param params.startDate - 开始日期，若为空则默认从本月 1 号开始
 * @param params.endDate - 结束日期，若为空则默认为今天
 * @returns 交付效率指标对象，包含测量和安装的各项细分指标
 */
const getDeliveryEfficiencyAction = createSafeAction(deliveryEfficiencySchema, async (params, { session }) => {
    await checkPermission(session, ANALYTICS_PERMISSIONS.VIEW);

    const startDate = params.startDate ? new Date(params.startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const endDate = params.endDate ? new Date(params.endDate) : new Date();
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            try {
                logger.info('交付效率分析查询开始', { tenantId, startDate, endDate });

                const [measureStats, installStats, pendingMeasure, pendingInstall, overdueMeasure, overdueInstall] = await Promise.all([
                    db.select({
                        avgDays: sql<number>`AVG(EXTRACT(EPOCH FROM (${measureTasks.completedAt} - ${measureTasks.createdAt})) / 86400)`,
                        total: sql<number>`COUNT(*)`,
                        onTime: sql<number>`SUM(CASE WHEN ${measureTasks.completedAt} <= ${measureTasks.scheduledAt} THEN 1 ELSE 0 END)`,
                    }).from(measureTasks).where(and(
                        eq(measureTasks.tenantId, tenantId), gte(measureTasks.createdAt, startDate), lte(measureTasks.createdAt, endDate),
                        sql`${measureTasks.status} = 'COMPLETED'`
                    )),
                    db.select({
                        avgDays: sql<number>`AVG(EXTRACT(EPOCH FROM (${installTasks.completedAt} - ${installTasks.createdAt})) / 86400)`,
                        total: sql<number>`COUNT(*)`,
                        onTime: sql<number>`SUM(CASE WHEN ${installTasks.completedAt} <= ${installTasks.scheduledDate} THEN 1 ELSE 0 END)`,
                    }).from(installTasks).where(and(
                        eq(installTasks.tenantId, tenantId), gte(installTasks.createdAt, startDate), lte(installTasks.createdAt, endDate),
                        sql`${installTasks.status} = 'COMPLETED'`
                    )),
                    db.select({ count: sql<number>`COUNT(*)` }).from(measureTasks)
                        .where(and(eq(measureTasks.tenantId, tenantId), sql`${measureTasks.status} IN ('PENDING', 'SCHEDULED')`)),
                    db.select({ count: sql<number>`COUNT(*)` }).from(installTasks)
                        .where(and(eq(installTasks.tenantId, tenantId), sql`${installTasks.status} IN ('PENDING', 'SCHEDULED')`)),
                    db.select({ count: sql<number>`COUNT(*)` }).from(measureTasks)
                        .where(and(eq(measureTasks.tenantId, tenantId), sql`${measureTasks.status} IN ('PENDING', 'SCHEDULED')`, lte(measureTasks.scheduledAt, new Date()))),
                    db.select({ count: sql<number>`COUNT(*)` }).from(installTasks)
                        .where(and(eq(installTasks.tenantId, tenantId), sql`${installTasks.status} IN ('PENDING', 'SCHEDULED')`, lte(installTasks.scheduledDate, new Date())))
                ]);

                const measureAvgDays = Number(measureStats[0]?.avgDays || 0);
                const measureTotal = Number(measureStats[0]?.total || 0);
                const measureOnTime = Number(measureStats[0]?.onTime || 0);
                const measureOnTimeRate = measureTotal > 0 ? (measureOnTime / measureTotal) * 100 : 0;

                const installAvgDays = Number(installStats[0]?.avgDays || 0);
                const installTotal = Number(installStats[0]?.total || 0);
                const installOnTime = Number(installStats[0]?.onTime || 0);
                const installOnTimeRate = installTotal > 0 ? (installOnTime / installTotal) * 100 : 0;

                const result = {
                    measureAvgDays, measureOnTimeRate,
                    installAvgDays, installOnTimeRate,
                    totalPendingTasks: Number(pendingMeasure[0]?.count || 0) + Number(pendingInstall[0]?.count || 0),
                    overdueTaskCount: Number(overdueMeasure[0]?.count || 0) + Number(overdueInstall[0]?.count || 0),
                };

                logger.info('交付效率分析查询成功', { tenantId, measureAvgDays, installAvgDays });
                return result;
            } catch (error) {
                logger.error('交付效率分析查询失败', { tenantId, error });
                throw error;
            }
        },
        [`delivery-efficiency-${tenantId}-${startDate.getTime()}-${endDate.getTime()}`],
        { tags: [`analytics-${tenantId}`, 'analytics-delivery'], revalidate: 3600 }
    )();
});

/**
 * 导出：获取交付效率数据
 * @param params - 查询参数
 */
export async function getDeliveryEfficiency(params: z.infer<typeof deliveryEfficiencySchema>) {
    return getDeliveryEfficiencyAction(params);
}
