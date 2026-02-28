'use server';

import { db } from '@/shared/api/db';
import { salesTargets, users, quotes } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { logger } from '@/shared/lib/logger';

/**
 * 目标达成分析 — 获取月度目标概览
 *
 * @description 返回团队当月的目标总额、完成总额、完成率，以及每人明细
 */
export async function getTargetAchievementOverview(params: { year: number; month: number }) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: '未登录' };
    }

    const { year, month } = params;
    const tenantId = session.user.tenantId;

    // 查询所有销售人员和目标
    const targetResult = await db
      .select({
        userId: users.id,
        userName: users.name,
        targetAmount: salesTargets.targetAmount,
      })
      .from(users)
      .leftJoin(
        salesTargets,
        and(
          eq(salesTargets.userId, users.id),
          eq(salesTargets.year, year),
          eq(salesTargets.month, month)
        )
      )
      .where(and(eq(users.tenantId, tenantId), eq(users.role, 'sales'), eq(users.isActive, true)));

    // 查询该月 ACCEPTED 报价
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const acceptedQuotes = await db.query.quotes.findMany({
      where: and(eq(quotes.tenantId, tenantId), eq(quotes.status, 'ACCEPTED')),
      columns: { finalAmount: true, createdBy: true, createdAt: true },
    });

    // 按用户汇总
    const achievedMap = new Map<string, number>();
    for (const q of acceptedQuotes) {
      const d = new Date(q.createdAt as unknown as string);
      if (d >= startDate && d <= endDate && q.createdBy) {
        achievedMap.set(
          q.createdBy,
          (achievedMap.get(q.createdBy) || 0) + (parseFloat(q.finalAmount as string) || 0)
        );
      }
    }

    // 计算每人明细
    const details = targetResult
      .map((r) => {
        const target = parseFloat(r.targetAmount as string) || 0;
        const achieved = achievedMap.get(r.userId) || 0;
        const rate = target > 0 ? Math.round((achieved / target) * 1000) / 10 : 0;
        return {
          userId: r.userId,
          userName: r.userName || '未知',
          targetAmount: target,
          achievedAmount: achieved,
          completionRate: rate,
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate);

    const totalTarget = details.reduce((s, d) => s + d.targetAmount, 0);
    const totalAchieved = details.reduce((s, d) => s + d.achievedAmount, 0);
    const totalRate = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 1000) / 10 : 0;

    return {
      success: true,
      data: {
        totalTarget,
        totalAchieved,
        totalRate,
        details,
      },
    };
  } catch (error) {
    logger.error('[analytics] 获取目标达成概览异常', { error });
    return { success: false, error: '获取数据失败' };
  }
}

/**
 * 目标达成分析 — 获取最近12个月的月度完成率趋势
 */
export async function getTargetCompletionTrend(params: { year: number; month: number }) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: '未登录' };
    }

    const tenantId = session.user.tenantId;
    const { year, month } = params;

    // 生成最近12个月的年月列表
    const months: { year: number; month: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    // 查询所有目标
    const allTargets = await db
      .select({
        year: salesTargets.year,
        month: salesTargets.month,
        targetAmount: salesTargets.targetAmount,
      })
      .from(salesTargets)
      .where(eq(salesTargets.tenantId, tenantId));

    // 查询所有 ACCEPTED 报价（筛选最近12个月范围）
    const acceptedQuotes = await db.query.quotes.findMany({
      where: and(eq(quotes.tenantId, tenantId), eq(quotes.status, 'ACCEPTED')),
      columns: { finalAmount: true, createdAt: true },
    });

    // 按月汇总
    const trend = months.map((m) => {
      const mStart = new Date(m.year, m.month - 1, 1);
      const mEnd = new Date(m.year, m.month, 0, 23, 59, 59);

      const monthTarget = allTargets
        .filter((t) => t.year === m.year && t.month === m.month)
        .reduce((s, t) => s + (parseFloat(t.targetAmount as string) || 0), 0);

      const monthAchieved = acceptedQuotes
        .filter((q) => {
          const d = new Date(q.createdAt as unknown as string);
          return d >= mStart && d <= mEnd;
        })
        .reduce((s, q) => s + (parseFloat(q.finalAmount as string) || 0), 0);

      const rate = monthTarget > 0 ? Math.round((monthAchieved / monthTarget) * 1000) / 10 : 0;

      return {
        label: `${m.month}月`,
        year: m.year,
        month: m.month,
        target: monthTarget,
        achieved: monthAchieved,
        completionRate: rate,
      };
    });

    return { success: true, data: trend };
  } catch (error) {
    logger.error('[analytics] 获取目标完成趋势异常', { error });
    return { success: false, error: '获取数据失败' };
  }
}

