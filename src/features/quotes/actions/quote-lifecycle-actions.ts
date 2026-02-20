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
import { checkPermission } from '@/shared/lib/auth';
import { AuditService } from '@/shared/lib/audit-service';
import { PERMISSIONS } from '@/shared/config/permissions';

// ─── 提交报价单 ─────────────────────────────────

/**
 * 提交报价单进行审批或转换流程
 * 仅具有编辑权限的用户可执行
 * @param data 包含报价单 ID 的对象
 * @param context 执行上下文
 */
export const submitQuote = createSafeAction(
  z.object({
    id: z.string().uuid(),
  }),
  async (data, context) => {
    // P2-01: 权限校验
    const hasPermission = await checkPermission(context.session, PERMISSIONS.QUOTE.EDIT);
    if (!hasPermission) {
      throw new Error('无权执行此操作');
    }
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
    return { success: true };
  }
);

// ─── 拒绝报价单 ─────────────────────────────────

/**
 * 拒绝当前报价单，需提供拒绝原因
 * 仅具有编辑权限的用户可执行
 * @param data 包含报价单 ID 和拒绝原因的对象
 * @param context 执行上下文
 */
export const rejectQuote = createSafeAction(
  z.object({
    id: z.string().uuid(),
    rejectReason: z.string().min(1),
  }),
  async (data, context) => {
    // P2-01: 权限校验
    const hasPermission = await checkPermission(context.session, PERMISSIONS.QUOTE.APPROVE);
    if (!hasPermission) {
      throw new Error('无权执行此操作');
    }

    // 🔒 安全修复：传入租户ID以便 Service 层校验归属
    await QuoteLifecycleService.reject(data.id, data.rejectReason, context.session.user.tenantId);

    // 审计日志：记录报价单拒绝
    await AuditService.recordFromSession(context.session, 'quotes', data.id, 'UPDATE', {
      new: { action: 'REJECT', rejectReason: data.rejectReason },
    });

    revalidatePath(`/quotes/${data.id}`);
    revalidatePath('/quotes');
    return { success: true };
  }
);

// ─── 锁定报价单 ─────────────────────────────────

/**
 * 锁定报价单以防止进一步编辑，通常用于待审批或最终确定前
 * 仅具有编辑权限的用户可执行
 * @param data 包含报价单 ID 的对象
 * @param context 执行上下文
 */
export const lockQuote = createSafeAction(
  z.object({
    id: z.string().uuid(),
    lockedBy: z.string().uuid().optional(),
  }),
  async (data, context) => {
    const userTenantId = context.session.user.tenantId;

    // P2-01: 权限校验
    const hasPermission = await checkPermission(context.session, PERMISSIONS.QUOTE.EDIT);
    if (!hasPermission) {
      throw new Error('无权执行此操作');
    }

    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, data.id), eq(quotes.tenantId, userTenantId)),
    });

    if (!quote) throw new Error('报价单不存在或无权操作');
    if (quote.lockedAt) throw new Error('该报价单已锁定');

    const [updated] = await db
      .update(quotes)
      .set({
        lockedAt: new Date(),
        // P1-07 技术债：DB schema 无 lockedBy 列，无法记录锁定操作人
        // 建议后续迁移中增加 lockedBy: varchar 字段
        updatedAt: new Date(),
      })
      .where(and(eq(quotes.id, data.id), eq(quotes.tenantId, userTenantId)))
      .returning();

    // 审计日志：记录报价单锁定
    await AuditService.recordFromSession(context.session, 'quotes', data.id, 'UPDATE', {
      new: { action: 'LOCK', lockedAt: new Date().toISOString() },
    });

    revalidatePath(`/quotes/${data.id}`);
    return updated;
  }
);

// ─── 解锁报价单 ─────────────────────────────────

/**
 * 解锁先前锁定的报价单，恢复编辑能力
 * 仅报价单的原始锁定者可执行
 * @param data 包含报价单 ID 的对象
 * @param context 执行上下文
 */
export const unlockQuote = createSafeAction(
  z.object({
    id: z.string().uuid(),
  }),
  async (data, context) => {
    const userTenantId = context.session.user.tenantId;

    // P2-01: 权限校验
    const hasPermission = await checkPermission(context.session, PERMISSIONS.QUOTE.EDIT);
    if (!hasPermission) {
      throw new Error('无权执行此操作');
    }

    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, data.id), eq(quotes.tenantId, userTenantId)),
    });

    if (!quote) throw new Error('报价单不存在或无权操作');

    const [updated] = await db
      .update(quotes)
      .set({ lockedAt: null, updatedAt: new Date() })
      .where(and(eq(quotes.id, data.id), eq(quotes.tenantId, userTenantId)))
      .returning();

    // 审计日志：记录报价单解锁
    await AuditService.recordFromSession(context.session, 'quotes', data.id, 'UPDATE', {
      new: { action: 'UNLOCK' },
    });

    revalidatePath(`/quotes/${data.id}`);
    return updated;
  }
);

// ─── 审批报价单 ─────────────────────────────────

/**
 * 审批通过折扣超限的报价单
 * 仅具有审批权限的用户可执行
 * @param data 包含报价单 ID 的对象
 * @param context 执行上下文
 */
export const approveQuote = createSafeAction(
  z.object({
    id: z.string().uuid(),
  }),
  async (data, context) => {
    // P2-01: 权限校验
    const hasPermission = await checkPermission(context.session, PERMISSIONS.QUOTE.APPROVE);
    if (!hasPermission) {
      throw new Error('无权执行此操作');
    }

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
    return { success: true };
  }
);

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
    return { success: true };
  }
);

// ─── 转订单 ─────────────────────────────────────

/**
 * 将批准的报价单转换为正式订单
 * 仅具有下订单权限的用户可执行
 * @param data 包含报价单 ID 的对象
 * @param context 执行上下文
 */
export const convertQuoteToOrder = createSafeAction(
  z.object({
    quoteId: z.string().uuid(),
  }),
  async (data, context) => {
    // P2-01: 权限校验 (转订单需要创建订单权限)
    const hasPermission = await checkPermission(context.session, PERMISSIONS.ORDER.CREATE);
    if (!hasPermission) {
      throw new Error('无权执行此操作');
    }

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
    return order;
  }
);

// ─── 创建新版本 ─────────────────────────────────

/**
 * 根据现有报价单创建一个新版本作为迭代基础
 * @param data 包含源报价单 ID 的对象
 * @param context 执行上下文
 * @returns 新版本报价单
 */
export const createNextVersion = createSafeAction(
  z.object({ quoteId: z.string().uuid() }),
  async (data, context) => {
    // P2-01: 权限校验 (创建新版本视为创建报价)
    const hasPermission = await checkPermission(context.session, PERMISSIONS.QUOTE.CREATE);
    if (!hasPermission) {
      throw new Error('无权执行此操作');
    }

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
    return newQuote;
  }
);
