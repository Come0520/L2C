
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { verifyToken, generateAccessToken, generateRefreshToken } from '@/shared/lib/jwt';

/**
 * Token 刷新接口
 * POST /api/mobile/auth/refresh
 * 
 * @body { refreshToken: string }
 * @returns { success: boolean, data: { accessToken, refreshToken, expiresIn } }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { refreshToken } = body;

        // 参数校验
        if (!refreshToken) {
            return apiError('refreshToken 不能为空', 400);
        }

        // 验证 refresh token
        const payload = await verifyToken(refreshToken);

        if (!payload) {
            return apiError('Token 无效或已过期', 401);
        }

        // 确保是 refresh token 类型
        if (payload.type !== 'refresh') {
            return apiError('无效的 Token 类型', 401);
        }

        // 生成新的 Token 对
        const newAccessToken = await generateAccessToken(
            payload.userId,
            payload.tenantId,
            payload.phone,
            payload.role
        );
        const newRefreshToken = await generateRefreshToken(
            payload.userId,
            payload.tenantId,
            payload.phone,
            payload.role
        );

        return apiSuccess({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresIn: 86400 // 24小时（秒）
        });

    } catch (error) {
        console.error('Token 刷新错误:', error);
        return apiError('服务器内部错误', 500);
    }
}
