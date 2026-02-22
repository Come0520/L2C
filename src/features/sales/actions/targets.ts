'use server';
/* eslint-disable no-console */

import { db } from '@/shared/api/db';
import { salesTargets, users } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { unstable_cache, revalidatePath } from 'next/cache';
import { logger } from '@/shared/lib/logger';
import { z } from 'zod';
import { AuditService } from '@/shared/services/audit-service';

export interface SalesTargetDTO {
  userId: string;
  userName: string;
  userAvatar: string | null;
  targetId: string | null;
  targetAmount: number;
  updatedAt: Date | null;
}

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
      .where(
        and(
          eq(users.tenantId, tenantId),
          eq(users.role, 'sales'),
          eq(users.isActive, true)
        )
      );
  },
  ['sales-targets-list'],
  { revalidate: 60, tags: ['sales-targets'] }
);

/**
 * 获取销售目标列表
 * 需要 tenantId 隔离，仅返回本租户的销售用户和目标
 */
export async function getSalesTargets(
  year: number,
  month: number
): Promise<{ success: boolean; data?: SalesTargetDTO[]; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      await AuditService.log(db, { action: 'GET_TARGETS_UNAUTHORIZED', tableName: 'sales_targets', recordId: 'none' });
      return { success: false, error: 'Unauthorized' };
    }

    // Zod 校验
    const validation = getSalesTargetsSchema.safeParse({ year, month });
    if (!validation.success) {
      await AuditService.log(db, { action: 'GET_TARGETS_VALIDATION_ERROR', tableName: 'sales_targets', recordId: 'none', details: { issues: validation.error.issues } });
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

    return { success: true, data };
  } catch (error) {
    console.error('[sales] 获取销售目标列表失败:', error);
    logger.error('getSalesTargets error:', error);
    await AuditService.log(db, { action: 'GET_TARGETS_ERROR', tableName: 'sales_targets', recordId: 'none', details: { error: String(error) } });
    return { success: false, error: 'Failed to fetch targets' };
  }
}

