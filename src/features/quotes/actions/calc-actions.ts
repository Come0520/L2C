'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';


import { db } from '@/shared/api/db';
import { quotes, quoteItems } from '@/shared/api/schema/quotes';
import { eq } from 'drizzle-orm';
import { StrategyFactory } from '../calc-strategies/strategy-factory';
import { revalidatePath } from 'next/cache';

// Mock 重新计算报价 - 现在实现真实逻辑
export const recalculateQuote = async (quoteId: string) => {
    // 1. Fetch Quote & Items
    const quote = await db.query.quotes.findFirst({
        where: eq(quotes.id, quoteId),
        with: {
            items: true
        }
    });

    if (!quote) return { success: false, message: 'Quote not found' };

    let totalAmount = 0;
    const updates: Promise<any>[] = [];

    // 2. Iterate and Calculate
    for (const item of quote.items) {
        // Need specific params from item attributes
        // Assuming item.attributes holds the calc params
        const params = item.attributes as any || {};

        // Merge with item basic info if needed
        const parsedWidth = parseFloat(item.width as any);
        const parsedHeight = parseFloat(item.height as any);

        const fullParams = {
            ...params,
            measuredWidth: parsedWidth,
            measuredHeight: parsedHeight,
            // Map for older strategies (Wallpaper)
            width: parsedWidth,
            height: parsedHeight,

            unitPrice: parseFloat(item.unitPrice as any),
            fabricType: (item.attributes as any)?.fabricType || 'FIXED_HEIGHT' // Fallback
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
                        ...(item.attributes as any),
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
};

// Mock 获取计算结果预览
export const getCalcPreview = async (params: any) => {
    const category = params.category || 'CURTAIN';
    const strategy = StrategyFactory.getStrategy(category);
    const result = strategy.calculate(params);
    return { data: result };
};
