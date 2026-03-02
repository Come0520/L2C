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

/**
 * 定价建议请求参数的 Zod 校验 Schema
 *
 * @description 用于验证前端传入的定价建议查询参数，
 * 确保产品 ID 或 SKU 至少提供其一，并设置默认的数据回溯期。
 *
 * @property {string} [productId] - 产品唯一识别 ID
 * @property {string} [sku] - 产品的 SKU 编码
 * @property {number} [periodDays=90] - 提取历史订单及报价数据的时间范围（天数），默认 90 天
 */
const pricingHintsSchema = z.object({
  productId: z.string().optional(),
  sku: z.string().optional(),
  periodDays: z.number().default(90), // Default lookback period
});

/**
 * 缓存的聚合定价数据查询函数
 *
 * @description 核心数据查询引擎，并行执行 4 个复杂的聚合查询：
 * 1. 销售统计：近 N 天的历史成交极值、均价、总销量及最近一次成交价
 * 2. 报价统计：近 N 天的历史报价均价及次数
 * 3. 价格趋势：近半年按月分组的均价走势
 * 4. 品类统计：同类目下所有活跃产品的指导价极值与均价
 *
 * 提升至顶层定义以确保 Next.js unstable_cache 能够正确识别并复用缓存，
 * 有效降低复杂聚合查询对数据库的压力。缓存有效期为 5 分钟 (300 秒)。
 *
 * @param {string} pId - 目标产品 ID
 * @param {string} tId - 当前登录用户的租户 ID（用于数据隔离）
 * @param {string|null} category - 目标产品的分类（用于同类对比），可为空
 * @param {string} startISO - 统计回溯的开始时间（ISO 8601 格式字符串）
 * @param {string} trendStartISO - 趋势图表的开始时间（通常更早，如半年前）
 *
 * @returns {Promise<[any[], any[], any[], any[]]>} 返回包含 4 个查询结果数组的 Promise
 *
 * @security 使用 Drizzle ORM 构建查询，内置 SQL 注入防护
 * @security 强制在所有查询中附加 eq(tenantId, tId) 条件实现租户数据隔离
 */
const getCachedPricingData = unstable_cache(
  async (
    pId: string,
    tId: string,
    category: string | null,
    startISO: string,
    trendStartISO: string
  ) => {
    /** 转换 ISO 字符串为 Date 对象供应 ORM 查询使用 */
    const start = new Date(startISO);
    const trendStart = new Date(trendStartISO);

    /**
     * 销售统计聚合查询
     * @description 查询已成交订单（排除取消和草稿状态）中的目标产品记录。
     * 使用 CAST(... AS DECIMAL) 确保金额计算的精度，避免浮点误差。
     */
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

    /**
     * 报价统计聚合查询
     * @description 查询历史报价单中的目标产品记录。
     * 使用 CAST(... AS DECIMAL) 确保金额计算的精度。
     */
    const quoteStatsPromise = db
      .select({
        avgQuotePrice: sql<string>`AVG(CAST(${quoteItems.unitPrice} AS DECIMAL))`,
        quoteCount: sql<number>`COUNT(*)`,
      })
      .from(quoteItems)
      .innerJoin(quotes, eq(quoteItems.quoteId, quotes.id))
      .where(
        and(eq(quoteItems.productId, pId), eq(quotes.tenantId, tId), gte(quotes.createdAt, start))
      );

    /**
     * 月度价格趋势查询
     * @description 按月分组（YYYY-MM）统计目标产品的成交均价，用于生成趋势图。
     */
    const priceTrendsPromise = db
      .select({
        month: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
        avgPrice: sql<string>`AVG(CAST(${orderItems.unitPrice} AS DECIMAL))`,
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

    /**
     * 同品类统计算法
     * @description 查询同分类下所有活跃产品的指导价。如果产品无分类，则查询全量活跃产品。
     */
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
          category
            ? eq(products.category, category as (typeof products.category.enumValues)[number])
            : sql`TRUE`,
          eq(products.tenantId, tId),
          eq(products.isActive, true)
        )
      );

    return await Promise.all([
      salesStatsPromise,
      quoteStatsPromise,
      priceTrendsPromise,
      categoryStatsPromise,
    ]);
  },
  ['pricing-hints-stats'],
  { revalidate: 300, tags: ['pricing'] }
);

/**
 * 获取产品定价参考建议的内部 Server Action
 *
 * @description 聚合指定产品或 SKU 的历史成交价、近期报价记录及成本等多维度信息，
 * 为销售端提供定价预估和毛利参考。
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
 *
 * @security 必须拥有 'quotes:create' 权限才能查看定价建议。
 */
