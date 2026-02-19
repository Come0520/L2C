/**
 * 商品搜索 API
 *
 * GET /api/miniprogram/products
 * Query: keyword, category
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { db } from '@/shared/api/db';
import { products } from '@/shared/api/schema';
import { eq, and, or, like, desc, SQL } from 'drizzle-orm';
import { getMiniprogramUser } from '../auth-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user || !user.tenantId) {
      return apiError('未授权', 401);
    }

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const category = searchParams.get('category');

    const conditions: SQL[] = [
      eq(products.tenantId, user.tenantId),
      eq(products.isActive, true),
    ];

    if (category) {
      // Cast category to any to bypass strict enum checking if needed, or ensure it matches enum
      conditions.push(eq(products.category, category as any));
    }

    if (keyword) {
      conditions.push(or(like(products.name, `%${keyword}%`), like(products.sku, `%${keyword}%`)) as SQL);
    }

    const list = await db.query.products.findMany({
      where: and(...conditions),
      orderBy: [desc(products.createdAt)],
      limit: 50,
    });

    const data = list.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      unit: p.unit,
      image: p.images && Array.isArray(p.images) ? p.images[0] : null,
    }));

    return apiSuccess(data);
  } catch (error) {
    console.error('Search Products Error:', error);
    return apiError('搜索失败', 500);
  }
}
