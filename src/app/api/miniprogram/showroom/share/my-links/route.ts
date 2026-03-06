/**
 * 获取当前销售的分享列表 API
 *
 * GET /api/miniprogram/showroom/share/my-links
 *
 * @description 销售查看自己创建的所有分享链接（分页）
 */
import { NextRequest } from 'next/server';
import { withMiniprogramAuth, type AuthUser } from '../../../auth-utils';
import { getMyShareLinks } from '@/features/showroom/actions/shares';
import { ShowroomError } from '@/features/showroom/errors';
import { apiSuccess, apiServerError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';

export const GET = withMiniprogramAuth(
  async (request: NextRequest, _user: AuthUser) => {
    try {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page')) || 1;
      const pageSize = Number(url.searchParams.get('pageSize')) || 20;

      const result = await getMyShareLinks(page, pageSize);

      return apiSuccess(result);
    } catch (error) {
      if (error instanceof ShowroomError) {
        return Response.json(
          { error: error.message, code: error.errorDetail.code },
          { status: 400 }
        );
      }
      logger.error('[ShowroomMyLinks] 获取分享列表失败', { error });
      return apiServerError('获取分享列表失败');
    }
  },
  ['SALES', 'ADMIN', 'MANAGER']
);
