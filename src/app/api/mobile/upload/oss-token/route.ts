
import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { authenticateMobile } from '@/shared/middleware/mobile-auth';
import { getOSSToken } from '@/features/upload/actions/oss-token';
import { createLogger } from '@/shared/lib/logger';

/**
 * OSS 临时上传凭证接口
 * GET /api/mobile/upload/oss-token
 * 
 * @header Authorization: Bearer {accessToken}
 * @returns { success: boolean, data: { AccessKeyId, AccessKeySecret, SecurityToken, Expiration, bucket, region } }
 */

const log = createLogger('mobile/upload/oss-token');
export async function GET(request: NextRequest) {
    try {
        // 1. 认证
        const authResult = await authenticateMobile(request);
        if (!authResult.success) {
            return authResult.response;
        }

        // 2. 获取 OSS STS Token
        const result = await getOSSToken();

        if (!result.success) {
            return apiError(result.error || 'OSS Token 获取失败', 500);
        }

        return apiSuccess(result.data);

    } catch (error) {
        log.error('OSS Token 获取错误', {}, error);
        return apiError('服务器内部错误', 500);
    }
}
