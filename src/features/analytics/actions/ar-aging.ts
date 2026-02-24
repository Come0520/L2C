"use server";

import { db } from '@/shared/api/db';
import { arStatements, users } from '@/shared/api/schema';
import { eq, and, sql } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { ANALYTICS_PERMISSIONS } from '../constants';
import { logger } from '@/shared/lib/logger';

const arAgingAnalysisSchema = z.object({
    asOfDate: z.string().optional(),
});

/**
 * 获取 AR 账龄分析数据 (Get AR Aging Analysis)
 * 
 * 对租户下的应收账款进行账龄分层统计 (30/60/90/90+天)。
 * 提供汇总信息、各账龄段明细以及按销售人员维度的归集统计。
 * 结果通过 `unstable_cache` 进行缓存。
 * 
 * 权限要求: ANALYTICS_PERMISSIONS.VIEW
 * 
 * @param params - 查询参数
 * @param params.asOfDate - 截止统计日期 (YYYY-MM-DD)，默认为当天
 * @returns 包含 summary(汇总)、agingBuckets(账龄分层) 和 bySales(按销售汇总) 的分析结果
 */
const getARAgingAnalysisAction = createSafeAction(arAgingAnalysisSchema, async (params, { session }) => {
    await checkPermission(session, ANALYTICS_PERMISSIONS.VIEW);

    const asOfDate = params.asOfDate ? new Date(params.asOfDate) : new Date();
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            logger.info('AR 账龄分析查询开始', { tenantId, asOfDate });
            try {
                // 并行执行：1. 获取所有待处理账单明细 2. 获取按销售维度的汇总
                const [pendingARStatements, bySalesRaw] = await Promise.all([
                    db.select({
                        id: arStatements.id,
                        statementNo: arStatements.statementNo,
                        customerName: arStatements.customerName,
                        totalAmount: arStatements.totalAmount,
                        pendingAmount: arStatements.pendingAmount,
                        createdAt: arStatements.createdAt,
                        salesId: arStatements.salesId,
                    }).from(arStatements).where(and(
                        eq(arStatements.tenantId, tenantId),
                        sql`${arStatements.status} != 'COMPLETED'`,
                        sql`${arStatements.pendingAmount} > 0`
                    )),

                    db.select({
                        salesId: arStatements.salesId,
                        salesName: users.name,
                        totalPending: sql<number>`SUM(${arStatements.pendingAmount})`,
                        count: sql<number>`COUNT(*)`,
                    }).from(arStatements).leftJoin(users, eq(arStatements.salesId, users.id))
                        .where(and(
                            eq(arStatements.tenantId, tenantId),
                            sql`${arStatements.status} != 'COMPLETED'`,
                            sql`${arStatements.pendingAmount} > 0`
                        )).groupBy(arStatements.salesId, users.name).orderBy(sql`SUM(${arStatements.pendingAmount}) DESC`)
                ]);

                // 内存中按账龄分层计算
                const agingBuckets = {
                    current: { amount: 0, count: 0, items: [] as typeof pendingARStatements },
                    days30: { amount: 0, count: 0, items: [] as typeof pendingARStatements },
                    days60: { amount: 0, count: 0, items: [] as typeof pendingARStatements },
                    days90Plus: { amount: 0, count: 0, items: [] as typeof pendingARStatements },
                };

                pendingARStatements.forEach(statement => {
                    const ageDays = Math.floor((asOfDate.getTime() - new Date(statement.createdAt ?? Date.now()).getTime()) / (1000 * 60 * 60 * 24));
                    const pendingAmount = Number(statement.pendingAmount || 0);

                    if (ageDays <= 30) {
                        agingBuckets.current.amount += pendingAmount;
                        agingBuckets.current.count++;
                        agingBuckets.current.items.push(statement);
                    } else if (ageDays <= 60) {
                        agingBuckets.days30.amount += pendingAmount;
                        agingBuckets.days30.count++;
                        agingBuckets.days30.items.push(statement);
                    } else if (ageDays <= 90) {
                        agingBuckets.days60.amount += pendingAmount;
                        agingBuckets.days60.count++;
                        agingBuckets.days60.items.push(statement);
                    } else {
                        agingBuckets.days90Plus.amount += pendingAmount;
                        agingBuckets.days90Plus.count++;
                        agingBuckets.days90Plus.items.push(statement);
                    }
                });

                const totalPending = Object.values(agingBuckets).reduce((sum, bucket) => sum + bucket.amount, 0);

                logger.info('AR 账龄分析查询成功', { tenantId, totalPendingAmount: totalPending, count: pendingARStatements.length });

                return {
                    summary: {
                        asOfDate: asOfDate.toISOString().split('T')[0],
                        totalPendingAmount: totalPending.toFixed(2),
                        totalCount: pendingARStatements.length,
                    },
                    agingBuckets: [
                        { range: '0-30天', amount: agingBuckets.current.amount.toFixed(2), count: agingBuckets.current.count, percentage: totalPending > 0 ? ((agingBuckets.current.amount / totalPending) * 100).toFixed(1) : '0' },
                        { range: '31-60天', amount: agingBuckets.days30.amount.toFixed(2), count: agingBuckets.days30.count, percentage: totalPending > 0 ? ((agingBuckets.days30.amount / totalPending) * 100).toFixed(1) : '0' },
                        { range: '61-90天', amount: agingBuckets.days60.amount.toFixed(2), count: agingBuckets.days60.count, percentage: totalPending > 0 ? ((agingBuckets.days60.amount / totalPending) * 100).toFixed(1) : '0' },
                        { range: '90天以上', amount: agingBuckets.days90Plus.amount.toFixed(2), count: agingBuckets.days90Plus.count, percentage: totalPending > 0 ? ((agingBuckets.days90Plus.amount / totalPending) * 100).toFixed(1) : '0', riskLevel: 'HIGH' },
                    ],
                    bySales: bySalesRaw.map(item => ({
                        salesId: item.salesId,
                        salesName: item.salesName || '未分配',
                        amount: Number(item.totalPending || 0).toFixed(2),
                        count: Number(item.count || 0),
                    })),
                };
            } catch (error) {
                logger.error('AR 账龄分析查询失败', { tenantId, asOfDate, error });
                throw error;
            }
        },
        [`ar-aging-${tenantId}-${asOfDate.toISOString().split('T')[0]}`],
        { tags: [`analytics-${tenantId}`, 'analytics-ar'], revalidate: 3600 }
    )();
});

/**
 * 导出：获取 AR 账龄分析数据（含账龄分层与销售汇总）
 * @param params - 查询参数
 */
export async function getARAgingAnalysis(params: z.infer<typeof arAgingAnalysisSchema>) {
    return getARAgingAnalysisAction(params);
}
