import { db } from "@/shared/api/db";
import { measureTasks } from "@/shared/api/schema";
import { eq, and } from "drizzle-orm";
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

        // 使用真实费用检查逻辑 (RC-05)
        const { checkMeasureFeeAdmission } = await import('@/features/service/measurement/logic/fee-admission');
        const admission = await checkMeasureFeeAdmission(_leadId, _tenantId, false);

        return {
            status: admission.canProceed ? 'PAID' : 'PENDING',
            isPaid: admission.canProceed,
            message: admission.message || '需支付测量费或申请豁免'
        };
    }

    /**
     * Dispatch a measurement task to a worker.
     */
    static async dispatchTask(taskId: string, workerId: string, scheduledAt: Date, _userId: string, tenantId: string) {
        return await db.transaction(async (tx) => {
            const task = await tx.query.measureTasks.findFirst({
                where: and(
                    eq(measureTasks.id, taskId),
                    eq(measureTasks.tenantId, tenantId)
                )
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
                    status: 'DISPATCHING', // Use correct enum value (DISPATCHING / PENDING_VISIT based on business logic)
                    // Usually dispatching puts it in DISPATCHING or PENDING_VISIT.
                    // Let's assume DISPATCHING based on existing logic, or PENDING_VISIT if auto-confirmed.
                    // The enum has DISPATCHING.
                    scheduledAt: scheduledAt,
                    updatedAt: new Date()
                })
                .where(eq(measureTasks.id, taskId));

            // Notify Worker (Mock)
            // NotificationService.send(...)
        });
    }
}
