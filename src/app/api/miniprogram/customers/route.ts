/**
 * 客户管理 API
 *
 * GET  /api/miniprogram/customers — 获取客户列表（带分页）
 * POST /api/miniprogram/customers — 快速创建客户
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { getMiniprogramUser } from '../auth-utils';
import { CreateCustomerSchema, PaginationSchema } from '../miniprogram-schemas';
import { CustomerService } from '@/shared/services/miniprogram/customer.service';

/**
 * 获取客户列表（分页、搜索、手机号脱敏）
 *
 * @route GET /api/miniprogram/customers
 * @auth 需要登录（Bearer Token）
 * @query keyword - 搜索关键词（姓名或手机号模糊匹配，可选）
 * @query page - 页码（默认 1）
 * @query limit - 每页条数（默认 50，最大 100）
 * @returns 客户列表，手机号自动脱敏为 138****1234 格式
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user || !user.tenantId) {
      return apiError('未授权', 401);
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

    const result = await CustomerService.getCustomers(user.tenantId, { keyword, page, limit, cursor });

    const response = apiSuccess({ list: result.data, total: result.total, page: result.page, limit: result.limit });
    response.headers.set('Cache-Control', 'private, max-age=30');
    return response;
  } catch (error) {
    logger.error('[Customers] 获取客户列表失败', { route: 'customers', error });
    return apiError('获取客户列表失败', 500);
  }
}

/**
 * 快速创建客户（可附带默认地址）
 *
 * @route POST /api/miniprogram/customers
 * @auth 需要登录（Bearer Token）
 * @body name - 客户姓名（必填）
 * @body phone - 手机号（可选）
 * @body wechat - 微信号（可选）
 * @body address - 默认地址（可选，将自动保存至地址表）
 * @returns 新创建的客户信息
 * @audit 记录 CREATE 审计日志
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user || !user.tenantId) {
      return apiError('未授权', 401);
    }

    const body = await request.json();

    // Zod 输入验证
    const parsed = CreateCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
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
    return apiError('创建客户失败', 500);
  }
}
