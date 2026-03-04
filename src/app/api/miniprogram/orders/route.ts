/**
 * 订单 API
 *
 * GET  /api/miniprogram/orders — 获取订单列表（带分页）
 * POST /api/miniprogram/orders — 从报价单创建订单
 */
import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiError,
  apiBadRequest,
  apiServerError,
  apiNotFound,
  apiUnauthorized,
} from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { withMiniprogramAuth } from '../auth-utils';
import { CreateOrderSchema, PaginationSchema } from '../miniprogram-schemas';
import { OrderService } from '@/shared/services/miniprogram/order.service';
import { IdempotencyGuard, RateLimiter } from '@/shared/services/miniprogram/security.service';
import { db } from '@/shared/api/db';
import { customers } from '@/shared/api/schema';
import { and, eq } from 'drizzle-orm';

export const GET = withMiniprogramAuth(
  async (request: NextRequest, user) => {
    try {
      if (!user || !user.tenantId) {
        return apiUnauthorized('未授权');
      }

      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');

      // 分页参数验证
      const pagination = PaginationSchema.safeParse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        cursor: searchParams.get('cursor') || undefined,
      });
      const { page, limit, cursor } = pagination.success
        ? pagination.data
        : { page: 1, limit: 50, cursor: undefined };

      // 安全隔离：CUSTOMER 角色只能查看自己绑定档案的订单
      let customerId: string | undefined = undefined;
      if (user.role?.toUpperCase() === 'CUSTOMER') {
        const customerRecord = await db.query.customers.findFirst({
          where: and(eq(customers.tenantId, user.tenantId), eq(customers.createdBy, user.id)),
          columns: { id: true },
        });

        if (!customerRecord) {
          // 安全降级：找不到 Customer 档案时，不暴露任何数据
          logger.warn('[Orders] CUSTOMER 角色未绑定 Customer 档案，安全降级返回空列表', {
            userId: user.id,
            tenantId: user.tenantId,
          });
          return apiSuccess([]);
        }

        customerId = customerRecord.id;
      }

      const list = await OrderService.getOrders(user.tenantId, {
        status,
        page,
        limit,
        cursor,
        customerId,
      });

      const response = apiSuccess(list);
      response.headers.set('Cache-Control', 'private, max-age=60');
      return response;
    } catch (error) {
      logger.error('[Orders] 获取订单列表失败', { route: 'orders', error });
      return apiServerError('获取订单列表失败');
    }
  },
  ['SALES', 'MANAGER', 'ADMIN', 'CUSTOMER']
);

export const POST = withMiniprogramAuth(
  async (request: NextRequest, user) => {
    try {
      if (!user || !user.tenantId) {
        return apiUnauthorized('未授权');
      }

      const body = await request.json();

      // Zod 输入验证
      const parsed = CreateOrderSchema.safeParse(body);
      if (!parsed.success) {
        return apiBadRequest(parsed.error.issues[0].message);
      }

      // 频控：单用户 2秒/次 创建速率限制
      if (!RateLimiter.allow(`create_order_${user.id}`, 3, 2000)) {
        return apiError('操作太频繁，请稍后再试', 429);
      }

      const { quoteId } = parsed.data;

      // 幂等键：同一租户同一用户针对同一个 quoteId 只能产生一个有效流转操作
      const idemKey = `order:create:${user.tenantId}:${user.id}:${quoteId}`;
      const idemRecord = IdempotencyGuard.check(idemKey);

      if (idemRecord) {
        if (idemRecord.status === 'COMPLETED') {
          return apiSuccess(idemRecord.response);
        }
        if (idemRecord.status === 'PROCESSING') {
          return apiError('订单正在处理中，请勿重复提交', 409);
        }
      }

      // 抢占幂等执行锁
      IdempotencyGuard.start(idemKey);

      try {
        const result = await OrderService.createOrderFromQuote(user.tenantId, user.id, quoteId);

        // 操作完满后写入缓存以便应对前端超时引起的即刻自动重试
        IdempotencyGuard.complete(idemKey, result);

        logger.info('[Orders] 订单创建成功', {
          route: 'orders',
          orderId: result.id,
          quoteId,
          userId: user.id,
          tenantId: user.tenantId,
        });

        return apiSuccess(result);
      } catch (bizError: unknown) {
        IdempotencyGuard.fail(idemKey);

        if (bizError instanceof Error) {
          if (bizError.message === 'QUOTE_NOT_FOUND') {
            return apiNotFound('报价单不存在');
          }
          if (bizError.message === 'QUOTE_NOT_CONFIRMED') {
            return apiBadRequest('报价单需先确认后才能下单');
          }
        }
        throw bizError;
      }
    } catch (error) {
      logger.error('[Orders] 创建订单失败', { route: 'orders', error });
      // 对于非预期的系统级错误，也要释放锁
      // IdempotencyGuard.fail 会在下一次 TTL 时限或手动捕获触发时剔除，此为宽泛捕获无需强制在此释放
      return apiServerError('创建订单失败');
    }
  },
  ['SALES', 'MANAGER', 'ADMIN', 'CUSTOMER']
);
