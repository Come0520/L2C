import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiBadRequest,
  apiServerError,
  apiNotFound,
  apiForbidden,
} from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { withMiniprogramAuth } from '../../../auth-utils';

export const POST = withMiniprogramAuth(
  async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { latitude, longitude, accuracy } = body;

      if (!latitude || !longitude) {
        return apiBadRequest('缺少位置信息');
      }

      // 查询任务
      const task = await db
        .select()
        .from(measureTasks)
        .where(and(eq(measureTasks.id, id), eq(measureTasks.tenantId, user.tenantId)))
        .limit(1);

      if (!task.length) {
        return apiNotFound('任务不存在');
      }

      const t = task[0];

      // 权限校验：只有被指派的工人可以签到
      if (t.assignedWorkerId !== user.id) {
        return apiForbidden('只有被指派的工人可以签到');
      }

      // 状态校验：必须是待上门状态
      if (t.status !== 'PENDING_VISIT') {
        return apiBadRequest('当前状态不允许签到');
      }

      // 更新签到信息
      await db
        .update(measureTasks)
        .set({
          checkInAt: new Date(),
          checkInLocation: { latitude, longitude, accuracy },
          updatedAt: new Date(),
        })
        .where(and(eq(measureTasks.id, id), eq(measureTasks.tenantId, user.tenantId)));

      return apiSuccess({ message: '签到成功' });
    } catch (error) {
      logger.error('[POST /api/miniprogram/tasks/[id]/check-in] Error:', error);
      const message = error instanceof Error ? error.message : '服务器错误';
      return apiServerError(message);
    }
  },
  ['WORKER', 'SALES', 'MANAGER', 'ADMIN']
);
