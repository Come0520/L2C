'use server';

import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema/service';
import { users } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ActionState, createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { notificationService } from '@/features/notifications/service';
import { auth } from '@/shared/lib/auth';

// 输入校验 Schema
const RejectMeasureTaskSchema = z.object({
    taskId: z.string().uuid(),
    reason: z.string().min(1, '驳回原因不能为空'),
});

type RejectMeasureTaskInput = z.infer<typeof RejectMeasureTaskSchema>;

const rejectMeasureTaskActionInternal = createSafeAction(
    RejectMeasureTaskSchema,
    async (input: RejectMeasureTaskInput): Promise<ActionState<{ taskId: string; rejectCount: number; status: string }>> => {
        // 🔒 安全校验：获取当前用户身份
        const session = await auth();
        if (!session?.user?.tenantId || !session?.user?.id) {
            return { success: false, error: '未授权访问' };
        }
        const tenantId = session.user.tenantId;

        const { taskId, reason } = input;

        return await db.transaction(async (tx) => {
            // 🔒 安全校验：验证任务归属当前租户
            const task = await tx.query.measureTasks.findFirst({
                where: and(
                    eq(measureTasks.id, taskId),
                    eq(measureTasks.tenantId, tenantId) // 强制租户隔离
                ),
                with: { lead: true }
            });

            if (!task) {
                return { success: false, error: '任务不存在或无权访问' };
            }

            if (task.status === 'CANCELLED') {
                return { success: false, error: '任务已取消，无法驳回' };
            }

            // TODO: 添加角色校验，确保只有销售/管理员可以驳回

            const newRejectCount = (task.rejectCount || 0) + 1;

            await tx.update(measureTasks)
                .set({
                    status: 'PENDING_VISIT',
                    rejectCount: newRejectCount,
                    rejectReason: reason,
                    updatedAt: new Date(),
                })
                .where(eq(measureTasks.id, taskId));

            // 驳回预警机制
            let warningMessage = null;
            if (newRejectCount >= 3) {
                try {
                    const storeManagers = await tx.query.users.findMany({
                        where: and(
                            eq(users.tenantId, tenantId), // 使用验证后的 tenantId
                            eq(users.role, 'STORE_MANAGER')
                        ),
                    });

                    for (const manager of storeManagers) {
                        await notificationService.send({
                            tenantId,
                            userId: manager.id,
                            title: '测量任务驳回预警',
                            content: `测量任务 ${task.measureNo} 已被驳回 ${newRejectCount} 次，驳回原因：${reason}。请关注。`,
                            type: 'ALERT',
                            link: `/service/measurement/${taskId}`,
                        });
                    }
                    warningMessage = `任务累计驳回 ${newRejectCount} 次，已通知店长介入。`;
                } catch (notifyError) {
                    console.error('[驳回预警] 通知店长失败:', notifyError);
                }
            }

            revalidatePath('/service/measurement');
            revalidatePath(`/service/measurement/${taskId}`);

            return {
                success: true,
                data: { taskId, rejectCount: newRejectCount, status: 'PENDING_VISIT' },
                message: warningMessage || '任务已驳回，等待重新测量'
            };
        });
    }
);

export async function rejectMeasureTask(params: RejectMeasureTaskInput) {
    return rejectMeasureTaskActionInternal(params);
}

