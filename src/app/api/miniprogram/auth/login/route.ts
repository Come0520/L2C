/**
 * 用户密码登录 API
 *
 * POST /api/miniprogram/auth/login
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { users, tenants } from '@/shared/api/schema';
import { eq, or } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { SignJWT } from 'jose';

// 生成 JWT Token (复用逻辑)
async function generateToken(userId: string, tenantId: string) {
  const secret = new TextEncoder().encode(process.env.AUTH_SECRET);

  const token = await new SignJWT({
    userId,
    tenantId,
    type: 'miniprogram',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);

  return token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account, password } = body;

    if (!account || !password) {
      return NextResponse.json({ success: false, error: '请输入账号和密码' }, { status: 400 });
    }

    // 1. 查找用户 (支持手机号或邮箱)
    const user = await db.query.users.findFirst({
      where: or(eq(users.phone, account), eq(users.email, account)),
    });

    if (!user) {
      return NextResponse.json({ success: false, error: '账号或密码错误' }, { status: 401 });
    }

    // 2. 验证密码
    if (!user.passwordHash) {
      return NextResponse.json(
        { success: false, error: '该账号未设置密码，请使用微信快捷登录' },
        { status: 401 }
      );
    }

    const isValid = await compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ success: false, error: '账号或密码错误' }, { status: 401 });
    }

    // 3. 检查租户状态
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, user.tenantId),
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: '租户信息异常' }, { status: 500 });
    }

    // 4. 生成 Token
    const token = await generateToken(user.id, user.tenantId);

    return NextResponse.json({
      success: true,
      data: {
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
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Login Error:', error);
    return NextResponse.json({ success: false, error: '登录服务异常' }, { status: 500 });
  }
}
