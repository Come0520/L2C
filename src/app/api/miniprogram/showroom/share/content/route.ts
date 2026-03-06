/**
 * 获取展厅分享内容 API
 *
 * POST /api/miniprogram/showroom/share/content
 *
 * @description 客户打开分享链接时调用，携带 visitorUserId 用于身份锁定
 */
import { NextRequest } from 'next/server';
import { withMiniprogramAuth, type AuthUser } from '../../../auth-utils';
import { getShareContent } from '@/features/showroom/actions/shares';
import { ShowroomError } from '@/features/showroom/errors';
import { apiSuccess, apiServerError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';

export const POST = withMiniprogramAuth(async (request: NextRequest, user: AuthUser) => {
  try {
    const body = await request.json();
    const { shareId, password, visitorUserId } = body;

    if (!shareId) {
      return Response.json({ error: '缺少 shareId 参数' }, { status: 400 });
    }

    const result = await getShareContent({
      shareId,
      password,
      visitorUserId: visitorUserId || user.id,
    });

    return apiSuccess(result);
  } catch (error) {
    if (error instanceof ShowroomError) {
      const statusMap: Record<string, number> = {
        SHOWROOM_1201: 404, // SHARE_NOT_FOUND
        SHOWROOM_1202: 410, // SHARE_EXPIRED
        SHOWROOM_1203: 403, // PASSWORD_REQUIRED
        SHOWROOM_1204: 403, // PASSWORD_INCORRECT
        SHOWROOM_1206: 410, // SHARE_LIMIT_EXCEEDED
        SHOWROOM_1207: 403, // SHARE_LOCKED
      };
      const status = statusMap[error.errorDetail.code] || 400;
      return Response.json({ error: error.message, code: error.errorDetail.code }, { status });
    }
    logger.error('[ShowroomShareContent] 获取分享内容失败', { error });
    return apiServerError('获取分享内容失败');
  }
});
