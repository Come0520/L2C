'use server';

/**
 * 报价单生命周期管理 Actions
 * 包含：提交、审批、拒绝、锁定、解锁、转订单、创建新版本
 */

import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { db } from '@/shared/api/db';
import { quotes } from '@/shared/api/schema/quotes';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';
import { QuoteLifecycleService } from '@/services/quote-lifecycle.service';
import { QuoteService } from '@/services/quote.service';
import { rejectQuoteDiscountSchema } from './schema';
import { checkPermission } from '@/shared/lib/auth';
import { AuditService } from '@/shared/lib/audit-service';
import { PERMISSIONS } from '@/shared/config/permissions';
import { AppError, ERROR_CODES } from '@/shared/lib/errors';
import { logger } from '@/shared/lib/logger';

/**
 * 【乐观锁】通用前置版本检查工具函数
 * 在委托 Service 层执行状态变更前，先校验版本号是否匹配，并递增版本
 * @param quoteId 报价单 ID
 * @param tenantId 租户 ID
 * @param version 客户端传入的版本号（可选）
 */
async function preflightVersionCheck(
  quoteId: string,
  tenantId: string,
  version?: number
): Promise<void> {
  if (version === undefined) return;

  const [updated] = await db
    .update(quotes)
    .set({ version: sql`${quotes.version} + 1`, updatedAt: new Date() })
    .where(and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId), eq(quotes.version, version)))
    .returning();

  if (!updated) {
    logger.warn('乐观锁冲突：前置检查发现版本号不匹配', {
      quoteId,
      tenantId,
      currentVersion: version,
    });
    throw new AppError('报价数据已被修改，请刷新后重试', ERROR_CODES.CONCURRENCY_CONFLICT, 409);
  }
}

// ─── 提交报价单 ─────────────────────────────────

const submitQuoteSchema = z.object({
  id: z.string().uuid(),
  /** 乐观锁版本号 */
  version: z.number().int().min(0).optional(),
});

/**
 * 客户端调用：提交报价单 (Submit Quote)
 * 应用状态机：DRAFT -> SUBMITTED（或根据折扣进入审批中）。
 * 包含：权限校验、乐观锁版本预检。
 *
 * @param params - 报价单 ID 及版本号
 * @returns 成功状态
 */
export async function submitQuoteAction(params: z.infer<typeof submitQuoteSchema>) {
  return submitQuote(params);
}

/**
 * 提交报价单进行审批或转换流程
 * 【乐观锁】传入 version 时启用并发冲突检测
 * @param data 包含报价单 ID 和可选版本号的对象
 * @param context 执行上下文
 */
export const submitQuote = createSafeAction(submitQuoteSchema, async (data, context) => {
  // P2-01: 权限校验
  const hasPermission = await checkPermission(context.session, PERMISSIONS.QUOTE.OWN_EDIT);
  if (!hasPermission) {
    logger.warn('无权执行此操作：提交报价单', { userId: context.session.user.id });
    throw new Error('无权执行此操作');
  }

  // 【乐观锁】前置版本检查
  await preflightVersionCheck(data.id, context.session.user.tenantId, data.version);

  await QuoteLifecycleService.submit(
    data.id,
    context.session.user.tenantId,
    context.session.user.id
  );

  // 审计日志：记录报价单提交
  await AuditService.recordFromSession(context.session, 'quotes', data.id, 'UPDATE', {
    new: { action: 'SUBMIT' },
  });

  revalidatePath(`/quotes/${data.id}`);
  revalidatePath('/quotes');
  revalidateTag('quotes', {});
  logger.info('[quotes] 报价单提交成功', { quoteId: data.id });
  return { success: true };
});

// ─── 拒绝报价单 ─────────────────────────────────

const rejectQuoteSchema = z.object({
  id: z.string().uuid(),
  rejectReason: z.string().min(1),
  /** 乐观锁版本号 */
  version: z.number().int().min(0).optional(),
});

/**
 * 客户端调用：驳回/拒绝报价单 (Reject Quote)
 * 场景：审批人通过该接口驳回存在问题的报价单，必须提供理由。
 * 逻辑：状态变更 -> 记录审计 -> revalidate 页面缓存。
 *
 * @param params - 包含 ID、拒绝理由及版本号
 * @returns 成功状态
 */
export async function rejectQuoteAction(params: z.infer<typeof rejectQuoteSchema>) {
  return rejectQuote(params);
}

/**
 * 拒绝当前报价单，需提供拒绝原因
 * 【乐观锁】传入 version 时启用并发冲突检测
 * @param data 包含报价单 ID、拒绝原因和可选版本号的对象
 * @param context 执行上下文
 */
