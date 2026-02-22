import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { afterSalesTickets, orders } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateNo } from '@/shared/lib/generators';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { getMiniprogramUser } from '../../auth-utils';
import { RateLimiter } from '@/shared/services/miniprogram/security.service';



export async function POST(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('Unauthorized', 401);
        }

        // 频控：单用户每 5 秒最多 2 个工单
        if (!RateLimiter.allow(`create_ticket_${user.id}`, 2, 5000)) {
            return apiError('提交太频繁，请稍后再试', 429);
        }

        const body = await request.json();
        const { orderId, type, description, photos } = body;

        if (!orderId || !type || !description) {
            return apiError('Missing required fields', 400);
        }

        // Ensure Order exists
        const order = await db.query.orders.findFirst({
            where: and(eq(orders.id, orderId), eq(orders.tenantId, user.tenantId)),
            columns: { id: true, customerId: true }
        });

        if (!order) {
            return apiError('Order not found', 404);
        }

        const ticketNo = generateNo('TKT');

        await db.insert(afterSalesTickets).values({
            tenantId: user.tenantId,
            ticketNo: ticketNo,
            orderId: orderId,
            customerId: order.customerId,
            type,
            description,
            photos: photos || [],
            status: 'PENDING',
            createdBy: user.id
        });

        // 审计日志
        const { AuditService } = await import('@/shared/services/audit-service');
        await AuditService.log(db, {
            tableName: 'after_sales_tickets',
            recordId: ticketNo,
            action: 'CREATE',
            userId: user.id,
            tenantId: user.tenantId,
            details: { orderId, type }
        });

        return apiSuccess({ ticketNo });

    } catch (error) {
        logger.error('[ServiceTicket] 创建售后工单故障', { route: 'service/tickets', error });
        return apiError('创建工单失败', 500);
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('Unauthorized', 401);
        }

        const list = await db.query.afterSalesTickets.findMany({
            where: and(
                eq(afterSalesTickets.tenantId, user.tenantId),
                eq(afterSalesTickets.createdBy, user.id)
            ),
            orderBy: [desc(afterSalesTickets.createdAt)]
        });

        return apiSuccess(list);

    } catch (error) {
        logger.error('[ServiceTicket] 获取工单列表异常', { route: 'service/tickets', error });
        return apiError('获取失败', 500);
    }
}
