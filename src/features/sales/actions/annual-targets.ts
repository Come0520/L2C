'use server';

import { db } from '@/shared/api/db';
import { salesAnnualTargets, salesTargets, users } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { logger } from '@/shared/lib/logger';
import { AuditService } from '@/shared/services/audit-service';
import { PERMISSIONS } from '@/shared/config/permissions';

/**
 * 年度目标 DTO
 */
export interface AnnualTargetDTO {
  userId: string;
  userName: string;
  userAvatar: string | null;
  targetId: string | null;
  targetAmount: number;
  /** 12个月目标合计 */
  monthlySum: number;
  /** 月目标与年目标是否一致 */
  isConsistent: boolean;
  /** 差异金额（月合计 - 年目标） */
  difference: number;
}

/**
 * 获取年度目标列表
 */
export async function getAnnualTargets(year: number): Promise<{
  success: boolean;
  data?: AnnualTargetDTO[];
  error?: string;
}> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: '未登录' };
    }

    const tenantId = session.user.tenantId;

    // 查询所有销售人员 + 年度目标
    const result = await db
      .select({
        userId: users.id,
        userName: users.name,
        userAvatar: users.avatarUrl,
        targetId: salesAnnualTargets.id,
        targetAmount: salesAnnualTargets.targetAmount,
      })
      .from(users)
      .leftJoin(
        salesAnnualTargets,
        and(eq(salesAnnualTargets.userId, users.id), eq(salesAnnualTargets.year, year))
      )
      .where(and(eq(users.tenantId, tenantId), eq(users.role, 'sales'), eq(users.isActive, true)));

    // 查询该年12个月目标合计
    const monthlyTargets = await db
      .select({
        userId: salesTargets.userId,
        targetAmount: salesTargets.targetAmount,
      })
      .from(salesTargets)
      .where(and(eq(salesTargets.tenantId, tenantId), eq(salesTargets.year, year)));

    // 按用户汇总月目标
    const monthlySumMap = new Map<string, number>();
    for (const mt of monthlyTargets) {
      monthlySumMap.set(
        mt.userId,
        (monthlySumMap.get(mt.userId) || 0) + (parseFloat(mt.targetAmount as string) || 0)
      );
    }

    const data: AnnualTargetDTO[] = result.map((r) => {
      const targetAmount = parseFloat(r.targetAmount as string) || 0;
      const monthlySum = monthlySumMap.get(r.userId) || 0;
      const difference = monthlySum - targetAmount;
      return {
        userId: r.userId,
        userName: r.userName || '未知',
        userAvatar: r.userAvatar,
        targetId: r.targetId,
        targetAmount,
        monthlySum,
        isConsistent: Math.abs(difference) < 0.01,
        difference,
      };
    });

    return { success: true, data };
  } catch (error) {
    logger.error('[sales][annual-targets] 获取年度目标异常', { error });
    return { success: false, error: '获取年度目标失败' };
  }
}

/**
 * 更新/设置年度目标
 */
export async function updateAnnualTarget(
  userId: string,
  year: number,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: '未登录' };
    }

    const hasManagePermission = await checkPermission(session, PERMISSIONS.SALES_TARGETS.MANAGE);
    if (!hasManagePermission) {
      return { success: false, error: '无权限' };
    }

    const tenantId = session.user.tenantId;

    // Upsert 年度目标
    const existing = await db
      .select({ id: salesAnnualTargets.id })
      .from(salesAnnualTargets)
      .where(
        and(
          eq(salesAnnualTargets.tenantId, tenantId),
          eq(salesAnnualTargets.userId, userId),
          eq(salesAnnualTargets.year, year)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(salesAnnualTargets)
        .set({
          targetAmount: String(amount),
          updatedAt: new Date(),
          updatedBy: session.user.id,
        })
        .where(eq(salesAnnualTargets.id, existing[0].id));
    } else {
      await db.insert(salesAnnualTargets).values({
        tenantId,
        userId,
        year,
        targetAmount: String(amount),
        updatedBy: session.user.id,
      });
    }

    await AuditService.log(db, {
      tableName: 'sales_annual_targets',
      recordId: userId,
      action: 'UPDATE_ANNUAL_TARGET',
      details: { year, amount },
      userId: session.user.id,
      tenantId,
    });

    logger.info(
      `[sales][annual-targets] 设置年度目标: userId=${userId}, year=${year}, amount=${amount}`
    );
    return { success: true };
  } catch (error) {
    logger.error('[sales][annual-targets] 更新年度目标异常', { error });
    return { success: false, error: '更新年度目标失败' };
  }
}

/**
 * 一键拆解年度目标为12个月目标（均分）
 *
 * @description 将年度目标金额均分到12个月，已有月目标的月份会被覆盖
 */
export async function splitAnnualToMonthly(
  userId: string,
  year: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: '未登录' };
    }

    const hasManagePermission = await checkPermission(session, PERMISSIONS.SALES_TARGETS.MANAGE);
    if (!hasManagePermission) {
      return { success: false, error: '无权限' };
    }

    const tenantId = session.user.tenantId;

    // 获取年度目标
    const annual = await db
      .select({ targetAmount: salesAnnualTargets.targetAmount })
      .from(salesAnnualTargets)
      .where(
        and(
          eq(salesAnnualTargets.tenantId, tenantId),
          eq(salesAnnualTargets.userId, userId),
          eq(salesAnnualTargets.year, year)
        )
      )
      .limit(1);

    if (annual.length === 0) {
      return { success: false, error: '请先设置年度目标' };
    }

    const annualAmount = parseFloat(annual[0].targetAmount as string) || 0;
    const monthlyAmount = Math.round((annualAmount / 12) * 100) / 100;

    // 为12个月 Upsert 月目标
    for (let month = 1; month <= 12; month++) {
      const existing = await db
        .select({ id: salesTargets.id })
        .from(salesTargets)
        .where(
          and(
            eq(salesTargets.tenantId, tenantId),
            eq(salesTargets.userId, userId),
            eq(salesTargets.year, year),
            eq(salesTargets.month, month)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(salesTargets)
          .set({
            targetAmount: String(monthlyAmount),
            updatedAt: new Date(),
            updatedBy: session.user.id,
          })
          .where(eq(salesTargets.id, existing[0].id));
      } else {
        await db.insert(salesTargets).values({
          tenantId,
          userId,
          year,
          month,
          targetAmount: String(monthlyAmount),
          updatedBy: session.user.id,
        });
      }
    }

    await AuditService.log(db, {
      tableName: 'sales_annual_targets',
      recordId: userId,
      action: 'SPLIT_ANNUAL_TO_MONTHLY',
      details: { year, annualAmount, monthlyAmount },
      userId: session.user.id,
      tenantId,
    });

    logger.info(
      `[sales][annual-targets] 拆解年度→月度: userId=${userId}, year=${year}, monthly=${monthlyAmount}`
    );
    return { success: true };
  } catch (error) {
    logger.error('[sales][annual-targets] 拆解年度目标异常', { error });
    return { success: false, error: '拆解失败' };
  }
}
