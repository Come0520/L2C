'use server';
import { logger } from '@/shared/lib/logger';
import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { QuoteService } from '@/services/quote.service';
import { auth } from '@/shared/lib/auth';
import { revalidatePath, updateTag } from 'next/cache';
import { db } from '@/shared/api/db';
import { quotes } from '@/shared/api/schema/quotes';
import { eq, and } from 'drizzle-orm';

/** 获取报价过期信息参数 Schema */
const getExpirationInfoSchema = z.object({
  quoteId: z.string().uuid(),
});

/** 从模板创建报价参数 Schema */
const createQuoteFromTemplateSchema = z.object({
  templateQuoteId: z.string().uuid(),
  customerId: z.string().uuid(),
  validDays: z.number().int().min(1).max(90).default(7),
});

/** 保存报价为模板参数 Schema */
const saveQuoteAsTemplateSchema = z.object({
  quoteId: z.string().uuid(),
  templateName: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

/** 获取报价过期信息的内部 Server Action */
const getQuoteExpirationInfoActionInternal = createSafeAction(
  getExpirationInfoSchema,
  async (data) => {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, data.quoteId), eq(quotes.tenantId, session.user.tenantId)),
      columns: { id: true, validUntil: true, status: true, createdAt: true },
    });

    if (!quote) throw new Error('Quote not found or access denied');

    const now = new Date();
    const validUntil = quote.validUntil ? new Date(quote.validUntil) : null;
    const isExpired = validUntil ? now > validUntil : false;
    const remainingDays = validUntil
      ? Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      quoteId: quote.id,
      validUntil,
      isExpired,
      remainingDays,
      status: quote.status,
    };
  }
);

/** 从模板创建报价的内部 Server Action */
const createQuoteFromTemplateActionInternal = createSafeAction(
  createQuoteFromTemplateSchema,
  async (data) => {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    const result = await QuoteService.createFromTemplate(
      data.templateQuoteId,
      data.customerId,
      session.user.tenantId,
      session.user.id,
      data.validDays
    );

    return { quoteId: result.id, quoteNo: result.quoteNo };
  }
);

/** 保存报价为模板的内部 Server Action */
const saveQuoteAsTemplateActionInternal = createSafeAction(
  saveQuoteAsTemplateSchema,
  async (data) => {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    const template = await QuoteService.saveAsTemplate(
      data.quoteId,
      session.user.tenantId,
      session.user.id,
      data.templateName,
      data.description
    );

    return { templateId: template.id, name: template.name };
  }
);

/**
 * 客户端调用：获取报价过期状态 (Get Quote Expiration Status)
 * 逻辑：自动检查当前时间 -> 若超过有效期则自动更新状态为 EXPIRED -> 返回最新详情。
 *
 * @param params - 报价单 ID
 * @returns 包含过期时间、剩余天数及过期状态的对象
 */
export async function getQuoteExpirationInfo(params: z.infer<typeof getExpirationInfoSchema>) {
  return getQuoteExpirationInfoActionInternal(params);
}

/**
 * 客户端调用：从模板创建报价单 (Create Quote from Template)
 * 场景：选择一个现有模板，指定新客户，系统自动按模板行项目生成新报价单。
 *
 * @param params - 包含模板 ID 及目标客户 ID
 * @returns 新报价单的 ID 与单号
 */
export async function createQuoteFromTemplate(
  params: z.infer<typeof createQuoteFromTemplateSchema>
) {
  return createQuoteFromTemplateActionInternal(params);
}

/**
 * 刷新过期报价的价格 (Refresh Expired Quote Prices)
 * 当客户重新确认过期报价时使用
 */
const refreshPricesSchema = z.object({
  quoteId: z.string().uuid(),
  validDays: z.number().int().min(1).max(90).default(7),
});

const refreshExpiredQuotePricesActionInternal = createSafeAction(
  refreshPricesSchema,
  async (data) => {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // 🔒 安全校验：验证报价单属于当前租户
    const quote = await db.query.quotes.findFirst({
      where: and(eq(quotes.id, data.quoteId), eq(quotes.tenantId, session.user.tenantId)),
      columns: { id: true },
    });
    if (!quote) throw new Error('Quote not found or access denied');

    const result = await QuoteService.refreshExpiredQuotePrices(
      data.quoteId,
      session.user.tenantId,
      data.validDays
    );

    revalidatePath(`/quotes/${data.quoteId}`);
    updateTag('quotes');
    logger.info('[quotes] 过期报价单价格刷新成功', { quoteId: data.quoteId });
    return result;
  }
);

export async function refreshExpiredQuotePrices(params: z.infer<typeof refreshPricesSchema>) {
  return refreshExpiredQuotePricesActionInternal(params);
}

/**
 * 批量过期处理 (Batch Expire Overdue Quotes)
 * 仅限管理员使用，用于手动触发或定时任务
 */
const batchExpireSchema = z.object({});

const batchExpireOverdueQuotesActionInternal = createSafeAction(
  batchExpireSchema,
  async (_data) => {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // 检查权限：仅管理员可执行
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      throw new Error('权限不足：仅管理员可执行批量过期操作');
    }

    // 🔒 安全校验：强制使用当前会话租户ID，防止越权操作
    const result = await QuoteService.expireAllOverdueQuotes(session.user.tenantId);

    updateTag('quotes');
    logger.info('[quotes] 手动批量触发报价单过期检查成功', { tenantId: session.user.tenantId });
    return result;
  }
);

export async function batchExpireOverdueQuotes(params: z.infer<typeof batchExpireSchema>) {
  return batchExpireOverdueQuotesActionInternal(params);
}

/**
 * 设置报价有效期 (Set Quote Valid Until)
 */
const setValidUntilSchema = z.object({
  quoteId: z.string().uuid(),
  validDays: z.number().int().min(1).max(90),
});

const setQuoteValidUntilActionInternal = createSafeAction(setValidUntilSchema, async (data) => {
  const session = await auth();
  if (!session?.user?.tenantId) throw new Error('Unauthorized');

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + data.validDays);

  // 🔒 安全校验：验证报价单属于当前租户
  const [updated] = await db
    .update(quotes)
    .set({
      validUntil,
      updatedAt: new Date(),
    })
    .where(and(eq(quotes.id, data.quoteId), eq(quotes.tenantId, session.user.tenantId)))
    .returning({ id: quotes.id });

  if (!updated) {
    throw new Error('Quote not found or access denied');
  }

  revalidatePath(`/quotes/${data.quoteId}`);
  updateTag('quotes');
  logger.info('[quotes] 报价单有效期设置成功', { quoteId: data.quoteId, validUntil });
  return { success: true, validUntil };
});

export async function setQuoteValidUntil(params: z.infer<typeof setValidUntilSchema>) {
  return setQuoteValidUntilActionInternal(params);
}

/**
 * 客户端调用：将现有报价单保存为模板 (Save Quote as Template)
 * 应用：将当前设计优秀的报价方案固化为模板，便于后续快速复用。
 *
 * @param params - 包含源报价单 ID 及模板名称、描述等
 * @returns 成功消息及新模板 ID
 */
export async function saveQuoteAsTemplate(params: z.infer<typeof saveQuoteAsTemplateSchema>) {
  return saveQuoteAsTemplateActionInternal(params);
}
