/**
 * 任务竞标/处理工单（接单/拒绝/议价）API
 *
 * POST /api/miniprogram/tasks/[id]/negotiate
 *
 * 业务场景：工程师在抢单池中查看任务后，可发起的动作。
 *
 * @param id 任务ID（可为 measure 任务 或 install 任务 ID）
 * @body action: 'ACCEPT' | 'REJECT' | 'COUNTER'
 * @body price: 议价时的新期望价格
 * @body reason: 议价的理由或拒绝的理由
 */
import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { measureTasks, installTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { getMiniprogramUser } from '../../../auth-utils';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user || !user.tenantId) {
      return apiError('未授权', 401);
    }
    const { id: taskId } = params;

    const body = await request.json();
    const { action, price, reason } = body;

    if (!['ACCEPT', 'REJECT', 'COUNTER'].includes(action)) {
      return apiError('无效的操作类型', 400);
    }

    // 1. 判断是哪种任务，先查 Measure
    let isMeasure = true;
    let taskBase = await db.query.measureTasks.findFirst({
      where: and(eq(measureTasks.id, taskId), eq(measureTasks.tenantId, user.tenantId)),
    });

    if (!taskBase) {
      // 没查到，查 Install
      isMeasure = false;
      const taskBaseInst = await db.query.installTasks.findFirst({
        where: and(eq(installTasks.id, taskId), eq(installTasks.tenantId, user.tenantId)),
      });
      if (!taskBaseInst) {
        return apiError('找不到指定的任务', 404);
      }
      taskBase = taskBaseInst as any;
    }

    // 2. 根据 Action 更新指定信息
    // 逻辑简化版，实际中可结合工作流或审批流
    if (action === 'ACCEPT') {
      if (isMeasure) {
        await db
          .update(measureTasks)
          .set({
            assignedWorkerId: user.id,
            status: 'ACCEPTED',
          })
          .where(eq(measureTasks.id, taskId));
      } else {
        await db
          .update(installTasks)
          .set({
            installerId: user.id,
            status: 'ACCEPTED',
          })
          .where(eq(installTasks.id, taskId));
      }
    } else if (action === 'REJECT') {
      // 如果原本就是 PENDING 没分配人，拒绝无意义，可简单忽略或记录日志。
      // 若是定向派单，则记录到流转日志或清空 assignedWorkerId。这里简化处理。
    } else if (action === 'COUNTER') {
      // 议价申请：可存储在 adjustmentReason，或另外的工作流表中。
      if (!price) {
        return apiError('议价必须传入期望价格 (price)', 400);
      }
      if (isMeasure) {
        await db
          .update(measureTasks)
          .set({
            adjustmentReason: `要求议价￥${price}：${reason || '无'}`,
          })
          .where(eq(measureTasks.id, taskId));
      } else {
        await db
          .update(installTasks)
          .set({
            adjustmentReason: `要求议价￥${price}：${reason || '无'}`,
          })
          .where(eq(installTasks.id, taskId));
      }
    }

    logger.info('[TaskNegotiate] 工单动作处理完毕', {
      route: `tasks/${taskId}/negotiate`,
      taskId,
      type: isMeasure ? 'MEASURE' : 'INSTALL',
      action,
      userId: user.id,
    });

    return apiSuccess({ success: true, action });
  } catch (error) {
    logger.error('[TaskNegotiate] 工单处理异常', { route: `tasks/negotiate`, error });
    return apiError('工单动作处理失败', 500);
  }
}
