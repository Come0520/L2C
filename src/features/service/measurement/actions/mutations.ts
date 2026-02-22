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
 * 指派测量师执行任务
 * 
 * 将任务由 PENDING 状态转为 DISPATCHING 状态，并记录预约时间。
 * 
 * @param {Object} input - 派单输入参数
 * @param {string} input.id - 测量任务 UUID
 * @param {string} input.workerId - 测量师用户 UUID
 * @param {string | Date} input.scheduledAt - 预约上门时间
 * @returns {Promise<{success: boolean}>} 操作成功返回 success: true
 */
export async function dispatchMeasureTask(input: unknown) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    const inputId = (typeof input === 'object' && input !== null && 'id' in input) ? (input as Record<string, unknown>).id : 'unknown';
    logger.info(`[MeasureDispatch] 开始指派测量任务: ${inputId}`, { input });

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
 * 测量师确认接单
 * 
 * 系统验证执行人身份后，将任务状态由 DISPATCHING (待接单) 切换为 PENDING_VISIT (待上门)。
 * 
 * @param {string} id - 测量任务 UUID
 * @returns {Promise<{success: boolean}>}
 * @throws {Error} 若任务不存在、权限不足或状态不正确时抛出异常
 */
export async function acceptMeasureTask(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('未授权');

    logger.info(`[MeasureAccept] 师傅接单尝试: 任务ID ${id}, 师傅ID ${session.user.id}`);

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
 * 测量任务拆分逻辑 (例如不同品类由不同师傅测量)
 * 
 * 此操作采用【逻辑删除/取消】模式：
 * 1. 验证原任务状态 (已完成任务不可拆分)
 * 2. 将原任务状态标记为 CANCELLED (取消)，并注明拆分原因
 * 3. 循环创建多个相互关联的新任务，继承原任务的核心属性 (leadId, customerId)
 * 4. 建立父子任务关联索引以便追溯
 * 5. 全程在数据库事务中执行，确保原子性
 * 
 * @param {unknown} input - 包含 originalTaskId, splits 列表及 reason 的数据结构
 * @returns {Promise<{success: boolean, error?: string}>}
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

    logger.info(`[MeasureSplit] 开始拆分测量任务: 原ID ${originalTaskId}, 拆分数量: ${splits.length}`, { reason });

    // 提升到 transaction 外部，避免 ReferenceError
    let createdCount = 0;
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
                    createdBy: session.user.id,
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

            // 将创建数量同步到外部变量
            createdCount = createdTaskIds.length;

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
        logger.info(`[MeasureSplit] 任务拆分成功: 原ID ${originalTaskId}, 新任务数: ${createdCount}`);
        return { success: true };
    } catch (error) {
        logger.error('[MeasureSplit] 任务拆分失败:', error);
        return { success: false, error: error instanceof Error ? error.message : '拆单失败' };
    }
}

// ----------------------------------------------------------------------
// Fee Waiver (费用豁免)
// ----------------------------------------------------------------------

import { feeWaiverSchema } from '../schemas';
import { logger } from '@/shared/lib/logger';

/**
 * 申请费用豁免
 * 
 * 处理特殊场景下（如 VIP 客户、后期补量等）在未收到测量定金时先行派单的需求。
 * 更新后，系统将允许该任务跳过费用校验流程。
 * 
 * @param {unknown} input - 包含 taskId 和 申请理由 reason 的数据结构
 * @returns {Promise<{success: boolean}>}
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
