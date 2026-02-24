'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { db } from '@/shared/api/db';
import { eq, and, sql, sum, count, SQL } from 'drizzle-orm';
import { afterSalesTickets, liabilityNotices } from '@/shared/api/schema';
import { getQualityAnalyticsSchema } from './schemas';
import { unstable_cache } from 'next/cache';

/**
 * 高频调用下的缓存防剧烈透传函数（获取特定租户的售后质量分析结果）
 * 基于稳定的 5 分钟局部短时缓存，以换取在大规模展示面板时强劲且极速的渲染速度。
 * 
 * @param tenantId - 指定聚合报表所属的企业空间 ID
 * @param startDate - 查询聚合结果周期的开始日期限定
 * @param endDate - 查询聚合结果周期的结束日期限定
 */
const getCachedQualityAnalytics = unstable_cache(
    async (tenantId: string, startDate?: string, endDate?: string) => {
        const dateConditions: SQL[] = [];
        if (startDate) {
            dateConditions.push(sql`${liabilityNotices.confirmedAt} >= ${new Date(startDate)}`);
        }
        if (endDate) {
            dateConditions.push(sql`${liabilityNotices.confirmedAt} <= ${new Date(endDate)}`);
        }

        const [liabilityByParty, ticketsByType, ticketsByStatus] = await Promise.all([
            // 1. 按责任方类型统计定责单
            db
                .select({
                    liablePartyType: liabilityNotices.liablePartyType,
                    count: count(liabilityNotices.id),
                    totalAmount: sum(sql`CAST(${liabilityNotices.amount} AS DECIMAL)`),
                })
                .from(liabilityNotices)
                .where(and(
                    eq(liabilityNotices.tenantId, tenantId),
                    eq(liabilityNotices.status, 'CONFIRMED'),
                    ...dateConditions
                ))
                .groupBy(liabilityNotices.liablePartyType),

            // 2. 按工单类型统计
            db
                .select({
                    type: afterSalesTickets.type,
                    count: count(afterSalesTickets.id),
                })
                .from(afterSalesTickets)
                .where(eq(afterSalesTickets.tenantId, tenantId))
                .groupBy(afterSalesTickets.type),

            // 3. 按状态统计
            db
                .select({
                    status: afterSalesTickets.status,
                    count: count(afterSalesTickets.id),
                })
                .from(afterSalesTickets)
                .where(eq(afterSalesTickets.tenantId, tenantId))
                .groupBy(afterSalesTickets.status)
        ]);

        return {
            liabilityByParty,
            ticketsByType,
            ticketsByStatus,
        };
    },
    ['after-sales-quality-analytics'],
    {
        revalidate: 300, // 5分钟缓存
        tags: ['after-sales-analytics'],
    }
);

/**
 * 获取售后质量分析报表 (Server Action)
 * 分维度统计：
 * 1. 责任方分布 (责任方类型、单量、罚款总额)。
 * 2. 问题类型分布。
 * 3. 工单状态分布。
 */
const getAfterSalesQualityAnalyticsAction = createSafeAction(getQualityAnalyticsSchema, async (params, { session }) => {
    const tenantId = session.user.tenantId;

    const { liabilityByParty, ticketsByType, ticketsByStatus } = await getCachedQualityAnalytics(
        tenantId,
        params.startDate,
        params.endDate
    );

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
 * 收取规定区间内的所有历史售后单据并产出直观洞察报告矩阵
 * 用于给公司管理层直接展示当前的服务质量异常热点、损失发生集中区域。
 * 含有基础类型分类和细致至赔偿金额深度的图表数据集组。
 * 
 * @param params - 提取多维报告要求的日期跨度起始端和结束端数据结构
 * @returns 并行下发的质量追溯报表
 */
export async function getAfterSalesQualityAnalytics(params: z.infer<typeof getQualityAnalyticsSchema>) {
    return getAfterSalesQualityAnalyticsAction(params);
}
