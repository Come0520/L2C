
import { NextResponse } from 'next/server';
import { extractAndVerifyToken } from '@/shared/lib/jwt';
import { getOSSToken } from '@/features/upload/actions/oss-token';

/**
 * OSS 临时上传凭证接口
 * GET /api/mobile/upload/oss-token
 * 
 * @header Authorization: Bearer {accessToken}
 * @returns { success: boolean, data: { AccessKeyId, AccessKeySecret, SecurityToken, Expiration, bucket, region } }
 */
export async function GET(request: Request) {
    try {
        // 验证 Token
        const authHeader = request.headers.get('Authorization');
        const payload = await extractAndVerifyToken(authHeader);

        if (!payload) {
            return NextResponse.json(
                { success: false, message: '未授权访问' },
                { status: 401 }
            );
        }

        // 确保是 access token 类型
        if (payload.type !== 'access') {
            return NextResponse.json(
                { success: false, message: '无效的 Token 类型' },
                { status: 401 }
            );
        }

        // 获取 OSS STS Token
        const result = await getOSSToken();

        if (!result.success) {
            return NextResponse.json(
                { success: false, message: result.error || 'OSS Token 获取失败' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: result.data
        });

    } catch (error) {
        console.error('OSS Token 获取错误:', error);
        return NextResponse.json(
            { success: false, message: '服务器内部错误' },
            { status: 500 }
        );
    }
}
