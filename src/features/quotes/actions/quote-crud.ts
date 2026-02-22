'use server';

/**
 * 报价单 CRUD 操作
 * 包含：创建报价单、更新报价单、复制报价单、创建报价套餐
 */

import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { db } from '@/shared/api/db';
import { AuditService } from '@/shared/lib/audit-service';
import { quotes } from '@/shared/api/schema/quotes';
import { eq, and, sql } from 'drizzle-orm';
import { AppError, ERROR_CODES } from '@/shared/lib/errors';
import { revalidatePath } from 'next/cache';
import { QuoteService } from '@/services/quote.service';
import { DiscountControlService } from '@/services/discount-control.service';
import Decimal from 'decimal.js';
import { createQuoteSchema, updateQuoteSchema, createQuoteBundleSchema } from './schema';
import { updateBundleTotal } from './shared-helpers';
import { logger } from '@/shared/lib/logger';

// ─── 创建报价套餐 ───────────────────────────────

/**
 * 内部服务器操作：创建报价套餐
 * @param data 套餐请求参数
 * @param context 执行上下文，包含用户会话信息
 * @returns 创建的套餐实例
 * @throws 缺少租户信息时抛出错误
 */
export const createQuoteBundleActionInternal = createSafeAction(
  createQuoteBundleSchema,
  async (data, context) => {
    const tenantId = context.session.user.tenantId;
    if (!tenantId) {
      logger.error('未授权访问：缺少租户信息');
      throw new Error('未授权访问：缺少租户信息');
    }

    logger.info('[quotes] 开始创建报价套餐', { customerId: data.customerId, leadId: data.leadId });

    const quoteNo = `QT${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const [newBundle] = await db
      .insert(quotes)
      .values({
        quoteNo,
        tenantId,
        customerId: data.customerId,
        leadId: data.leadId,
        title: `报价套餐 - ${quoteNo}`,
        notes: data.remark,
        status: 'DRAFT',
        createdBy: context.session.user.id,
      })
      .returning();

    // 设置 rootQuoteId
    await db.update(quotes).set({ rootQuoteId: newBundle.id }).where(eq(quotes.id, newBundle.id));

    // 审计日志：记录报价套餐创建
    await AuditService.recordFromSession(context.session, 'quotes', newBundle.id, 'CREATE', {
      new: { quoteNo: newBundle.quoteNo, customerId: data.customerId, type: 'BUNDLE' },
    });

    revalidatePath('/quotes');
    logger.info('[quotes] 报价套餐创建成功', { bundleId: newBundle.id, quoteNo: newBundle.quoteNo });
    return newBundle;
  }
);

/**
 * 客户端可调用的无上下文包装方法：创建报价套餐
 * @param params 套餐请求参数
 * @returns 包装了响应的套餐实例
 */

// ─── 创建报价单 ─────────────────────────────────

/**
 * 内部服务器操作：创建报价单
 * @param data 报价单请求参数
 * @param context 执行上下文，包含用户会话信息
 * @returns 创建的报价单实例（自动设为根版本并可选择关联套餐）
 * @throws 缺少租户信息时抛出错误
 */
const createQuoteActionInternal = createSafeAction(createQuoteSchema, async (data, context) => {
  const tenantId = context.session.user.tenantId;
  if (!tenantId) {
    logger.error('未授权访问：缺少租户信息');
    throw new Error('未授权访问：缺少租户信息');
  }

  const quoteNo = `QT${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  logger.info('[quotes] 开始创建报价单', { customerId: data.customerId, bundleId: data.bundleId, title: data.title });

  const [newQuote] = await db
    .insert(quotes)
    .values({
      quoteNo,
      tenantId,
      customerId: data.customerId,
      leadId: data.leadId,
      measureVariantId: data.measureVariantId,
      title: data.title || '新报价单',
      status: 'DRAFT',
      bundleId: data.bundleId,
      createdBy: context.session.user.id,
    })
    .returning();

  // 每个报价单都是自己版本链的根节点（即使是子报价也如此）
  const rootId = newQuote.id;
  await db.update(quotes).set({ rootQuoteId: rootId }).where(eq(quotes.id, newQuote.id));

  newQuote.rootQuoteId = rootId;

  // 若加入套餐，更新套餐总额
  if (data.bundleId) {
    await updateBundleTotal(data.bundleId, tenantId);
  }

  // 审计日志：记录报价单创建
  await AuditService.recordFromSession(context.session, 'quotes', newQuote.id, 'CREATE', {
    new: { quoteNo: newQuote.quoteNo, customerId: data.customerId, bundleId: data.bundleId },
  });

  revalidatePath('/quotes');
  logger.info('[quotes] 报价单创建成功', { quoteId: newQuote.id, quoteNo: newQuote.quoteNo });
  return newQuote;
});

/**
 * 客户端可调用的无上下文包装方法：创建报价单
 * @param params 报价单请求参数
 * @returns 包装了响应的报价单实例
 */
export async function createQuote(params: z.infer<typeof createQuoteSchema>) {
  return createQuoteActionInternal(params);
}

// ─── 更新报价单 ─────────────────────────────────

/**
 * 更新报价单，包含自动重新计算折扣和最终金额的校验逻辑
 * 【乐观锁】传入 version 时启用并发冲突检测，版本不匹配将抛出 CONCURRENCY_CONFLICT
 * @param data 包含要更新属性的对象（含报价单ID 和可选的版本号）
 * @param context 执行上下文，用于安全检查和审计日志
 * @returns 包含成功状态的响应
 */
export const updateQuote = createSafeAction(updateQuoteSchema, async (data, context) => {
  const { id, version, ...updateData } = data;
  const userTenantId = context.session.user.tenantId;
  logger.info('[quotes] 开始更新报价单', { quoteId: id, version, updateKeys: Object.keys(updateData) });

  // 安全检查：验证报价单属于当前租户
  const quote = await db.query.quotes.findFirst({
    where: and(eq(quotes.id, id), eq(quotes.tenantId, userTenantId)),
  });

  if (!quote) {
    logger.warn('报价单不存在或无权操作', { quoteId: id, tenantId: userTenantId });
    throw new Error('报价单不存在或无权操作');
  }

  // 折扣逻辑（使用 Decimal.js 保证精度一致性）
  const totalAmountDec = new Decimal(quote.totalAmount || 0);
  const oldRate = new Decimal(quote.discountRate || 1);
  const newRate = updateData.discountRate !== undefined
    ? new Decimal(updateData.discountRate)
    : oldRate;
  const newDiscountAmountDec = updateData.discountAmount !== undefined
    ? new Decimal(updateData.discountAmount)
    : new Decimal(quote.discountAmount || 0);

  // 审批检查
  const requiresApproval = await DiscountControlService.checkRequiresApproval(
    quote.tenantId,
    newRate.toNumber()
  );

  // 计算最终金额（精确计算）
  const finalAmountDec = Decimal.max(0, totalAmountDec.mul(newRate).sub(newDiscountAmountDec));

  // 【乐观锁】更新时携带版本自增，并在 where 条件中校验版本号
  const [updated] = await db
    .update(quotes)
    .set({
      ...updateData,
      discountRate: newRate.toFixed(4),
      discountAmount: newDiscountAmountDec.toFixed(2),
      finalAmount: finalAmountDec.toFixed(2),
      approvalRequired: requiresApproval,
      updatedAt: new Date(),
      version: sql`${quotes.version} + 1`,
    })
    .where(and(
      eq(quotes.id, id),
      eq(quotes.tenantId, userTenantId),
      version !== undefined ? eq(quotes.version, version) : undefined
    ))
    .returning();

  // 【乐观锁】版本不匹配时抛出并发冲突错误
  if (!updated && version !== undefined) {
    logger.warn('乐观锁冲突：报价数据已被修改', { quoteId: id, currentVersion: version });
    throw new AppError('报价数据已被修改，请刷新后重试', ERROR_CODES.CONCURRENCY_CONFLICT, 409);
  }

  // 审计日志：记录报价单更新
  await AuditService.recordFromSession(context.session, 'quotes', id, 'UPDATE', {
    old: { discountRate: quote.discountRate, discountAmount: quote.discountAmount },
    new: { discountRate: newRate.toFixed(4), discountAmount: newDiscountAmountDec.toFixed(2), finalAmount: finalAmountDec.toFixed(2) },
  });

  revalidatePath(`/quotes/${id}`);
  revalidatePath('/quotes');
  logger.info('[quotes] 报价单更新成功', { quoteId: id });
  return { success: true };
});

// ─── 复制报价单 ─────────────────────────────────

/**
 * 复制当前选定的报价单并可选择分配给新客户
 * @param data 包含源报价单ID和可选的目标客户ID
 * @param context 执行上下文，提供身份验证信息
 * @returns 新建的副件报价单记录
 */
export const copyQuote = createSafeAction(
  z.object({
    quoteId: z.string().uuid(),
    targetCustomerId: z.string().optional(),
  }),
  async (data, context) => {
    const userTenantId = context.session.user.tenantId;
    logger.info('[quotes] 开始复制报价单', { quoteId: data.quoteId, targetCustomerId: data.targetCustomerId });

    // 安全检查：验证源报价单归属
    const sourceQuote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, data.quoteId), eq(quotes.tenantId, userTenantId)),
      columns: { id: true },
    });

    if (!sourceQuote) {
      logger.warn('报价单不存在或无权操作', { quoteId: data.quoteId, tenantId: userTenantId });
      throw new Error('报价单不存在或无权操作');
    }

    const newQuote = await QuoteService.copyQuote(
      data.quoteId,
      context.session.user.id,
      userTenantId,
      data.targetCustomerId
    );

    // 审计日志：记录报价单复制
    await AuditService.recordFromSession(context.session, 'quotes', newQuote.id, 'CREATE', {
      new: { sourceQuoteId: data.quoteId, targetCustomerId: data.targetCustomerId },
    });

    revalidatePath('/quotes');
    logger.info('[quotes] 报价单复制成功', { sourceQuoteId: data.quoteId, newQuoteId: newQuote.id });
    return newQuote;
  }
);
