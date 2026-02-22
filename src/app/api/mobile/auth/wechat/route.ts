/**
 * 微信小程序登录 API
 * POST /api/mobile/auth/wechat
 * 
 * 通过 code 换取 openid 并生成 JWT
 */

import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { customers } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { env } from '@/shared/config/env';
import { generateAccessToken, generateRefreshToken } from '@/shared/lib/jwt';
import { createLogger } from '@/shared/lib/logger';
import { AuditService } from '@/shared/services/audit-service';

/**
 * 微信登录请求体
 */
interface WechatLoginBody {
    code: string;           // 小程序 wx.login() 返回的 code
    phone?: string;         // 手机号（可选，用于绑定客户）
    encryptedData?: string; // 加密的手机号数据
    iv?: string;            // 加密向量
}

/**
 * 微信 code2session 响应
 */
interface WxSessionResponse {
    openid: string;
    session_key: string;
    unionid?: string;
    errcode?: number;
    errmsg?: string;
}


const log = createLogger('mobile/auth/wechat');
export async function POST(request: NextRequest) {
    // 1. 解析请求体
    let body: WechatLoginBody;
    try {
        body = await request.json();
    } catch {
        return apiError('请求体格式错误', 400);
    }

    const { code, phone } = body;

    if (!code) {
        return apiError('缺少 code 参数', 400);
    }

    // 2. 检查微信配置
    if (!env.WX_APPID || !env.WX_APPSECRET) {
        return apiError('微信小程序未配置', 500);
    }

    try {
        // 3. 调用微信 code2session 接口
        const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${env.WX_APPID}&secret=${env.WX_APPSECRET}&js_code=${code}&grant_type=authorization_code`;

        const wxResponse = await fetch(wxUrl);
        const wxData: WxSessionResponse = await wxResponse.json();

        if (wxData.errcode) {
            log.error('微信登录失败', {}, wxData);
            return apiError(`微信登录失败: ${wxData.errmsg}`, 400);
        }

        const { openid, unionid } = wxData;

        // 4. 查找或创建客户记录
        let customer = await db.query.customers.findFirst({
            where: eq(customers.wechatOpenId, openid),
            columns: {
                id: true,
                name: true,
                phone: true,
                tenantId: true,
            }
        });

        // 如果客户不存在且提供了手机号，尝试通过手机号关联
        if (!customer && phone) {
            customer = await db.query.customers.findFirst({
                where: eq(customers.phone, phone),
                columns: {
                    id: true,
                    name: true,
                    phone: true,
                    tenantId: true,
                }
            });

            // 如果找到了，更新 openid
            if (customer) {
                await db.update(customers)
                    .set({
                        wechatOpenId: openid,
                        updatedAt: new Date(),
                    })
                    .where(eq(customers.id, customer.id));
            }
        }

        // 5. 如果仍然没有客户，返回需要绑定的状态
        if (!customer) {
            await AuditService.log(db, {
                tableName: 'auth_login',
                recordId: openid,
                action: 'LOGIN_FAILED',
                userId: openid,
                tenantId: 'SYSTEM',
                details: { method: 'wechat_miniprogram', platform: 'mobile', reason: 'need_binding' }
            });

            return apiSuccess({
                needBinding: true,
                // P4.1: 脱敏处理 OpenID，不直接返回完整敏感信息
                openid: openid.substring(0, 4) + '****' + openid.substring(openid.length - 4),
                unionid: unionid ? unionid.substring(0, 4) + '****' + unionid.substring(unionid.length - 4) : undefined,
            }, '请绑定手机号完成注册');
        }

        // 6. 生成 JWT Token
        const accessToken = await generateAccessToken(
            customer.id,
            customer.tenantId,
            customer.phone || '',
            'CUSTOMER'
        );
        const refreshToken = await generateRefreshToken(
            customer.id,
            customer.tenantId,
            customer.phone || '',
            'CUSTOMER'
        );

        log.info(`微信登录: 客户 ${customer.name} 登录成功`);

        await AuditService.log(db, {
            tableName: 'auth_login',
            recordId: customer.id,
            action: 'LOGIN_SUCCESS',
            userId: customer.id,
            tenantId: customer.tenantId || 'SYSTEM',
            details: { method: 'wechat_miniprogram', platform: 'mobile' }
        });

        return apiSuccess({
            needBinding: false,
            accessToken,
            refreshToken,
            expiresIn: 86400,
            user: {
                id: customer.id,
                name: customer.name,
                phone: customer.phone,
                role: 'CUSTOMER',
            }
        }, '登录成功');

    } catch (error) {
        log.error('微信登录错误', {}, error);
        return apiError('微信登录失败', 500);
    }
}
