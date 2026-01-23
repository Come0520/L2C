/**
 * 微信小程序登录 API
 * 
 * POST /api/miniprogram/auth/wx-login
 * 用 code 换取 openId，并检查是否已绑定用户
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

    if (!appId || !appSecret) {
        throw new Error('微信小程序配置缺失');
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`;

    const response = await fetch(url);
    const data = await response.json();

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
        type: 'miniprogram'
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
        const { code } = body;

        if (!code) {
            return NextResponse.json(
                { success: false, error: '缺少 code 参数' },
                { status: 400 }
            );
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
        return NextResponse.json({
            success: true,
            data: {
                openId,
                unionId,
                user: null,
            },
        });

    } catch (error) {
        console.error('微信登录错误:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : '登录失败' },
            { status: 500 }
        );
    }
}
