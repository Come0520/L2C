/**
 * 获取展厅浏览统计报告 API
 *
 * GET /api/miniprogram/showroom/share/view-stats/[shareId]
 *
 * @description 销售查看特定分享链接的客户浏览统计（按停留时间排序）
 */
import { NextRequest } from 'next/server';
import { withMiniprogramAuth, type AuthUser } from '../../../../auth-utils';
import { getViewStatsReport } from '@/features/showroom/actions/view-stats';
import { ShowroomError } from '@/features/showroom/errors';
import { apiSuccess, apiServerError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';

export const GET = withMiniprogramAuth(
  async (request: NextRequest, _user: AuthUser, context: any) => {
    try {
      const { shareId } = await context.params;

      if (!shareId) {
        return Response.json({ error: '缺少 shareId' }, { status: 400 });
      }

      // 从 URL 参数中提取 limit
      const url = new URL(request.url);
      const limit = Number(url.searchParams.get('limit')) || 20;

      const result = await getViewStatsReport({ shareId, limit });

      return apiSuccess(result);
    } catch (error) {
      if (error instanceof ShowroomError) {
        const statusMap: Record<string, number> = {
          SHOWROOM_1000: 401, // UNAUTHORIZED
          SHOWROOM_1001: 403, // FORBIDDEN
        };
        const status = statusMap[error.errorDetail.code] || 400;
        return Response.json({ error: error.message, code: error.errorDetail.code }, { status });
      }
      logger.error('[ShowroomViewStatsReport] 获取浏览报告失败', { error });
      return apiServerError('获取浏览报告失败');
    }
  },
  ['SALES', 'ADMIN', 'MANAGER']
);
