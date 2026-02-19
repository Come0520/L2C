import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { getMiniprogramUser } from '../../../auth-utils';



/**
 * POST /api/miniprogram/tasks/[id]/check-in
 * GPS 签到
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getMiniprogramUser(request);
    if (!user) {
      return apiError('未授权', 401);
    }

    const { id } = await params;
    const body = await request.json();
    const { latitude, longitude, accuracy } = body;

    if (!latitude || !longitude) {
      return apiError('缺少位置信息', 400);
    }

    // 查询任务
    const task = await db
      .select()
      .from(measureTasks)
      .where(and(eq(measureTasks.id, id), eq(measureTasks.tenantId, user.tenantId)))
      .limit(1);

    if (!task.length) {
      return apiError('任务不存在', 404);
    }

    const t = task[0];

    // 权限校验：只有被指派的工人可以签到
    if (t.assignedWorkerId !== user.id) {
      return apiError('只有被指派的工人可以签到', 403);
    }

    // 状态校验：必须是待上门状态
    if (t.status !== 'PENDING_VISIT') {
      return apiError('当前状态不允许签到', 400);
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
    console.error('[POST /api/miniprogram/tasks/[id]/check-in] Error:', error);
    const message = error instanceof Error ? error.message : '服务器错误';
    return apiError(message, 500);
  }
}
