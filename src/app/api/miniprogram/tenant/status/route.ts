/**
 * 查询租户审批状态 API
 * 
 * GET /api/miniprogram/tenant/status
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { getMiniprogramUser } from '../../auth-utils';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { CacheService } from '@/shared/services/miniprogram/cache.service';



export async function GET(request: NextRequest) {
    try {
        const tokenData = await getMiniprogramUser(request);

        if (!tokenData) {
            return apiError('未授权', 401);
        }

        const cacheKey = `tenant-status:${tokenData.tenantId}`;
        const data = await CacheService.getOrSet(cacheKey, async () => {
            // 获取租户信息 (仅查询必要字段，防止泄露 settings 等敏感配置)
            const tenant = await db.query.tenants.findFirst({
                where: eq(tenants.id, tokenData.tenantId),
                columns: {
                    id: true,
                    status: true,
                    name: true,
                    code: true,
                    applicantName: true,
                    applicantPhone: true,
                    applicantEmail: true,
                    region: true,
                    businessDescription: true,
                    rejectReason: true,
                    createdAt: true,
                    reviewedAt: true,
                },
            });

            if (!tenant) return null;

            return {
                status: tenant.status,
                tenant: {
                    id: tenant.id,
                    name: tenant.name,
                    code: tenant.code,
                    applicantName: tenant.applicantName,
                    applicantPhone: tenant.applicantPhone,
                    applicantEmail: tenant.applicantEmail,
                    region: tenant.region,
                    businessDescription: tenant.businessDescription,
                    rejectReason: tenant.rejectReason,
                    createdAt: tenant.createdAt,
                    reviewedAt: tenant.reviewedAt,
                },
            };
        }, 120000); // 120秒缓存

        if (!data) {
            return apiError('租户不存在', 404);
        }

        const response = apiSuccess(data);
        response.headers.set('Cache-Control', 'private, max-age=120');
        return response;

    } catch (error) {
        logger.error('查询状态错误:', error);
        return apiError('查询失败', 500);
    }
}
