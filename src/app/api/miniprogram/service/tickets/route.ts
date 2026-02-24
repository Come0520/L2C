/**
 * 售后服务工单 API
 *
 * POST /api/miniprogram/service/tickets — 创建售后工单
 * GET  /api/miniprogram/service/tickets — 获取当前用户创建的售后工单列表
 *
 * 业务场景：客户在小程序端对已完成订单发起维修、退换货或投诉等售后请求。
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { afterSalesTickets, orders } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateNo } from '@/shared/lib/generators';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { getMiniprogramUser } from '../../auth-utils';
import { RateLimiter } from '@/shared/services/miniprogram/security.service';

/**
 * 创建售后服务工单
 *
 * @route POST /api/miniprogram/service/tickets
 * @auth 需要小程序登录（Bearer Token）
 * @body orderId - 关联的原始订单 ID（必填，需属于当前租户）
 * @body type - 售后类型：REPAIR(维修)/RETURN(退货)/EXCHANGE(换货)/COMPLAINT(投诉)/CONSULTATION(咨询)
 * @body description - 问题描述（必填）
 * @body photos - 问题照片 URL 数组（可选）
 * @returns 新工单编号 { ticketNo }
 * @audit 记录 CREATE 审计日志（容灾设计，失败不阻塞主流程）
 * @rateLimit 单用户每 5 秒最多 2 次
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('未授权', 401);
        }

        // 频控：单用户每 5 秒最多 2 个工单
        if (!RateLimiter.allow(`create_ticket_${user.id}`, 2, 5000)) {
            return apiError('提交太频繁，请稍后再试', 429);
        }

        const body = await request.json();
        const { orderId, type, description, photos } = body;

        if (!orderId || !type || !description) {
            return apiError('缺少必填字段（orderId, type, description）', 400);
        }

        // 验证订单归属权（租户隔离）
        const order = await db.query.orders.findFirst({
            where: and(eq(orders.id, orderId), eq(orders.tenantId, user.tenantId)),
            columns: { id: true, customerId: true }
        });

        if (!order) {
            return apiError('订单不存在', 404);
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

        // 审计日志（容灾设计：审计故障不应中断核心业务）
        try {
            const { AuditService } = await import('@/shared/services/audit-service');
            await AuditService.log(db, {
                tableName: 'after_sales_tickets',
                recordId: ticketNo,
                action: 'CREATE',
                userId: user.id,
                tenantId: user.tenantId,
                details: { orderId, type }
            });
        } catch (auditError) {
            logger.warn('[ServiceTicket] 审计日志记录失败', { error: auditError, ticketNo });
        }

        logger.info('[ServiceTicket] 售后工单创建成功', {
            route: 'service/tickets',
            ticketNo,
            orderId,
            userId: user.id,
            tenantId: user.tenantId,
        });

        return apiSuccess({ ticketNo });

    } catch (error) {
        logger.error('[ServiceTicket] 创建售后工单故障', { route: 'service/tickets', error });
        return apiError('创建工单失败', 500);
    }
}

/**
 * 获取当前用户创建的售后工单列表
 *
 * @route GET /api/miniprogram/service/tickets
 * @auth 需要小程序登录（Bearer Token），仅返回当前用户创建的工单
 * @returns 按创建时间倒序排列的售后工单数组
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('未授权', 401);
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
        return apiError('获取工单列表失败', 500);
    }
}
