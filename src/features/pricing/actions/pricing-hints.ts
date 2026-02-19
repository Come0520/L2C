'use server';

import { db } from '@/shared/api/db';
import { orderItems, orders, products, quoteItems, quotes } from '@/shared/api/schema';
import { eq, and, sql, desc, gte, lte } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { cache } from 'react';

const pricingHintsSchema = z.object({
    productId: z.string().optional(),
    sku: z.string().optional(),
    periodDays: z.number().default(90), // Default lookback period
});

/**
 * 获取产品定价参考建议
 * 聚合历史成交价、报价记录、成本信息
 */
export const getPricingHintsAction = cache(createSafeAction(pricingHintsSchema, async (params, { session }) => {
    // 允许销售查看定价建议
    await checkPermission(session, 'quotes:create');

    if (!params.productId && !params.sku) {
        return { success: false, error: 'Product ID or SKU is required' };
    }

    const tenantId = session.user.tenantId;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - params.periodDays);

    // 1. 获取基础产品信息 (成本/底价)
    let productInfo;
    if (params.productId) {
        productInfo = await db.query.products.findFirst({
            where: and(eq(products.id, params.productId), eq(products.tenantId, tenantId)),
        });
    } else if (params.sku) {
        productInfo = await db.query.products.findFirst({
            where: and(eq(products.sku, params.sku), eq(products.tenantId, tenantId)),
        });
    }

    if (!productInfo) {
        return { success: false, error: 'Product not found' };
    }

    const targetProductId = productInfo.id;

    // 2. 历史成交价统计 (Order Items)
    // 排除已取消的订单
    const salesStats = await db
        .select({
            minPrice: sql<string>`MIN(CAST(${orderItems.unitPrice} AS DECIMAL))`,
            maxPrice: sql<string>`MAX(CAST(${orderItems.unitPrice} AS DECIMAL))`,
            avgPrice: sql<string>`AVG(CAST(${orderItems.unitPrice} AS DECIMAL))`,
            totalSold: sql<number>`SUM(CAST(${orderItems.quantity} AS DECIMAL))`,
            lastPrice: sql<string>`(ARRAY_AGG(CAST(${orderItems.unitPrice} AS DECIMAL) ORDER BY ${orderItems.createdAt} DESC))[1]`,
            count: sql<number>`COUNT(*)`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
            and(
                eq(orderItems.productId, targetProductId),
                eq(orders.tenantId, tenantId),
                gte(orders.createdAt, startDate),
                sql`${orders.status} NOT IN ('CANCELLED', 'DRAFT')`
            )
        );

    // 3. 近期报价统计 (Quote Items) - 了解当前市场热度/竞争情况
    const quoteStats = await db
        .select({
            avgQuotePrice: sql<string>`AVG(CAST(${quoteItems.unitPrice} AS DECIMAL))`,
            quoteCount: sql<number>`COUNT(*)`,
        })
        .from(quoteItems)
        .innerJoin(quotes, eq(quoteItems.quoteId, quotes.id))
        .where(
            and(
                eq(quoteItems.productId, targetProductId),
                eq(quotes.tenantId, tenantId),
                gte(quotes.createdAt, startDate)
            )
        );

    // 4. 计算建议
    const cost = Number(productInfo.purchasePrice || 0);
    const floorPrice = Number(productInfo.floorPrice || 0);
    const retailPrice = Number(productInfo.retailPrice || productInfo.unitPrice || 0);

    const avgSoldPrice = Number(salesStats[0]?.avgPrice || 0);
    const minSoldPrice = Number(salesStats[0]?.minPrice || 0);
    const maxSoldPrice = Number(salesStats[0]?.maxPrice || 0);
    const lastSoldPrice = Number(salesStats[0]?.lastPrice || 0);

    // 简单的毛利率计算
    const currentMargin = retailPrice > 0 ? ((retailPrice - cost) / retailPrice * 100).toFixed(1) : '0';
    const historicMargin = avgSoldPrice > 0 ? ((avgSoldPrice - cost) / avgSoldPrice * 100).toFixed(1) : '0';

    return {
        success: true,
        data: {
            product: {
                name: productInfo.name,
                sku: productInfo.sku,
                cost: cost,
                floorPrice: floorPrice,
                guidancePrice: retailPrice,
            },
            stats: {
                periodDays: params.periodDays,
                soldCount: Number(salesStats[0]?.count || 0),
                totalVolume: Number(salesStats[0]?.totalSold || 0),
                avgSoldPrice: avgSoldPrice.toFixed(2),
                minSoldPrice: minSoldPrice.toFixed(2),
                maxSoldPrice: maxSoldPrice.toFixed(2),
                lastSoldPrice: lastSoldPrice.toFixed(2),
                quoteCount: Number(quoteStats[0]?.quoteCount || 0),
                avgQuotePrice: Number(quoteStats[0]?.avgQuotePrice || 0).toFixed(2),
            },
            analysis: {
                suggestedPrice: avgSoldPrice > 0 ? avgSoldPrice.toFixed(2) : retailPrice.toFixed(2),
                margin: {
                    guidance: currentMargin,
                    actual: historicMargin,
                },
                competitiveness: avgSoldPrice < retailPrice ? 'BELOW_GUIDE' : 'ABOVE_GUIDE',
            }
        }
    };
}));

export async function getPricingHints(params: z.infer<typeof pricingHintsSchema>) {
    return getPricingHintsAction(params);
}
