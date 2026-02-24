'use server';

import { db } from '@/shared/api/db';
import { quotes, customers, salesTargets, users } from '@/shared/api/schema';
import { eq, and, count, sum } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { logger } from '@/shared/lib/logger';

/**
 * 销售仪表盘统计数据接口
 */
export interface DashboardStats {
    /** 目标达成情况 */
    target: {
        /** 目标总额（元） */
        amount: number;
        /** 已达成金额（元） */
        achieved: number;
        /** 完成百分比 (0-100) */
        percentage: number;
    };
    /** 核心业务指标 */
    stats: {
        /** 线索总数 */
        leads: number;
        /** 线索状态分布 */
        leadsBreakdown: {
            /** 待分配/待跟进 */
            pending: number;
            /** 跟进中（待报价/待量尺等） */
            following: number;
            /** 已转订单/已完成 */
            won: number;
        };
        /** 报价单总数 */
        quotes: number;
        /** 已转订单数 */
        orders: number;
        /** 总成交额（千元） */
        cash: string;
        /** 转化率 (%) */
        conversionRate: string;
        /** 平均客单价（元） */
        avgOrderValue: string;
    };
}

import { unstable_cache } from 'next/cache';

/**
 * 获取销售仪表盘综合统计数据
 * 
 * @description 根据用户角色返回不同的视图数据：
 * - 管理层 (admin/BOSS/manager): 返回全租户汇总数据。
 * - 普通销售: 仅返回该销售名下的个人业绩与线索统计。
 * 
 * @returns {Promise<{ success: boolean; data?: DashboardStats; error?: string }>} 成功返回统计对象，失败返回错误说明
 * @throws {Error} 数据库连接异常或未授权访问
 */
