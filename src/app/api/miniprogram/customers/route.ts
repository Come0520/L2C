/**
 * 客户管理 API
 *
 * GET /api/miniprogram/customers - 获取客户列表
 * POST /api/miniprogram/customers - 快速创建客户
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { customers, customerAddresses } from '@/shared/api/schema';
import { eq, and, or, like, desc, isNull } from 'drizzle-orm';
import { jwtVerify } from 'jose';

// 辅助函数：获取用户信息
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

// Mock 客户数据（开发模式）
const mockCustomers = [
  { id: 'mock-cust-001', name: '张三', phone: '138****1234', level: 'B', totalOrders: 3 },
  { id: 'mock-cust-002', name: '李四', phone: '139****5678', level: 'C', totalOrders: 1 },
  { id: 'mock-cust-003', name: '王五', phone: '137****9012', level: 'A', totalOrders: 8 },
  { id: 'mock-cust-004', name: '赵六', phone: '136****3456', level: 'D', totalOrders: 0 },
  { id: 'mock-cust-005', name: '孙七', phone: '135****7890', level: 'C', totalOrders: 2 },
];

/**
 * GET - 获取客户列表
 */
export async function GET(request: NextRequest) {
  try {
    // 开发模式检测
    const authHeader = request.headers.get('authorization');
    if (authHeader?.includes('dev-mock-token-')) {
      return NextResponse.json({ success: true, data: mockCustomers });
    }

    const user = await getUser(request);
    if (!user || !user.tenantId) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 构建查询条件
    let whereClause = and(
      eq(customers.tenantId, user.tenantId),
      isNull(customers.deletedAt)
    );

    if (keyword) {
      whereClause = and(
        whereClause,
        or(
          like(customers.name, `%${keyword}%`),
          like(customers.phone, `%${keyword}%`)
        )
      );
    }

    const list = await db.query.customers.findMany({
      where: whereClause,
      orderBy: [desc(customers.updatedAt)],
      limit,
      columns: {
        id: true,
        name: true,
        phone: true,
        level: true,
        totalOrders: true,
        // address removed as it is not in customers table
        lifecycleStage: true,
      },
    });

    // 手机号脱敏
    const data = list.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone ? c.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '',
      level: c.level,
      totalOrders: c.totalOrders,
      lifecycleStage: c.lifecycleStage,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Get Customers Error:', error);
    return NextResponse.json({ success: false, error: '获取客户列表失败' }, { status: 500 });
  }
}

/**
 * POST - 快速创建客户
 */
export async function POST(request: NextRequest) {
  try {
    // 开发模式检测
    const authHeader = request.headers.get('authorization');
    if (authHeader?.includes('dev-mock-token-')) {
      const body = await request.json();
      const newMockCustomer = {
        id: 'mock-new-' + Date.now(),
        name: body.name || '新客户',
        phone: body.phone || '',
        channelId: body.channelId,
        contactId: body.contactId,
        source: body.source,
      };
      return NextResponse.json({ success: true, data: newMockCustomer });
    }

    const user = await getUser(request);
    if (!user || !user.tenantId) {
      return NextResponse.json({ success: false, error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, wechat, address } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: '客户姓名不能为空' }, { status: 400 });
    }

    // 生成客户编号
    const customerNo = `C${Date.now()}`;

    const [newCustomer] = await db
      .insert(customers)
      .values({
        tenantId: user.tenantId,
        customerNo,
        name,
        phone: phone || '',
        wechat: wechat || null,
        createdBy: user.id,
      })
      .returning({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
      });

    // 如果提供了地址，保存到地址表
    if (address) {
      await db.insert(customerAddresses).values({
        tenantId: user.tenantId,
        customerId: newCustomer.id,
        address: address,
        label: '默认地址',
        isDefault: true,
      });
    }

    return NextResponse.json({ success: true, data: newCustomer });
  } catch (error) {
    console.error('Create Customer Error:', error);
    return NextResponse.json({ success: false, error: '创建客户失败' }, { status: 500 });
  }
}
