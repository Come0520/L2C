/**
 * Magic Link 一次性登录 API Route
 *
 * GET /api/auth/magic-login?token=<uuid>
 *
 * 流程：
 * 1. 验证 token（类型 MAGIC_LOGIN、未使用、未过期）
 * 2. 标记 token 为已使用
 * 3. 生成一个短效 PASSWORD_RESET token，供用户修改密码使用
 * 4. 手动签发 NextAuth JWT，写入 session cookie，实现免密码自动登录
 * 5. 302 跳转到 /reset-password?token=<密码重置token>
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { verificationCodes } from '@/shared/api/schema/verification_codes';
import { eq, and } from 'drizzle-orm';
import { encode } from 'next-auth/jwt';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/shared/lib/logger';
import { AuditService } from '@/shared/services/audit-service';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const baseUrl =
    process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // token 为空时跳转登录页，携带错误提示
  if (!token) {
    logger.warn('[MagicLogin] 缺少 token 参数');
    return NextResponse.redirect(`${baseUrl}/login?error=invalid_magic_link`);
  }

  try {
    // 1. 查找有效的 MAGIC_LOGIN token（未使用、未过期）
    const activeCode = await db.query.verificationCodes.findFirst({
      where: and(
        eq(verificationCodes.token, token),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        eq(verificationCodes.type, 'MAGIC_LOGIN' as any),
        eq(verificationCodes.used, false)
      ),
    });

    if (!activeCode) {
      logger.warn('[MagicLogin] token 无效或已使用', { token });
      return NextResponse.redirect(`${baseUrl}/login?error=magic_link_expired`);
    }

    // 检查过期
    if (new Date() > activeCode.expiresAt) {
      logger.warn('[MagicLogin] token 已过期', { token, expiresAt: activeCode.expiresAt });
      return NextResponse.redirect(`${baseUrl}/login?error=magic_link_expired`);
    }

    // 2. 查找对应用户
    const user = await db.query.users.findFirst({
      where: eq(users.id, activeCode.userId),
      columns: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        role: true,
        roles: true,
        tenantId: true,
        isPlatformAdmin: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      logger.warn('[MagicLogin] 用户不存在或已停用', { userId: activeCode.userId });
      return NextResponse.redirect(`${baseUrl}/login?error=account_inactive`);
    }

    // 3. 标记 Magic Link token 为已使用（单次有效）
    await db
      .update(verificationCodes)
      .set({ used: true })
      .where(eq(verificationCodes.id, activeCode.id));

    // 4. 生成短效密码重置 token（15 分钟），供用户到达修改密码页后使用
    const resetToken = uuidv4();
    const resetExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15分钟

    await db.insert(verificationCodes).values({
      userId: user.id,
      code: Math.floor(100000 + Math.random() * 900000).toString(), // code 为必填占位
      token: resetToken,
      type: 'PASSWORD_RESET' as any,
      expiresAt: resetExpiresAt,
    });

    // 5. 签发 NextAuth JWT，建立用户 Session（免密码直接登录）
    const userRoles =
      (user.roles as string[])?.length > 0 ? (user.roles as string[]) : [user.role || 'BOSS'];

    const jwtPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      picture: user.avatarUrl,
      // 以下为系统自定义字段（对应 auth.ts jwt callback）
      tenantId: user.tenantId,
      role: user.role || 'BOSS',
      roles: userRoles,
      isPlatformAdmin: user.isPlatformAdmin || false,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // Session 有效期 1 小时（够改密码用）
    };

    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '';
    const encodedJwt = await encode({
      token: jwtPayload,
      secret,
      salt:
        process.env.NODE_ENV === 'production'
          ? '__Secure-authjs.session-token'
          : 'authjs.session-token',
    });

    // 6. 记录审计日志
    await AuditService.log(db, {
      tenantId: user.tenantId,
      userId: user.id,
      tableName: 'auth_login',
      recordId: user.id,
      action: 'MAGIC_LOGIN_SUCCESS',
      details: {
        method: 'magic_link',
        platform: 'web',
        tokenId: activeCode.id,
      },
    });

    logger.info('[MagicLogin] 一次性登录成功，跳转至密码修改页', {
      userId: user.id,
      tenantId: user.tenantId,
    });

    // 7. 构造响应：写入 session cookie，跳转到强制改密码页
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token';

    const response = NextResponse.redirect(`${baseUrl}/reset-password?token=${resetToken}`);

    response.cookies.set(cookieName, encodedJwt, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 小时，与 JWT exp 一致
      path: '/',
    });

    return response;
  } catch (error) {
    logger.error('[MagicLogin] 处理一次性登录时发生异常:', error);
    return NextResponse.redirect(`${baseUrl}/login?error=magic_link_error`);
  }
}
