/**
 * 商品搜索 API
 *
 * GET /api/miniprogram/products
 * Query: keyword, category
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { products } from '@/shared/api/schema';
import { eq, and, or, like, desc } from 'drizzle-orm';
import { jwtVerify } from 'jose';

// Helper to get user
async function getUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.slice(7);
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return {
      id: payload.userId as string,
      tenantId: payload.tenantId as string,
    };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user || !user.tenantId) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const category = searchParams.get('category');

    let whereClause = and(eq(products.tenantId, user.tenantId), eq(products.isActive, true));

    if (category) {
      whereClause = and(whereClause, eq(products.category, category as any));
    }

    if (keyword) {
      whereClause = and(
        whereClause,
        or(like(products.name, `%${keyword}%`), like(products.sku, `%${keyword}%`))
      );
    }

    const list = await db.query.products.findMany({
      where: whereClause,
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
      image: p.images ? (p.images as any[])[0] : null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Search Products Error:', error);
    return NextResponse.json({ success: false, error: '搜索失败' }, { status: 500 });
  }
}
