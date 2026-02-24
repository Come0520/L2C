"use server";

import { db } from '@/shared/api/db';
import { quotes, quoteItems } from '@/shared/api/schema';
import { eq, and, gte, sql, notInArray } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { unstable_cache } from 'next/cache';
import { logger } from '@/shared/lib/logger';
import { ANALYTICS_PERMISSIONS } from '../constants';

const pricingReferenceSchema = z.object({
    productId: z.string(),
    periodDays: z.number().optional().default(90),
});

/**
 * 获取报价参考价格 (Get Pricing Reference)
 * 
 * 聚合历史报价明细 (quoteItems) 数据，计算特定产品的均价、最高价、最低价。
 * 仅统计已确认 (非草稿、非拒绝) 的报价数据，为新报价提供价格参考。
 * 结果通过 `unstable_cache` 进行缓存。
 * 
 * 权限要求: ANALYTICS_PERMISSIONS.VIEW
 * 
 * @param params - 查询参数
 * @param params.productId - 产品 ID
 * @param params.periodDays - 统计的历史天数，默认为 90 天
 * @returns 价格分析对象，包含均价、最高价、最低价和采样数
 */
const getPricingReferenceAction = createSafeAction(pricingReferenceSchema, async (params, { session }) => {
    await checkPermission(session, ANALYTICS_PERMISSIONS.VIEW);

    const { productId, periodDays } = params;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            try {
                logger.info('报价参考价格查询开始', { tenantId, productId, periodDays });

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

                const finalResult = {
                    productId,
                    periodDays,
                    minPrice: Number(result?.minPrice || 0).toFixed(2),
                    maxPrice: Number(result?.maxPrice || 0).toFixed(2),
                    avgPrice: Number(result?.avgPrice || 0).toFixed(2),
                    sampleSize: Number(result?.count || 0),
                };

                logger.info('报价参考价格查询成功', { tenantId, productId, avgPrice: finalResult.avgPrice, sampleSize: finalResult.sampleSize });
                return finalResult;
            } catch (error) {
                logger.error('报价参考价格查询失败', { tenantId, productId, error });
                throw error;
            }
        },
        [`pricing-ref-${tenantId}-${productId}-${periodDays}`],
        { tags: [`analytics-${tenantId}`, 'analytics-pricing'], revalidate: 3600 }
    )();
});

/**
 * 导出：获取报价参考价格
 * @param params - 查询参数
 */
export async function getPricingReference(params: z.infer<typeof pricingReferenceSchema>) {
    return getPricingReferenceAction(params);
}
