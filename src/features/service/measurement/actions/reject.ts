'use server';

import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema/service';
import { users } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ActionState, createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { notificationService } from '@/features/notifications/service';

// Input Schema
const RejectMeasureTaskSchema = z.object({
    taskId: z.string().uuid(),
    reason: z.string().min(1, '驳回原因不能为空'),
});

type RejectMeasureTaskInput = z.infer<typeof RejectMeasureTaskSchema>;

/**
 * 驳回测量任务
 * 
 * 1. 验证状态（不能是已取消）
 * 2. 重置状态为 PENDING_VISIT（待重新上门测量）
 * 3. 累加驳回次数
 * 4. 驳回次数 >= 3 时通知店长
 */
export const rejectMeasureTask = createSafeAction(
    RejectMeasureTaskSchema,
    async (input: RejectMeasureTaskInput): Promise<ActionState<any>> => {
        const { taskId, reason } = input;

        return await db.transaction(async (tx) => {
            // 1. 获取任务信息
            const task = await tx.query.measureTasks.findFirst({
                where: eq(measureTasks.id, taskId),
                with: {
                    lead: true,
                }
            });

            if (!task) {
                return { success: false, error: '任务不存在' };
            }

            if (task.status === 'CANCELLED') {
                return { success: false, error: '任务已取消，无法驳回' };
            }

            // 2. 累加驳回次数
            const newRejectCount = (task.rejectCount || 0) + 1;

            // 3. 更新任务状态
            await tx.update(measureTasks)
                .set({
                    status: 'PENDING_VISIT', // 重置为待上门，需要重新测量
                    rejectCount: newRejectCount,
                    rejectReason: reason,
                    updatedAt: new Date(),
                })
                .where(eq(measureTasks.id, taskId));

            // 4. 驳回预警：>= 3 次时通知店长
            let warningMessage = null;
            if (newRejectCount >= 3) {
                try {
                    // 查找店长用户（假设通过 lead 的 tenantId 关联）
                    const storeManagers = await tx.query.users.findMany({
                        where: and(
                            eq(users.tenantId, task.tenantId),
                            eq(users.role, 'STORE_MANAGER')
                        ),
                    });

                    // 向所有店长发送通知
                    for (const manager of storeManagers) {
                        await notificationService.send({
                            tenantId: task.tenantId,
                            userId: manager.id,
                            title: '测量任务驳回预警',
                            content: `测量任务 ${task.measureNo} 已被驳回 ${newRejectCount} 次，驳回原因：${reason}。请关注。`,
                            type: 'ALERT',
                            link: `/service/measurement/${taskId}`,
                        });
                    }

                    console.warn(`[驳回预警] 任务 ${task.measureNo} 已驳回 ${newRejectCount} 次，已通知 ${storeManagers.length} 位店长`);
                    warningMessage = `任务累计驳回 ${newRejectCount} 次，已通知店长介入。`;
                } catch (notifyError) {
                    console.error('[驳回预警] 通知店长失败:', notifyError);
                    // 通知失败不影响驳回操作
                }
            }

            revalidatePath('/service/measurement');
            revalidatePath(`/service/measurement/${taskId}`);

            return {
                success: true,
                data: {
                    taskId,
                    rejectCount: newRejectCount,
                    status: 'PENDING_VISIT'
                },
                message: warningMessage || '任务已驳回，等待重新测量'
            };
        });
    }
);
