'use server';

import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';
import { randomBytes } from 'crypto';
import {
    createMeasureTaskSchema,
    dispatchMeasureTaskSchema,
    checkInSchema
} from '../schemas';

// 生成测量单号: MS + YYYYMMDD + 6位随机十六进制
async function generateMeasureNo() {
    const prefix = `MS${format(new Date(), 'yyyyMMdd')}`;
    const random = randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}${random}`;
}

/**
 * 创建测量任务
 */
export async function createMeasureTask(input: z.infer<typeof createMeasureTaskSchema>, userId: string, tenantId: string) {
    const data = createMeasureTaskSchema.parse(input);
    const measureNo = await generateMeasureNo();

    const [newTask] = await db.insert(measureTasks).values({
        tenantId,
        measureNo,
        leadId: data.leadId,
        customerId: data.customerId,
        scheduledAt: new Date(data.scheduledAt),
        remark: data.remark,
        status: 'PENDING',
    }).returning();

    revalidatePath('/service/measurement');
    return { success: true, data: newTask };
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

    const [updated] = await db.update(measureTasks)
        .set({
            checkInAt: new Date(),
            checkInLocation: location,
        })
        .where(eq(measureTasks.id, id))
        .returning();

    revalidatePath('/service/measurement');
    revalidatePath(`/service/measurement/${id}`);
    return { success: true, data: updated };
}

/**
 * 提交测量数据 (Stub)
 */
export async function submitMeasureData(input: any) {
    return { success: true, data: {} };
}
