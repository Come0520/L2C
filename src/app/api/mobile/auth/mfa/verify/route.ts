
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { verifyToken, generateAccessToken, generateRefreshToken } from '@/shared/lib/jwt';
import { VerificationCodeService } from '@/shared/services/verification-code.service';

/**
 * MFA 验证接口
 * POST /api/mobile/auth/mfa/verify
 * 
 * @body { preAuthToken: string, code: string }
 * @returns { success: boolean, data: { accessToken, refreshToken, user } }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { preAuthToken, code } = body;

        if (!preAuthToken || !code) {
            return apiError('缺少必要参数', 400);
        }

        // 1. 验证 Pre-Auth Token
        const payload = await verifyToken(preAuthToken);
        if (!payload || payload.type !== 'pre-auth') {
            return apiError('会话已失效，请重新登录', 401);
        }

        // 2. 验证短信验证码
        const isValid = await VerificationCodeService.verify(payload.userId, code, 'LOGIN_MFA');
        if (!isValid) {
            return apiError('验证码错误或已过期', 400);
        }

        // 3. 生成正式 Token
        const accessToken = await generateAccessToken(
            payload.userId,
            payload.tenantId,
            payload.phone,
            payload.role
        );
        const refreshToken = await generateRefreshToken(
            payload.userId,
            payload.tenantId,
            payload.phone,
            payload.role
        );

        return apiSuccess({
            accessToken,
            refreshToken,
            expiresIn: 86400,
            user: {
                id: payload.userId,
                tenantId: payload.tenantId,
                name: undefined, // Payload allows lightweight user info, or fetch from DB if needed
                phone: payload.phone,
                role: payload.role
            }
        }, '验证通过');

    } catch (error) {
        console.error('MFA 验证错误:', error);
        return apiError('服务器内部错误', 500);
    }
}
