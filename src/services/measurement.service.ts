import { db } from "@/shared/api/db";
import { measureTasks } from "@/shared/api/schema";
import { eq } from "drizzle-orm";
import { getSetting } from "@/features/settings/actions/system-settings-actions";

export class MeasurementService {

    /**
     * Check if a fee is required before dispatching.
     * Returns status and simple reason.
     */
    static async checkFeeStatus(_leadId: string, _tenantId: string) {
        // 读取设置
        const isCheckEnabled = await getSetting('ENABLE_MEASURE_FEE_CHECK') as boolean;

        if (!isCheckEnabled) {
            return {
                status: 'NONE',
                isPaid: true,
                message: '不需要测量费校验'
            };
        }

        // Mock logic: Always require fee unless exempt
        return {
            status: 'PENDING',
            isPaid: false,
            message: 'Need to pay measurement fee or request waiver.'
        };
    }

    /**
     * Dispatch a measurement task to a worker.
     */
    static async dispatchTask(taskId: string, workerId: string, _userId: string, _tenantId: string) {
        return await db.transaction(async (tx) => {
            const task = await tx.query.measureTasks.findFirst({
                where: eq(measureTasks.id, taskId)
            });

            if (!task) throw new Error("Task not found");

            // Gatekeeping: Check Fee
            const isCheckEnabled = await getSetting('ENABLE_MEASURE_FEE_CHECK') as boolean;

            if (isCheckEnabled && !task.isFeeExempt && task.feeCheckStatus !== 'PAID' && task.feeCheckStatus !== 'WAIVED' && task.feeCheckStatus !== 'NONE') {
                throw new Error("测量费未结算，无法派工。请先确认付款或申请豁免。");
            }

            await tx.update(measureTasks)
                .set({
                    assignedWorkerId: workerId,
                    status: 'DISPATCHING', // Use correct enum value
                    updatedAt: new Date()
                })
                .where(eq(measureTasks.id, taskId));

            // Notify Worker (Mock)
            // NotificationService.send(...)
        });
    }
}
