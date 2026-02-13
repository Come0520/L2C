'use server';

import { db } from '@/shared/api/db';
import { quotes, quoteItems } from '@/shared/api/schema/quotes';
import { StrategyFactory } from '../calc-strategies/strategy-factory';
import { revalidatePath } from 'next/cache';
import type { QuoteItemAttributes } from '@/shared/api/types/quote-types';

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
    const { auth } = await import('@/shared/lib/auth');
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, message: '未授权访问' };
    }
    const tenantId = session.user.tenantId;

    // 1. Fetch Quote & Items (添加租户隔离)
    const { and, eq } = await import('drizzle-orm');
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
                .where(eq(quoteItems.id, item.id))
        );
    }

    await Promise.all(updates);

    // 3. Update Quote Total
    await db.update(quotes)
        .set({
            totalAmount: totalAmount.toString(),
            finalAmount: (totalAmount * (Number(quote.discountRate) || 1)).toString(),
            updatedAt: new Date()
        })
        .where(eq(quotes.id, quoteId));

    revalidatePath(`/quotes/${quoteId}`);
    return { success: true, message: 'Recalculated successfully' };
}

// 获取计算结果预览
export async function getCalcPreview(params: CalcPreviewParams) {
    const category = params.category || 'CURTAIN';
    const strategy = StrategyFactory.getStrategy(category);
    const result = strategy.calculate(params);
    return { data: result };
}
