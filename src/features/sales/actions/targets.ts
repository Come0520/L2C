'use server';

import { db } from '@/shared/api/db';
import { salesTargets, users } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { unstable_cache } from 'next/cache';
import { logger } from '@/shared/lib/logger';
import { z } from 'zod';
import { AuditService } from '@/shared/services/audit-service';

import { SalesTargetDTO } from '../types';

/**
 * 获取销售目标列表 Zod Schema
 */
const getSalesTargetsSchema = z.object({
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
});

/**
 * 更新销售目标 Zod Schema
 */
const updateSalesTargetSchema = z.object({
  userId: z.string().min(1, '用户 ID 不能为空'),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  amount: z.number().min(0, '目标金额不能为负数'),
});

/**
 * 获取我的销售目标 Zod Schema
 */
const getMySalesTargetSchema = z.object({
  year: z.number().int().min(2020).max(2100).optional(),
  month: z.number().int().min(1).max(12).optional(),
});

/**
 * 调整目标值 Zod Schema
 */
const adjustSalesTargetSchema = z.object({
  userId: z.string().min(1, '用户 ID 不能为空'),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  adjustAmount: z.number(), // 可正可负
  reason: z.string().max(500).optional(),
});

/**
 * 确认目标 Zod Schema
 */
const confirmSalesTargetSchema = z.object({
  userId: z.string().min(1, '用户 ID 不能为空'),
  year: z.number().int().min(2020).max(2100),
  month: z.number().int().min(1).max(12),
  notes: z.string().max(500).optional(),
});

const getCachedSalesTargets = unstable_cache(
  async (tenantId: string, year: number, month: number) => {
    return db
      .select({
        userId: users.id,
        userName: users.name,
        userAvatar: users.avatarUrl,
        targetId: salesTargets.id,
        targetAmount: salesTargets.targetAmount,
        updatedAt: salesTargets.updatedAt,
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
  },
  ['sales-targets-list'],
  { revalidate: 60, tags: ['sales-targets'] }
);

/**
 * 获取销售目标列表
 *
 * @param year 年份
 * @param month 月份
 * @returns 包含销售目标 DTO 列表的结果对象
 * @throws 数据库或授权错误时抛出异常
 */
export async function getSalesTargets(
  year: number,
  month: number
): Promise<{ success: boolean; data?: SalesTargetDTO[]; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      await AuditService.log(db, {
        action: 'GET_TARGETS_UNAUTHORIZED',
        tableName: 'sales_targets',
        recordId: 'none',
      });
      return { success: false, error: 'Unauthorized' };
    }

    const validation = getSalesTargetsSchema.safeParse({ year, month });
    if (!validation.success) {
      await AuditService.log(db, {
        action: 'GET_TARGETS_VALIDATION_ERROR',
        tableName: 'sales_targets',
        recordId: 'none',
        details: { issues: validation.error.issues },
      });
      return { success: false, error: validation.error.issues[0]?.message || '参数校验失败' };
    }

    const result = await getCachedSalesTargets(session.user.tenantId, year, month);

    const data: SalesTargetDTO[] = result.map((r) => ({
      userId: r.userId,
      userName: r.userName || 'Unknown',
      userAvatar: r.userAvatar,
      targetId: r.targetId,
      targetAmount: parseFloat(r.targetAmount as string) || 0,
      updatedAt: r.updatedAt,
    }));

    logger.info(
      `[sales][targets] Successfully fetched targets for ${year}-${month}, count: ${data.length}`
    );
    return { success: true, data };
  } catch (error) {
    logger.error('[sales][targets] Failed to getSalesTargets:', error);
    await AuditService.log(db, {
      action: 'GET_TARGETS_ERROR',
      tableName: 'sales_targets',
      recordId: 'none',
      details: { error: String(error) },
    });
    return { success: false, error: 'Failed to fetch targets' };
  }
}

/**
 * 更新或创建销售目标
 * 仅具有管理权限 (admin/manager/BOSS) 的用户可执行此操作
 *
 * @param userId 目标所属用户 ID
 * @param year 年份
 * @param month 月份
 * @param amount 目标金额
 * @returns 操作结果
 */
