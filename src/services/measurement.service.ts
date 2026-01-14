import { db } from "@/shared/api/db";
import { measureTasks, users } from "@/shared/api/schema";
import { eq, and } from "drizzle-orm";

export class MeasurementService {

    /**
     * Check if a fee is required before dispatching.
     * Returns status and simple reason.
     */
    static async checkFeeStatus(leadId: string, tenantId: string) {
        // Mock logic: Always require fee unless exempt
        // In real app, query Orders linked to Lead with type 'MEASURE_FEE'
        return {
            status: 'PENDING',
            isPaid: false,
            message: 'Need to pay measurement fee or request waiver.'
        };
    }

    /**
     * Dispatch a measurement task to a worker.
     */
    static async dispatchTask(taskId: string, workerId: string, userId: string, tenantId: string) {
        return await db.transaction(async (tx) => {
            const task = await tx.query.measureTasks.findFirst({
                where: eq(measureTasks.id, taskId)
            });

            if (!task) throw new Error("Task not found");

            // Gatekeeping: Check Fee
            if (!task.isFeeExempt && task.feeCheckStatus !== 'PAID' && task.feeCheckStatus !== 'WAIVED' && task.feeCheckStatus !== 'NONE') {
                // Allows dispatching if status is explicitly handled. 
                // If strictly requiring Payment:
                // throw new Error("Measurement Fee not settled.");
                // For now, warn or allow.
                console.warn("Dispatching task with unpaid fee: " + task.feeCheckStatus);
            }

            await tx.update(measureTasks)
                .set({
                    assignedWorkerId: workerId,
                    status: 'DISPATCHED', // Map to enum 'DISPATCHING'
                    updatedAt: new Date()
                })
                .where(eq(measureTasks.id, taskId));

            // Notify Worker (Mock)
            // NotificationService.send(...)
        });
    }
}
