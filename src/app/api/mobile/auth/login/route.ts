import { db } from '@/shared/api/db';
import { users, tenants } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import {
  apiSuccess,
  apiBadRequest,
  apiServerError,
  apiForbidden,
  apiUnauthorized,
} from '@/shared/lib/api-response';
import { generateAccessToken, generateRefreshToken, generatePreAuthToken } from '@/shared/lib/jwt';
import { VerificationCodeService } from '@/shared/services/verification-code.service';
import { compare } from 'bcryptjs';
import { withRateLimit, getRateLimitKey } from '@/shared/middleware/rate-limiter';
import { NextRequest } from 'next/server';
import { createLogger } from '@/shared/lib/logger';
import type { TenantSettings } from '@/shared/types/tenant-settings';

const log = createLogger('auth:login');

/**
 * 移动端登录接口
 *
 * @description 处理移动端用户的手机号密码登录。支持多种角色映射。
 * 如果租户开启了 MFA 且用户角色在 MFA 范围内，将返回 preAuthToken。
 * 已集成速率限制：5 分钟内最多 10 次尝试。
 *
 * @param {NextRequest} request - Next.js 请求对象，JSON body 需包含 phone 和 password
 * @returns {Promise<NextResponse>} 返回登录结果或 MFA 要求
 */
async function loginHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    // 参数校验
    if (!phone || !password) {
      return apiBadRequest('手机号或密码不能为空');
    }

    // 查找用户（不绑定 tenantId 导致潜在租户碰撞，使用 findMany 获取同一手机号不同租户的多个账号）
    const userRecords = await db.query.users.findMany({
      where: and(eq(users.phone, phone), eq(users.isActive, true)),
    });

    if (!userRecords.length) {
      return apiUnauthorized('手机号或密码错误');
    }

    let user = null;
    // 安全修复：验证密码哈希，通过逐一对比找出真正需要登录的那一条记录
    for (const record of userRecords) {
      if (!record.passwordHash) continue;
      const isMatch = await compare(password, record.passwordHash);
      if (isMatch) {
        user = record;
        break;
      }
    }

    if (!user) {
      return apiUnauthorized('手机号或密码错误');
    }

    // 角色映射 logic
    let mobileRole = 'WORKER'; // Default fallback
    const dbRole = user.role || '';

    switch (dbRole) {
      case 'FINANCE':
      case 'DISPATCHER':
        return apiForbidden('部分内部角色不支持移动端应用登录，请使用电脑访问');
      case 'ADMIN':
      case 'MANAGER':
      case 'SUPER_ADMIN':
        mobileRole = 'ADMIN';
        break;
      case 'SALES':
        mobileRole = 'SALES';
        break;
      case 'WORKER':
        mobileRole = 'WORKER';
        break;
      case 'SUPPLY':
        mobileRole = 'PURCHASER';
        break;
      default:
        mobileRole = 'WORKER';
    }

    // MFA 检查 — 使用类型安全的 TenantSettings
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, user.tenantId),
      columns: {
        settings: true,
      },
    });

    const settings = tenant?.settings as TenantSettings | null;
    const mfaConfig = settings?.mfa;

    let mfaRequired = false;
    if (mfaConfig?.enabled && mfaConfig?.roles?.includes(mobileRole)) {
      mfaRequired = true;
    }

    if (mfaRequired) {
      const userPhone = user.phone || phone;
      await VerificationCodeService.generateAndSend(user.id, userPhone, 'LOGIN_MFA');

      const preAuthToken = await generatePreAuthToken(
        user.id,
        user.tenantId,
        userPhone,
        mobileRole
      );

      return apiSuccess({
        mfaRequired: true,
        preAuthToken,
        maskPhone: userPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      });
    }

    const userPhone = user.phone || phone;
    const accessToken = await generateAccessToken(user.id, user.tenantId, userPhone, mobileRole);
    const refreshToken = await generateRefreshToken(user.id, user.tenantId, userPhone, mobileRole);

    return apiSuccess({
      mfaRequired: false,
      accessToken,
      refreshToken,
      expiresIn: 86400,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        avatar: user.avatarUrl,
        tenantId: user.tenantId,
        role: mobileRole,
      },
    });
  } catch (error) {
    log.error(
      '移动端登录错误',
      { error: error instanceof Error ? error.message : String(error) },
      error
    );
    return apiServerError('服务器内部错误');
  }
}

// 应用速率限制：5 分钟内最多 10 次尝试
export const POST = withRateLimit(
  loginHandler,
  { windowMs: 5 * 60 * 1000, maxAttempts: 10, message: '登录过于频繁，请 5 分钟后再试' },
  getRateLimitKey('auth:login')
);
