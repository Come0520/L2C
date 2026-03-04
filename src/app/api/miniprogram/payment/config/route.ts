/**
 * 支付配置查询 API (普通用户可用)
 *
 * GET /api/miniprogram/payment/config
 */
import { NextRequest } from 'next/server';
import { apiSuccess, apiServerError, apiUnauthorized } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { withMiniprogramAuth } from '../../auth-utils';
import { CacheService } from '@/shared/services/miniprogram/cache.service';

export const GET = withMiniprogramAuth(async (request: NextRequest, user) => {
  try {
    const tenantId = user?.tenantId;
    if (!tenantId) {
      return apiUnauthorized('未授权');
    }

    const cacheKey = `payment-config:${tenantId}`;
    const paymentConfig = await CacheService.getOrSet(
      cacheKey,
      async () => {
        const tenant = await db.query.tenants.findFirst({
          where: eq(tenants.id, tenantId),
          columns: { settings: true },
        });

        const settings = (tenant?.settings as Record<string, unknown>) || {};
        return (
          (settings.payment as Record<string, unknown>) || {
            enabled: true,
            offline: { enabled: true, instructions: '' },
            online: { enabled: false },
          }
        );
      },
      300000
    ); // 5分钟长效缓存

    const response = apiSuccess(paymentConfig);
    response.headers.set('Cache-Control', 'private, max-age=300');
    return response;
  } catch (error) {
    logger.error('Get Payment Config Error:', error);
    return apiServerError('Failed');
  }
});