/**
 * 目标达成分析 — 风险预警（预测月底完成率低于 80% 的销售人员）
 */
export async function getTargetRiskWarnings(params: { year: number; month: number }) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: '未登录' };
    }

    const { year, month } = params;
    const tenantId = session.user.tenantId;

    // 获取当月第几天和总天数
    const now = new Date();
    const totalDays = new Date(year, month, 0).getDate();
    const currentDay =
      now.getFullYear() === year && now.getMonth() + 1 === month ? now.getDate() : totalDays; // 非当月则视为已结束

    // 查询目标
    const targetResult = await db
      .select({
        userId: users.id,
        userName: users.name,
        targetAmount: salesTargets.targetAmount,
      })
      .from(users)
      .leftJoin(
        salesTargets,
        and(
          eq(salesTargets.userId, users.id),
          eq(salesTargets.year, year),
          eq(salesTargets.month, month)
        )
      )
      .where(and(eq(users.tenantId, tenantId), eq(users.role, 'sales'), eq(users.isActive, true)));

    // 查询该月完成
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const acceptedQuotes = await db.query.quotes.findMany({
      where: and(eq(quotes.tenantId, tenantId), eq(quotes.status, 'ACCEPTED')),
      columns: { finalAmount: true, createdBy: true, createdAt: true },
    });

    const achievedMap = new Map<string, number>();
    for (const q of acceptedQuotes) {
      const d = new Date(q.createdAt as unknown as string);
      if (d >= startDate && d <= endDate && q.createdBy) {
        achievedMap.set(
          q.createdBy,
          (achievedMap.get(q.createdBy) || 0) + (parseFloat(q.finalAmount as string) || 0)
        );
      }
    }

    // 预测完成率 = (当前完成 / 已过天数) * 总天数 / 目标
    const warnings = targetResult
      .filter((r) => (parseFloat(r.targetAmount as string) || 0) > 0)
      .map((r) => {
        const target = parseFloat(r.targetAmount as string) || 0;
        const achieved = achievedMap.get(r.userId) || 0;
        const dailyRate = currentDay > 0 ? achieved / currentDay : 0;
        const predictedAmount = dailyRate * totalDays;
        const predictedRate = target > 0 ? Math.round((predictedAmount / target) * 1000) / 10 : 0;
        const currentRate = target > 0 ? Math.round((achieved / target) * 1000) / 10 : 0;

        let riskLevel: 'high' | 'medium' | 'low' = 'low';
        if (predictedRate < 50) riskLevel = 'high';
        else if (predictedRate < 80) riskLevel = 'medium';

        return {
          userId: r.userId,
          userName: r.userName || '未知',
          targetAmount: target,
          achievedAmount: achieved,
          currentRate,
          predictedRate,
          riskLevel,
        };
      })
      .filter((w) => w.riskLevel !== 'low')
      .sort((a, b) => a.predictedRate - b.predictedRate);

    return { success: true, data: warnings };
  } catch (error) {
    logger.error('[analytics] 获取目标风险预警异常', { error });
    return { success: false, error: '获取数据失败' };
  }
}