export const rejectQuote = createSafeAction(rejectQuoteSchema, async (data, context) => {
  // P2-01: 权限校验
  const hasPermission = await checkPermission(context.session, PERMISSIONS.QUOTE.APPROVE);
  if (!hasPermission) {
    logger.warn('无权执行此操作：拒绝报价单', { userId: context.session.user.id });
    throw new Error('无权执行此操作');
  }

  // 【乐观锁】前置版本检查
  await preflightVersionCheck(data.id, context.session.user.tenantId, data.version);

  // 🔒 安全修复：传入租户ID以便 Service 层校验归属
  await QuoteLifecycleService.reject(data.id, data.rejectReason, context.session.user.tenantId);

  // 审计日志：记录报价单拒绝
  await AuditService.recordFromSession(context.session, 'quotes', data.id, 'UPDATE', {
    new: { action: 'REJECT', rejectReason: data.rejectReason },
  });

  revalidatePath(`/quotes/${data.id}`);
  revalidatePath('/quotes');
  revalidateTag('quotes', {});
  logger.info('[quotes] 报价单拒绝成功', { quoteId: data.id });
  return { success: true };
});

// ─── 锁定报价单 ─────────────────────────────────

const lockQuoteSchema = z.object({
  id: z.string().uuid(),
  lockedBy: z.string().uuid().optional(),
  /** 乐观锁版本号 */
  version: z.number().int().min(0).optional(),
});

/**
 * 客户端调用：锁定报价单 (Lock Quote)
 * 结果：报价单进入只读状态，防止非预期修改。
 */
export async function lockQuoteAction(params: z.infer<typeof lockQuoteSchema>) {
  return lockQuote(params);
}

/**
 * 锁定报价单以防止进一步编辑，通常用于待审批或最终确定前
 * 【乐观锁】传入 version 时启用并发冲突检测，版本不匹配将抛出 CONCURRENCY_CONFLICT
 * @param data 包含报价单 ID 和可选版本号的对象
 * @param context 执行上下文
 */
export const lockQuote = createSafeAction(lockQuoteSchema, async (data, context) => {
  const userTenantId = context.session.user.tenantId;

  // P2-01: 权限校验
  const hasPermission = await checkPermission(context.session, PERMISSIONS.QUOTE.OWN_EDIT);
  if (!hasPermission) {
    logger.warn('无权执行此操作：锁定报价单', { userId: context.session.user.id });
    throw new Error('无权执行此操作');
  }

  const quote = await db.query.quotes.findFirst({
    where: and(eq(quotes.id, data.id), eq(quotes.tenantId, userTenantId)),
  });

  if (!quote) {
    logger.warn('报价单不存在或无权操作', { quoteId: data.id, tenantId: userTenantId });
    throw new Error('报价单不存在或无权操作');
  }
  if (quote.lockedAt) {
    logger.warn('试图锁定已经锁定的报价单', { quoteId: data.id });
    throw new Error('该报价单已锁定');
  }

  // 【乐观锁】更新时携带版本自增，并在 where 条件中校验版本号
  const [updated] = await db
    .update(quotes)
    .set({
      lockedAt: new Date(),
      updatedAt: new Date(),
      version: sql`${quotes.version} + 1`,
    })
    .where(
      and(
        eq(quotes.id, data.id),
        eq(quotes.tenantId, userTenantId),
        data.version !== undefined ? eq(quotes.version, data.version) : undefined
      )
    )
    .returning();

  // 【乐观锁】版本不匹配时抛出并发冲突错误
  if (!updated && data.version !== undefined) {
    logger.warn('乐观锁冲突：报价单已被修改 (锁定操作)', { quoteId: data.id });
    throw new AppError('报价数据已被修改，请刷新后重试', ERROR_CODES.CONCURRENCY_CONFLICT, 409);
  }

  // 审计日志：记录报价单锁定
  await AuditService.recordFromSession(context.session, 'quotes', data.id, 'UPDATE', {
    new: { action: 'LOCK', lockedAt: new Date().toISOString() },
  });

  revalidatePath(`/quotes/${data.id}`);
  revalidateTag('quotes', {});
  logger.info('[quotes] 报价单锁定成功', { quoteId: data.id });
  return updated;
});

// ─── 解锁报价单 ─────────────────────────────────

const unlockQuoteSchema = z.object({
  id: z.string().uuid(),
  /** 乐观锁版本号 */
  version: z.number().int().min(0).optional(),
});

/**
 * 客户端调用：解锁报价单 (Unlock Quote)
 */
export async function unlockQuoteAction(params: z.infer<typeof unlockQuoteSchema>) {
  return unlockQuote(params);
}

/**
 * 解锁先前锁定的报价单，恢复编辑能力
 * 【乐观锁】传入 version 时启用并发冲突检测，版本不匹配将抛出 CONCURRENCY_CONFLICT
 * @param data 包含报价单 ID 和可选版本号的对象
 * @param context 执行上下文
 */