export async function updateSalesTarget(
  userId: string,
  year: number,
  month: number,
  amount: number
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      logger.warn(`[sales][targets] Unauthorized update target attempt: user ${session?.user?.id}`);
      await AuditService.log(db, {
        action: 'UPDATE_TARGET_UNAUTHORIZED',
        tableName: 'sales_targets',
        recordId: `${userId}-${year}-${month}`,
      });
      return { success: false, error: 'Unauthorized' };
    }

    // Zod 校验
    const validation = updateSalesTargetSchema.safeParse({ userId, year, month, amount });
    if (!validation.success) {
      logger.error(
        '[sales][targets] Validation failed for updateSalesTarget:',
        validation.error.issues
      );
      await AuditService.log(db, {
        action: 'UPDATE_TARGET_VALIDATION_ERROR',
        tableName: 'sales_targets',
        recordId: `${userId}-${year}-${month}`,
        details: { issues: validation.error.issues },
      });
      return { success: false, error: validation.error.issues[0]?.message || '参数校验失败' };
    }

    // 权限检查
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { role: true },
    });

    if (!['admin', 'manager', 'BOSS'].includes(currentUser?.role || '')) {
      logger.warn(
        `[sales][targets] Permission denied for updateSalesTarget: user ${session.user.id}`
      );
      await AuditService.log(db, {
        action: 'UPDATE_TARGET_PERMISSION_DENIED',
        tableName: 'sales_targets',
        recordId: `${userId}-${year}-${month}`,
        userId: session.user.id,
      });
      return { success: false, error: 'Permission denied' };
    }

    const oldTarget = await db.query.salesTargets.findFirst({
      where: and(
        eq(salesTargets.tenantId, session.user.tenantId),
        eq(salesTargets.userId, userId),
        eq(salesTargets.year, year),
        eq(salesTargets.month, month)
      ),
    });

    await db
      .insert(salesTargets)
      .values({
        tenantId: session.user.tenantId,
        userId,
        year,
        month,
        targetAmount: String(amount),
        updatedBy: session.user.id,
      })
      .onConflictDoUpdate({
        target: [salesTargets.tenantId, salesTargets.userId, salesTargets.year, salesTargets.month],
        set: {
          targetAmount: String(amount),
          updatedAt: new Date(),
          updatedBy: session.user.id,
        },
      });

    if (oldTarget) {
      logger.info(
        `[sales][targets] Successfully updated target: ${oldTarget.id}, from ${oldTarget.targetAmount} to ${amount}`
      );
      await AuditService.log(db, {
        action: 'UPDATE',
        tableName: 'sales_targets',
        recordId: oldTarget.id,
        userId: session.user.id,
        tenantId: session.user.tenantId,
        oldValues: { targetAmount: oldTarget.targetAmount },
        newValues: { targetAmount: String(amount), userId, year, month },
      });
    } else {
      logger.info(`[sales][targets] Successfully created target for ${userId}, amount: ${amount}`);
      await AuditService.log(db, {
        action: 'CREATE',
        tableName: 'sales_targets',
        recordId: `${userId}-${year}-${month}`,
        userId: session.user.id,
        tenantId: session.user.tenantId,
        newValues: { targetAmount: String(amount), userId, year, month },
      });
    }

    // 批量失效相关缓存
    const { revalidateTag } = await import('next/cache');
    revalidateTag('sales-targets', {});
    revalidateTag('sales-dashboard', {});
    revalidateTag('sales-analytics', {});

    return { success: true };
  } catch (error) {
    logger.error('[sales][targets] Exception in updateSalesTarget:', error);
    await AuditService.log(db, {
      action: 'UPDATE_TARGET_ERROR',
      tableName: 'sales_targets',
      recordId: `${userId}-${year}-${month}`,
      details: { error: String(error) },
    });
    return { success: false, error: 'Failed to update target' };
  }
}

/**
 * 调整现有的销售目标值
 *
 * @param userId 销售用户 ID
 * @param year 年份
 * @param month 月份
 * @param adjustAmount 调整金额（正数为增加，负数为减少）
 * @param reason 调整原因（可选）
 */
