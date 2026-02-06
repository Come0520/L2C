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
    // 开发模式检测 - 返回 Mock 商品数据
    const authHeader = request.headers.get('authorization');
    if (authHeader?.includes('dev-mock-token-')) {
      const mockProducts = [
        { id: 'mock-prod-1', name: '高遮光窗帘布', sku: 'CUR-001', category: 'CURTAIN', unitPrice: '128.00', unit: '米', image: null, calcType: 'CURTAIN', fabricWidth: 2.8 },
        { id: 'mock-prod-2', name: '纱帘布料', sku: 'CUR-002', category: 'CURTAIN', unitPrice: '68.00', unit: '米', image: null, calcType: 'CURTAIN', fabricWidth: 2.8 },
        { id: 'mock-prod-3', name: '铝合金静音轨道', sku: 'TRK-001', category: 'TRACK', unitPrice: '45.00', unit: '米', image: null, calcType: 'LINEAR' },
        { id: 'mock-prod-4', name: '罗马杆套装', sku: 'ROD-001', category: 'ACCESSORY', unitPrice: '180.00', unit: '套', image: null, calcType: 'FIXED' },
        { id: 'mock-prod-5', name: '挂钩（100个装）', sku: 'ACC-001', category: 'ACCESSORY', unitPrice: '25.00', unit: '包', image: null, calcType: 'FIXED' },
      ];
      return NextResponse.json({ success: true, data: mockProducts });
    }

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
