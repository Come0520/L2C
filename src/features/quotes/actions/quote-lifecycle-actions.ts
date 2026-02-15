'use server';

/**
 * 报价单生命周期管理 Actions
 * 包含：提交、审批、拒绝、锁定、解锁、转订单、创建新版本
 */

import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { db } from '@/shared/api/db';
import { quotes } from '@/shared/api/schema/quotes';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { QuoteLifecycleService } from '@/services/quote-lifecycle.service';
import { QuoteService } from '@/services/quote.service';
import { rejectQuoteDiscountSchema } from './schema';

// ─── 提交报价单 ─────────────────────────────────

export const submitQuote = createSafeAction(
  z.object({
    id: z.string().uuid(),
  }),
  async (data, context) => {
    await QuoteLifecycleService.submit(
      data.id,
      context.session.user.tenantId,
      context.session.user.id
    );

    revalidatePath(`/quotes/${data.id}`);
    revalidatePath('/quotes');
    return { success: true };
  }
);

// ─── 拒绝报价单 ─────────────────────────────────

export const rejectQuote = createSafeAction(
  z.object({
    id: z.string().uuid(),
    rejectReason: z.string().min(1),
  }),
  async (data, context) => {
    // 🔒 安全修复：传入租户ID以便 Service 层校验归属
    await QuoteLifecycleService.reject(data.id, data.rejectReason, context.session.user.tenantId);

    revalidatePath(`/quotes/${data.id}`);
    revalidatePath('/quotes');
    return { success: true };
  }
);

// ─── 锁定报价单 ─────────────────────────────────

export const lockQuote = createSafeAction(
  z.object({
    id: z.string().uuid(),
    lockedBy: z.string().uuid().optional(),
  }),
  async (data, context) => {
    const userTenantId = context.session.user.tenantId;

    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, data.id), eq(quotes.tenantId, userTenantId)),
    });

    if (!quote) throw new Error('报价单不存在或无权操作');
    if (quote.lockedAt) throw new Error('该报价单已锁定');

    const [updated] = await db
      .update(quotes)
      .set({
        lockedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, data.id))
      .returning();

    revalidatePath(`/quotes/${data.id}`);
    return updated;
  }
);

// ─── 解锁报价单 ─────────────────────────────────

export const unlockQuote = createSafeAction(
  z.object({
    id: z.string().uuid(),
  }),
  async (data, context) => {
    const userTenantId = context.session.user.tenantId;

    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, data.id), eq(quotes.tenantId, userTenantId)),
    });

    if (!quote) throw new Error('报价单不存在或无权操作');

    const [updated] = await db
      .update(quotes)
      .set({ lockedAt: null, updatedAt: new Date() })
      .where(eq(quotes.id, data.id))
      .returning();

    revalidatePath(`/quotes/${data.id}`);
    return updated;
  }
);

// ─── 审批报价单 ─────────────────────────────────

export const approveQuote = createSafeAction(
  z.object({
    id: z.string().uuid(),
  }),
  async (data, context) => {
    // 🔒 安全修复：传入租户ID以便 Service 层校验归属
    await QuoteLifecycleService.approve(
      data.id,
      context.session.user.id,
      context.session.user.tenantId
    );

    revalidatePath(`/quotes/${data.id}`);
    revalidatePath('/quotes');
    return { success: true };
  }
);

// ─── 拒绝折扣变更 ───────────────────────────────

export const rejectQuoteDiscount = createSafeAction(
  rejectQuoteDiscountSchema,
  async (data, context) => {
    // 🔒 安全修复：传入租户ID以便 Service 层校验归属
    await QuoteLifecycleService.reject(data.id, data.reason, context.session.user.tenantId);

    revalidatePath(`/quotes/${data.id}`);
    revalidatePath('/quotes');
    return { success: true };
  }
);

// ─── 转订单 ─────────────────────────────────────

export const convertQuoteToOrder = createSafeAction(
  z.object({
    quoteId: z.string().uuid(),
  }),
  async (data, context) => {
    const order = await QuoteLifecycleService.convertToOrder(
      data.quoteId,
      context.session.user.tenantId,
      context.session.user.id
    );

    revalidatePath('/orders');
    revalidatePath(`/quotes/${data.quoteId}`);
    return order;
  }
);

// ─── 创建新版本 ─────────────────────────────────

export const createNextVersion = createSafeAction(
  z.object({ quoteId: z.string() }),
  async (data, context) => {
    const newQuote = await QuoteService.createNextVersion(data.quoteId, context.session.user.id);
    revalidatePath('/quotes');
    revalidatePath(`/quotes/${newQuote.id}`);
    revalidatePath(`/quotes/${data.quoteId}`);
    return newQuote;
  }
);
