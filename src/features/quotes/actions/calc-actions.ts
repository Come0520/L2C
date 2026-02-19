'use server';

import { db } from '@/shared/api/db';
import { quotes, quoteItems } from '@/shared/api/schema/quotes';
import { StrategyFactory } from '../calc-strategies/strategy-factory';
import { revalidatePath } from 'next/cache';
import type { QuoteItemAttributes } from '@/shared/api/types/quote-types';
import { auth } from '@/shared/lib/auth';
import { and, eq } from 'drizzle-orm';

/**
 * 计算预览参数接口
 */
interface CalcPreviewParams {
    category?: string;
    measuredWidth?: number;
    measuredHeight?: number;
    unitPrice?: number;
    fabricType?: string;
    fabricWidth?: number;
    foldRatio?: number;
    [key: string]: unknown; // 允许扩展参数
}

// 重新计算报价 - 现在实现真实逻辑
export async function recalculateQuote(quoteId: string) {
    // 🔒 安全校验：添加认证和租户隔离
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, message: '未授权访问' };
    }
    const tenantId = session.user.tenantId;

    const quote = await db.query.quotes.findFirst({
        where: and(
            eq(quotes.id, quoteId),
            eq(quotes.tenantId, tenantId) // 🔒 强制租户过滤
        ),
        with: {
            items: true
        }
    });

    if (!quote) return { success: false, message: 'Quote not found' };

    let totalAmount = 0;
    const updates: Promise<unknown>[] = [];

    // 2. Iterate and Calculate
    for (const item of quote.items) {
        // Need specific params from item attributes
        // Assuming item.attributes holds the calc params
        const params = (item.attributes as QuoteItemAttributes) || {};

        // Merge with item basic info if needed
        const parsedWidth = parseFloat(item.width as string);
        const parsedHeight = parseFloat(item.height as string);

        const fullParams = {
            ...params,
            measuredWidth: parsedWidth,
            measuredHeight: parsedHeight,
            // Map for older strategies (Wallpaper)
            width: parsedWidth,
            height: parsedHeight,

            unitPrice: parseFloat(item.unitPrice as string),
            fabricType: (item.attributes as QuoteItemAttributes & { fabricType?: string })?.fabricType || 'FIXED_HEIGHT' // Fallback
        };

        const strategy = StrategyFactory.getStrategy(item.category || 'STANDARD');
        const result = strategy.calculate(fullParams);

        // Update item total
        const newSubtotal = result.subtotal;
        totalAmount += newSubtotal;

        // Push update
        updates.push(
            db.update(quoteItems)
                .set({
                    quantity: result.usage.toString(),
                    subtotal: newSubtotal.toString(),
                    attributes: {
                        ...(item.attributes as QuoteItemAttributes),
                        calcResult: result.details
                    }
                })
                .where(and(eq(quoteItems.id, item.id), eq(quoteItems.tenantId, tenantId)))
        );
    }

    await Promise.all(updates);

    // 3. Update Quote Total
    await db.update(quotes)
        .set({
            totalAmount: totalAmount.toString(),
            finalAmount: Math.max(0, totalAmount * (Number(quote.discountRate) || 1) - Number(quote.discountAmount || 0)).toString(),
            // discountAmount shouldn't be overridden by calculation unless it was percentage based, but here we persist the manual amount?
            // Wait, existing logic was: `discountAmount: (totalAmount * (1 - rate))` -> this ignores manual discount amount
            // Implementation plan says: "不再覆写 discountAmount，保留用户手动设置的折减值"
            // So we REMOVE the discountAmount update line entirely, or keep it if we want to support rate-based calc?
            // The issue description H-01 says: "discountAmount 被直接覆写... 丢失了用户手动设置的折减值"
            // So we should NOT update discountAmount here, OR update it only if it's derived?
            // "Recalculate" usually implies "re-sum items". Discount amount is usually manually set or fixed.
            // Let's remove discountAmount update to respect manual value.
            updatedAt: new Date()
        })
        .where(and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)));

    revalidatePath(`/quotes/${quoteId}`);
    return { success: true, message: 'Recalculated successfully' };
}

export async function getCalcPreview(params: CalcPreviewParams) {
    // 🔒 安全校验
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('未授权访问');
    }

    const category = params.category || 'CURTAIN';
    const strategy = StrategyFactory.getStrategy(category);
    const result = strategy.calculate(params);
    return { data: result };
}
