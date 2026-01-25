/**
 * 客户列表查询 API
 *
 * GET /api/miniprogram/customers
 * Query Params: ?keyword=xxx
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { customers, users } from '@/shared/api/schema';
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

    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, payload.userId as string),
      columns: { id: true, role: true, tenantId: true },
    });
    return user;
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

    let whereClause = eq(customers.tenantId, user.tenantId);

    // Role-based filtering
    if (user.role === 'sales') {
      whereClause = and(whereClause, eq(customers.salesId, user.id))!;
    }
    // Admin sees all by default

    // Keyword filtering (Name or Phone)
    if (keyword) {
      whereClause = and(
        whereClause,
        or(like(customers.name, `%${keyword}%`), like(customers.phone, `%${keyword}%`))
      )!;
    }

    const list = await db.query.customers.findMany({
      where: whereClause,
      orderBy: [desc(customers.createdAt)],
      with: {
        // Join sales rep info if admin
        salesRep: {
          columns: { name: true },
        },
      },
    });

    const data = list.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      address: c.address,
      tags: c.tags,
      status: 'active', // TODO: Add status to schema if needed
      salesRepName: c.salesRep?.name || '公海',
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Fetch Customers Error:', error);
    return NextResponse.json({ success: false, error: '获取客户列表失败' }, { status: 500 });
  }
}