export async function adjustSalesTarget(
  userId: string,
  year: number,
  month: number,
  adjustAmount: number,
  reason?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      logger.warn(`[sales][targets] Unauthorized adjust target attempt: user ${session?.user?.id}`);
      await AuditService.log(db, {
        action: 'ADJUST_TARGET_UNAUTHORIZED',
        tableName: 'sales_targets',
        recordId: `${userId}-${year}-${month}`,
      });
      return { success: false, error: 'Unauthorized' };
    }

    const validation = adjustSalesTargetSchema.safeParse({
      userId,
      year,
      month,
      adjustAmount,
      reason,
    });
    if (!validation.success) {
      logger.error(
        '[sales][targets] Validation failed for adjustSalesTarget:',
        validation.error.issues
      );
      await AuditService.log(db, {
        action: 'ADJUST_TARGET_VALIDATION_ERROR',
        tableName: 'sales_targets',
        recordId: `${userId}-${year}-${month}`,
        details: { issues: validation.error.issues },
      });
      return { success: false, error: validation.error.issues[0]?.message || '参数校验失败' };
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { role: true },
    });

    if (!['admin', 'manager', 'BOSS'].includes(currentUser?.role || '')) {
      logger.warn(
        `[sales][targets] Permission denied for adjustSalesTarget: user ${session.user.id}`
      );
      await AuditService.log(db, {
        action: 'ADJUST_TARGET_PERMISSION_DENIED',
        tableName: 'sales_targets',
        recordId: `${userId}-${year}-${month}`,
        userId: session.user.id,
      });
      return { success: false, error: 'Permission denied' };
    }

    const oldTarget = await db.query.salesTargets.findFirst({
      where: and(
        eq(salesTargets.tenantId, session.user.tenantId),
        eq(salesTargets.userId, userId),
        eq(salesTargets.year, year),
        eq(salesTargets.month, month)
      ),
    });

    if (!oldTarget) {
      logger.error(`[sales][targets] Target not found for adjustment: ${userId}-${year}-${month}`);
      await AuditService.log(db, {
        action: 'ADJUST_TARGET_NOT_FOUND',
        tableName: 'sales_targets',
        recordId: `${userId}-${year}-${month}`,
        userId: session.user.id,
      });
      return { success: false, error: 'Sales target does not exist' };
    }

    const newAmount = Number(oldTarget.targetAmount) + adjustAmount;
    if (newAmount < 0) {
      logger.warn(`[sales][targets] Invalid adjustment to negative total: ${newAmount}`);
      await AuditService.log(db, {
        action: 'ADJUST_TARGET_INVALID_AMOUNT',
        tableName: 'sales_targets',
        recordId: oldTarget.id,
        userId: session.user.id,
      });
      return { success: false, error: 'Target amount cannot be negative' };
    }

    await db
      .update(salesTargets)
      .set({
        targetAmount: String(newAmount),
        updatedAt: new Date(),
        updatedBy: session.user.id,
      })
      .where(eq(salesTargets.id, oldTarget.id));

    logger.info(
      `[sales][targets] Successfully adjusted target ${oldTarget.id} by ${adjustAmount}, new total: ${newAmount}`
    );
    await AuditService.log(db, {
      action: 'ADJUST_TARGET_VALUE',
      tableName: 'sales_targets',
      recordId: oldTarget.id,
      userId: session.user.id,
      tenantId: session.user.tenantId,
      oldValues: { targetAmount: oldTarget.targetAmount },
      newValues: { targetAmount: String(newAmount) },
      details: { adjustAmount, reason },
    });

    const { revalidateTag } = await import('next/cache');
    revalidateTag('sales-targets', {});
    revalidateTag('sales-dashboard', {});
    revalidateTag('sales-analytics', {});

    return { success: true };
  } catch (error) {
    logger.error('[sales][targets] Exception in adjustSalesTarget:', error);
    await AuditService.log(db, {
      action: 'ADJUST_TARGET_ERROR',
      tableName: 'sales_targets',
      recordId: `${userId}-${year}-${month}`,
      details: { error: String(error) },
    });
    return { success: false, error: 'Failed to adjust target' };
  }
}

/**
 * 确认销售目标
 *
 * @param userId 销售用户 ID
 * @param year 年份
 * @param month 月份
 * @param notes 确认说明
 */
