'use server';

import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema/service';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ActionState, createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';

// Input Schema
const RejectMeasureTaskSchema = z.object({
    taskId: z.string().uuid(),
    reason: z.string().min(1, '驳回原因不能为空'),
});

type RejectMeasureTaskInput = z.infer<typeof RejectMeasureTaskSchema>;

/**
 * Reject Measure Task
 * 1. Validate Status (Must be PENDING_CONFIRM, PENDING_VISIT, or COMPLETED? Usually PENDING_CONFIRM)
 * 2. Reset Status to PENDING (for re-dispatch/re-measure) or PENDING_VISIT?
 *    - Requirement: "驳回". Usually implies re-doing. So maybe Status -> PENDING (Draft/New).
 *    - Let's assume it goes back to 'PENDING' for re-dispatch or just re-execution.
 * 3. Increment Reject Count
 * 4. Check for Warning Threshold
 */
export const rejectMeasureTask = createSafeAction(
    RejectMeasureTaskSchema,
    async (input: RejectMeasureTaskInput): Promise<ActionState<any>> => {
        const { taskId, reason } = input;

        return await db.transaction(async (tx) => {
            // 1. Fetch Task
            const task = await tx.query.measureTasks.findFirst({
                where: eq(measureTasks.id, taskId)
            });

            if (!task) {
                return { success: false, error: '任务不存在' };
            }

            // Allow rejecting if it's not already cancelled
            if (task.status === 'CANCELLED') {
                return { success: false, error: '任务已取消，无法驳回' };
            }

            // 2. Update Task
            const newRejectCount = task.rejectCount + 1;

            await tx.update(measureTasks)
                .set({
                    status: 'PENDING', // Reset to Pending for re-processing
                    rejectCount: newRejectCount,
                    rejectReason: reason,
                    // Maybe clear assignedWorker? Depends on policy. Keeping it for now.
                })
                .where(eq(measureTasks.id, taskId));

            // 3. Warning Logic
            let warningMessage = null;
            if (newRejectCount >= 3) {
                // Placeholder for notification service
                console.warn(`[MeasureTask Warning] Task ${task.measureNo} has been rejected ${newRejectCount} times. Notify Store Manager.`);
                warningMessage = '任务累计驳回超过3次，已通知店长介入。';
            }

            revalidatePath('/measurement');
            return {
                success: true,
                data: {
                    taskId,
                    rejectCount: newRejectCount,
                    status: 'PENDING'
                },
                message: warningMessage || '任务已驳回'
            };
        });
    }
);
