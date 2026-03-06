/**
 * 上报展厅浏览停留时间 API
 *
 * POST /api/miniprogram/showroom/share/view-stats
 *
 * @description 客户退出展厅或切换素材时，批量上报各素材的停留时长
 */
import { NextRequest } from 'next/server';
import { withMiniprogramAuth, type AuthUser } from '../../../auth-utils';
import { reportViewStats } from '@/features/showroom/actions/view-stats';
import { ShowroomError } from '@/features/showroom/errors';
import { apiSuccess, apiServerError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';

export const POST = withMiniprogramAuth(async (request: NextRequest, _user: AuthUser) => {
  try {
    const body = await request.json();
    const { shareId, visitorUserId, items } = body;

    if (!shareId || !visitorUserId) {
      return Response.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const result = await reportViewStats({ shareId, visitorUserId, items });

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof ShowroomError) {
      const statusMap: Record<string, number> = {
        SHOWROOM_1201: 404, // SHARE_NOT_FOUND
      };
      const status = statusMap[error.errorDetail.code] || 400;
      return Response.json({ error: error.message, code: error.errorDetail.code }, { status });
    }
    logger.error('[ShowroomViewStats] 上报停留时间失败', { error });
    return apiServerError('上报停留时间失败');
  }
});
