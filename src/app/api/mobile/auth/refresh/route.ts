
import { NextResponse } from 'next/server';
import { verifyToken, generateAccessToken, generateRefreshToken } from '@/shared/lib/jwt';

/**
 * Token 刷新接口
 * POST /api/mobile/auth/refresh
 * 
 * @body { refreshToken: string }
 * @returns { success: boolean, data: { accessToken, refreshToken, expiresIn } }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { refreshToken } = body;

        // 参数校验
        if (!refreshToken) {
            return NextResponse.json(
                { success: false, message: 'refreshToken 不能为空' },
                { status: 400 }
            );
        }

        // 验证 refresh token
        const payload = await verifyToken(refreshToken);

        if (!payload) {
            return NextResponse.json(
                { success: false, message: 'Token 无效或已过期' },
                { status: 401 }
            );
        }

        // 确保是 refresh token 类型
        if (payload.type !== 'refresh') {
            return NextResponse.json(
                { success: false, message: '无效的 Token 类型' },
                { status: 401 }
            );
        }

        // 生成新的 Token 对
        const newAccessToken = await generateAccessToken(
            payload.userId,
            payload.tenantId,
            payload.phone
        );
        const newRefreshToken = await generateRefreshToken(
            payload.userId,
            payload.tenantId,
            payload.phone
        );

        return NextResponse.json({
            success: true,
            data: {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                expiresIn: 86400 // 24小时（秒）
            }
        });

    } catch (error) {
        console.error('Token 刷新错误:', error);
        return NextResponse.json(
            { success: false, message: '服务器内部错误' },
            { status: 500 }
        );
    }
}
