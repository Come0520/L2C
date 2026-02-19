'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { db } from '@/shared/api/db';
import { eq, and, sql, sum, count, SQL } from 'drizzle-orm';
import { afterSalesTickets, liabilityNotices } from '@/shared/api/schema';
import { getQualityAnalyticsSchema } from './schemas';

/**
 * 获取售后质量分析报表 (Server Action)
 * 分维度统计：
 * 1. 责任方分布 (责任方类型、单量、罚款总额)。
 * 2. 问题类型分布。
 * 3. 工单状态分布。
 */
const getAfterSalesQualityAnalyticsAction = createSafeAction(getQualityAnalyticsSchema, async (params, { session }) => {
    const tenantId = session.user.tenantId;

    // P1 FIX (AS-09): 定义日期过滤范围
    const dateConditions: SQL[] = [];
    if (params.startDate) {
        dateConditions.push(sql`${liabilityNotices.confirmedAt} >= ${new Date(params.startDate)}`);
    }
    if (params.endDate) {
        dateConditions.push(sql`${liabilityNotices.confirmedAt} <= ${new Date(params.endDate)}`);
    }

    // 按责任方类型统计定责单
    const liabilityByParty = await db
        .select({
            liablePartyType: liabilityNotices.liablePartyType,
            count: count(liabilityNotices.id),
            totalAmount: sum(sql`CAST(${liabilityNotices.amount} AS DECIMAL)`),
        })
        .from(liabilityNotices)
        .where(and(
            eq(liabilityNotices.tenantId, tenantId),
            eq(liabilityNotices.status, 'CONFIRMED'),
            ...dateConditions // P1 FIX (AS-09): 应用日期过滤
        ))
        .groupBy(liabilityNotices.liablePartyType);

    // 按工单类型统计
    const ticketsByType = await db
        .select({
            type: afterSalesTickets.type,
            count: count(afterSalesTickets.id),
        })
        .from(afterSalesTickets)
        .where(eq(afterSalesTickets.tenantId, tenantId))
        .groupBy(afterSalesTickets.type);

    // 按状态统计
    const ticketsByStatus = await db
        .select({
            status: afterSalesTickets.status,
            count: count(afterSalesTickets.id),
        })
        .from(afterSalesTickets)
        .where(eq(afterSalesTickets.tenantId, tenantId))
        .groupBy(afterSalesTickets.status);

    // 责任方类型映射 (本地化)
    const partyTypeLabels: Record<string, string> = {
        FACTORY: '工厂',
        INSTALLER: '安装工',
        LOGISTICS: '物流',
        CUSTOMER: '客户',
        SALESPERSON: '销售',
        OTHER: '其他',
    };

    return {
        liabilityByParty: liabilityByParty.map(item => ({
            partyType: item.liablePartyType,
            partyTypeLabel: partyTypeLabels[item.liablePartyType || ''] || item.liablePartyType,
            count: Number(item.count),
            totalAmount: parseFloat(item.totalAmount?.toString() || '0'),
        })),
        ticketsByType: ticketsByType.map(item => ({
            type: item.type,
            count: Number(item.count),
            ticketsByType: ticketsByType.map(item => ({
                type: item.type,
                count: Number(item.count),
            })),
        })),
        ticketsByStatus: ticketsByStatus.map(item => ({
            status: item.status,
            count: Number(item.count),
        })),
        summary: {
            totalLiabilityAmount: liabilityByParty.reduce((acc, item) =>
                acc + parseFloat(item.totalAmount?.toString() || '0'), 0),
            totalLiabilityCount: liabilityByParty.reduce((acc, item) =>
                acc + Number(item.count), 0),
        }
    };
});

/**
 * 获取指定时间范围内的售后质量多维统计报表
 */
export async function getAfterSalesQualityAnalytics(params: z.infer<typeof getQualityAnalyticsSchema>) {
    return getAfterSalesQualityAnalyticsAction(params);
}
