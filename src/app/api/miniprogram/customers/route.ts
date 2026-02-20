/**
 * 客户管理 API
 *
 * GET /api/miniprogram/customers - 获取客户列表
 * POST /api/miniprogram/customers - 快速创建客户
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { db } from '@/shared/api/db';
import { customers, customerAddresses } from '@/shared/api/schema';
import { eq, and, or, like, desc, isNull } from 'drizzle-orm';
import { getMiniprogramUser } from '../auth-utils';



/**
 * GET - 获取客户列表
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user || !user.tenantId) {
      return apiError('未授权', 401);
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

    return apiSuccess(data);
  } catch (error) {
    console.error('Get Customers Error:', error);
    return apiError(
      process.env.NODE_ENV === 'development' ? `获取客户列表失败: ${error instanceof Error ? error.message : String(error)}` : '获取客户列表失败',
      500
    );
  }
}

/**
 * POST - 快速创建客户
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user || !user.tenantId) {
      return apiError('未授权', 401);
    }

    const body = await request.json();
    const { name, phone, wechat, address } = body;

    if (!name) {
      return apiError('客户姓名不能为空', 400);
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

    return apiSuccess(newCustomer);
  } catch (error) {
    console.error('Create Customer Error:', error);
    return apiError('创建客户失败', 500);
  }
}
