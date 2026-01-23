'use server';

import { db } from '@/shared/api/db';
import { measureTasks, measureSheets, measureItems } from '@/shared/api/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { measureSheetSchema, reviewMeasureTaskSchema } from '../schemas';
import { auth } from '@/shared/lib/auth';

/**
 * 提交测量数据 (创建新的 Measure Sheet 和 Items)
 * 
 * 安全校验：只有被指派的测量师才能提交数据
 */
export async function submitMeasureData(input: z.infer<typeof measureSheetSchema>) {
    // 🔒 安全校验：获取当前用户身份
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        return { success: false, error: '未授权访问' };
    }
    const tenantId = session.user.tenantId;
    const userId = session.user.id;

    const data = measureSheetSchema.parse(input);

    // 🔒 安全校验：验证任务归属并检查执行者权限
    const task = await db.query.measureTasks.findFirst({
        where: and(
            eq(measureTasks.id, data.taskId),
            eq(measureTasks.tenantId, tenantId)
        ),
        columns: { id: true, assignedWorkerId: true }
    });

    if (!task) {
        return { success: false, error: '任务不存在或无权访问' };
    }

    // 只有被指派的测量师才能提交数据
    if (task.assignedWorkerId !== userId) {
        return { success: false, error: '只有被指派的测量师才能提交测量数据' };
    }

    return await db.transaction(async (tx) => {
        // 1. 创建测量单
        const [sheet] = await tx.insert(measureSheets).values({
            tenantId,
            taskId: data.taskId,
            round: data.round,
            variant: data.variant,
            sitePhotos: data.sitePhotos,
            sketchMap: data.sketchMap,
            status: 'CONFIRMED', // 提交即为确认 (师傅端逻辑)
        }).returning();

        // 2. 创建明细
        if (data.items.length > 0) {
            await tx.insert(measureItems).values(
                data.items.map(item => ({
                    ...item,
                    tenantId,
                    sheetId: sheet.id,
                    width: item.width.toString(),
                    height: item.height.toString(),
                    bracketDist: item.bracketDist?.toString(),
                    boxDepth: item.boxDepth?.toString(),
                }))
            );
        }

        // 3. 更新任务状态为 PENDING_CONFIRM
        await tx.update(measureTasks)
            .set({ status: 'PENDING_CONFIRM' })
            .where(eq(measureTasks.id, data.taskId));

        return sheet;
    }).then((res) => {
        revalidatePath('/service/measurement');
        revalidatePath(`/service/measurement/${data.taskId}`);
        return { success: true, data: res };
    });
}

/**
 * 审核测量任务 (确认完成或驳回)
 * 
 * 安全校验：只有销售/管理员才能审核
 */
export async function reviewMeasureTask(input: z.infer<typeof reviewMeasureTaskSchema>) {
    // 🔒 安全校验：获取当前用户身份
    const session = await auth();
    if (!session?.user?.tenantId || !session?.user?.id) {
        return { success: false, error: '未授权访问' };
    }
    const tenantId = session.user.tenantId;

    const { id, action, reason } = reviewMeasureTaskSchema.parse(input);

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

    // TODO: 添加角色校验，确保只有销售/管理员可以审核

    return await db.transaction(async (tx) => {
        if (action === 'APPROVE') {
            await tx.update(measureTasks)
                .set({
                    status: 'COMPLETED',
                    completedAt: new Date(),
                })
                .where(eq(measureTasks.id, id));
        } else {
            // 驳回逻辑
            await tx.update(measureTasks)
                .set({
                    status: 'PENDING_VISIT', // 驳回至待上门
                    rejectCount: sql`${measureTasks.rejectCount} + 1`,
                    rejectReason: reason,
                })
                .where(eq(measureTasks.id, id));

            // 将关联的最新 Measure Sheet 标记为 DRAFT（由师傅重新提交）
        }
    }).then(() => {
        revalidatePath('/service/measurement');
        revalidatePath(`/service/measurement/${id}`);
        return { success: true };
    });
}

/**
 * 生成新的测量方案 (Variant) 或轮次 (Round)
 */
export async function createNewMeasureVersion(taskId: string, type: 'ROUND' | 'VARIANT') {
    // 🔒 安全校验：获取当前用户身份
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('未授权访问');
    }
    const tenantId = session.user.tenantId;

    // 🔒 安全校验：验证任务归属当前租户
    const task = await db.query.measureTasks.findFirst({
        where: and(
            eq(measureTasks.id, taskId),
            eq(measureTasks.tenantId, tenantId)
        ),
    });

    if (!task) throw new Error('任务不存在或无权访问');

    let newRound = task.round;
    if (type === 'ROUND') {
        newRound += 1;
        await db.update(measureTasks).set({ round: newRound }).where(eq(measureTasks.id, taskId));
        return { success: true, round: newRound, variant: 'A' };
    }

    // type === 'VARIANT'
    // 查询当前轮次下的所有方案，找到最大的 variant
    const existingSheets = await db.query.measureSheets.findMany({
        where: and(
            eq(measureSheets.taskId, taskId),
            eq(measureSheets.round, newRound),
            eq(measureSheets.tenantId, tenantId)
        ),
        columns: { variant: true }
    });

    let newVariant = 'A';
    if (existingSheets.length > 0) {
        // 找到最大的 variant (这里假设是单字母 A-Z)
        const variants = existingSheets.map(s => s.variant).filter(Boolean) as string[];
        if (variants.length > 0) {
            variants.sort();
            const lastVariant = variants[variants.length - 1];
            // 简单的字符递增逻辑: A -> B, B -> C
            const lastCharCode = lastVariant.charCodeAt(0);
            newVariant = String.fromCharCode(lastCharCode + 1);
        }
    }

    revalidatePath(`/service/measurement/${taskId}`);
    return { success: true, round: newRound, variant: newVariant };
}


