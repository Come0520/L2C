/**
 * 客户端 - 发起售后 API
 * POST /api/mobile/after-sales
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { afterSalesTickets, orders, customers } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireCustomer } from '@/shared/middleware/mobile-auth';

/**
 * 售后申请请求体
 */
interface AfterSalesBody {
    orderId: string;                    // 关联订单
    orderItemId?: string;               // 关联订单项（可选）
    type: 'REPAIR' | 'REPLACE' | 'REFUND' | 'OTHER';  // 售后类型
    reason: string;                     // 问题描述
    photos?: string[];                  // 问题照片
    videos?: string[];                  // 问题视频
    expectation?: string;               // 期望处理方式
}

export async function POST(request: NextRequest) {
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

    // 3. 解析请求体
    let body: AfterSalesBody;
    try {
        body = await request.json();
    } catch {
        return apiError('请求体格式错误', 400);
    }

    const { orderId, orderItemId, type, reason, photos, videos, expectation } = body;

    // 4. 参数校验
    if (!orderId || !type || !reason) {
        return apiError('缺少必要参数: orderId, type, reason', 400);
    }

    try {
        // 5. 验证订单归属
        const customer = await db.query.customers.findFirst({
            where: eq(customers.phone, session.phone),
            columns: { id: true, name: true }
        });

        if (!customer) {
            return apiNotFound('客户信息不存在');
        }

        const order = await db.query.orders.findFirst({
            where: and(
                eq(orders.id, orderId),
                eq(orders.customerId, customer.id)
            ),
            columns: {
                id: true,
                orderNo: true,
                salesId: true,
                tenantId: true,
            }
        });

        if (!order) {
            return apiNotFound('订单不存在');
        }

        // 6. 生成售后单号
        const ticketNo = `AS${Date.now()}`;
        const now = new Date();

        // 7. 创建售后工单
        const [ticket] = await db.insert(afterSalesTickets).values({
            id: crypto.randomUUID(),
            ticketNo,
            tenantId: order.tenantId,
            orderId: order.id,
            customerId: customer.id,
            type,
            description: reason,
            createdAt: now,
            updatedAt: now,
        }).returning();

        console.log(`[售后申请] 工单号: ${ticketNo}, 订单: ${order.orderNo}, 类型: ${type}`);

        return apiSuccess(
            {
                ticketId: ticket.id,
                ticketNo: ticket.ticketNo,
                orderId,
                type,
                status: 'PENDING',
                statusText: '待受理',
                createdAt: now.toISOString(),
            },
            '售后申请提交成功，客服将尽快处理'
        );

    } catch (error) {
        console.error('售后申请创建错误:', error);
        return apiError('提交售后申请失败', 500);
    }
}

/**
 * 查询售后列表
 */
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

    try {
        // 3. 查找客户
        const customer = await db.query.customers.findFirst({
            where: eq(customers.phone, session.phone),
            columns: { id: true }
        });

        if (!customer) {
            return apiSuccess({ items: [] });
        }

        // 4. 查询售后工单
        const tickets = await db.query.afterSalesTickets.findMany({
            where: eq(afterSalesTickets.customerId, customer.id),
            orderBy: (t, { desc }) => [desc(t.createdAt)],
            columns: {
                id: true,
                ticketNo: true,
                type: true,
                status: true,
                description: true,
                createdAt: true,
            }
        });

        const items = tickets.map(t => ({
            id: t.id,
            ticketNo: t.ticketNo,
            type: t.type,
            typeText: getTypeText(t.type),
            status: t.status,
            statusText: getStatusText(t.status),
            description: t.description,
            createdAt: t.createdAt?.toISOString(),
        }));

        return apiSuccess({ items });

    } catch (error) {
        console.error('售后列表查询错误:', error);
        return apiError('查询售后列表失败', 500);
    }
}

function getTypeText(type: string): string {
    const map: Record<string, string> = {
        'REPAIR': '维修',
        'REPLACE': '换货',
        'REFUND': '退款',
        'OTHER': '其他',
    };
    return map[type] || type;
}

function getStatusText(status: string): string {
    const map: Record<string, string> = {
        'PENDING': '待受理',
        'PROCESSING': '处理中',
        'RESOLVED': '已解决',
        'CLOSED': '已关闭',
    };
    return map[status] || status;
}