export async function confirmSalesTarget(
  userId: string,
  year: number,
  month: number,
  notes?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      logger.warn(
        `[sales][targets] Unauthorized confirm target attempt: user ${session?.user?.id}`
      );
      await AuditService.log(db, {
        action: 'CONFIRM_TARGET_UNAUTHORIZED',
        tableName: 'sales_targets',
        recordId: `${userId}-${year}-${month}`,
      });
      return { success: false, error: 'Unauthorized' };
    }

    const validation = confirmSalesTargetSchema.safeParse({ userId, year, month, notes });
    if (!validation.success) {
      logger.error(
        '[sales][targets] Validation failed for confirmSalesTarget:',
        validation.error.issues
      );
      await AuditService.log(db, {
        action: 'CONFIRM_TARGET_VALIDATION_ERROR',
        tableName: 'sales_targets',
        recordId: `${userId}-${year}-${month}`,
        details: { issues: validation.error.issues },
      });
      return { success: false, error: validation.error.issues[0]?.message || '参数校验失败' };
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { role: true },
    });

    if (!['admin', 'manager', 'BOSS'].includes(currentUser?.role || '')) {
      logger.warn(
        `[sales][targets] Permission denied for confirmSalesTarget: user ${session.user.id}`
      );
      await AuditService.log(db, {
        action: 'CONFIRM_TARGET_PERMISSION_DENIED',
        tableName: 'sales_targets',
        recordId: `${userId}-${year}-${month}`,
        userId: session.user.id,
      });
      return { success: false, error: 'Permission denied' };
    }

    const target = await db.query.salesTargets.findFirst({
      where: and(
        eq(salesTargets.tenantId, session.user.tenantId),
        eq(salesTargets.userId, userId),
        eq(salesTargets.year, year),
        eq(salesTargets.month, month)
      ),
    });

    if (!target) {
      logger.error(
        `[sales][targets] Target not found for confirmation: ${userId}-${year}-${month}`
      );
      await AuditService.log(db, {
        action: 'CONFIRM_TARGET_NOT_FOUND',
        tableName: 'sales_targets',
        recordId: `${userId}-${year}-${month}`,
        userId: session.user.id,
      });
      return { success: false, error: 'Sales target does not exist' };
    }

    logger.info(`[sales][targets] Successfully confirmed target: ${target.id}`);
    await AuditService.log(db, {
      action: 'CONFIRM_TARGET',
      tableName: 'sales_targets',
      recordId: target.id,
      userId: session.user.id,
      tenantId: session.user.tenantId,
      details: {
        confirmed: true,
        notes,
        targetAmount: target.targetAmount,
      },
    });

    const { revalidateTag } = await import('next/cache');
    revalidateTag('sales-targets', {});
    revalidateTag('sales-dashboard', {});
    revalidateTag('sales-analytics', {});

    return { success: true };
  } catch (error) {
    logger.error('[sales][targets] Exception in confirmSalesTarget:', error);
    await AuditService.log(db, {
      action: 'CONFIRM_TARGET_ERROR',
      tableName: 'sales_targets',
      recordId: `${userId}-${year}-${month}`,
      details: { error: String(error) },
    });
    return { success: false, error: 'Failed to confirm target' };
  }
}

const getCachedMySalesTarget = unstable_cache(
  async (tenantId: string, userId: string, targetYear: number, targetMonth: number) => {
    return db.query.salesTargets.findFirst({
      where: and(
        eq(salesTargets.tenantId, tenantId),
        eq(salesTargets.userId, userId),
        eq(salesTargets.year, targetYear),
        eq(salesTargets.month, targetMonth)
      ),
      columns: { targetAmount: true },
    });
  },
  ['my-sales-target-detail'],
  { revalidate: 60, tags: ['sales-targets'] }
);

/**
 * 获取当前用户的销售目标
 *
 * @param year 年份 (可选，默认当前年)
 * @param month 月份 (可选，默认当前月)
 * @returns 包含目标金额的结果
 */
export async function getMySalesTarget(year?: number, month?: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      await AuditService.log(db, {
        action: 'GET_MY_TARGET_UNAUTHORIZED',
        tableName: 'sales_targets',
        recordId: 'none',
      });
      return { success: false, error: 'Unauthorized' };
    }

    const validation = getMySalesTargetSchema.safeParse({ year, month });
    if (!validation.success) {
      await AuditService.log(db, {
        action: 'GET_MY_TARGET_VALIDATION_ERROR',
        tableName: 'sales_targets',
        recordId: 'none',
        details: { issues: validation.error.issues },
      });
      return { success: false, error: validation.error.issues[0]?.message || '参数校验失败' };
    }

    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const result = await getCachedMySalesTarget(
      session.user.tenantId,
      session.user.id,
      targetYear,
      targetMonth
    );

    logger.info(
      `[sales][targets] getMySalesTarget success, user: ${session.user.id}, targetYear: ${targetYear}, targetMonth: ${targetMonth}`
    );
    return {
      success: true,
      data: {
        targetAmount: parseFloat(result?.targetAmount as string) || 0,
      },
    };
  } catch (error) {
    logger.error('[sales][targets] Failed in getMySalesTarget:', error);
    await AuditService.log(db, {
      action: 'GET_MY_TARGET_ERROR',
      tableName: 'sales_targets',
      recordId: 'none',
      details: { error: String(error) },
    });
    return { success: false, error: 'Failed' };
  }
}