export const unlockQuote = createSafeAction(unlockQuoteSchema, async (data, context) => {
  const userTenantId = context.session.user.tenantId;

  // P2-01: 权限校验
  const hasPermission = await checkPermission(context.session, PERMISSIONS.QUOTE.OWN_EDIT);
  if (!hasPermission) {
    logger.warn('无权执行此操作：解锁报价单', { userId: context.session.user.id });
    throw new Error('无权执行此操作');
  }

  const quote = await db.query.quotes.findFirst({
    where: and(eq(quotes.id, data.id), eq(quotes.tenantId, userTenantId)),
  });

  if (!quote) {
    logger.warn('报价单不存在或无权操作', { quoteId: data.id, tenantId: userTenantId });
    throw new Error('报价单不存在或无权操作');
  }

  // 【乐观锁】更新时携带版本自增，并在 where 条件中校验版本号
  const [updated] = await db
    .update(quotes)
    .set({
      lockedAt: null,
      updatedAt: new Date(),
      version: sql`${quotes.version} + 1`,
    })
    .where(
      and(
        eq(quotes.id, data.id),
        eq(quotes.tenantId, userTenantId),
        data.version !== undefined ? eq(quotes.version, data.version) : undefined
      )
    )
    .returning();

  // 【乐观锁】版本不匹配时抛出并发冲突错误
  if (!updated && data.version !== undefined) {
    logger.warn('乐观锁冲突：报价单已被修改 (解锁操作)', { quoteId: data.id });
    throw new AppError('报价数据已被修改，请刷新后重试', ERROR_CODES.CONCURRENCY_CONFLICT, 409);
  }

  // 审计日志：记录报价单解锁
  await AuditService.recordFromSession(context.session, 'quotes', data.id, 'UPDATE', {
    new: { action: 'UNLOCK' },
  });

  revalidatePath(`/quotes/${data.id}`);
  revalidateTag('quotes', {});
  logger.info('[quotes] 报价单解锁成功', { quoteId: data.id });
  return updated;
});

// ─── 审批报价单 ─────────────────────────────────

const approveQuoteSchema = z.object({
  id: z.string().uuid(),
  /** 乐观锁版本号 */
  version: z.number().int().min(0).optional(),
});

/**
 * 客户端调用：审批通过报价单 (Approve Quote)
 * 【权限校验】仅拥有审批权限的用户可操作。
 */
export async function approveQuoteAction(params: z.infer<typeof approveQuoteSchema>) {
  return approveQuote(params);
}

/**
 * 审批通过折扣超限的报价单
 * 【乐观锁】传入 version 时启用并发冲突检测
 * @param data 包含报价单 ID 和可选版本号的对象
 * @param context 执行上下文
 */
export const approveQuote = createSafeAction(approveQuoteSchema, async (data, context) => {
  // P2-01: 权限校验
  const hasPermission = await checkPermission(context.session, PERMISSIONS.QUOTE.APPROVE);
  if (!hasPermission) {
    logger.warn('无权执行此操作：审批通过报价单', { userId: context.session.user.id });
    throw new Error('无权执行此操作');
  }

  // 【乐观锁】前置版本检查
  await preflightVersionCheck(data.id, context.session.user.tenantId, data.version);

  // 🔒 安全修复：传入租户ID以便 Service 层校验归属
  await QuoteLifecycleService.approve(
    data.id,
    context.session.user.id,
    context.session.user.tenantId
  );

  // 审计日志：记录报价单审批
  await AuditService.recordFromSession(context.session, 'quotes', data.id, 'UPDATE', {
    new: { action: 'APPROVE' },
  });

  revalidatePath(`/quotes/${data.id}`);
  revalidatePath('/quotes');
  revalidateTag('quotes', {});
  logger.info('[quotes] 报价单审批成功', { quoteId: data.id });
  return { success: true };
});

// ─── 拒绝折扣变更 ───────────────────────────────

/**
 * 拒绝对报价单进行的过高折扣，恢复原价或要求重新修改
 * 仅具有审批权限的用户可执行
 * @param data 包含报价单 ID 和拒绝原因的对象
 * @param context 执行上下文
 */
export const rejectQuoteDiscount = createSafeAction(
  rejectQuoteDiscountSchema,
  async (data, context) => {
    // P2-01: 权限校验
    const hasPermission = await checkPermission(context.session, PERMISSIONS.QUOTE.APPROVE);
    if (!hasPermission) {
      logger.warn('无权执行此操作：拒绝折扣', { userId: context.session.user.id });
      throw new Error('无权执行此操作');
    }

    // 🔒 安全修复：传入租户ID以便 Service 层校验归属
    await QuoteLifecycleService.reject(data.id, data.reason, context.session.user.tenantId);

    // 审计日志：记录折扣拒绝
    await AuditService.recordFromSession(context.session, 'quotes', data.id, 'UPDATE', {
      new: { action: 'REJECT_DISCOUNT', reason: data.reason },
    });

    revalidatePath(`/quotes/${data.id}`);
    revalidatePath('/quotes');
    revalidateTag('quotes', {});
    return { success: true };
  }
);

