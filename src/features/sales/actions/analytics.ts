'use server';

/**
 * Sales Analytics（销售分析）增强功能
 * 提供：目标完成率趋势、排名对比、月中预警提醒
 */

import { db } from '@/shared/api/db';
import { salesTargets, quotes, users } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { logger } from '@/shared/lib/logger';
import { unstable_cache } from 'next/cache';

// ========== 类型定义 ==========

/**
 * 月度完成率数据点
 */
export interface MonthlyCompletionPoint {
    year: number;
    month: number;
    /** 月份标签，如 "2月" */
    label: string;
    /** 目标金额（元） */
    targetAmount: number;
    /** 实际完成金额（元） */
    achievedAmount: number;
    /** 完成率百分比（0~100） */
    completionRate: number;
}

/**
 * 销售排名条目
 */
export interface SalesRankingItem {
    userId: string;
    userName: string;
    userAvatar: string | null;
    /** 目标金额（元） */
    targetAmount: number;
    /** 已完成金额（元） */
    achievedAmount: number;
    /** 完成率百分比（0~100） */
    completionRate: number;
    /** 排名（1为第一） */
    rank: number;
}

/**
 * 月中预警数据
 */
export interface TargetWarning {
    userId: string;
    userName: string;
    /** 目标金额（元） */
    targetAmount: number;
    /** 当前已完成（元） */
    currentAmount: number;
    /** 按当前进度预测月底完成金额（元） */
    predictedAmount: number;
    /** 预测完成率（0~100） */
    predictedRate: number;
    /** 是否高风险未达标 */
    atRisk: boolean;
    /** 风险等级：high/medium/low */
    riskLevel: 'high' | 'medium' | 'low';
}

// ========== 内部辅助函数 ==========

/**
 * 计算某月的 ACCEPTED 报价金额合计
 */
/**
 * 计算指定月份的已达成业绩金额
 * 
 * @description 汇总指定租户下、指定月份内所有状态为 ACCEPTED 的报价单金额。
 * 
 * @param {string} tenantId - 租户 ID
 * @param {number} year - 年份
 * @param {number} month - 月份 (1-12)
 * @param {string} [userId] - 可选，指定销售人员 ID
 * @returns {Promise<number>} 返回汇总后的总金额
 */
async function getMonthlyAchievedAmount(
    tenantId: string,
    year: number,
    month: number,
    userId?: string
): Promise<number> {
    // 构建月份日期范围
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59); // 月底最后一秒

    // 查询该月 ACCEPTED 状态报价
    const allQuotes = await db.query.quotes.findMany({
        where: and(
            eq(quotes.tenantId, tenantId),
            eq(quotes.status, 'ACCEPTED'),
        ),
        columns: { finalAmount: true, createdBy: true, createdAt: true },
    });

    // 过滤月份范围和可选的 userId
    return allQuotes
        .filter(q => {
            const d = new Date(q.createdAt as unknown as string);
            return d >= startDate && d <= endDate && (!userId || q.createdBy === userId);
        })
        .reduce((acc, q) => acc + (parseFloat(q.finalAmount as string) || 0), 0);
}

// ========== 导出 Action ==========

/**
 * 获取销售目标完成率趋势（最近 6 个月）
 * 权限：所有已登录用户（团队视图限 admin/manager/BOSS）
 * 
 * @param {string} [userId] - 指定用户 ID，默认为当前登录用户
 * @returns {Promise<{ success: boolean; data?: MonthlyCompletionPoint[]; error?: string }>}
 * @throws {Error} 数据库查询异常
 */
