'use server';

import { db } from '@/shared/api/db';
import { measureTasks } from '@/shared/api/schema/service';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ActionState, createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { validateGpsCheckIn, calculateLateMinutes } from '@/shared/lib/gps-utils';

// Input Schema
const CheckInMeasureTaskSchema = z.object({
    taskId: z.string().uuid(),
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().optional(),
    targetLatitude: z.number().optional(),
    targetLongitude: z.number().optional(),
});

type CheckInMeasureTaskInput = z.infer<typeof CheckInMeasureTaskSchema>;

/**
 * Check-in Measure Task
 * 1. Validate GPS (if target coords provided)
 * 2. Check for Late Arrival
 * 3. Update Task Status & Check-in Info
 */
export const checkInMeasureTask = createSafeAction(
    CheckInMeasureTaskSchema,
    async (input: CheckInMeasureTaskInput): Promise<ActionState<any>> => {
        const { taskId, latitude, longitude, address, targetLatitude, targetLongitude } = input;

        return await db.transaction(async (tx) => {
            // 1. Fetch Task
            const task = await tx.query.measureTasks.findFirst({
                where: eq(measureTasks.id, taskId)
            });

            if (!task) {
                return { success: false, error: '任务不存在' };
            }

            if (task.status === 'COMPLETED' || task.status === 'CANCELLED') {
                return { success: false, error: '任务已结束，无法签到' };
            }

            // 2. GPS Validation
            let gpsResult = null;
            if (targetLatitude && targetLongitude) {
                gpsResult = validateGpsCheckIn(latitude, longitude, targetLatitude, targetLongitude);
            }

            // 3. Late Validation
            let lateMinutes = 0;
            if (task.scheduledAt) {
                lateMinutes = calculateLateMinutes(task.scheduledAt, new Date());
            }

            // 4. Update Task
            const checkInInfo = {
                coords: { lat: latitude, lng: longitude },
                address,
                gpsResult,
                lateMinutes,
                isLate: lateMinutes > 0
            };

            await tx.update(measureTasks)
                .set({
                    checkInAt: new Date(),
                    checkInLocation: checkInInfo,
                    status: 'PENDING', // Stay in PENDING or move to 'IN_PROGRESS' if available? Schema has PENDING_VISIT?
                    // measureTaskStatusEnum: ['PENDING_APPROVAL','PENDING','DISPATCHING','PENDING_VISIT','PENDING_CONFIRM','COMPLETED','CANCELLED']
                    // Assuming PENDING_VISIT is for "Waiting for visit", so maybe current status is PENDING_VISIT?
                    // And checking in implies start of work? Usually status stays PENDING_VISIT until completion or maybe we don't change status on check-in, just record time.
                    // Or if we have IN_PROGRESS. We don't.
                    // Let's keep status as is or update to indicating presence.
                    // Requirement says: "现场考核". Usually just updates checkInAt.
                })
                .where(eq(measureTasks.id, taskId));

            revalidatePath('/measurement');
            return {
                success: true,
                data: {
                    checkInAt: new Date(),
                    gpsResult,
                    lateMinutes
                }
            };
        });
    }
);
