import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { salesWeeklyTargets, users } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { getMiniprogramUser } from '../../auth-utils';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { CacheService } from '@/shared/services/miniprogram/cache.service';
import { SetSalesWeeklyTargetSchema } from '../../miniprogram-schemas';
import { startOfISOWeek, endOfISOWeek, getISOWeek, getISOWeekYear } from 'date-fns';
import { RolePermissionService } from '@/shared/lib/role-permission-service';
import { PERMISSIONS } from '@/shared/config/permissions';

/**
 * 获取周目标列表
 *
 * @route GET /api/miniprogram/sales/weekly-targets
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user) return apiError('未授权', 401);

    const { searchParams } = new URL(request.url);
    const now = new Date();
    const defaultYear = getISOWeekYear(now);
    const defaultWeek = getISOWeek(now);

    const year = parseInt(searchParams.get('year') || String(defaultYear));
    const week = parseInt(searchParams.get('week') || String(defaultWeek));
    const _targetUserId = searchParams.get('userId');

    // 缓存策略
    const cacheKey = `miniprogram:sales:weekly-targets:${user.tenantId}:${year}:${week}`;

    const formatted = await CacheService.getOrSet(
      cacheKey,
      async () => {
        const { quotes } = await import('@/shared/api/schema');

        const result = await db
          .select({
            userId: users.id,
            userName: users.name,
            userAvatar: users.avatarUrl,
            targetId: salesWeeklyTargets.id,
            targetAmount: salesWeeklyTargets.targetAmount,
            updatedAt: salesWeeklyTargets.updatedAt,
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
          .where(
            and(
              eq(users.tenantId, user.tenantId),
              eq(users.role, 'sales'),
              eq(users.isActive, true)
            )
          );

        // 计算该周的日期范围
        const weekDate = new Date(year, 0, 1 + (week - 1) * 7);
        const weekStart = startOfISOWeek(weekDate);
        const weekEnd = endOfISOWeek(weekDate);

        const acceptedQuotes = await db.query.quotes.findMany({
          where: and(eq(quotes.tenantId, user.tenantId), eq(quotes.status, 'ACCEPTED')),
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

        return result.map((r) => {
          const targetAmount = parseFloat(r.targetAmount as string) || 0;
          const achievedAmount = achievedMap.get(r.userId) || 0;
          const completionRate =
            targetAmount > 0 ? Math.round((achievedAmount / targetAmount) * 1000) / 10 : 0;
          return {
            id: r.targetId,
            userId: r.userId,
            userName: r.userName,
            userAvatar: r.userAvatar,
            year,
            week,
            targetAmount: r.targetAmount || '0',
            achievedAmount: String(achievedAmount),
            completionRate,
            updatedAt: r.updatedAt,
          };
        });
      },
      60000
    );

    return apiSuccess(formatted);
  } catch (error) {
    logger.error('[SalesWeeklyTarget] 获取销售周目标异常', {
      route: 'sales/weekly-targets',
      error,
    });
    return apiError('获取销售周目标失败', 500);
  }
}

/**
 * 设置或更新销售人员周度业绩目标
 *
 * @route POST /api/miniprogram/sales/weekly-targets
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user) return apiError('未授权', 401);

    // 权限校验：使用权限矩阵
    const hasManagePermission = await RolePermissionService.hasPermission(
      user.id,
      PERMISSIONS.SALES_TARGETS.MANAGE
    );
    if (!hasManagePermission) {
      return apiError('权限不足，请联系管理员开通目标管理权限', 403);
    }

    const body = await request.json();
    const parsed = SetSalesWeeklyTargetSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { userId, year, week, targetAmount } = parsed.data;

    await db
      .insert(salesWeeklyTargets)
      .values({
        tenantId: user.tenantId,
        userId,
        year,
        week,
        targetAmount: String(targetAmount),
        updatedBy: user.id,
      })
      .onConflictDoUpdate({
        target: [
          salesWeeklyTargets.tenantId,
          salesWeeklyTargets.userId,
          salesWeeklyTargets.year,
          salesWeeklyTargets.week,
        ],
        set: {
          targetAmount: String(targetAmount),
          updatedAt: new Date(),
          updatedBy: user.id,
        },
      });

    try {
      const { AuditService } = await import('@/shared/services/audit-service');
      await AuditService.log(db, {
        tableName: 'sales_weekly_targets',
        recordId: `${userId}_${year}_W${week}`,
        action: 'SET_WEEKLY_TARGET',
        userId: user.id,
        tenantId: user.tenantId,
        details: { targetUserId: userId, year, week, amount: targetAmount },
      });
      // 缓存将在下次 getOrSet 时自动刷新（CacheService 不支持单条删除，数据会在 60 秒后过期）
    } catch (auditError) {
      logger.warn('[SalesWeeklyTarget] 审计日志记录失败', { error: auditError });
    }

    return apiSuccess(null);
  } catch (error) {
    logger.error('[SalesWeeklyTarget] 设置销售周目标异常', {
      route: 'sales/weekly-targets',
      error,
    });
    return apiError('设置销售周目标失败', 500);
  }
}
