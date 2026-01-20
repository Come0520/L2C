/**
 * 客户端 - 订单列表 API
 * GET /api/mobile/orders
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { orders, customers } from '@/shared/api/schema';
import { eq, desc } from 'drizzle-orm';
import { apiSuccess, apiError, apiPaginated } from '@/shared/lib/api-response';
import { authenticateMobile, requireCustomer } from '@/shared/middleware/mobile-auth';

export async function GET(request: NextRequest) {
    // 1. 认证
    const authResult = await authenticateMobile(request);
    if (!authResult.success) {
        return authResult.response;
    }
    const { session } = authResult;

    // 2. 权限检查
    const roleCheck = requireCustomer(session);
    if (!roleCheck.allowed) {
        return roleCheck.response;
    }

    // 3. 解析查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    try {
        // 4. 根据客户手机号查找客户
        const customer = await db.query.customers.findFirst({
            where: eq(customers.phone, session.phone),
            columns: { id: true }
        });

        if (!customer) {
            return apiSuccess({
                items: [],
                pagination: { page, pageSize, total: 0, totalPages: 0 }
            });
        }

        // 5. 查询订单列表
        const orderList = await db.query.orders.findMany({
            where: eq(orders.customerId, customer.id),
            orderBy: [desc(orders.createdAt)],
            limit: pageSize,
            offset: (page - 1) * pageSize,
            columns: {
                id: true,
                orderNo: true,
                status: true,
                totalAmount: true,
                createdAt: true,
            }
        });

        // 6. 统计总数
        const allOrders = await db.query.orders.findMany({
            where: eq(orders.customerId, customer.id),
            columns: { id: true }
        });
        const total = allOrders.length;

        // 7. 格式化响应（status 是枚举类型，需要类型断言）
        const items = orderList.map(order => ({
            id: order.id,
            orderNo: order.orderNo,
            status: order.status,
            statusText: getOrderStatusText((order.status as string | null) ?? ''),
            totalAmount: order.totalAmount ? parseFloat(String(order.totalAmount)) : 0,
            createdAt: order.createdAt?.toISOString(),
        }));

        return apiPaginated(items, page, pageSize, total);

    } catch (error) {
        console.error('订单列表查询错误:', error);
        return apiError('查询订单列表失败', 500);
    }
}

/**
 * 订单状态文本映射
 */
function getOrderStatusText(status: string): string {
    const statusMap: Record<string, string> = {
        'DRAFT': '草稿',
        'PENDING_CONFIRM': '待确认',
        'CONFIRMED': '已确认',
        'SIGNED': '已签约',
        'IN_PRODUCTION': '生产中',
        'PENDING_INSTALL': '待安装',
        'INSTALLING': '安装中',
        'COMPLETED': '已完成',
        'CANCELLED': '已取消',
    };
    return statusMap[status] || status;
}
