/**
 * 报价参考价格 — getPricingReference
 */

import { db } from '@/shared/api/db';
import { quotes, quoteItems } from '@/shared/api/schema';
import { eq, and, gte, sql, notInArray } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { ANALYTICS_PERMISSIONS } from '../constants';

const pricingReferenceSchema = z.object({
    productId: z.string(),
    periodDays: z.number().optional().default(90),
});

/**
 * 获取报价参考价格
 * 聚合历史 quoteItems 的均价/最高/最低
 * 仅统计已确认的报价
 */
const getPricingReferenceAction = createSafeAction(pricingReferenceSchema, async (params, { session }) => {
    await checkPermission(session, ANALYTICS_PERMISSIONS.VIEW);

    const { productId, periodDays } = params;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            const stats = await db.select({
                minPrice: sql<number>`MIN(${quoteItems.unitPrice})`,
                maxPrice: sql<number>`MAX(${quoteItems.unitPrice})`,
                avgPrice: sql<number>`AVG(${quoteItems.unitPrice})`,
                totalQuantity: sql<number>`SUM(${quoteItems.quantity})`,
                count: sql<number>`COUNT(*)`,
            }).from(quoteItems).innerJoin(quotes, eq(quoteItems.quoteId, quotes.id))
                .where(and(
                    eq(quoteItems.tenantId, tenantId),
                    eq(quoteItems.productId, productId),
                    gte(quotes.createdAt, startDate),
                    notInArray(quotes.status, ['DRAFT', 'REJECTED'])
                ));

            const result = stats[0];

            return {
                productId,
                periodDays,
                minPrice: Number(result?.minPrice || 0).toFixed(2),
                maxPrice: Number(result?.maxPrice || 0).toFixed(2),
                avgPrice: Number(result?.avgPrice || 0).toFixed(2),
                sampleSize: Number(result?.count || 0),
            }
        },
        [`pricing-ref-${tenantId}-${productId}-${periodDays}`],
        { tags: [`analytics-${tenantId}`, 'analytics-pricing'], revalidate: 3600 }
    )();
});

export async function getPricingReference(params: z.infer<typeof pricingReferenceSchema>) {
    return getPricingReferenceAction(params);
}