export async function getSalesDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.tenantId) {
            return { success: false, error: 'Unauthorized' };
        }

        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: { id: true, role: true, tenantId: true }
        });

        if (!user) {
            logger.error('[sales][dashboard] User not found for session id:', session.user.id);
            return { success: false, error: 'User not found' };
        }

        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const isTeamView = user.role === 'admin' || user.role === 'BOSS' || user.role === 'manager';

        // Define cache wrapper function
        const getCachedStats = unstable_cache(
            async () => {
                let targetAmount = 0;
                let totalCash = 0;
                let totalLeads = 0;
                let pendingLeads = 0;
                let followingLeads = 0;
                let wonLeads = 0;
                let quotesCount = 0;
                let ordersCount = 0;

                if (isTeamView) {
                    // --- TEAM VIEW ---
                    const [teamTargetRes, leadsStats, qCount, oCount, confirmedQuotes] = await Promise.all([
                        db.select({ total: sum(salesTargets.targetAmount) })
                            .from(salesTargets)
                            .where(and(
                                eq(salesTargets.tenantId, user.tenantId),
                                eq(salesTargets.year, currentYear),
                                eq(salesTargets.month, currentMonth)
                            )),
                        db.select({
                            status: customers.pipelineStatus,
                            count: count()
                        })
                            .from(customers)
                            .where(eq(customers.tenantId, user.tenantId))
                            .groupBy(customers.pipelineStatus),
                        db.select({ count: count() }).from(quotes).where(eq(quotes.tenantId, user.tenantId)),
                        db.select({ count: count() }).from(quotes).where(and(eq(quotes.tenantId, user.tenantId), eq(quotes.status, 'ORDERED'))),
                        db.query.quotes.findMany({
                            where: and(eq(quotes.tenantId, user.tenantId), eq(quotes.status, 'ACCEPTED')),
                            columns: { finalAmount: true },
                        })
                    ]);

                    targetAmount = parseFloat(teamTargetRes[0]?.total as string) || 0;

                    totalLeads = leadsStats.reduce((acc, curr) => acc + curr.count, 0);
                    pendingLeads = leadsStats.filter(s => ['UNASSIGNED', 'PENDING_FOLLOWUP'].includes(s.status || '')).reduce((acc, c) => acc + c.count, 0);
                    followingLeads = leadsStats.filter(s => ['PENDING_QUOTE', 'QUOTE_SENT', 'PENDING_MEASUREMENT'].includes(s.status || '')).reduce((acc, c) => acc + c.count, 0);
                    wonLeads = leadsStats.filter(s => ['IN_PRODUCTION', 'PENDING_DELIVERY', 'PENDING_INSTALLATION', 'COMPLETED'].includes(s.status || '')).reduce((acc, c) => acc + c.count, 0);

                    quotesCount = qCount[0].count;
                    ordersCount = oCount[0].count;
                    totalCash = confirmedQuotes.reduce((sum, q) => sum + (parseFloat(q.finalAmount as string) || 0), 0);

                } else {
                    // --- INDIVIDUAL SALES VIEW ---
                    const [myTargetRes, myLeadsStats, qCount, oCount, myConfirmed] = await Promise.all([
                        db.query.salesTargets.findFirst({
                            where: and(
                                eq(salesTargets.tenantId, user.tenantId),
                                eq(salesTargets.userId, user.id),
                                eq(salesTargets.year, currentYear),
                                eq(salesTargets.month, currentMonth)
                            ),
                            columns: { targetAmount: true }
                        }),
                        db.select({
                            status: customers.pipelineStatus,
                            count: count()
                        })
                            .from(customers)
                            .where(and(eq(customers.tenantId, user.tenantId), eq(customers.assignedSalesId, user.id)))
                            .groupBy(customers.pipelineStatus),
                        db.select({ count: count() }).from(quotes).where(and(eq(quotes.tenantId, user.tenantId), eq(quotes.createdBy, user.id))),
                        db.select({ count: count() }).from(quotes).where(and(
                            eq(quotes.tenantId, user.tenantId),
                            eq(quotes.createdBy, user.id),
                            eq(quotes.status, 'ORDERED')
                        )),
                        db.query.quotes.findMany({
                            where: and(
                                eq(quotes.tenantId, user.tenantId),
                                eq(quotes.createdBy, user.id),
                                eq(quotes.status, 'ACCEPTED')
                            ),
                            columns: { finalAmount: true },
                        })
                    ]);

                    targetAmount = parseFloat(myTargetRes?.targetAmount as string) || 0;

                    totalLeads = myLeadsStats.reduce((acc, curr) => acc + curr.count, 0);
                    pendingLeads = myLeadsStats.filter(s => ['UNASSIGNED', 'PENDING_FOLLOWUP'].includes(s.status || '')).reduce((acc, c) => acc + c.count, 0);
                    followingLeads = myLeadsStats.filter(s => ['PENDING_QUOTE', 'QUOTE_SENT', 'PENDING_MEASUREMENT'].includes(s.status || '')).reduce((acc, c) => acc + c.count, 0);
                    wonLeads = myLeadsStats.filter(s => ['IN_PRODUCTION', 'PENDING_DELIVERY', 'PENDING_INSTALLATION', 'COMPLETED'].includes(s.status || '')).reduce((acc, c) => acc + c.count, 0);

                    quotesCount = qCount[0].count;
                    ordersCount = oCount[0].count;
                    totalCash = myConfirmed.reduce((sum, q) => sum + (parseFloat(q.finalAmount as string) || 0), 0);
                }

                return {
                    target: {
                        amount: targetAmount,
                        achieved: totalCash,
                        percentage: targetAmount > 0 ? Math.min(Math.round((totalCash / targetAmount) * 100), 100) : 0
                    },
                    stats: {
                        leads: totalLeads,
                        leadsBreakdown: {
                            pending: pendingLeads,
                            following: followingLeads,
                            won: wonLeads
                        },
                        quotes: quotesCount,
                        orders: ordersCount,
                        cash: (totalCash / 1000).toFixed(1),
                        conversionRate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0',
                        avgOrderValue: ordersCount > 0 ? (totalCash / ordersCount).toFixed(0) : '0'
                    }
                };
            },
            ['sales-dashboard', user.tenantId || 'system', user.role || 'none', user.id, String(currentYear), String(currentMonth)],
            { revalidate: 60, tags: ['sales-dashboard'] }
        );

        const data = await getCachedStats();
        logger.info(`[sales][dashboard] Successfully retrieved dashboard stats, target: ${data.target.amount}, user: ${user.id}`);

        return {
            success: true,
            data
        };

    } catch (error) {
        logger.error('[sales][dashboard] Exception in getSalesDashboardStats:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}
