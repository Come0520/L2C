/**
 * 租户存储配额接口
 *
 * GET /api/miniprogram/storage/quota
 *
 * @description 师傅查看当前租户的存储配额使用情况（已用/总量/使用率）
 */
import { NextRequest } from 'next/server';
import { withMiniprogramAuth, type AuthUser } from '../../auth-utils';
import { getTenantStorageQuota } from '@/features/measure/actions/storage';
import { apiSuccess, apiServerError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';

export const GET = withMiniprogramAuth(
  async (_request: NextRequest, user: AuthUser) => {
    try {
      const quota = await getTenantStorageQuota(user.tenantId);
      return apiSuccess(quota);
    } catch (error) {
      logger.error('[StorageQuota] 获取存储配额失败', { error });
      return apiServerError('获取存储配额失败');
    }
  },
  ['WORKER', 'SALES', 'ADMIN', 'MANAGER']
);
