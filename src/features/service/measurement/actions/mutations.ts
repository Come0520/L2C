'use server';

import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { generateMeasureNo } from '../utils';
import {
    dispatchMeasureTaskSchema,
    checkInSchema
} from '../schemas';

// generateMeasureNo 移除，createMeasureTask 移除

/**
 * 指派测量任务
 */
export async function dispatchMeasureTask(input: z.infer<typeof dispatchMeasureTaskSchema>) {
    // 🔒 安全校验：获取当前用户身份
    const { auth } = await import('@/shared/lib/auth');
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权访问' };
    }
    const tenantId = session.user.tenantId;

    const { id, assignedWorkerId, scheduledAt } = dispatchMeasureTaskSchema.parse(input);

    // 🔒 安全校验：验证任务归属当前租户
    const task = await db.query.measureTasks.findFirst({
        where: and(
            eq(measureTasks.id, id),
            eq(measureTasks.tenantId, tenantId)
        ),
        columns: { id: true, status: true }
    });

    if (!task) {
        return { success: false, error: '任务不存在或无权访问' };
    }

    // TODO: 添加角色校验，确保只有派单员/管理员可以指派

    const [updated] = await db.update(measureTasks)
        .set({
            assignedWorkerId,
            scheduledAt: new Date(scheduledAt),
            status: 'DISPATCHING',
        })
        .where(eq(measureTasks.id, id))
        .returning();

    revalidatePath('/service/measurement');
    revalidatePath(`/service/measurement/${id}`);
    return { success: true, data: updated };
}

/**
 * 测量师接单
 */
export async function acceptMeasureTask(id: string) {
    // 🔒 安全校验：获取当前用户身份
    const { auth } = await import('@/shared/lib/auth');
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        return { success: false, error: '未授权访问' };
    }
    const tenantId = session.user.tenantId;
    const userId = session.user.id;

    // 🔒 安全校验：验证任务归属当前租户
    const task = await db.query.measureTasks.findFirst({
        where: and(
            eq(measureTasks.id, id),
            eq(measureTasks.tenantId, tenantId)
        ),
        columns: { id: true, assignedWorkerId: true, status: true }
    });

    if (!task) {
        return { success: false, error: '任务不存在或无权访问' };
    }

    // 🔒 安全校验：只有被指派的测量师才能接单
    if (task.assignedWorkerId !== userId) {
        return { success: false, error: '只有被指派的测量师才能接单' };
    }

    const [updated] = await db.update(measureTasks)
        .set({
            status: 'PENDING_VISIT',
        })
        .where(eq(measureTasks.id, id))
        .returning();

    revalidatePath('/service/measurement');
    revalidatePath(`/service/measurement/${id}`);
    return { success: true, data: updated };
}

/**
 * 现场签到
 */
export async function checkInMeasureTask(input: z.infer<typeof checkInSchema>) {
    const { id, location } = checkInSchema.parse(input);

    // 获取任务信息
    const task = await db.query.measureTasks.findFirst({
        where: eq(measureTasks.id, id),
        columns: {
            id: true,
            scheduledAt: true,
        }
    });

    if (!task) {
        return { success: false, error: '任务不存在' };
    }

    // 迟到检测
    let isLate = false;
    let lateMinutes = 0;

    if (task.scheduledAt) {
        const { calculateLateMinutes } = await import('@/shared/lib/gps-utils');
        const scheduledTime = new Date(task.scheduledAt);
        const checkInTime = new Date();

        lateMinutes = calculateLateMinutes(scheduledTime, checkInTime);
        isLate = lateMinutes > 0;
    }

    // 注意：GPS 距离校验需要 schema 添加 addressLocation 字段后启用
    const [updated] = await db.update(measureTasks)
        .set({
            checkInAt: new Date(),
            checkInLocation: location,
        })
        .where(eq(measureTasks.id, id))
        .returning();

    revalidatePath('/service/measurement');
    revalidatePath(`/service/measurement/${id}`);

    // 构建返回消息
    let message = '签到成功';
    if (isLate) {
        message += `，迟到 ${lateMinutes} 分钟`;
    }

    return {
        success: true,
        data: updated,
        message,
        gpsInfo: {
            isLate,
            lateMinutes,
        }
    };
}

