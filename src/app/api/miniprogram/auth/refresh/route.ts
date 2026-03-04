import { NextRequest } from 'next/server';
import { createLogger } from '@/shared/lib/logger';
import {
  apiSuccess,
  apiBadRequest,
  apiServerError,
  apiUnauthorized,
} from '@/shared/lib/api-response';
import { verifyToken, generateRefreshToken } from '@/shared/lib/jwt';
import { db } from '@/shared/api/db';
import { users, customers } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { withRateLimit, getRateLimitKey } from '@/shared/middleware/rate-limiter';
import { generateMiniprogramToken } from '../../auth-utils';

const log = createLogger('auth:miniprogram:refresh');

/**
 * 小程序端 Token 刷新接口
 *
 * @description 使用 Refresh Token 换取新的 Access Token（在系统里为统一的小程序 Token）。会检查用户或客户存续状态。
 * 集成了 1 分钟内最多 10 次的速率限制。
 *
 * @param {NextRequest} request - JSON body 包含 refreshToken
 */
async function refreshHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    // 参数校验
    if (!refreshToken) {
      return apiBadRequest('refreshToken 不能为空');
    }

    // 验证 refresh token
    const payload = await verifyToken(refreshToken);

    if (!payload) {
      return apiUnauthorized('Token 无效或已过期');
    }

    if (payload.type !== 'refresh') {
      return apiUnauthorized('无效的 Token 类型');
    }

    // 验证用户状态，保持安全性
    if (payload.role === 'CUSTOMER') {
      const customer = await db.query.customers.findFirst({
        where: and(
          eq(customers.id, payload.userId as string),
          eq(customers.tenantId, payload.tenantId as string)
        ),
      });
      if (!customer) return apiUnauthorized('账户记录已失效，请重新登录');
    } else {
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.id, payload.userId as string),
          eq(users.tenantId, payload.tenantId as string),
          eq(users.isActive, true)
        ),
      });
      if (!user) return apiUnauthorized('账户已失效或被禁用，请重新登录');
    }

    // 小程序特有：直接使用带有 role 和新有效期的 miniprogram token 覆盖
    const newAccessToken = await generateMiniprogramToken(
      payload.userId as string,
      payload.tenantId as string,
      payload.role as string
    );

    // 生成匹配的新 refresh token
    const newRefreshToken = await generateRefreshToken(
      payload.userId as string,
      payload.tenantId as string,
      payload.phone as string,
      payload.role as string
    );

    return apiSuccess({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 86400 * 7, // 小程序默认 7 天
    });
  } catch (error) {
    log.error(
      '小程序 Token 刷新失败',
      { error: error instanceof Error ? error.message : String(error) },
      error
    );
    return apiServerError('服务器内部错误');
  }
}

// 频率限制保护
export const POST = withRateLimit(
  refreshHandler,
  { windowMs: 60 * 1000, maxAttempts: 10, message: '请求过于频繁' },
  getRateLimitKey('auth:miniprogram:refresh')
);
