'use server';

import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema/service';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ActionState, createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { validateGpsCheckIn, calculateLateMinutes } from '@/shared/lib/gps-utils';
import { auth } from '@/shared/lib/auth';

import { AuditService } from '@/shared/services/audit-service';

// 输入校验 Schema
const CheckInMeasureTaskSchema = z.object({
  taskId: z.string().uuid(),
  latitude: z.number(),
  longitude: z.number(),
  address: z.string().optional(),
  targetLatitude: z.number().optional(),
  targetLongitude: z.number().optional(),
});

type CheckInMeasureTaskInput = z.infer<typeof CheckInMeasureTaskSchema>;

const checkInMeasureTaskActionInternal = createSafeAction(
  CheckInMeasureTaskSchema,
  async (
    input: CheckInMeasureTaskInput
  ): Promise<
    ActionState<{
      checkInAt: Date;
      gpsResult: ReturnType<typeof validateGpsCheckIn> | null;
      lateMinutes: number;
    }>
  > => {
    // 🔒 安全校验：获取当前用户身份
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
      return { success: false, error: '未授权访问' };
    }
    const tenantId = session.user.tenantId;
    const userId = session.user.id;

    const { taskId, latitude, longitude, address, targetLatitude, targetLongitude } = input;

    return await db.transaction(async (tx) => {
      // 🔒 安全校验：验证任务归属当前租户
      const task = await tx.query.measureTasks.findFirst({
        where: and(
          eq(measureTasks.id, taskId),
          eq(measureTasks.tenantId, tenantId) // 租户隔离
        ),
      });

      if (!task) {
        return { success: false, error: '任务不存在或无权访问' };
      }

      // 🔒 安全校验：只有被指派的测量师才能签到
      if (task.assignedWorkerId !== userId) {
        return { success: false, error: '只有被指派的测量师才能签到' };
      }

      if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
        return { success: false, error: '任务已结束，无法签到' };
      }

      // GPS 校验
      let gpsResult = null;
      if (targetLatitude && targetLongitude) {
        gpsResult = validateGpsCheckIn(latitude, longitude, targetLatitude, targetLongitude);
      }

      // 迟到检测
      let lateMinutes = 0;
      if (task.scheduledAt) {
        // 读取系统配置的迟到阈值 (动态 import 避免循环依赖)
        const { getSetting } = await import('@/features/settings/actions/system-settings-actions');
        const lateThreshold = ((await getSetting('MEASURE_LATE_THRESHOLD')) as number) ?? 15;

        lateMinutes = calculateLateMinutes(task.scheduledAt, new Date(), lateThreshold);
      }

      const checkInInfo = {
        coords: { lat: latitude, lng: longitude },
        address,
        gpsResult,
        lateMinutes,
        isLate: lateMinutes > 0,
      };

      // 更新任务：签到后状态应保持 PENDING_VISIT（待上门）或进入测量中
      await tx
        .update(measureTasks)
        .set({
          checkInAt: new Date(),
          checkInLocation: checkInInfo,
          // 持久化迟到数据 (BLO-02)
          isLate: checkInInfo.isLate,
          lateMinutes: checkInInfo.lateMinutes,
          // 签到后状态保持 PENDING_VISIT，提交数据后才变更
        })
        .where(eq(measureTasks.id, taskId));

      revalidatePath('/service/measurement');
      revalidatePath(`/service/measurement/${taskId}`);

      // 审计日志: 记录签到
      await AuditService.record({
        tenantId: tenantId,
        userId: userId,
        tableName: 'measure_tasks',
        recordId: taskId,
        action: 'UPDATE',
        changedFields: {
          checkInAt: new Date(),
          checkInLocation: checkInInfo,
          isLate: checkInInfo.isLate,
          lateMinutes: checkInInfo.lateMinutes,
        },
      });

      return {
        success: true,
        data: { checkInAt: new Date(), gpsResult, lateMinutes },
      };
    });
  }
);

/**
 * 测量任务签到
 *
 * 功能流程：
 * 1. 验证用户身份与租户隔离
 * 2. 确认当前用户是被指派测量师
 * 3. GPS 位置校验（可选）
 * 4. 迟到检测（基于系统配置的阈值）
 * 5. 更新任务签到信息并记录审计日志
 *
 * @param params - 签到参数，包含 taskId、经纬度和可选的目标坐标
 * @returns ActionState 包含签到时间、GPS 校验结果和迟到分钟数
 */
export async function checkInMeasureTask(params: CheckInMeasureTaskInput) {
  return checkInMeasureTaskActionInternal(params);
}