/**
 * 提交测量数据 (Stub)
 */
export async function submitMeasureData(_input: unknown) {
    return { success: true, data: {} };
}

/**
 * 申请费用减免 (Stub)
 */
export async function requestFeeWaiver(_input: unknown) {
    return { success: true, data: {} };
}

/**
 * 拆分测量任务
 * 
 * 业务逻辑：
 * 1. 取消原任务
 * 2. 按品类创建新的测量任务
 * 3. 记录拆单关系到 measureTaskSplits 表
 * 4. 如果指定了 workerId，自动指派测量师
 * 
 * @param input - 拆单请求数据
 */
export async function splitMeasureTask(input: z.infer<typeof splitMeasureTaskSchema>) {
    const { splitMeasureTaskSchema: schema } = await import('../schemas');
    const { measureTaskSplits } = await import('@/shared/api/schema');
    const { auth } = await import('@/shared/lib/auth');

    try {
        const data = schema.parse(input);
        const session = await auth();

        if (!session?.user?.tenantId) {
            return { success: false, error: '未授权' };
        }

        const tenantId = session.user.tenantId;
        const userId = session.user.id;

        return await db.transaction(async (tx) => {
            // 1. 获取原任务信息（🔒 强制租户隔离）
            const originalTask = await tx.query.measureTasks.findFirst({
                where: and(
                    eq(measureTasks.id, data.originalTaskId),
                    eq(measureTasks.tenantId, tenantId) // 🔒 租户校验
                ),
            });

            if (!originalTask) {
                throw new Error('任务不存在或无权访问');
            }

            if (originalTask.status === 'COMPLETED' || originalTask.status === 'CANCELLED') {
                throw new Error('已完成或已取消的任务无法拆分');
            }

            // 2. 取消原任务
            await tx.update(measureTasks)
                .set({
                    status: 'CANCELLED',
                    remark: `[拆单] ${data.reason || '按品类拆分'} (拆分为 ${data.splits.length} 个子任务)`,
                })
                .where(eq(measureTasks.id, data.originalTaskId));

            // 3. 按品类创建新任务
            const newTaskIds: string[] = [];

            for (let i = 0; i < data.splits.length; i++) {
                const split = data.splits[i];
                const measureNo = await generateMeasureNo();

                const [newTask] = await tx.insert(measureTasks).values({
                    tenantId,
                    measureNo,
                    leadId: originalTask.leadId,
                    customerId: originalTask.customerId,
                    scheduledAt: originalTask.scheduledAt,
                    remark: `[拆单自 ${originalTask.measureNo}] 品类: ${split.category}`,
                    isFeeExempt: originalTask.isFeeExempt,
                    type: originalTask.type,
                    status: split.workerId ? 'DISPATCHING' : 'PENDING',
                    assignedWorkerId: split.workerId,
                    parentId: data.originalTaskId, // 关联原任务
                }).returning();

                newTaskIds.push(newTask.id);

                // 4. 记录拆单关系
                await tx.insert(measureTaskSplits).values({
                    tenantId,
                    originalTaskId: data.originalTaskId,
                    newTaskId: newTask.id,
                    reason: `品类: ${split.category}`,
                    createdBy: userId,
                });
            }

            return {
                success: true,
                data: {
                    originalTaskId: data.originalTaskId,
                    newTaskIds,
                    splitCount: data.splits.length,
                },
            };
        }).then((result) => {
            revalidatePath('/service/measurement');
            return result;
        });
    } catch (error: unknown) {
        console.error('拆单失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '拆单失败'
        };
    }
}

// 导入 schema 类型用于函数签名
import { splitMeasureTaskSchema } from '../schemas';

