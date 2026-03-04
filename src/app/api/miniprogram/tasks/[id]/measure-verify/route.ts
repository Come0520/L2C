/**
 * 测量数据审核 API
 *
 * POST /api/miniprogram/tasks/[id]/measure-verify
 *
 * 业务场景：销售在小程序中查看“待复核”的量尺单数据，并决定是“通过(APPROVE)”还是“申诉(DISPUTE)”。
 *
 * @param id 任务ID (MeasureTask ID)
 * @body action: 'APPROVE' | 'DISPUTE'
 * @body disputeReason?: 申诉理由（打回给师傅）
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import {
  apiSuccess,
  apiBadRequest,
  apiServerError,
  apiNotFound,
  apiUnauthorized,
} from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { withMiniprogramAuth } from '../../../auth-utils';

export const POST = withMiniprogramAuth(
  async (request: NextRequest, user, { params }: { params: Promise<{ id: string }> }) => {
    try {
      if (!user || (!user.tenantId && user.role !== 'SUPER_ADMIN')) {
        return apiUnauthorized('未授权');
      }
      const { id: taskId } = await params;
      const { action, disputeReason } = await request.json();

      if (!['APPROVE', 'DISPUTE'].includes(action)) {
        return apiBadRequest('无效的操作');
      }

      const mTask = await db.query.measureTasks.findFirst({
        where: and(eq(measureTasks.id, taskId), eq(measureTasks.tenantId, user.tenantId as string)),
      });

      if (!mTask) {
        return apiNotFound('找不到量尺任务');
      }
      if (mTask.status !== 'COMPLETED') {
        return apiBadRequest('当前任务尚未完成测量提交，无法复核');
      }

      if (action === 'APPROVE') {
        // 通过复核：任务结束。如有工单关联，可以更新工单的测量阶段。
        // 这里标记状态为 COMPLETED（可根据字典具体调整，假设我们使用 COMPLETED 表示审结）
        await db
          .update(measureTasks)
          .set({ status: 'COMPLETED' })
          .where(eq(measureTasks.id, taskId));
      } else if (action === 'DISPUTE') {
        // 申诉：打回让师傅重新测量，变为 PENDING 状态重置
        if (!disputeReason) {
          return apiBadRequest('申诉必须填写理由');
        }
        await db
          .update(measureTasks)
          .set({
            status: 'PENDING_CONFIRM',
            // 实际应该存在专门的备注或日志字段，这里简化复用了 adjustmentReason，或者你可以新建字段
            adjustmentReason: `数据复核不通过：${disputeReason}`,
          })
          .where(eq(measureTasks.id, taskId));
      }

      logger.info('[MeasureVerify] 量尺复核提交成功', { action, taskId, userId: user.id });
      return apiSuccess({ success: true, action });
    } catch (error) {
      logger.error('[MeasureVerify] 量尺复核异常', {
        route: `tasks/${error}`,
      });
      return apiServerError('量尺数据复核失败');
    }
  }
);
