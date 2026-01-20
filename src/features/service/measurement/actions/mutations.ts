'use server';

import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';
import { randomBytes } from 'crypto';
import {
    createMeasureTaskSchema,
    dispatchMeasureTaskSchema,
    checkInSchema
} from '../schemas';
import { submitApproval } from '@/features/approval/actions/submission';

// 生成测量单号: MS + YYYYMMDD + 6位随机十六进制
async function generateMeasureNo() {
    const prefix = `MS${format(new Date(), 'yyyyMMdd')}`;
    const random = randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}${random}`;
}

/**
 * 创建测量任务
 * 
 * 费用准入校验流程：
 * 1. 检查测量费用准入（是否申请免费）
 * 2. 如果申请免费且非销售自测，需要审批
 * 3. 否则允许创建，测量费现场收取
 */
export async function createMeasureTask(input: z.infer<typeof createMeasureTaskSchema>, userId: string, tenantId: string) {
    const data = createMeasureTaskSchema.parse(input);

    // 费用准入校验
    const { checkMeasureFeeAdmission } = await import('../logic/fee-admission');
    const admission = await checkMeasureFeeAdmission(data.leadId, tenantId, data.isFeeExempt);

    const measureNo = await generateMeasureNo();

    // 判断是否需要审批: 免费测量且非销售自测需要店长审批
    const needsApproval = data.isFeeExempt && data.type !== 'SALES_SELF';
    const status = needsApproval ? 'PENDING_APPROVAL' : 'PENDING';

    return await db.transaction(async (tx) => {
        const [newTask] = await tx.insert(measureTasks).values({
            tenantId,
            measureNo,
            leadId: data.leadId,
            customerId: data.customerId,
            scheduledAt: new Date(data.scheduledAt),
            remark: data.remark ? `${data.remark}\n\n[费用准入] ${admission.message}` : `[费用准入] ${admission.message}`,
            isFeeExempt: data.isFeeExempt,
            type: data.type,
            status,
        }).returning();

        if (needsApproval) {
            // 提交审批流
            const approvalResult = await submitApproval({
                entityType: 'MEASURE_TASK',
                entityId: newTask.id,
                flowCode: 'FREE_MEASURE_APPROVAL',
                comment: `申请免费测量: ${measureNo}`,
            }, tx);

            if (!approvalResult.success) {
                // Determine error message safely
                const errorMessage = 'error' in approvalResult ? approvalResult.error : 'Approval submission failed';
                throw new Error(`Failed to submit approval: ${errorMessage}`);
            }

            // 更新任务关联的 feeApprovalId
            // approvalResult is union, if success is true, approvalId exists
            if ('approvalId' in approvalResult) {
                await tx.update(measureTasks)
                    .set({ feeApprovalId: approvalResult.approvalId })
                    .where(eq(measureTasks.id, newTask.id));
            }
        }

        return newTask;
    }).then((newTask) => {
        revalidatePath('/service/measurement');
        return {
            success: true,
            data: newTask,
            admission, // 返回费用准入信息
        };
    }).catch((error) => {
        console.error('Error creating measure task:', error);
        return { success: false, error: error.message };
    });
}

/**
 * 指派测量任务
 */
export async function dispatchMeasureTask(input: z.infer<typeof dispatchMeasureTaskSchema>) {
    const { id, assignedWorkerId, scheduledAt } = dispatchMeasureTaskSchema.parse(input);

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
            // 1. 获取原任务信息
            const originalTask = await tx.query.measureTasks.findFirst({
                where: eq(measureTasks.id, data.originalTaskId),
            });

            if (!originalTask) {
                throw new Error('原任务不存在');
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

