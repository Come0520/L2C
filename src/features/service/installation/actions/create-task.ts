'use server';

import { db } from '@/shared/api/db';
import { installTasks, installItems } from '@/shared/api/schema/service';
import { orders } from '@/shared/api/schema/orders';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ActionState, createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
// installTaskStatusEnum, installTaskCategoryEnum 导入已移除（未使用）

// Input Schema
const GenerateInstallTasksSchema = z.object({
    orderId: z.string().uuid(),
    tenantId: z.string().uuid(),
    userId: z.string().uuid().optional(),
});

type GenerateInstallTasksInput = z.infer<typeof GenerateInstallTasksSchema>;

/**
 * Generate Install Tasks from Order (Split by Category)
 */
export const generateInstallTasksFromOrder = createSafeAction(
    GenerateInstallTasksSchema,
    async (input: GenerateInstallTasksInput): Promise<ActionState<any>> => {
        const { orderId, tenantId, userId: _userId } = input;

        return await db.transaction(async (tx) => {
            // 1. Fetch Order & Order Items
            const order = await tx.query.orders.findFirst({
                where: eq(orders.id, orderId),
                with: {
                    items: true
                }
            });

            if (!order) {
                return { success: false, error: 'Order not found' };
            }

            if (order.status !== 'PENDING_INSTALL' && order.status !== 'IN_PRODUCTION' && order.status !== 'PENDING_DELIVERY') {
                // Allow generating tasks in earlier stages if needed, but typically PENDING_INSTALL.
                // For now, let's leniently allow it but log a warning or check strictness based on rules.
                // Strict: PENDING_INSTALL.
            }

            // Check if tasks already exist to prevent duplicate generation
            const existingTasks = await tx.query.installTasks.findMany({
                where: eq(installTasks.orderId, orderId)
            });

            if (existingTasks.length > 0) {
                return { success: false, error: 'Install tasks already exist for this order' };
            }

            // 2. Group Items by Category
            const itemsByCategory: Record<string, typeof order.items> = {
                'CURTAIN': [],
                'WALLPAPER': [],
                'WALLCLOTH': [],
                'OTHER': []
            };

            for (const item of order.items) {
                const cat = item.category as string;
                // Map Product Category to Install Task Category
                let installCat: 'CURTAIN' | 'WALLPAPER' | 'WALLCLOTH' | 'OTHER' = 'OTHER';

                if (['CURTAIN', 'CURTAIN_FABRIC', 'CURTAIN_SHEER', 'CURTAIN_TRACK', 'MOTOR', 'CURTAIN_ACCESSORY'].includes(cat)) {
                    installCat = 'CURTAIN';
                } else if (cat === 'WALLPAPER') {
                    installCat = 'WALLPAPER';
                } else if (['WALLCLOTH', 'WALLCLOTH_ACCESSORY', 'WALLPANEL'].includes(cat)) {
                    installCat = 'WALLCLOTH';
                } else {
                    installCat = 'OTHER';
                }

                itemsByCategory[installCat].push(item);
            }

            // 3. Create Install Tasks
            const createdTaskIds: string[] = [];

            for (const [category, items] of Object.entries(itemsByCategory)) {
                if (items.length === 0) continue;

                // Create Task Header
                const taskNo = `INS-${order.orderNo}-${category.substring(0, 3)}-${Date.now().toString().slice(-4)}`;
                const [newTask] = await tx.insert(installTasks).values({
                    tenantId,
                    taskNo,
                    sourceType: 'ORDER',
                    orderId: order.id,
                    customerId: order.customerId,
                    customerName: order.customerName,
                    customerPhone: order.customerPhone,
                    address: order.deliveryAddress, // Fallback removed as contractAddress not in schema
                    category: category as any, // Cast to enum
                    status: 'PENDING_DISPATCH',
                    salesId: order.salesId,
                }).returning();

                createdTaskIds.push(newTask.id);

                // Create Install Items
                if (items.length > 0) {
                    await tx.insert(installItems).values(items.map(item => ({
                        tenantId,
                        installTaskId: newTask.id,
                        orderItemId: item.id,
                        productName: item.productName,
                        roomName: item.roomName,
                        quantity: String(item.quantity) || '1',
                        actualInstalledQuantity: '0',
                        isInstalled: false
                    })));
                }
            }

            // Revalidate
            revalidatePath(`/orders/${orderId}`);
            revalidatePath(`/installation`);

            return { success: true, data: { createdTaskIds } };
        });
    }
);