export const getPricingHintsAction = cache(
  createSafeAction(pricingHintsSchema, async (params, { session }) => {
    /** 记录开始时间以统计执行耗时 */
    const startTime = performance.now();
    const tenantId = session.user.tenantId;

    try {
      /**
       * 权限校验：仅允许具备案源/报价创建权限的角色访问
       * 销售人员通常具备此权限。
       */
      await checkPermission(session, 'quotes:create');

      logger.info('开始获取定价建议', {
        productId: params.productId,
        sku: params.sku,
        periodDays: params.periodDays,
        tenantId,
      });

      if (!params.productId && !params.sku) {
        logger.warn('获取定价建议失败：缺失 productId 和 sku');
        return { success: false, error: 'Product ID or SKU is required' };
      }

      /**
       * 第一阶段：获取基础产品信息 (成本/底价)
       * 用于作为毛利计算的基准。
       */
      const productInfo = await db.query.products.findFirst({
        where: (products, { eq, and }) =>
          and(
            eq(products.tenantId, tenantId),
            params.productId ? eq(products.id, params.productId) : undefined,
            params.sku ? eq(products.sku, params.sku) : undefined
          ),
      });

      if (!productInfo) {
        logger.warn('未找到指定商品的定价信息', { productId: params.productId, sku: params.sku, tenantId });
        return { success: false, error: 'Product not found' };
      }

      const targetProductId = productInfo.id;

      /** 设定统计的时间窗口：常规统计近1个月，趋势图近6个月 */
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // 最近一个月

      const trendStartDate = new Date();
      trendStartDate.setMonth(trendStartDate.getMonth() - 6); // 最近半年

      logger.info('准备执行内部定价统计聚合计算', { targetProductId, startDate, trendStartDate });

      /**
       * 第二阶段：并行执行缓存的复杂关联及聚合查询
       */
      const [salesStats, quoteStats, priceTrends, categoryStats] = await getCachedPricingData(
        targetProductId,
        tenantId,
        productInfo.category,
        startDate.toISOString(),
        trendStartDate.toISOString()
      );

      const dbEndTime = performance.now();
      const dbDuration = (dbEndTime - startTime).toFixed(2);

      /**
       * 第三阶段：计算衍生指标与智能建议
       * 将数据库返回的字符串统一转换为 Number 以便进行数学运算。
       */
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

      /**
       * 智能建议价计算逻辑
       * @description PR-02 修复：建议价安全防线 —— 不得低于 floor_price（底价红线）。
       * 优先参考历史均价，若无记录则退化为指导价。
       */
      const rawSuggestedPrice = avgSoldPrice > 0 ? avgSoldPrice : retailPrice;
      const suggestedPriceNum =
        floorPrice > 0 && rawSuggestedPrice < floorPrice
          ? floorPrice // 若计算结果低于底价，自动托底为 floor_price
          : rawSuggestedPrice;

      /**
       * 毛利率计算
       * @description PR-06 保护：使用条件表达式，避免除以零产生 NaN/Infinity。
       * 计算公式：(售价 - 成本) / 售价 * 100
       */
      const currentMargin =
        retailPrice > 0 ? (((retailPrice - cost) / retailPrice) * 100).toFixed(1) : '0';
      const historicMargin =
        avgSoldPrice > 0 ? (((avgSoldPrice - cost) / avgSoldPrice) * 100).toFixed(1) : '0';
      const estimatedMargin =
        suggestedPriceNum > 0
          ? (((suggestedPriceNum - cost) / suggestedPriceNum) * 100).toFixed(1)
          : '0';

      /**
       * 第四阶段：风控规则引擎
       * @description PR-01 修复：预计算低毛利告警标志（任一毛利率低于 20% 则告警）。
       */
      const LOW_MARGIN_THRESHOLD = 20;
      const isLowMargin = [
        parseFloat(currentMargin),
        parseFloat(historicMargin),
        parseFloat(estimatedMargin),
      ].some((m) => m < LOW_MARGIN_THRESHOLD);

      if (isLowMargin) {
        logger.info('毛利率分析：检测到较低毛利率', { targetProductId, currentMargin, historicMargin, estimatedMargin });
      }

      /** 低于成本价的最高级别告警 */
      if (suggestedPriceNum < cost) {
        logger.warn('即将触发定价底线告警：建议价格低于采购成本', { targetProductId, suggestedPriceNum, cost });
      }

      const totalEndTime = performance.now();
      const totalDuration = (totalEndTime - startTime).toFixed(2);

      logger.info('获取定价建议成功', {
        productId: params.productId,
        sku: params.sku,
        tenantId,
        suggestedPrice: suggestedPriceNum,
        duration: {
          db: `${dbDuration}ms`,
          total: `${totalDuration}ms`,
        },
      });

      return {
        success: true,
        data: {
          /** 产品基础约束数据 */
          product: {
            name: productInfo.name,
            sku: productInfo.sku,
            cost: cost,
            floorPrice: floorPrice,
            guidancePrice: retailPrice,
          },
          /** 历史成交及报价摘要 */
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
          /** 智能分析与风控预测结果 */
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
          /** 月度价格趋势线数据 */
          trends: priceTrends.map((t: { month: string; avgPrice: string }) => ({
            month: t.month,
            avgPrice: Number(t.avgPrice).toFixed(2),
          })),
          /** 行业/品类基准对比数据 */
          categoryAnalysis: {
            category: productInfo.category,
            minPrice: Number(cat.minRetailPrice || 0).toFixed(2),
            maxPrice: Number(cat.maxRetailPrice || 0).toFixed(2),
            avgPrice: Number(cat.avgRetailPrice || 0).toFixed(2),
            productCount: Number(cat.count || 0),
          },
        },
      };
    } catch (error) {
      logger.error('获取定价建议失败', {
        error,
        productId: params.productId,
        sku: params.sku,
        tenantId,
      });
      return { success: false, error: '获取定价建议失败' };
    }
  })
);

/**
 * 服务端调用的定价建议获取接口
 *
 * @description 封装了包含权限与日志审计机制的 getPricingHintsAction，
 * 并确保入参满足 pricingHintsSchema。
 * 用于组件或前端请求中获取经过合法性与安全过滤的定价数据。
 *
 * @param {z.input<typeof pricingHintsSchema>} params - 包含产品识别与追溯日期的入参对象
 * @returns {Promise<any>} 安全代理层返回的序列化产品预估结果对象
 */
export async function getPricingHints(params: z.input<typeof pricingHintsSchema>) {
  return getPricingHintsAction(params as z.infer<typeof pricingHintsSchema>);
}
