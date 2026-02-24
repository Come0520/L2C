'use server';

import { db } from '@/shared/api/db';
import { orderItems, orders, products, quoteItems, quotes } from '@/shared/api/schema';
import { eq, and, sql, gte } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { cache } from 'react';
import { logger } from '@/shared/lib/logger';
import { unstable_cache } from 'next/cache';

const pricingHintsSchema = z.object({
    productId: z.string().optional(),
    sku: z.string().optional(),
    periodDays: z.number().default(90), // Default lookback period
});

/**
 * 缓存的定价数据查询函数
 * 提升至顶层以确保 Next.js 能够正确识别并复用缓存
 * 
 * @param pId 产品ID
 * @param tId 租户ID
 * @param category 产品分类
 * @param startISO 统计开始时间(ISO)
 * @param trendStartISO 趋势开始时间(ISO)
 */
const getCachedPricingData = unstable_cache(
    async (pId: string, tId: string, category: string | null, startISO: string, trendStartISO: string) => {
        const start = new Date(startISO);
        const trendStart = new Date(trendStartISO);

        const salesStatsPromise = db
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
                    eq(orderItems.productId, pId),
                    eq(orders.tenantId, tId),
                    gte(orders.createdAt, start),
                    sql`${orders.status} NOT IN ('CANCELLED', 'DRAFT')`
                )
            );

        const quoteStatsPromise = db
            .select({
                avgQuotePrice: sql<string>`AVG(CAST(${quoteItems.unitPrice} AS DECIMAL))`,
                quoteCount: sql<number>`COUNT(*)`,
            })
            .from(quoteItems)
            .innerJoin(quotes, eq(quoteItems.quoteId, quotes.id))
            .where(
                and(
                    eq(quoteItems.productId, pId),
                    eq(quotes.tenantId, tId),
                    gte(quotes.createdAt, start)
                )
            );

        const priceTrendsPromise = db
            .select({
                month: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
                avgPrice: sql<string>`AVG(CAST(${orderItems.unitPrice} AS DECIMAL))`
            })
            .from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .where(
                and(
                    eq(orderItems.productId, pId),
                    eq(orders.tenantId, tId),
                    gte(orders.createdAt, trendStart),
                    sql`${orders.status} NOT IN ('CANCELLED', 'DRAFT')`
                )
            )
            .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`)
            .orderBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`);

        const categoryStatsPromise = db
            .select({
                minRetailPrice: sql<string>`MIN(CAST(${products.retailPrice} AS DECIMAL))`,
                maxRetailPrice: sql<string>`MAX(CAST(${products.retailPrice} AS DECIMAL))`,
                avgRetailPrice: sql<string>`AVG(CAST(${products.retailPrice} AS DECIMAL))`,
                count: sql<number>`COUNT(*)`,
            })
            .from(products)
            .where(
                and(
                    category ? eq(products.category, category as typeof products.category.enumValues[number]) : sql`TRUE`,
                    eq(products.tenantId, tId),
                    eq(products.isActive, true)
                )
            );

        return await Promise.all([
            salesStatsPromise,
            quoteStatsPromise,
            priceTrendsPromise,
            categoryStatsPromise
        ]);
    },
    ['pricing-hints-stats'],
    { revalidate: 300, tags: ['pricing'] }
);

/**
 * 获取产品定价参考建议的内部 Server Action
 * 
 * 聚合指定产品或 SKU 的历史成交价、近期报价记录及成本等多维度信息，为销售端提供定价预估和毛利参考。
 * 返回包括成本底价、指导价、近期均价、价格趋势图数据以及同类产品的市场价格参考。
 * 
 * @param {Object} params - 请求参数对象
 * @param {string} [params.productId] - 产品唯一识别ID
 * @param {string} [params.sku] - 产品库存单位 (SKU) 代码
 * @param {number} [params.periodDays=90] - 提取历史订单及报价数据的时间范围（天数），默认为 90 天
 * @param {Object} param1 - 下文执行环境（由 createSafeAction 注入）
 * @param {Object} param1.session - 用户会话信息，包含用于校验权限及数据视图范围的 user 和 tenantId
 * 
 * @returns {Promise<Object>} 返回具有 success 与 data 字段的状态结果
 */
