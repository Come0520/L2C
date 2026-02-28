'use server';

import { db } from '@/shared/api/db';
import { salesTargets, salesAnnualTargets, quotes } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { logger } from '@/shared/lib/logger';

/**
 * 获取四个季度的目标金额与实际完成金额对比
 */
export async function getQuarterlyComparison(params: { year: number }) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: '未登录' };
    }

    const { year } = params;
    const tenantId = session.user.tenantId;

    // 1. 获取全年的各月度目标
    const monthlyTargets = await db
      .select({
        month: salesTargets.month,
        targetAmount: salesTargets.targetAmount,
      })
      .from(salesTargets)
      .where(and(eq(salesTargets.tenantId, tenantId), eq(salesTargets.year, year)));

    // 2. 获取全年已完成订单
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);
    const acceptedQuotes = await db.query.quotes.findMany({
      where: and(eq(quotes.tenantId, tenantId), eq(quotes.status, 'ACCEPTED')),
      columns: { finalAmount: true, createdAt: true },
    });

    // 初始化四个季度数据
    const initialData = [
      { name: 'Q1', target: 0, achieved: 0, rate: 0 },
      { name: 'Q2', target: 0, achieved: 0, rate: 0 },
      { name: 'Q3', target: 0, achieved: 0, rate: 0 },
      { name: 'Q4', target: 0, achieved: 0, rate: 0 },
    ];

    // 汇总目标到各个季度
    monthlyTargets.forEach((t) => {
      const amount = parseFloat(t.targetAmount as string) || 0;
      const qIndex = Math.floor((t.month - 1) / 3);
      initialData[qIndex].target += amount;
    });

    // 汇总业绩到各个季度
    acceptedQuotes.forEach((q) => {
      const d = new Date(q.createdAt as unknown as string);
      if (d >= startDate && d <= endDate) {
        const amount = parseFloat(q.finalAmount as string) || 0;
        const qIndex = Math.floor(d.getMonth() / 3);
        initialData[qIndex].achieved += amount;
      }
    });

    // 计算各个季度的达成率
    const data = initialData.map((q) => {
      return {
        ...q,
        rate: q.target > 0 ? Math.round((q.achieved / q.target) * 1000) / 10 : 0,
      };
    });

    return { success: true, data };
  } catch (error) {
    logger.error('[analytics] 获取季度交叉对比异常', { error });
    return { success: false, error: '获取季度数据失败' };
  }
}

/**
 * 获取整个团队/公司的年度目标总体完成进度
 */
export async function getAnnualTargetProgress(params: { year: number }) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: '未登录' };
    }

    const { year } = params;
    const tenantId = session.user.tenantId;

    // 1. 获取全年的年度目标之和（整个团队汇总）
    const annualTargets = await db
      .select({
        targetAmount: salesAnnualTargets.targetAmount,
      })
      .from(salesAnnualTargets)
      .where(and(eq(salesAnnualTargets.tenantId, tenantId), eq(salesAnnualTargets.year, year)));

    const totalAnnualTarget = annualTargets.reduce(
      (s, t) => s + (parseFloat(t.targetAmount as string) || 0),
      0
    );

    // 如果今年没制定宏观的 AnnualTarget，则 fallback 退到统计全年12个月目标总和
    let finalTarget = totalAnnualTarget;
    if (finalTarget === 0) {
      const monthlyTargets = await db
        .select({
          targetAmount: salesTargets.targetAmount,
        })
        .from(salesTargets)
        .where(and(eq(salesTargets.tenantId, tenantId), eq(salesTargets.year, year)));
      finalTarget = monthlyTargets.reduce(
        (s, t) => s + (parseFloat(t.targetAmount as string) || 0),
        0
      );
    }

    // 2. 获取本年度所有的已结算完成度
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const acceptedQuotes = await db.query.quotes.findMany({
      where: and(eq(quotes.tenantId, tenantId), eq(quotes.status, 'ACCEPTED')),
      columns: { finalAmount: true, createdAt: true },
    });

    const totalAchieved = acceptedQuotes.reduce((s, q) => {
      const d = new Date(q.createdAt as unknown as string);
      if (d >= startDate && d <= endDate) {
        return s + (parseFloat(q.finalAmount as string) || 0);
      }
      return s;
    }, 0);

    const completionRate =
      finalTarget > 0 ? Math.round((totalAchieved / finalTarget) * 1000) / 10 : 0;

    return {
      success: true,
      data: {
        year,
        totalTarget: finalTarget,
        totalAchieved,
        completionRate,
      },
    };
  } catch (error) {
    logger.error('[analytics] 获取年度目标进度异常', { error });
    return { success: false, error: '获取年度进度失败' };
  }
}