/**
 * 更新销售目标（含 Zod 校验 + 审计日志）
 * 仅管理员/店长可操作
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
      console.log('[sales] 创建/更新销售目标失败：未授权访问');
      await AuditService.log(db, { action: 'UPDATE_TARGET_UNAUTHORIZED', tableName: 'sales_targets', recordId: `${userId}-${year}-${month}` });
      return { success: false, error: 'Unauthorized' };
    }

    console.log('[sales] 创建/更新销售目标:', { targetId: `${userId}-${year}-${month}`, tenantId: session.user.tenantId, period: `${year}-${month}`, amount });

    // Zod 校验
    const validation = updateSalesTargetSchema.safeParse({ userId, year, month, amount });
    if (!validation.success) {
      console.log('[sales] 创建/更新销售目标失败：参数校验失败', validation.error.issues);
      await AuditService.log(db, { action: 'UPDATE_TARGET_VALIDATION_ERROR', tableName: 'sales_targets', recordId: `${userId}-${year}-${month}`, details: { issues: validation.error.issues } });
      return { success: false, error: validation.error.issues[0]?.message || '参数校验失败' };
    }

    // 权限检查：仅管理员/店长
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { role: true },
    });

    if (!['admin', 'manager', 'BOSS'].includes(currentUser?.role || '')) {
      console.log('[sales] 创建/更新销售目标失败：权限不足');
      await AuditService.log(db, { action: 'UPDATE_TARGET_PERMISSION_DENIED', tableName: 'sales_targets', recordId: `${userId}-${year}-${month}`, userId: session.user.id });
      return { success: false, error: 'Permission denied' };
    }

    // 查询旧值（用于审计日志）
    const oldTarget = await db.query.salesTargets.findFirst({
      where: and(
        eq(salesTargets.tenantId, session.user.tenantId),
        eq(salesTargets.userId, userId),
        eq(salesTargets.year, year),
        eq(salesTargets.month, month)
      ),
    });

    // Upsert
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

    // 审计日志
    if (oldTarget) {
      console.log('[sales] 更新销售目标成功:', { targetId: oldTarget.id, oldAmount: oldTarget.targetAmount, newAmount: amount });
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
      console.log('[sales] 创建销售目标成功:', { targetId: `${userId}-${year}-${month}`, newAmount: amount });
      await AuditService.log(db, {
        action: 'CREATE',
        tableName: 'sales_targets',
        recordId: `${userId}-${year}-${month}`,
        userId: session.user.id,
        tenantId: session.user.tenantId,
        newValues: { targetAmount: String(amount), userId, year, month },
      });
    }

    revalidatePath('/settings/sales/targets');
    return { success: true };
  } catch (error) {
    console.error('[sales] 创建/更新销售目标出错:', error);
    logger.error('updateSalesTarget error:', error);
    await AuditService.log(db, { action: 'UPDATE_TARGET_ERROR', tableName: 'sales_targets', recordId: `${userId}-${year}-${month}`, details: { error: String(error) } });
    return { success: false, error: 'Failed to update target' };
  }
}

/**
 * 调整目标值（含 Zod 校验 + 审计日志）
 * 仅管理员/店长可操作
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
      console.log('[sales] 调整目标值失败：未授权访问');
      await AuditService.log(db, { action: 'ADJUST_TARGET_UNAUTHORIZED', tableName: 'sales_targets', recordId: `${userId}-${year}-${month}` });
      return { success: false, error: 'Unauthorized' };
    }

    console.log('[sales] 调整目标值:', { targetId: `${userId}-${year}-${month}`, tenantId: session.user.tenantId, adjustAmount, reason });

    const validation = adjustSalesTargetSchema.safeParse({ userId, year, month, adjustAmount, reason });
    if (!validation.success) {
      console.log('[sales] 调整目标值失败：参数校验失败', validation.error.issues);
      await AuditService.log(db, { action: 'ADJUST_TARGET_VALIDATION_ERROR', tableName: 'sales_targets', recordId: `${userId}-${year}-${month}`, details: { issues: validation.error.issues } });
      return { success: false, error: validation.error.issues[0]?.message || '参数校验失败' };
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { role: true },
    });

    if (!['admin', 'manager', 'BOSS'].includes(currentUser?.role || '')) {
      console.log('[sales] 调整目标值失败：权限不足');
      await AuditService.log(db, { action: 'ADJUST_TARGET_PERMISSION_DENIED', tableName: 'sales_targets', recordId: `${userId}-${year}-${month}`, userId: session.user.id });
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
      console.log('[sales] 调整目标值失败：销售目标不存在');
      await AuditService.log(db, { action: 'ADJUST_TARGET_NOT_FOUND', tableName: 'sales_targets', recordId: `${userId}-${year}-${month}`, userId: session.user.id });
      return { success: false, error: 'Sales target does not exist' };
    }

    const newAmount = Number(oldTarget.targetAmount) + adjustAmount;
    if (newAmount < 0) {
      console.log('[sales] 调整目标值失败：调整后金额不能为负');
      await AuditService.log(db, { action: 'ADJUST_TARGET_INVALID_AMOUNT', tableName: 'sales_targets', recordId: oldTarget.id, userId: session.user.id });
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

    console.log('[sales] 调整销售目标成功:', { targetId: oldTarget.id, oldAmount: oldTarget.targetAmount, newAmount, reason });
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

    revalidatePath('/settings/sales/targets');
    return { success: true };
  } catch (error) {
    console.error('[sales] 调整目标值出错:', error);
    logger.error('adjustSalesTarget error:', error);
    await AuditService.log(db, { action: 'ADJUST_TARGET_ERROR', tableName: 'sales_targets', recordId: `${userId}-${year}-${month}`, details: { error: String(error) } });
    return { success: false, error: 'Failed to adjust target' };
  }
}

/**
 * 完成目标确认（含 Zod 校验 + 审计日志）
 * 仅管理员/店长可操作
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
      console.log('[sales] 确认目标失败：未授权访问');
      await AuditService.log(db, { action: 'CONFIRM_TARGET_UNAUTHORIZED', tableName: 'sales_targets', recordId: `${userId}-${year}-${month}` });
      return { success: false, error: 'Unauthorized' };
    }

    console.log('[sales] 确认目标:', { targetId: `${userId}-${year}-${month}`, tenantId: session.user.tenantId, notes });

    const validation = confirmSalesTargetSchema.safeParse({ userId, year, month, notes });
    if (!validation.success) {
      console.log('[sales] 确认目标失败：参数校验失败', validation.error.issues);
      await AuditService.log(db, { action: 'CONFIRM_TARGET_VALIDATION_ERROR', tableName: 'sales_targets', recordId: `${userId}-${year}-${month}`, details: { issues: validation.error.issues } });
      return { success: false, error: validation.error.issues[0]?.message || '参数校验失败' };
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { role: true },
    });

    if (!['admin', 'manager', 'BOSS'].includes(currentUser?.role || '')) {
      console.log('[sales] 确认目标失败：权限不足');
      await AuditService.log(db, { action: 'CONFIRM_TARGET_PERMISSION_DENIED', tableName: 'sales_targets', recordId: `${userId}-${year}-${month}`, userId: session.user.id });
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
      console.log('[sales] 确认目标失败：销售目标不存在');
      await AuditService.log(db, { action: 'CONFIRM_TARGET_NOT_FOUND', tableName: 'sales_targets', recordId: `${userId}-${year}-${month}`, userId: session.user.id });
      return { success: false, error: 'Sales target does not exist' };
    }

    console.log('[sales] 完成销售目标确认:', { targetId: target.id, targetAmount: target.targetAmount, notes });
    await AuditService.log(db, {
      action: 'CONFIRM_TARGET',
      tableName: 'sales_targets',
      recordId: target.id,
      userId: session.user.id,
      tenantId: session.user.tenantId,
      details: {
        confirmed: true,
        notes,
        targetAmount: target.targetAmount
      },
    });

    revalidatePath('/settings/sales/targets');
    return { success: true };
  } catch (error) {
    console.error('[sales] 确认目标出错:', error);
    logger.error('confirmSalesTarget error:', error);
    await AuditService.log(db, { action: 'CONFIRM_TARGET_ERROR', tableName: 'sales_targets', recordId: `${userId}-${year}-${month}`, details: { error: String(error) } });
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
 */
export async function getMySalesTarget(year?: number, month?: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      await AuditService.log(db, { action: 'GET_MY_TARGET_UNAUTHORIZED', tableName: 'sales_targets', recordId: 'none' });
      return { success: false, error: 'Unauthorized' };
    }

    const validation = getMySalesTargetSchema.safeParse({ year, month });
    if (!validation.success) {
      await AuditService.log(db, { action: 'GET_MY_TARGET_VALIDATION_ERROR', tableName: 'sales_targets', recordId: 'none', details: { issues: validation.error.issues } });
      return { success: false, error: validation.error.issues[0]?.message || '参数校验失败' };
    }

    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth() + 1;

    const result = await getCachedMySalesTarget(session.user.tenantId, session.user.id, targetYear, targetMonth);

    return {
      success: true,
      data: {
        targetAmount: parseFloat(result?.targetAmount as string) || 0,
      },
    };
  } catch (error) {
    console.error('[sales] 获取我的销售目标出错:', error);
    logger.error('getMySalesTarget error:', error);
    await AuditService.log(db, { action: 'GET_MY_TARGET_ERROR', tableName: 'sales_targets', recordId: 'none', details: { error: String(error) } });
    return { success: false, error: 'Failed' };
  }
}