export async function getSalesCompletionTrend(
    userId?: string
): Promise<{ success: boolean; data?: MonthlyCompletionPoint[]; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.tenantId) {
            return { success: false, error: 'Unauthorized' };
        }

        const targetUserId = userId || session.user.id;
        const now = new Date();

        const getCachedTrend = unstable_cache(
            async () => {
                const points: MonthlyCompletionPoint[] = [];

                // 循环最近 6 个月
                for (let i = 5; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const year = date.getFullYear();
                    const month = date.getMonth() + 1;

                    // 查询该月目标
                    const targetRecord = await db.query.salesTargets.findFirst({
                        where: and(
                            eq(salesTargets.tenantId, session.user.tenantId),
                            eq(salesTargets.userId, targetUserId),
                            eq(salesTargets.year, year),
                            eq(salesTargets.month, month)
                        ),
                        columns: { targetAmount: true },
                    });

                    const targetAmount = parseFloat(targetRecord?.targetAmount as string) || 0;
                    const achievedAmount = await getMonthlyAchievedAmount(
                        session.user.tenantId,
                        year,
                        month,
                        targetUserId
                    );

                    const completionRate = targetAmount > 0
                        ? Math.min(Math.round((achievedAmount / targetAmount) * 100), 100)
                        : 0;

                    points.push({
                        year,
                        month,
                        label: `${month}月`,
                        targetAmount,
                        achievedAmount,
                        completionRate,
                    });
                }
                return points;
            },
            ['sales-completion-trend', session.user.tenantId, targetUserId, String(now.getFullYear()), String(now.getMonth())],
            { revalidate: 60, tags: ['sales-analytics'] }
        );

        const points = await getCachedTrend();
        logger.info(`[sales][analytics] getSalesCompletionTrend success, user: ${targetUserId}`);

        return { success: true, data: points };
    } catch (error) {
        logger.error('[sales][analytics] Exception in getSalesCompletionTrend:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

/**
 * 获取团队销售排名（当月）
 * 权限：admin/manager/BOSS
 * 
 * @param {number} [year] - 指定年份，默认当年
 * @param {number} [month] - 指定月份，默认当月
 * @returns {Promise<{ success: boolean; data?: SalesRankingItem[]; error?: string }>}
 * @throws {Error} 接口鉴权失败或数据库异常
 */
export async function getSalesRanking(
    year?: number,
    month?: number
): Promise<{ success: boolean; data?: SalesRankingItem[]; error?: string }> {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.tenantId) {
            return { success: false, error: 'Unauthorized' };
        }

        // 权限检查：仅管理层可查看排名
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: { role: true },
        });

        if (!['admin', 'manager', 'BOSS'].includes(currentUser?.role || '')) {
            logger.error(`[sales][analytics] Permission denied for getSalesRanking: user ${session.user.id}, role ${currentUser?.role}`);
            return { success: false, error: 'Permission denied' };
        }

        const now = new Date();
        const targetYear = year || now.getFullYear();
        const targetMonth = month || now.getMonth() + 1;

        const getCachedRanking = unstable_cache(
            async () => {
                // 获取所有活跃销售用户
                const salesUsers = await db.query.users.findMany({
                    where: and(
                        eq(users.tenantId, session.user.tenantId),
                        eq(users.role, 'sales'),
                        eq(users.isActive, true)
                    ),
                    columns: { id: true, name: true, avatarUrl: true },
                });

                // 并行获取每个销售的目标和完成情况
                const rankingItems: SalesRankingItem[] = await Promise.all(
                    salesUsers.map(async (user) => {
                        const targetRecord = await db.query.salesTargets.findFirst({
                            where: and(
                                eq(salesTargets.tenantId, session.user.tenantId),
                                eq(salesTargets.userId, user.id),
                                eq(salesTargets.year, targetYear),
                                eq(salesTargets.month, targetMonth)
                            ),
                            columns: { targetAmount: true },
                        });

                        const targetAmount = parseFloat(targetRecord?.targetAmount as string) || 0;
                        const achievedAmount = await getMonthlyAchievedAmount(
                            session.user.tenantId,
                            targetYear,
                            targetMonth,
                            user.id
                        );

                        const completionRate = targetAmount > 0
                            ? Math.min(Math.round((achievedAmount / targetAmount) * 100), 100)
                            : 0;

                        return {
                            userId: user.id,
                            userName: user.name || '未命名',
                            userAvatar: user.avatarUrl,
                            targetAmount,
                            achievedAmount,
                            completionRate,
                            rank: 0, // 排名在排序后计算
                        };
                    })
                );

                // 按完成金额降序排序并分配排名
                rankingItems.sort((a, b) => b.achievedAmount - a.achievedAmount);
                rankingItems.forEach((item, index) => {
                    item.rank = index + 1;
                });

                return rankingItems;
            },
            ['sales-ranking', session.user.tenantId, String(targetYear), String(targetMonth)],
            { revalidate: 60, tags: ['sales-analytics'] }
        );

        const rankingItems = await getCachedRanking();
        logger.info(`[sales][analytics] getSalesRanking success, length: ${rankingItems.length}`);

        return { success: true, data: rankingItems };
    } catch (error) {
        logger.error('[sales][analytics] Exception in getSalesRanking:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

/**
 * 获取月中目标达成预警
 * 按照月初到今天的实际进度，线性预测月底完成情况
 * 权限：admin/manager/BOSS
 * 
 * @returns {Promise<{ success: boolean; data?: TargetWarning[]; error?: string; }>}
 * @throws {Error} 鉴权失败或预测逻辑异常
 */
export async function getSalesTargetWarnings(): Promise<{
    success: boolean;
    data?: TargetWarning[];
    error?: string;
}> {
    try {
        const session = await auth();
        if (!session?.user?.id || !session?.user?.tenantId) {
            return { success: false, error: 'Unauthorized' };
        }

        // 权限检查：仅管理层
        const currentUser = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: { role: true },
        });

        if (!['admin', 'manager', 'BOSS'].includes(currentUser?.role || '')) {
            logger.error(`[sales][analytics] Permission denied for getSalesTargetWarnings: user ${session.user.id}, role ${currentUser?.role}`);
            return { success: false, error: 'Permission denied' };
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const today = now.getDate();

        const getCachedWarnings = unstable_cache(
            async () => {
                // 计算月份过去比例：今天是第几天 / 这个月总天数
                const daysInMonth = new Date(year, month, 0).getDate();
                const monthProgress = today / daysInMonth; // 0~1

                // 获取所有活跃销售用户
                const salesUsers = await db.query.users.findMany({
                    where: and(
                        eq(users.tenantId, session.user.tenantId),
                        eq(users.role, 'sales'),
                        eq(users.isActive, true)
                    ),
                    columns: { id: true, name: true },
                });

                const warnings: TargetWarning[] = await Promise.all(
                    salesUsers.map(async (user) => {
                        const targetRecord = await db.query.salesTargets.findFirst({
                            where: and(
                                eq(salesTargets.tenantId, session.user.tenantId),
                                eq(salesTargets.userId, user.id),
                                eq(salesTargets.year, year),
                                eq(salesTargets.month, month)
                            ),
                            columns: { targetAmount: true },
                        });

                        const targetAmount = parseFloat(targetRecord?.targetAmount as string) || 0;
                        const currentAmount = await getMonthlyAchievedAmount(
                            session.user.tenantId,
                            year,
                            month,
                            user.id
                        );

                        // 线性预测：如果月份还未开始，预测值为 0
                        const predictedAmount = monthProgress > 0
                            ? Math.round(currentAmount / monthProgress)
                            : 0;

                        const predictedRate = targetAmount > 0
                            ? Math.min(Math.round((predictedAmount / targetAmount) * 100), 100)
                            : 0;

                        // 风险判断：基于预测完成率
                        const atRisk = predictedRate < 80;
                        const riskLevel: 'high' | 'medium' | 'low' =
                            predictedRate < 50 ? 'high' :
                                predictedRate < 80 ? 'medium' : 'low';

                        return {
                            userId: user.id,
                            userName: user.name || '未命名',
                            targetAmount,
                            currentAmount,
                            predictedAmount,
                            predictedRate,
                            atRisk,
                            riskLevel,
                        };
                    })
                );

                // 只返回有风险的（atRisk: true），且按风险从高到低排序
                return warnings
                    .filter(w => w.atRisk)
                    .sort((a, b) => a.predictedRate - b.predictedRate);
            },
            ['sales-warnings', session.user.tenantId, String(year), String(month), String(today)],
            { revalidate: 60, tags: ['sales-analytics'] }
        );

        const atRiskWarnings = await getCachedWarnings();
        logger.info(`[sales][analytics] getSalesTargetWarnings success, found ${atRiskWarnings.length} warnings`);

        return { success: true, data: atRiskWarnings };
    } catch (error) {
        logger.error('[sales][analytics] Exception in getSalesTargetWarnings:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}
