'use server';

import { db } from '@/shared/api/db';
import { measureTasks, measureTaskSplits } from '@/shared/api/schema';
import { eq, and, sql } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@/shared/lib/auth';
import { splitMeasureTaskSchema } from '../schemas';
import { generateMeasureNo } from '../utils'; // 修复无效 import
import { MeasurementService } from '@/services/measurement.service';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions'; // Fix: Import PERMISSIONS
import { z } from 'zod';
import { AuditService } from '@/shared/lib/audit-service';

// ----------------------------------------------------------------------
// Dispatch & Assign
// ----------------------------------------------------------------------

/**
 * 指派测量师并将任务状态改为 DISPATCHING
 * @param input - { id: string, workerId: string, scheduledAt: string | Date }
 */
export async function dispatchMeasureTask(input: unknown) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    // 权限校验
    await checkPermission(session, PERMISSIONS.MEASURE.DISPATCH);

    // 输入校验
    const schema = z.object({
        id: z.string().uuid(),
        workerId: z.string().uuid(),
        scheduledAt: z.string().datetime().or(z.date()),
    });

    const parsed = schema.safeParse(input);
    if (!parsed.success) {
        throw new Error('无效的参数: ' + parsed.error.message);
    }

    const { id, workerId, scheduledAt } = parsed.data;

    // Use Service Layer for core logic
    await MeasurementService.dispatchTask(
        id,
        workerId,
        new Date(scheduledAt),
        session.user.id,
        session.user.tenantId
    );

    await AuditService.recordFromSession(
        session,
        'measure_tasks',
        id,
        'UPDATE',
        {
            changed: {
                status: 'DISPATCHED',
                workerId: workerId,
                scheduledAt: scheduledAt,
            }
        }
    );

    revalidateTag('measure-task', 'default');
    revalidatePath('/service/measurement');
    return { success: true };
}

/**
 * 测量师确认接单，状态由 DISPATCHING 改为 PENDING_VISIT
 * @param id - 测量任务 ID
 */
export async function acceptMeasureTask(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    const task = await db.query.measureTasks.findFirst({
        where: and(
            eq(measureTasks.id, id),
            eq(measureTasks.tenantId, session.user.tenantId)
        ),
    });

    if (!task) throw new Error('Task not found');
    if (task.assignedWorkerId !== session.user.id) throw new Error('Unauthorized access');
    if (task.status !== 'DISPATCHING') throw new Error('任务状态不正确，无法接单');

    await db.update(measureTasks)
        .set({
            status: 'PENDING_VISIT',
            updatedAt: new Date(),
        })
        .where(and(
            eq(measureTasks.id, id),
            eq(measureTasks.tenantId, session.user.tenantId)
        ));

    revalidateTag('measure-task', 'default');
    revalidatePath('/service/measurement');
    return { success: true };
}

// ----------------------------------------------------------------------
// Split Task (拆单)
// ----------------------------------------------------------------------

// ... (existing imports)

// Fix: splitMeasureTask Logic
/**
 * 测量任务拆分逻辑 (例如不同品类由不同师父测量)
 * 会将原任务取消，并创建多个关联的新任务
 * @param input - splitMeasureTaskSchema 校验的数据
 */
