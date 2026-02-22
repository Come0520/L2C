/**
 * 商品搜索 API
 *
 * GET /api/miniprogram/products
 * Query: keyword, category
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { db } from '@/shared/api/db';
import { products } from '@/shared/api/schema';
import { eq, and, or, like, desc, SQL } from 'drizzle-orm';
import { getMiniprogramUser } from '../auth-utils';
import { CacheService } from '@/shared/services/miniprogram/cache.service';
import { RateLimiter } from '@/shared/services/miniprogram/security.service';
import { productCategoryEnum } from '@/shared/api/schema/enums';

export async function GET(request: NextRequest) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user || !user.tenantId) {
      return apiError('未授权', 401);
    }

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const category = searchParams.get('category');

    // 频控：商品搜索 5秒/3次 (防爬虫)
    if (!RateLimiter.allow(`search_products_${user.id}`, 3, 5000)) {
      return apiError('搜索太频繁，请稍后再试', 429);
    }

    // 缓存 Key：基于租户、分类、关键字构建
    const cacheKey = `products:${user.tenantId}:${category || 'ALL'}:${keyword || 'NONE'}`;

    const data = await CacheService.getOrSet(cacheKey, async () => {
      const conditions: SQL[] = [
        eq(products.tenantId, user.tenantId),
        eq(products.isActive, true),
      ];

      if (category) {
        // 类型安全过滤：仅允许合法的分类枚举值
        const validCategories = productCategoryEnum.enumValues as readonly string[];
        if (validCategories.includes(category)) {
          conditions.push(eq(products.category, category as typeof productCategoryEnum.enumValues[number]));
        }
      }

      if (keyword) {
        conditions.push(or(like(products.name, `%${keyword}%`), like(products.sku, `%${keyword}%`)) as SQL);
      }

      const list = await db.query.products.findMany({
        where: and(...conditions),
        orderBy: [desc(products.createdAt)],
        limit: 50,
      });

      return list.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category,
        unitPrice: p.unitPrice,
        unit: p.unit,
        image: p.images && Array.isArray(p.images) ? p.images[0] : null,
      }));
    }, 60000); // 1分钟冷热数据平衡缓存

    // 设置浏览器私有缓存
    const response = apiSuccess(data);
    response.headers.set('Cache-Control', 'private, max-age=60');
    return response;
  } catch (error) {
    logger.error('Search Products Error:', error);
    return apiError('搜索失败', 500);
  }
}
