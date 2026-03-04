/**
 * 客户管理 API
 *
 * GET  /api/miniprogram/customers — 获取客户列表（带分页）
 * POST /api/miniprogram/customers — 快速创建客户
 */
import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiBadRequest,
  apiServerError,
  apiUnauthorized,
} from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { withMiniprogramAuth } from '../auth-utils';
import { CreateCustomerSchema, PaginationSchema } from '../miniprogram-schemas';
import { CustomerService } from '@/shared/services/miniprogram/customer.service';

export const GET = withMiniprogramAuth(
  async (request: NextRequest, user) => {
    try {
      if (!user || !user.tenantId) {
        return apiUnauthorized('未授权');
      }

      const { searchParams } = new URL(request.url);
      const keyword = searchParams.get('keyword');

      // 分页参数验证
      const pagination = PaginationSchema.safeParse({
        page: searchParams.get('page'),
        limit: searchParams.get('limit'),
        cursor: searchParams.get('cursor') || undefined,
      });
      const { page, limit, cursor } = pagination.success
        ? pagination.data
        : { page: 1, limit: 50, cursor: undefined };

      const result = await CustomerService.getCustomers(user.tenantId, {
        keyword,
        page,
        limit,
        cursor,
      });

      const response = apiSuccess({
        list: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
      response.headers.set('Cache-Control', 'private, max-age=30');
      return response;
    } catch (error) {
      logger.error('[Customers] 获取客户列表失败', { route: 'customers', error });
      return apiServerError('获取客户列表失败');
    }
  },
  ['SALES', 'MANAGER', 'ADMIN']
);

export const POST = withMiniprogramAuth(
  async (request: NextRequest, user) => {
    try {
      if (!user || !user.tenantId) {
        return apiUnauthorized('未授权');
      }

      const body = await request.json();

      // Zod 输入验证
      const parsed = CreateCustomerSchema.safeParse(body);
      if (!parsed.success) {
        return apiBadRequest(parsed.error.issues[0].message);
      }

      const newCustomer = await CustomerService.createCustomer(user.tenantId, user.id, parsed.data);

      logger.info('[Customers] 客户创建成功', {
        route: 'customers',
        customerId: newCustomer.id,
        userId: user.id,
        tenantId: user.tenantId,
      });

      return apiSuccess(newCustomer);
    } catch (error) {
      logger.error('[Customers] 创建客户失败', { route: 'customers', error });
      return apiServerError('创建客户失败');
    }
  },
  ['SALES', 'MANAGER', 'ADMIN']
);