export async function splitMeasureTask(input: unknown) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.tenantId) {
        return { success: false, error: 'Unauthorized' };
    }

    const { success, data, error } = splitMeasureTaskSchema.safeParse(input);
    if (!success) {
        return { success: false, error: error.message };
    }

    const { originalTaskId, splits, reason } = data; // use 'splits' from schema

    try {
        await db.transaction(async (tx) => {
            // 1. 验证原任务
            const originalTask = await tx.query.measureTasks.findFirst({
                where: and(
                    eq(measureTasks.id, originalTaskId),
                    eq(measureTasks.tenantId, session.user.tenantId)
                ),
            });

            if (!originalTask) throw new Error('原任务不存在');
            if (originalTask.status === 'COMPLETED') throw new Error('已完成任务不可拆分');

            // 2. 取消原任务
            await tx.update(measureTasks)
                .set({
                    status: 'CANCELLED',
                    cancelReason: `拆分重派: ${reason}`,
                    updatedAt: new Date(),
                })
                .where(and(
                    eq(measureTasks.id, originalTaskId),
                    eq(measureTasks.tenantId, session.user.tenantId)
                ));

            // 3. 创建新任务
            const createdTaskIds: string[] = [];

            for (const splitItem of splits) {
                // 生成新单号 (M + 日期 + 序号)
                const measureNo = await generateMeasureNo(session.user.tenantId);

                // 将 category 和 remark 组合到 remark 中，或者仅 remark
                const fullRemark = splitItem.remark
                    ? `[${splitItem.category}] ${splitItem.remark}`
                    : `[${splitItem.category}] 拆分任务`;

                const [inserted] = await tx.insert(measureTasks).values({
                    tenantId: session.user.tenantId,
                    measureNo: measureNo,
                    leadId: originalTask.leadId,
                    customerId: originalTask.customerId,
                    status: 'PENDING',
                    laborFee: splitItem.laborFee ? String(splitItem.laborFee) : null,
                    remark: fullRemark,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }).returning({ id: measureTasks.id });

                createdTaskIds.push(inserted.id);

                // 4. 记录拆分关系
                await tx.insert(measureTaskSplits).values({
                    tenantId: session.user.tenantId,
                    originalTaskId: originalTaskId,
                    newTaskId: inserted.id,
                    reason: reason,
                    createdBy: session.user.id, // Fix: operatorId -> createdBy
                    createdAt: new Date(),
                });

                // 审计：创建新任务
                await AuditService.recordFromSession(
                    session,
                    'measure_tasks',
                    inserted.id,
                    'CREATE',
                    {
                        new: {
                            measureNo,
                            leadId: originalTask.leadId,
                            customerId: originalTask.customerId,
                            status: 'PENDING',
                            remark: fullRemark,
                        }
                    },
                    tx
                );
            }

            // 审计：取消原任务
            await AuditService.recordFromSession(
                session,
                'measure_tasks',
                originalTaskId,
                'UPDATE',
                {
                    changed: {
                        status: 'CANCELLED',
                        cancelReason: `拆分重派: ${reason}`,
                    }
                },
                tx
            );
        });

        revalidateTag('measure-task', 'default');
        revalidatePath('/service/measurement');
        return { success: true };
    } catch (error) {
        console.error('Split task failed:', error);
        return { success: false, error: error instanceof Error ? error.message : '拆单失败' };
    }
}

// ----------------------------------------------------------------------
// Fee Waiver (费用豁免)
// ----------------------------------------------------------------------

import { feeWaiverSchema } from '../schemas';

/**
 * 申请费用豁免，允许在未支付定金的情况下进行派单
 * @param input - { taskId: string, reason: string }
 */
export async function requestFeeWaiver(input: unknown) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    const parsed = feeWaiverSchema.safeParse(input);
    if (!parsed.success) {
        throw new Error('无效参数: ' + parsed.error.message);
    }

    const { taskId, reason } = parsed.data;

    // 权限校验：通常需要经理或以上权限
    await checkPermission(session, PERMISSIONS.MEASURE.MANAGE);

    await db.update(measureTasks)
        .set({
            isFeeExempt: true,
            remark: sql`${measureTasks.remark} || '\n[费用豁免申请] ' || ${reason}`,
            updatedAt: new Date(),
        })
        .where(and(
            eq(measureTasks.id, taskId),
            eq(measureTasks.tenantId, session.user.tenantId)
        ));

    await AuditService.recordFromSession(
        session,
        'measure_tasks',
        taskId,
        'UPDATE',
        {
            changed: {
                isFeeExempt: true,
                feeWaiverReason: reason,
            }
        }
    );

    revalidateTag('measure-task', 'default');
    revalidatePath('/service/measurement');
    return { success: true };
}
