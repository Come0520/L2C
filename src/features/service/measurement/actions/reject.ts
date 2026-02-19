'use server';

import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema/service';
import { users } from '@/shared/api/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ActionState, createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { notificationService } from '@/features/notifications/service';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';

import { AuditService } from '@/shared/lib/audit-service';

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

            // 权限校验
            try {
                await checkPermission(session, PERMISSIONS.MEASURE.MANAGE);
            } catch (_error) {
                return { success: false, error: '无权限驳回任务' };
            }

            const newRejectCount = (task.rejectCount || 0) + 1;

            // 多级驳回逻辑 (RC-04)
            // 使用字面量类型确保与 drizzle enum 兼容
            type MeasureTaskStatus = 'PENDING_APPROVAL' | 'PENDING' | 'DISPATCHING' | 'PENDING_VISIT' | 'PENDING_CONFIRM' | 'COMPLETED' | 'CANCELLED';
            let newStatus: MeasureTaskStatus = 'PENDING_VISIT'; // 默认：数据有误，驳回至待上门（重测）
            let shouldClearWorker = false;

            if (task.status === 'PENDING_CONFIRM') {
                newStatus = 'PENDING_VISIT'; // 销售/客户驳回测量数据 -> 重新测量
            } else if (task.status === 'PENDING_VISIT' || task.status === 'DISPATCHING') {
                // 待上门/派单中被驳回 -> 重新分配
                newStatus = 'PENDING';
                shouldClearWorker = true;
            }

            // 驳回历史记录 (RC-03)
            const historyItem = {
                reason: reason,
                createdAt: new Date().toISOString(),
                rejectedBy: session.user.id,
                rejectedByName: session.user.name
            };

            // 使用 sql 更新 JSONB 数组
            const newHistory = sql`
                COALESCE(${measureTasks.rejectHistory}, '[]'::jsonb) || ${JSON.stringify(historyItem)}::jsonb
            `;

            await tx.update(measureTasks)
                .set({
                    status: newStatus,
                    rejectCount: newRejectCount,
                    rejectReason: reason,
                    rejectHistory: newHistory,
                    updatedAt: new Date(),
                    assignedWorkerId: shouldClearWorker ? null : undefined, // 如果退回待分配，清空工人
                })
                .where(and(
                    eq(measureTasks.id, taskId),
                    eq(measureTasks.tenantId, tenantId)
                ));

            // 驳回预警机制 (RC-03: 四级预警)
            // >= 3: 通知店长
            // >= 4: 通知店长 + 区域经理 (假设有 AREA_MANAGER 角色)
            let warningMessage = null;

            if (newRejectCount >= 3) {
                try {
                    const notifyRoles = ['STORE_MANAGER'];
                    if (newRejectCount >= 4) {
                        notifyRoles.push('AREA_MANAGER');
                    }

                    const managers = await tx.query.users.findMany({
                        where: and(
                            eq(users.tenantId, tenantId),
                            inArray(users.role, notifyRoles)
                        ),
                    });

                    for (const manager of managers) {
                        await notificationService.send({
                            tenantId,
                            userId: manager.id,
                            title: newRejectCount >= 4 ? '【严重】测量任务多次驳回预警' : '测量任务驳回预警',
                            content: `测量任务 ${task.measureNo} 已被驳回 ${newRejectCount} 次，请立即介入处理。驳回原因：${reason}`,
                            type: 'ALERT',
                            link: `/service/measurement/${taskId}`,
                        });
                    }

                    warningMessage = `任务累计驳回 ${newRejectCount} 次，已通知${newRejectCount >= 4 ? '区域经理' : '店长'}介入。`;
                } catch (notifyError) {
                    console.error('[驳回预警] 通知管理层失败:', notifyError);
                }
            }

            revalidatePath('/service/measurement');
            revalidatePath(`/service/measurement/${taskId}`);



            // 审计日志: 记录任务驳回
            await AuditService.record(
                {
                    tenantId: tenantId,
                    userId: session.user.id,
                    tableName: 'measure_tasks',
                    recordId: taskId,
                    action: 'UPDATE',
                    changedFields: {
                        status: newStatus,
                        rejectCount: newRejectCount,
                        rejectReason: reason,
                        assignedWorkerId: shouldClearWorker ? null : undefined,
                    }
                }
            );

            return {
                success: true,
                data: { taskId, rejectCount: newRejectCount, status: newStatus },
                message: warningMessage || '任务已驳回，等待重新测量'
            };
        });
    }
);

export async function rejectMeasureTask(params: RejectMeasureTaskInput) {
    return rejectMeasureTaskActionInternal(params);
}

