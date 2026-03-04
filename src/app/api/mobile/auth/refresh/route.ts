import { NextRequest } from 'next/server';
import { createLogger } from '@/shared/lib/logger';

const log = createLogger('auth:refresh');
import {
  apiSuccess,
  apiBadRequest,
  apiServerError,
  apiForbidden,
  apiUnauthorized,
} from '@/shared/lib/api-response';
import { verifyToken, generateAccessToken, generateRefreshToken } from '@/shared/lib/jwt';
import { db } from '@/shared/api/db';
import { users, customers } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { withRateLimit, getRateLimitKey } from '@/shared/middleware/rate-limiter';

/**
 * Token 刷新接口
 *
 * @description 使用 Refresh Token 换取新的 Access Token。会检查用户账号是否依然活跃。
 * 已集成速率限制：1 分钟内最多 10 次刷新请求。
 *
 * @param {NextRequest} request - JSON body 需包含 refreshToken
 * @returns {Promise<NextResponse>} 返回新的令牌对
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

    // 验证用户是否依然存在且有效 (P2.4)
    if (payload.role === 'CUSTOMER') {
      const customer = await db.query.customers.findFirst({
        where: and(
          eq(customers.id, payload.userId as string),
          eq(customers.tenantId, payload.tenantId as string)
        ),
      });
      if (!customer) return apiUnauthorized('账户已失效');
    } else {
      const user = await db.query.users.findFirst({
        where: and(
          eq(users.id, payload.userId as string),
          eq(users.tenantId, payload.tenantId as string),
          eq(users.isActive, true)
        ),
      });
      if (!user) return apiUnauthorized('账户已失效或被禁用');

      if (user.role === 'FINANCE' || user.role === 'DISPATCHER') {
        return apiForbidden('您的角色已不支持移动端访问，请使用电脑登录');
      }
    }

    // 生成新的 Token 对
    const newAccessToken = await generateAccessToken(
      payload.userId as string,
      payload.tenantId as string,
      (payload.phone as string) || '',
      payload.role as string
    );
    const newRefreshToken = await generateRefreshToken(
      payload.userId as string,
      payload.tenantId as string,
      (payload.phone as string) || '',
      payload.role as string
    );

    return apiSuccess({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 86400,
    });
  } catch (error) {
    log.error(
      'Token 刷新错误',
      { error: error instanceof Error ? error.message : String(error) },
      error
    );
    return apiServerError('服务器内部错误');
  }
}

// 应用速率限制：1 分钟内最多 10 次尝试
export const POST = withRateLimit(
  refreshHandler,
  { windowMs: 60 * 1000, maxAttempts: 10, message: '请求过于频繁，请稍后再试' },
  getRateLimitKey('auth:refresh')
);
