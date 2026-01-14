import { db } from "@/shared/api/db";
import { productionTasks } from "@/shared/api/schema/supply-chain";
import { eq, and } from "drizzle-orm";
import { orderItems } from "@/shared/api/schema/orders";

export class ProductionService {

    /**
     * Dispatch Task to Workshop
     */
    static async dispatchTask(orderId: string, orderItemId: string | null, workshop: string, tenantId: string) {
        return await db.transaction(async (tx) => {
            // Find existing task? 
            // For now, always create new task

            const taskNo = `PRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

            const [task] = await tx.insert(productionTasks).values({
                tenantId,
                taskNo,
                orderId,
                orderItemId,
                workshop,
                status: 'PENDING'
            }).returning();

            // If linked to item, update item status?
            if (orderItemId) {
                await tx.update(orderItems)
                    .set({ status: 'IN_PRODUCTION' })
                    .where(and(eq(orderItems.id, orderItemId), eq(orderItems.tenantId, tenantId)));
            }

            return task;
        });
    }

    /**
     * Complete Task
     */
    static async completeTask(taskId: string, tenantId: string) {
        return await db.transaction(async (tx) => {
            const [task] = await tx.update(productionTasks)
                .set({ status: 'COMPLETED', updatedAt: new Date() })
                .where(and(eq(productionTasks.id, taskId), eq(productionTasks.tenantId, tenantId)))
                .returning();

            return task;
        });
    }
}
