'use server';

/**
 * 报价单 CRUD 操作
 * 包含：创建报价单、更新报价单、复制报价单、创建报价套餐
 */

import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { db } from '@/shared/api/db';
import { quotes } from '@/shared/api/schema/quotes';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { QuoteService } from '@/services/quote.service';
import { DiscountControlService } from '@/services/discount-control.service';
import { createQuoteSchema, updateQuoteSchema, createQuoteBundleSchema } from './schema';
import { updateBundleTotal } from './shared-helpers';

// ─── 创建报价套餐 ───────────────────────────────

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

    revalidatePath('/quotes');
    return newBundle;
  }
);

export async function createQuoteBundle(params: z.infer<typeof createQuoteBundleSchema>) {
  return createQuoteBundleActionInternal(params);
}

// ─── 创建报价单 ─────────────────────────────────

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
    await updateBundleTotal(data.bundleId);
  }

  revalidatePath('/quotes');
  return newQuote;
});

export async function createQuote(params: z.infer<typeof createQuoteSchema>) {
  return createQuoteActionInternal(params);
}

// ─── 更新报价单 ─────────────────────────────────

export const updateQuote = createSafeAction(updateQuoteSchema, async (data, context) => {
  const { id, ...updateData } = data;
  const userTenantId = context.session.user.tenantId;

  // 安全检查：验证报价单属于当前租户
  const quote = await db.query.quotes.findFirst({
    where: and(eq(quotes.id, id), eq(quotes.tenantId, userTenantId)),
  });

  if (!quote) throw new Error('报价单不存在或无权操作');

  // 折扣逻辑
  const totalAmount = Number(quote.totalAmount || 0);
  const oldRate = Number(quote.discountRate || 1);
  const newRate = updateData.discountRate !== undefined ? Number(updateData.discountRate) : oldRate;
  const newDiscountAmount =
    updateData.discountAmount !== undefined
      ? Number(updateData.discountAmount)
      : Number(quote.discountAmount || 0);

  // 审批检查
  const requiresApproval = await DiscountControlService.checkRequiresApproval(
    quote.tenantId,
    newRate
  );

  // 计算最终金额
  const finalAmount = Math.max(0, totalAmount * newRate - newDiscountAmount);

  await db
    .update(quotes)
    .set({
      ...updateData,
      discountRate: newRate.toString(),
      discountAmount: newDiscountAmount.toString(),
      finalAmount: finalAmount.toString(),
      approvalRequired: requiresApproval,
      updatedAt: new Date(),
    })
    .where(and(eq(quotes.id, id), eq(quotes.tenantId, userTenantId)));

  revalidatePath(`/quotes/${id}`);
  revalidatePath('/quotes');
  return { success: true };
});

// ─── 复制报价单 ─────────────────────────────────

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
      data.targetCustomerId
    );

    revalidatePath('/quotes');
    return newQuote;
  }
);
