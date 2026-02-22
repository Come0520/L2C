/**
 * 订单 API
 *
 * GET  /api/miniprogram/orders — 获取订单列表（带分页）
 * POST /api/miniprogram/orders — 从报价单创建订单
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { getMiniprogramUser } from '../auth-utils';
import { CreateOrderSchema, PaginationSchema } from '../miniprogram-schemas';
import { OrderService } from '@/shared/services/miniprogram/order.service';
import { IdempotencyGuard, RateLimiter } from '@/shared/services/miniprogram/security.service';

/**
 * 获取订单列表（分页、状态筛选、关联客户名称）
 *
 * @route GET /api/miniprogram/orders
 * @auth 需要登录（Bearer Token）
 * @query status - 订单状态筛选（可选，'ALL' 或具体状态值）
 * @query page - 页码（默认 1）
 * @query limit - 每页条数（默认 50，最大 100）
 * @returns 订单列表，含客户名称
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('未授权', 401);
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

        const list = await OrderService.getOrders(user.tenantId, { status, page, limit, cursor });

        const response = apiSuccess(list);
        response.headers.set('Cache-Control', 'private, max-age=60');
        return response;

    } catch (error) {
        logger.error('[Orders] 获取订单列表失败', { route: 'orders', error });
        return apiError('获取订单列表失败', 500);
    }
}

/**
 * 从已确认报价单创建订单（含订单项、付款计划）
 *
 * @route POST /api/miniprogram/orders
 * @auth 需要登录（Bearer Token）
 * @body quoteId - 报价单 ID（UUID 格式，必须为已确认状态）
 * @returns 新订单信息
 * @audit 记录 CREATE_FROM_QUOTE 审计日志
 * @transaction 使用事务确保订单、订单项、付款计划原子创建
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('未授权', 401);
        }

        const body = await request.json();

        // Zod 输入验证
        const parsed = CreateOrderSchema.safeParse(body);
        if (!parsed.success) {
            return apiError(parsed.error.issues[0].message, 400);
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
                    return apiError('报价单不存在', 404);
                }
                if (bizError.message === 'QUOTE_NOT_CONFIRMED') {
                    return apiError('报价单需先确认后才能下单', 400);
                }
            }
            throw bizError;
        }

    } catch (error) {
        logger.error('[Orders] 创建订单失败', { route: 'orders', error });
        // 对于非预期的系统级错误，也要释放锁
        // IdempotencyGuard.fail 会在下一次 TTL 时限或手动捕获触发时剔除，此为宽泛捕获无需强制在此释放
        return apiError('创建订单失败', 500);
    }
}