// ─── 转订单 ─────────────────────────────────────

const convertQuoteToOrderSchema = z.object({
  quoteId: z.string().uuid(),
  /** 乐观锁版本号 */
  version: z.number().int().min(0).optional(),
});

/**
 * 客户端调用：报价转订单 (Convert to Order)
 * 逻辑：由 LifecycleService 生成正式订单 -> 更新原报价状态。
 *
 * @param params - 包含报价单 ID 及版本号
 * @returns 新建的订单对象
 */
export async function convertQuoteToOrderAction(params: z.infer<typeof convertQuoteToOrderSchema>) {
  return convertQuoteToOrder(params);
}

/**
 * 将批准的报价单转换为正式订单
 * 【乐观锁】传入 version 时启用并发冲突检测
 * @param data 包含报价单 ID 和可选版本号的对象
 * @param context 执行上下文
 */
export const convertQuoteToOrder = createSafeAction(
  convertQuoteToOrderSchema,
  async (data, context) => {
    logger.info('[quotes] 开始转订单', { quoteId: data.quoteId, version: data.version });
    // P2-01: 权限校验 (转订单需要创建订单权限)
    const hasPermission = await checkPermission(context.session, PERMISSIONS.ORDER.OWN_EDIT);
    if (!hasPermission) {
      logger.warn('无权执行此操作：转订单', { userId: context.session.user.id });
      throw new Error('无权执行此操作');
    }

    // 【乐观锁】前置版本检查
    await preflightVersionCheck(data.quoteId, context.session.user.tenantId, data.version);

    const order = await QuoteLifecycleService.convertToOrder(
      data.quoteId,
      context.session.user.tenantId,
      context.session.user.id
    );

    // 审计日志：记录报价转订单
    await AuditService.recordFromSession(context.session, 'quotes', data.quoteId, 'UPDATE', {
      new: { action: 'CONVERT_TO_ORDER', orderId: order?.id },
    });

    revalidatePath('/orders');
    revalidatePath(`/quotes/${data.quoteId}`);
    revalidateTag('quotes', {});
    logger.info('[quotes] 报价转订单成功', { quoteId: data.quoteId, orderId: order?.id });
    return order;
  }
);

// ─── 创建新版本 ─────────────────────────────────

const createNextVersionSchema = z.object({
  quoteId: z.string().uuid(),
  /** 乐观锁版本号 */
  version: z.number().int().min(0).optional(),
});

/**
 * 客户端调用：创建报价单新版本 (Create New Version)
 * 逻辑：复制当前报价单结构 -> 版本号递增 -> 链接到 rootQuoteId。
 *
 * @param params - 包含源报价单 ID 及版本号
 * @returns 新版本报价单对象
 */
export async function createNextVersionAction(params: z.infer<typeof createNextVersionSchema>) {
  return createNextVersion(params);
}

/**
 * 根据现有报价单创建一个新版本作为迭代基础
 * 【乐观锁】传入 version 时启用并发冲突检测
 * @param data 包含源报价单 ID 和可选版本号的对象
 * @param context 执行上下文
 * @returns 新版本报价单
 */
export const createNextVersion = createSafeAction(
  createNextVersionSchema,
  async (data, context) => {
    logger.info('[quotes] 开始创建新版本', { quoteId: data.quoteId, version: data.version });
    // P2-01: 权限校验 (创建新版本视为创建报价)
    const hasPermission = await checkPermission(context.session, PERMISSIONS.QUOTE.OWN_EDIT);
    if (!hasPermission) {
      logger.warn('无权执行此操作：创建新版本', { userId: context.session.user.id });
      throw new Error('无权执行此操作');
    }

    // 【乐观锁】前置版本检查
    await preflightVersionCheck(data.quoteId, context.session.user.tenantId, data.version);

    const newQuote = await QuoteService.createNextVersion(
      data.quoteId,
      context.session.user.id,
      context.session.user.tenantId
    );

    // 审计日志：记录创建新版本
    await AuditService.recordFromSession(context.session, 'quotes', newQuote.id, 'CREATE', {
      new: { action: 'CREATE_VERSION', sourceQuoteId: data.quoteId },
    });

    revalidatePath('/quotes');
    revalidatePath(`/quotes/${newQuote.id}`);
    revalidatePath(`/quotes/${data.quoteId}`);
    revalidateTag('quotes', {});
    logger.info('[quotes] 报价新版本创建成功', {
      sourceQuoteId: data.quoteId,
      newQuoteId: newQuote.id,
    });
    return newQuote;
  }
);
