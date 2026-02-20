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
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { QuoteService } from '@/services/quote.service';
import { DiscountControlService } from '@/services/discount-control.service';
import Decimal from 'decimal.js';
import { createQuoteSchema, updateQuoteSchema, createQuoteBundleSchema } from './schema';
import { updateBundleTotal } from './shared-helpers';

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
    if (!tenantId) throw new Error('未授权访问：缺少租户信息');

    const quoteNo = `QB${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

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
    return newBundle;
  }
);

/**
 * 客户端可调用的无上下文包装方法：创建报价套餐
 * @param params 套餐请求参数
 * @returns 包装了响应的套餐实例
 */
export async function createQuoteBundle(params: z.infer<typeof createQuoteBundleSchema>) {
  return createQuoteBundleActionInternal(params);
}

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
  if (!tenantId) throw new Error('未授权访问：缺少租户信息');

  const quoteNo = `QT${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

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
 * @param data 包含要更新属性的对象（含报价单ID）
 * @param context 执行上下文，用于安全检查和审计日志
 * @returns 包含成功状态的响应
 */
export const updateQuote = createSafeAction(updateQuoteSchema, async (data, context) => {
  const { id, ...updateData } = data;
  const userTenantId = context.session.user.tenantId;

  // 安全检查：验证报价单属于当前租户
  const quote = await db.query.quotes.findFirst({
    where: and(eq(quotes.id, id), eq(quotes.tenantId, userTenantId)),
  });

  if (!quote) throw new Error('报价单不存在或无权操作');

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

  await db
    .update(quotes)
    .set({
      ...updateData,
      discountRate: newRate.toFixed(4),
      discountAmount: newDiscountAmountDec.toFixed(2),
      finalAmount: finalAmountDec.toFixed(2),
      approvalRequired: requiresApproval,
      updatedAt: new Date(),
    })
    .where(and(eq(quotes.id, id), eq(quotes.tenantId, userTenantId)));

  // 审计日志：记录报价单更新
  await AuditService.recordFromSession(context.session, 'quotes', id, 'UPDATE', {
    old: { discountRate: quote.discountRate, discountAmount: quote.discountAmount },
    new: { discountRate: newRate.toFixed(4), discountAmount: newDiscountAmountDec.toFixed(2), finalAmount: finalAmountDec.toFixed(2) },
  });

  revalidatePath(`/quotes/${id}`);
  revalidatePath('/quotes');
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

    // 安全检查：验证源报价单归属
    const sourceQuote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, data.quoteId), eq(quotes.tenantId, userTenantId)),
      columns: { id: true },
    });

    if (!sourceQuote) throw new Error('报价单不存在或无权操作');

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
    return newQuote;
  }
);
