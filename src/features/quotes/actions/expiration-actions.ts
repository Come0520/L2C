'use server';

import { z } from 'zod';
import { createSafeAction } from '@/shared/lib/server-action';
import { QuoteService } from '@/services/quote.service';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { db } from '@/shared/api/db';
import { quotes } from '@/shared/api/schema/quotes';
import { eq, and } from 'drizzle-orm';

/**
 * 获取报价过期状态 (Get Quote Expiration Status)
 */
const getExpirationInfoSchema = z.object({
    quoteId: z.string().uuid()
});

const getQuoteExpirationInfoActionInternal = createSafeAction(getExpirationInfoSchema, async (data) => {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // 🔒 安全校验：验证报价单属于当前租户
    const quote = await db.query.quotes.findFirst({
        where: and(
            eq(quotes.id, data.quoteId),
            eq(quotes.tenantId, session.user.tenantId)
        ),
        columns: { id: true }
    });
    if (!quote) throw new Error('Quote not found or access denied');

    // 先检查并更新过期状态
    await QuoteService.checkAndExpireQuote(data.quoteId, session.user.tenantId);

    // 获取最新过期信息
    return await QuoteService.getExpirationInfo(data.quoteId, session.user.tenantId);
});

export async function getQuoteExpirationInfo(params: z.infer<typeof getExpirationInfoSchema>) {
    return getQuoteExpirationInfoActionInternal(params);
}

/**
 * 刷新过期报价的价格 (Refresh Expired Quote Prices)
 * 当客户重新确认过期报价时使用
 */
const refreshPricesSchema = z.object({
    quoteId: z.string().uuid(),
    validDays: z.number().int().min(1).max(90).default(7)
});

const refreshExpiredQuotePricesActionInternal = createSafeAction(refreshPricesSchema, async (data) => {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // 🔒 安全校验：验证报价单属于当前租户
    const quote = await db.query.quotes.findFirst({
        where: and(
            eq(quotes.id, data.quoteId),
            eq(quotes.tenantId, session.user.tenantId)
        ),
        columns: { id: true }
    });
    if (!quote) throw new Error('Quote not found or access denied');

    const result = await QuoteService.refreshExpiredQuotePrices(
        data.quoteId,
        session.user.tenantId,
        data.validDays
    );

    revalidatePath(`/quotes/${data.quoteId}`);
    return result;
});

export async function refreshExpiredQuotePrices(params: z.infer<typeof refreshPricesSchema>) {
    return refreshExpiredQuotePricesActionInternal(params);
}

/**
 * 批量过期处理 (Batch Expire Overdue Quotes)
 * 仅限管理员使用，用于手动触发或定时任务
 */
const batchExpireSchema = z.object({});

const batchExpireOverdueQuotesActionInternal = createSafeAction(batchExpireSchema, async (_data) => {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    // 检查权限：仅管理员可执行
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
        throw new Error('权限不足：仅管理员可执行批量过期操作');
    }

    // 🔒 安全校验：强制使用当前会话租户ID，防止越权操作
    const result = await QuoteService.expireAllOverdueQuotes(
        session.user.tenantId
    );

    return result;
});

export async function batchExpireOverdueQuotes(params: z.infer<typeof batchExpireSchema>) {
    return batchExpireOverdueQuotesActionInternal(params);
}

/**
 * 设置报价有效期 (Set Quote Valid Until)
 */
const setValidUntilSchema = z.object({
    quoteId: z.string().uuid(),
    validDays: z.number().int().min(1).max(90)
});

const setQuoteValidUntilActionInternal = createSafeAction(setValidUntilSchema, async (data) => {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + data.validDays);

    // 🔒 安全校验：验证报价单属于当前租户
    const [updated] = await db.update(quotes)
        .set({
            validUntil,
            updatedAt: new Date()
        })
        .where(
            and(
                eq(quotes.id, data.quoteId),
                eq(quotes.tenantId, session.user.tenantId)
            )
        )
        .returning({ id: quotes.id });

    if (!updated) {
        throw new Error('Quote not found or access denied');
    }

    revalidatePath(`/quotes/${data.quoteId}`);
    return { success: true, validUntil };
});

export async function setQuoteValidUntil(params: z.infer<typeof setValidUntilSchema>) {
    return setQuoteValidUntilActionInternal(params);
}