export const getPricingHintsAction = cache(createSafeAction(pricingHintsSchema, async (params, { session }) => {
    const startTime = performance.now();
    const tenantId = session.user.tenantId;

    try {
        // 允许销售查看定价建议
        await checkPermission(session, 'quotes:create');

        if (!params.productId && !params.sku) {
            return { success: false, error: 'Product ID or SKU is required' };
        }

        // 1. 获取基础产品信息 (成本/底价)
        const productInfo = await db.query.products.findFirst({
            where: (products, { eq, and }) =>
                and(
                    eq(products.tenantId, tenantId),
                    params.productId ? eq(products.id, params.productId) : undefined,
                    params.sku ? eq(products.sku, params.sku) : undefined
                ),
        });

        if (!productInfo) {
            return { success: false, error: 'Product not found' };
        }

        const targetProductId = productInfo.id;
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1); // 最近一个月

        const trendStartDate = new Date();
        trendStartDate.setMonth(trendStartDate.getMonth() - 6); // 最近半年

        // 2. 调用缓存的聚合查询
        const [salesStats, quoteStats, priceTrends, categoryStats] = await getCachedPricingData(
            targetProductId,
            tenantId,
            productInfo.category,
            startDate.toISOString(),
            trendStartDate.toISOString()
        );

        const dbEndTime = performance.now();
        const dbDuration = (dbEndTime - startTime).toFixed(2);

        // 3. 计算建议与分析
        const cost = Number(productInfo.purchasePrice || 0);
        const floorPrice = Number(productInfo.floorPrice || 0);
        const retailPrice = Number(productInfo.retailPrice || productInfo.unitPrice || 0);

        const sales = salesStats[0] || {};
        const quotesData = quoteStats[0] || {};
        const cat = categoryStats[0] || {};

        const avgSoldPrice = Number(sales.avgPrice || 0);
        const minSoldPrice = Number(sales.minPrice || 0);
        const maxSoldPrice = Number(sales.maxPrice || 0);
        const lastSoldPrice = Number(sales.lastPrice || 0);

        // PR-02 修复：建议价安全防线 —— 不得低于 floor_price（底价红线）
        const rawSuggestedPrice = avgSoldPrice > 0 ? avgSoldPrice : retailPrice;
        const suggestedPriceNum = floorPrice > 0 && rawSuggestedPrice < floorPrice
            ? floorPrice  // 若计算结果低于底价，自动托底为 floor_price
            : rawSuggestedPrice;

        // PR-06 已有保护：毛利率计算使用条件表达式，避免除零产生 NaN/Infinity
        const currentMargin = retailPrice > 0 ? ((retailPrice - cost) / retailPrice * 100).toFixed(1) : '0';
        const historicMargin = avgSoldPrice > 0 ? ((avgSoldPrice - cost) / avgSoldPrice * 100).toFixed(1) : '0';
        const estimatedMargin = suggestedPriceNum > 0 ? ((suggestedPriceNum - cost) / suggestedPriceNum * 100).toFixed(1) : '0';

        // PR-01 修复：预计算低毛利告警标志（任一毛利率低于 20% 则告警）
        const LOW_MARGIN_THRESHOLD = 20;
        const isLowMargin = [
            parseFloat(currentMargin),
            parseFloat(historicMargin),
            parseFloat(estimatedMargin),
        ].some(m => m < LOW_MARGIN_THRESHOLD);

        const totalEndTime = performance.now();
        const totalDuration = (totalEndTime - startTime).toFixed(2);

        logger.info('获取定价建议成功', {
            productId: params.productId,
            sku: params.sku,
            tenantId,
            suggestedPrice: suggestedPriceNum,
            duration: {
                db: `${dbDuration}ms`,
                total: `${totalDuration}ms`
            }
        });

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
                    soldCount: Number(sales.count || 0),
                    totalVolume: Number(sales.totalSold || 0),
                    avgSoldPrice: avgSoldPrice.toFixed(2),
                    minSoldPrice: minSoldPrice.toFixed(2),
                    maxSoldPrice: maxSoldPrice.toFixed(2),
                    lastSoldPrice: lastSoldPrice.toFixed(2),
                    quoteCount: Number(quotesData.quoteCount || 0),
                    avgQuotePrice: Number(quotesData.avgQuotePrice || 0).toFixed(2),
                },
                analysis: {
                    suggestedPrice: suggestedPriceNum.toFixed(2),
                    // PR-02: 标识建议价是否被 floor_price 托底
                    floorPriceTriggered: floorPrice > 0 && rawSuggestedPrice < floorPrice,
                    margin: {
                        guidance: currentMargin,
                        actual: historicMargin,
                        estimated: estimatedMargin,
                    },
                    // PR-01: 低毛利率告警（任一毛利率低于 20% 时为 true）——前端可展示红色警示
                    isLowMargin,
                    competitiveness: avgSoldPrice < retailPrice ? 'BELOW_GUIDE' : 'ABOVE_GUIDE',
                },
                trends: priceTrends.map((t: { month: string; avgPrice: string }) => ({
                    month: t.month,
                    avgPrice: Number(t.avgPrice).toFixed(2)
                })),
                categoryAnalysis: {
                    category: productInfo.category,
                    minPrice: Number(cat.minRetailPrice || 0).toFixed(2),
                    maxPrice: Number(cat.maxRetailPrice || 0).toFixed(2),
                    avgPrice: Number(cat.avgRetailPrice || 0).toFixed(2),
                    productCount: Number(cat.count || 0),
                }
            }
        };
    } catch (error) {
        logger.error('获取定价建议失败', { error, productId: params.productId, sku: params.sku, tenantId });
        return { success: false, error: '获取定价建议失败' };
    }
}));

/**
 * 服务端调用的定价建议获取接口
 * 
 * 封装了包含权限与日志审计机制的 getPricingHintsAction，并确保入参满足 pricingHintsSchema。
 * 用于组件或前端请求中获取经过合法性与安全过滤的定价数据。
 * 
 * @param {z.input<typeof pricingHintsSchema>} params - 包含产品识别与追溯日期的入参对象
 * @returns {Promise<any>} 安全代理层返回的序列化产品预估结果对象
 */
export async function getPricingHints(params: z.input<typeof pricingHintsSchema>) {
    return getPricingHintsAction(params as z.infer<typeof pricingHintsSchema>);
}
