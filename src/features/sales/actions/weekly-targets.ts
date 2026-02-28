'use server';

import { db } from '@/shared/api/db';
import { salesWeeklyTargets, users, quotes } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { logger } from '@/shared/lib/logger';
import { AuditService } from '@/shared/services/audit-service';
import { startOfISOWeek, endOfISOWeek, getISOWeek, getISOWeekYear } from 'date-fns';

/**
 * 周目标 DTO
 */
export interface WeeklyTargetDTO {
  userId: string;
  userName: string;
  targetId: string | null;
  targetAmount: number;
  achievedAmount: number;
  completionRate: number;
}

/**
 * 获取指定周的目标列表
 */
export async function getWeeklyTargets(
  year: number,
  week: number
): Promise<{
  success: boolean;
  data?: WeeklyTargetDTO[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: '未登录' };
    }

    const tenantId = session.user.tenantId;

    // 查询所有销售人员 + 周目标
    const result = await db
      .select({
        userId: users.id,
        userName: users.name,
        targetId: salesWeeklyTargets.id,
        targetAmount: salesWeeklyTargets.targetAmount,
      })
      .from(users)
      .leftJoin(
        salesWeeklyTargets,
        and(
          eq(salesWeeklyTargets.userId, users.id),
          eq(salesWeeklyTargets.year, year),
          eq(salesWeeklyTargets.week, week)
        )
      )
      .where(and(eq(users.tenantId, tenantId), eq(users.role, 'sales'), eq(users.isActive, true)));

    // 计算该周的日期范围
    const weekDate = new Date(year, 0, 1 + (week - 1) * 7);
    const weekStart = startOfISOWeek(weekDate);
    const weekEnd = endOfISOWeek(weekDate);

    // 查询该周 ACCEPTED 报价
    const acceptedQuotes = await db.query.quotes.findMany({
      where: and(eq(quotes.tenantId, tenantId), eq(quotes.status, 'ACCEPTED')),
      columns: { finalAmount: true, createdBy: true, createdAt: true },
    });

    const achievedMap = new Map<string, number>();
    for (const q of acceptedQuotes) {
      const d = new Date(q.createdAt as unknown as string);
      if (d >= weekStart && d <= weekEnd && q.createdBy) {
        achievedMap.set(
          q.createdBy,
          (achievedMap.get(q.createdBy) || 0) + (parseFloat(q.finalAmount as string) || 0)
        );
      }
    }

    const data: WeeklyTargetDTO[] = result.map((r) => {
      const target = parseFloat(r.targetAmount as string) || 0;
      const achieved = achievedMap.get(r.userId) || 0;
      const rate = target > 0 ? Math.round((achieved / target) * 1000) / 10 : 0;
      return {
        userId: r.userId,
        userName: r.userName || '未知',
        targetId: r.targetId,
        targetAmount: target,
        achievedAmount: achieved,
        completionRate: rate,
      };
    });

    return { success: true, data };
  } catch (error) {
    logger.error('[sales][weekly-targets] 获取周目标异常', { error });
    return { success: false, error: '获取周目标失败' };
  }
}

/**
 * 更新/设置周目标
 */
export async function updateWeeklyTarget(
  userId: string,
  year: number,
  week: number,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: '未登录' };
    }

    const { PERMISSIONS } = await import('@/shared/config/permissions');
    const hasManagePermission = await checkPermission(session, PERMISSIONS.SALES_TARGETS.MANAGE);
    if (!hasManagePermission) {
      return { success: false, error: '无权限' };
    }

    const tenantId = session.user.tenantId;

    const existing = await db
      .select({ id: salesWeeklyTargets.id })
      .from(salesWeeklyTargets)
      .where(
        and(
          eq(salesWeeklyTargets.tenantId, tenantId),
          eq(salesWeeklyTargets.userId, userId),
          eq(salesWeeklyTargets.year, year),
          eq(salesWeeklyTargets.week, week)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(salesWeeklyTargets)
        .set({
          targetAmount: String(amount),
          updatedAt: new Date(),
          updatedBy: session.user.id,
        })
        .where(eq(salesWeeklyTargets.id, existing[0].id));
    } else {
      await db.insert(salesWeeklyTargets).values({
        tenantId,
        userId,
        year,
        week,
        targetAmount: String(amount),
        updatedBy: session.user.id,
      });
    }

    await AuditService.log(db, {
      tableName: 'sales_weekly_targets',
      recordId: userId,
      action: 'UPDATE_WEEKLY_TARGET',
      details: { year, week, amount },
      userId: session.user.id,
      tenantId,
    });

    return { success: true };
  } catch (error) {
    logger.error('[sales][weekly-targets] 更新周目标异常', { error });
    return { success: false, error: '更新周目标失败' };
  }
}

/**
 * 获取当前 ISO 周信息
 */
export async function getCurrentWeekInfo(): Promise<{ year: number; week: number }> {
  const now = new Date();
  return {
    year: getISOWeekYear(now),
    week: getISOWeek(now),
  };
}
