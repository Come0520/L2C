/**
 * 客户端 - 发起售后 API
 * POST /api/mobile/after-sales
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { customers, afterSalesTickets, orders } from '@/shared/api/schema';
import { eq, desc, and } from 'drizzle-orm';
import { apiSuccess, apiError, apiNotFound } from '@/shared/lib/api-response';
import { authenticateMobile, requireCustomer } from '@/shared/middleware/mobile-auth';
import { generateTicketNo } from '@/features/after-sales/utils';
import { z } from 'zod';
import { createLogger } from '@/shared/lib/logger';

// P0 FIX (AS-03): 使用 Zod 进行运行时校验
const createAfterSalesSchema = z.object({
    orderId: z.string().uuid('订单ID格式无效'),
    orderItemId: z.string().uuid().optional(),
    type: z.enum(['REPAIR', 'REPLACE', 'REFUND', 'OTHER']),
    reason: z.string().min(1, '问题描述不能为空').max(2000, '问题描述过长'),
    photos: z.array(z.string().url('照片链接格式无效')).max(9, '最多上传9张照片').optional(),
    videos: z.array(z.string().url('视频链接格式无效')).max(3, '最多上传3个视频').optional(),
    expectation: z.string().max(500, '期望描述过长').optional(),
});


const log = createLogger('mobile/after-sales');
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

    // 3. P0 FIX (AS-03): 使用 Zod 解析和校验请求体
    let body: z.infer<typeof createAfterSalesSchema>;
    try {
        const rawBody = await request.json();
        const result = createAfterSalesSchema.safeParse(rawBody);
        if (!result.success) {
            return apiError(`参数校验失败: ${result.error.issues[0].message}`, 400);
        }
        body = result.data;
    } catch {
        return apiError('请求体格式错误', 400);
    }

    const { orderId, type, reason, photos } = body;

    try {
        // 5. 验证订单归属
        const customer = await db.query.customers.findFirst({
            where: and(eq(customers.phone, session.phone), eq(customers.tenantId, session.tenantId)),
            columns: { id: true, tenantId: true }
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

        // P1 FIX (R2-06): 使用事务包裹编号生成与插入，由于 generateTicketNo 内部不再自建事务，在此处手动开启
        const result = await db.transaction(async (tx) => {
            const ticketNo = await generateTicketNo(order.tenantId, tx);
            const now = new Date();

            const [ticket] = await tx.insert(afterSalesTickets).values({
                id: crypto.randomUUID(),
                ticketNo,
                tenantId: order.tenantId,
                orderId: order.id,
                customerId: customer.id,
                type,
                description: reason,
                photos: photos,
                createdAt: now,
                updatedAt: now,
            }).returning();

            return { ticket, now };
        });

        const { ticket, now } = result;
        log.info(`售后申请: 工单号 ${ticket.ticketNo}, 订单 ${order.orderNo}, 类型 ${type}`);

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
        log.error('售后申请创建错误', {}, error);
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
            where: and(eq(customers.phone, session.phone), eq(customers.tenantId, session.tenantId)),
            columns: { id: true, tenantId: true }
        });

        if (!customer) {
            return apiSuccess({ items: [] });
        }

        // 4. P0 FIX (AS-04): 查询售后工单，添加租户过滤
        // P1 FIX (R2-07): 分页参数防滥用与校验
        let page = parseInt(request.nextUrl.searchParams.get('page') || '1');
        let pageSize = parseInt(request.nextUrl.searchParams.get('pageSize') || '10');

        // 边界保护
        page = Math.max(1, isNaN(page) ? 1 : page);
        pageSize = Math.min(50, Math.max(1, isNaN(pageSize) ? 10 : pageSize));

        const offset = (page - 1) * pageSize;

        const tickets = await db.query.afterSalesTickets.findMany({
            where: and(
                eq(afterSalesTickets.customerId, customer.id),
                eq(afterSalesTickets.tenantId, customer.tenantId) // 租户隔离
            ),
            orderBy: [desc(afterSalesTickets.createdAt)],
            limit: pageSize,
            offset: offset,
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
        log.error('售后列表查询错误', {}, error);
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
        'INVESTIGATING': '定责中',
        'PROCESSING': '处理中',
        'PENDING_VISIT': '待上门',
        'PENDING_CALLBACK': '待回访',
        'PENDING_VERIFY': '待验收',
        'RESOLVED': '已解决',
        'REJECTED': '已驳回',
        'CLOSED': '已关闭',
    };
    return map[status] || status;
}
