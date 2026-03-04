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
import { afterSalesTickets, orders, customers } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateNo } from '@/shared/lib/generators';
import {
  apiSuccess,
  apiError,
  apiBadRequest,
  apiServerError,
  apiNotFound,
  apiUnauthorized,
} from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { withMiniprogramAuth } from '../../auth-utils';
import { RateLimiter } from '@/shared/services/miniprogram/security.service';

export const POST = withMiniprogramAuth(async (request: NextRequest, user) => {
  try {
    if (!user || !user.tenantId) {
      return apiUnauthorized('未授权');
    }

    // 频控：单用户每 5 秒最多 2 个工单
    if (!RateLimiter.allow(`create_ticket_${user.id}`, 2, 5000)) {
      return apiError('提交太频繁，请稍后再试', 429);
    }

    const body = await request.json();
    const { orderId, type, description, photos } = body;

    if (!orderId || !type || !description) {
      return apiBadRequest('缺少必填字段（orderId, type, description）');
    }

    // 验证订单归属权（租户隔离）
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.tenantId, user.tenantId)),
      columns: { id: true, customerId: true },
    });

    if (!order) {
      return apiNotFound('订单不存在');
    }

    // 安全隔离：CUSTOMER 角色必须额外校验订单归属权，防止跨客户越权 (IDOR)
    if (user.role?.toUpperCase() === 'CUSTOMER') {
      // 安全隔离：通过 customers 表反查该用户绑定的 Customer 档案
      const customerRecord = await db.query.customers.findFirst({
        where: and(eq(customers.tenantId, user.tenantId), eq(customers.createdBy, user.id)),
        columns: { id: true },
      });

      // 找不到档案，或订单不属于该客户 → 返回 404，不暴露资源存在性
      if (!customerRecord || order.customerId !== customerRecord.id) {
        logger.warn('[ServiceTicket] CUSTOMER 角色尝试对非归属订单发起售后，已拦截', {
          userId: user.id,
          tenantId: user.tenantId,
          orderId,
          orderCustomerId: order.customerId,
          actualCustomerId: customerRecord?.id,
        });
        return apiNotFound('订单不存在');
      }
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
      createdBy: user.id,
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
        details: { orderId, type },
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
    return apiServerError('创建工单失败');
  }
});

export const GET = withMiniprogramAuth(async (request: NextRequest, user) => {
  try {
    if (!user || !user.tenantId) {
      return apiUnauthorized('未授权');
    }

    const list = await db.query.afterSalesTickets.findMany({
      where: and(
        eq(afterSalesTickets.tenantId, user.tenantId),
        eq(afterSalesTickets.createdBy, user.id)
      ),
      orderBy: [desc(afterSalesTickets.createdAt)],
    });

    return apiSuccess(list);
  } catch (error) {
    logger.error('[ServiceTicket] 获取工单列表异常', { route: 'service/tickets', error });
    return apiServerError('获取工单列表失败');
  }
});
