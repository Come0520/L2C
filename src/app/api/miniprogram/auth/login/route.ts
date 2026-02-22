/**
 * 用户密码登录 API
 *
 * POST /api/miniprogram/auth/login
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { users, tenants } from '@/shared/api/schema';
import { eq, or } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { generateMiniprogramToken } from '../../auth-utils';
import { LoginSchema } from '../../miniprogram-schemas';
import { AuditService } from '@/shared/services/audit-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Zod 输入验证
    const parsed = LoginSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const { account, password } = parsed.data;

    // 1. 查找用户 (支持手机号或邮箱)
    const user = await db.query.users.findFirst({
      where: or(eq(users.phone, account), eq(users.email, account)),
    });

    if (!user) {
      return apiError('账号或密码错误', 401);
    }

    // 2. 验证密码
    if (!user.passwordHash) {
      return apiError('该账号未设置密码，请使用微信快捷登录', 401);
    }

    const isValid = await compare(password, user.passwordHash);
    if (!isValid) {
      return apiError('账号或密码错误', 401);
    }

    // 3. 检查租户状态
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, user.tenantId),
    });

    if (!tenant) {
      return apiError('租户信息异常', 500);
    }

    // 4. 生成 Token（统一 7d 有效期）
    const token = await generateMiniprogramToken(user.id, user.tenantId);

    // 5. 审计日志
    await AuditService.log(db, {
      tableName: 'users',
      recordId: user.id,
      action: 'LOGIN',
      userId: user.id,
      tenantId: user.tenantId,
      details: { method: 'PASSWORD', account }
    });

    logger.info('[Login] 用户登录成功', {
      route: 'auth/login',
      userId: user.id,
      tenantId: user.tenantId,
    });

    return apiSuccess({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: tenant.name,
        avatarUrl: user.avatarUrl,
      },
      tenantStatus: tenant.status,
    });
  } catch (error: unknown) {
    logger.error('[Login] 登录服务异常', { route: 'auth/login', error });
    return apiError('登录服务异常', 500);
  }
}
