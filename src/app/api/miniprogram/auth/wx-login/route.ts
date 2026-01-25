/**
 * 微信小程序登录 API
 *
 * POST /api/miniprogram/auth/wx-login
 * 用 code 换取 openId，并检查是否已绑定用户
 * (Updated)
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { users, tenants } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { SignJWT } from 'jose';

// 获取微信 Access Token 和 OpenID
async function code2Session(code: string) {
  const appId = process.env.WX_APPID;
  const appSecret = process.env.WX_APPSECRET;
  console.log(
    '[DEBUG] 1. Config Check. AppID:',
    appId ? 'Present' : 'Missing',
    'Secret:',
    appSecret ? 'Present' : 'Missing'
  );

  if (!appId || !appSecret) {
    console.error('[DEBUG] Config Error. AppID:', appId);
    throw new Error('微信小程序配置缺失');
  }
  console.log('[DEBUG] 2. Config OK. SecretPrefix:', appSecret.slice(0, 4));

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

  console.log('[DEBUG] 3. Fetching WeChat API...');
  const startTime = Date.now();
  const res = await fetch(url);
  console.log('[DEBUG] 4. WeChat API Responded in', Date.now() - startTime, 'ms');

  const data = await res.json();
  console.log('[DEBUG] 5. WeChat Data:', data);

  if (data.errcode) {
    console.error('微信登录失败:', data);
    throw new Error(`微信登录失败: ${data.errmsg}`);
  }

  return {
    openId: data.openid,
    sessionKey: data.session_key,
    unionId: data.unionid,
  };
}

// 生成 JWT Token
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
    console.log('[DEBUG] wx-login: Request received');
    const body = await request.json();
    console.log('[DEBUG] wx-login: Body parsed', body);
    const { code } = body;

    if (!code) {
      console.error('[DEBUG] wx-login: Missing code');
      return NextResponse.json({ success: false, error: '缺少 code 参数' }, { status: 400 });
    }

    // 1. 获取 openId
    const { openId, unionId } = await code2Session(code);

    // 2. 查找用户
    const existingUser = await db.query.users.findFirst({
      where: eq(users.wechatOpenId, openId),
    });

    if (existingUser) {
      // 用户已存在，获取租户状态
      const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, existingUser.tenantId),
      });

      const token = await generateToken(existingUser.id, existingUser.tenantId);

      return NextResponse.json({
        success: true,
        data: {
          openId,
          unionId,
          user: {
            id: existingUser.id,
            name: existingUser.name,
            phone: existingUser.phone,
            email: existingUser.email,
            role: existingUser.role,
            tenantId: existingUser.tenantId,
            tenantName: tenant?.name,
            avatarUrl: existingUser.avatarUrl,
          },
          tenantStatus: tenant?.status,
          token,
        },
      });
    }

    // 用户不存在，返回 openId 供后续注册使用
    console.log('[DEBUG] User not found for OpenID:', openId);
    return NextResponse.json({
      success: true,
      data: {
        openId,
        unionId,
        user: null,
      },
    });
  } catch (error: any) {
    console.error('微信登录错误 (Detailed):', error);
    // Extract Postgres error details if available
    const errorDetails = {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      where: error.where,
      query: error.query, // Drizzle/Postgres often include the failing query
    };
    return NextResponse.json(
      { success: false, error: `Database Error: ${JSON.stringify(errorDetails)}` },
      { status: 500 }
    );
  }
}
