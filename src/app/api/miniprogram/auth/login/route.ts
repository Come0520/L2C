/**
 * 用户密码登录 API
 *
 * POST /api/miniprogram/auth/login
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { users, tenantMembers } from '@/shared/api/schema';
import { eq, or, and } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import {
  apiSuccess,
  apiBadRequest,
  apiServerError,
  apiUnauthorized,
  apiError,
} from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { generateMiniprogramToken, generateTempLoginToken } from '../../auth-utils';
import { LoginSchema } from '../../miniprogram-schemas';
import { AuditService } from '@/shared/services/audit-service';
import {
  checkMobileLoginRateLimit,
  resetMobileLoginRateLimit,
} from '@/shared/lib/auth-rate-limit-mobile';

// 简单手机号/邮箱脱敏，用于安全审计
function maskPhone(phone: string) {
  if (!phone || phone.length < 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

export async function POST(request: NextRequest) {
  try {
    let body = {};
    try {
      // 兼容一些奇怪的空请求或非标准 JSON 格式
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (e) {
      logger.warn('[Login] 解析请求 Body 失败', { route: 'auth/login', error: String(e) });
      return apiBadRequest('无效的请求数据格式');
    }

    // Zod 输入验证
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return apiBadRequest(parsed.error.issues[0].message);
    }

    const { account, password } = parsed.data;

    // 1. 速率限制：15 分钟内最多 5 次失败
    const rateLimit = checkMobileLoginRateLimit(account);
    if (!rateLimit.allowed) {
      return apiError(
        `登录尝试次数过多，请在 ${Math.ceil(rateLimit.retryAfter! / 60)} 分钟后重试`,
        429
      );
    }

    // 2. 防碰撞：查找符合条件的所有活跃用户 (支持手机号或邮箱，且必须处于激活状态)
    const matchedUsers = await db.query.users.findMany({
      where: and(or(eq(users.phone, account), eq(users.email, account)), eq(users.isActive, true)),
    });

    if (matchedUsers.length === 0) {
      return apiUnauthorized('账号或密码错误');
    }

    let validUser = null;
    for (const u of matchedUsers) {
      if (u.passwordHash && (await compare(password, u.passwordHash))) {
        validUser = u;
        break;
      }
    }

    if (!validUser) {
      return apiUnauthorized('账号或密码错误');
    }

    // 密码比对成功，重置速率限制器
    resetMobileLoginRateLimit(account);
    const user = validUser;

    // 3. 检查租户成员资格（多租户改造）
    const userMemberships = await db.query.tenantMembers.findMany({
      where: eq(tenantMembers.userId, user.id),
      with: {
        tenant: true,
      },
    });

    const activeMemberships = userMemberships.filter(
      (m) => m.tenant && m.tenant.status === 'active'
    );

    if (activeMemberships.length === 0) {
      return apiUnauthorized('您暂未被分配到任何活跃的企业/团队');
    }

    // 脱敏用于审计和日志
    const maskedAccount = maskPhone(account);

    // 4. 判断是否需要选择租户
    if (activeMemberships.length > 1) {
      const tempToken = await generateTempLoginToken(user.id);

      await AuditService.log(db, {
        tableName: 'users',
        recordId: user.id,
        action: 'LOGIN',
        userId: user.id,
        tenantId: undefined,
        details: { method: 'PASSWORD_MULTI_TENANT', account: maskedAccount },
      });

      logger.info('[Login] 用户需要选择租户', {
        route: 'auth/login',
        userId: user.id,
        tenantCount: activeMemberships.length,
      });

      return apiSuccess({
        status: 'REQUIRE_TENANT_SELECTION',
        tempToken,
        tenants: activeMemberships.map((m) => ({
          id: m.tenantId,
          name: m.tenant.name,
          role: m.role,
        })),
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
        },
      });
    }

    // 5. 单租户直接登录
    const member = activeMemberships[0];
    const tenant = member.tenant;

    // 签发正式 Token（严格注入选中租户映射的 role）
    const token = await generateMiniprogramToken(user.id, tenant.id, member.role || undefined);

    // 6. 审计日志
    await AuditService.log(db, {
      tableName: 'users',
      recordId: user.id,
      action: 'LOGIN',
      userId: user.id,
      tenantId: tenant.id,
      details: { method: 'PASSWORD', account: maskedAccount },
    });

    logger.info('[Login] 用户登录成功', {
      route: 'auth/login',
      userId: user.id,
      tenantId: tenant.id,
      role: member.role,
    });

    return apiSuccess({
      status: 'SUCCESS',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: member.role,
        tenantId: tenant.id,
        tenantName: tenant.name,
        avatarUrl: user.avatarUrl,
      },
      tenantStatus: tenant.status,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      logger.error('[Login] 登录服务异常', {
        route: 'auth/login',
        error: error.message,
        stack: error.stack,
      });
    } else {
      logger.error('[Login] 登录服务异常 (未知)', { route: 'auth/login', error: String(error) });
    }
    return apiServerError('登录服务异常');
  }
}
