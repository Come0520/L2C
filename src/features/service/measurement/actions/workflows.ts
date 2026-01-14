'use server';

import { db } from '@/shared/api/db';
import { measureTasks, measureSheets, measureItems } from '@/shared/api/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { measureSheetSchema, reviewMeasureTaskSchema } from '../schemas';

/**
 * 提交测量数据 (创建新的 Measure Sheet 和 Items)
 */
export async function submitMeasureData(input: z.infer<typeof measureSheetSchema>, tenantId: string) {
    const data = measureSheetSchema.parse(input);

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
 */
export async function reviewMeasureTask(input: z.infer<typeof reviewMeasureTaskSchema>) {
    const { id, action, reason } = reviewMeasureTaskSchema.parse(input);

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
            const [task] = await tx.select().from(measureTasks).where(eq(measureTasks.id, id));

            await tx.update(measureTasks)
                .set({
                    status: 'PENDING_VISIT', // 驳回至待上门
                    rejectCount: sql`${measureTasks.rejectCount} + 1`,
                    rejectReason: reason,
                })
                .where(eq(measureTasks.id, id));

            // 将关联的最新 Measure Sheet 标记为 DRAFT 或处理
            // 这里简单处理为保持状态，由师傅重新提交
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
export async function createNewMeasureVersion(taskId: string, type: 'ROUND' | 'VARIANT', tenantId: string) {
    const task = await db.query.measureTasks.findFirst({
        where: eq(measureTasks.id, taskId),
    });

    if (!task) throw new Error('Task not found');

    let newRound = task.round;
    if (type === 'ROUND') {
        newRound += 1;
        await db.update(measureTasks).set({ round: newRound }).where(eq(measureTasks.id, taskId));
    }

    // 默认新方案为 A/B/C 递增逻辑（此处简化）
    const newVariant = type === 'VARIANT' ? 'B' : 'A';

    revalidatePath(`/service/measurement/${taskId}`);
    return { success: true, round: newRound, variant: newVariant };
}

