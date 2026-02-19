/**
 * 微信手机号解密与登录/注册 API
 * 
 * POST /api/miniprogram/auth/decrypt-phone
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { users, tenants } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { SignJWT } from 'jose';
import { apiSuccess, apiError } from '@/shared/lib/api-response';

// 获取微信 Access Token
async function getAccessToken() {
    const appId = process.env.WX_APPID;
    const appSecret = process.env.WX_APPSECRET;
    const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;

    const res = await fetch(url);
    const data = await res.json();
    if (data.errcode) {
        throw new Error(`获取 AccessToken 失败: ${data.errmsg}`);
    }
    return data.access_token;
}

// 解密手机号 (新版接口: getuserphonenumber)
// https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/user-login/getPhoneNumber.html
async function getPhoneNumber(code: string) {
    // Note: For newer base library, we call API directly from backend with the code
    // AccessToken is NOT needed for the new `getPhoneNumber` code?
    // Wait, the doc says: POST https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=ACCESS_TOKEN

    const accessToken = await getAccessToken();
    const url = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
    });

    const data = await res.json();
    if (data.errcode) {
        throw new Error(`获取手机号失败: ${data.errmsg}`);
    }
    return data.phone_info;
}

// 生成 JWT Token
async function generateToken(userId: string, tenantId: string) {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
    return await new SignJWT({
        userId,
        tenantId,
        type: 'miniprogram',
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d')
        .sign(secret);
}

export async function POST(request: NextRequest) {
    try {
        const { code, openId } = await request.json();

        if (!code) {
            return apiError('缺少 code', 400);
        }

        // 1. 解密手机号
        const phoneInfo = await getPhoneNumber(code);
        const phoneNumber = phoneInfo.phoneNumber || phoneInfo.purePhoneNumber;

        if (!phoneNumber) {
            return apiError('无法获取手机号', 400);
        }

        console.log('[DecryptPhone] Phone:', phoneNumber, 'OpenId:', openId);

        // 2. 查找用户 by Phone
        const user = await db.query.users.findFirst({
            where: eq(users.phone, phoneNumber)
        });

        if (user) {
            // 用户存在 -> 登录

            // 如果 openId 不同，绑定 (Upsert logic sort of)
            if (openId && user.wechatOpenId !== openId) {
                await db.update(users).set({ wechatOpenId: openId }).where(eq(users.id, user.id));
            }

            const tenant = await db.query.tenants.findFirst({
                where: eq(tenants.id, user.tenantId)
            });

            const token = await generateToken(user.id, user.tenantId);

            return apiSuccess({
                token,
                tenantStatus: tenant?.status,
                user: {
                    id: user.id,
                    name: user.name,
                    phone: user.phone,
                    role: user.role,
                    tenantId: user.tenantId,
                    tenantName: tenant?.name,
                    avatarUrl: user.avatarUrl
                }
            });

        } else {
            // 用户不存在 -> 返回 USER_NOT_FOUND，前端引导注册
            // 携带解析出的手机号，方便填充注册表单
            return apiSuccess({
                status: 'USER_NOT_FOUND',
                phone: phoneNumber
            }, '验证成功，请完成注册');
        }

    } catch (error: any) {
        console.error('Decrypt Phone Error:', error);
        return apiError(error.message, 500);
    }
}
