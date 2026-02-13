'use server';

import { db } from '@/shared/api/db';
import { installTasks, installItems } from '@/shared/api/schema/service';
import { orders } from '@/shared/api/schema/orders';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ActionState, createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';

// Input Schema - tenantId 已移除，从 session 获取
const GenerateInstallTasksSchema = z.object({
    orderId: z.string().uuid(),
});

type GenerateInstallTasksInput = z.infer<typeof GenerateInstallTasksSchema>;

const generateInstallTasksFromOrderActionInternal = createSafeAction(
    GenerateInstallTasksSchema,
    async (input: GenerateInstallTasksInput, ctx): Promise<ActionState<{ createdTaskIds: string[] }>> => {
        // 安全：从 session 获取 tenantId，而非客户端传入
        const session = ctx.session;
        if (!session?.user?.tenantId) {
            return { success: false, error: '未授权' };
        }
        const tenantId = session.user.tenantId;

        // 权限检查
        await checkPermission(session, PERMISSIONS.INSTALL.MANAGE);

        const { orderId } = input;

        const { checkPaymentBeforeInstall } = await import('../logic/payment-check');
        const paymentCheck = await checkPaymentBeforeInstall(orderId);

        if (!paymentCheck.passed) {
            return {
                success: false,
                error: paymentCheck.reason || '收款检查未通过',
                data: {
                    createdTaskIds: [],
                    requiresApproval: paymentCheck.requiresApproval,
                    details: paymentCheck.details,
                } as { createdTaskIds: string[] }
            };
        }

        return await db.transaction(async (tx) => {
            // P0 修复：订单查询必须验证租户归属
            const order = await tx.query.orders.findFirst({
                where: and(
                    eq(orders.id, orderId),
                    eq(orders.tenantId, tenantId)  // 租户验证
                ),
                with: { items: true }
            });

            if (!order) {
                return { success: false, error: '订单不存在或无权访问' };
            }

            const existingTasks = await tx.query.installTasks.findMany({
                where: eq(installTasks.orderId, orderId)
            });

            if (existingTasks.length > 0) {
                return { success: false, error: 'Install tasks already exist for this order' };
            }

            const itemsByCategory: Record<string, typeof order.items> = {
                'CURTAIN': [],
                'WALLPAPER': [],
                'WALLCLOTH': [],
                'OTHER': []
            };

            for (const item of order.items) {
                const cat = item.category as string;
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

            const createdTaskIds: string[] = [];

            for (const [category, items] of Object.entries(itemsByCategory)) {
                if (items.length === 0) continue;

                const taskNo = `INS-${order.orderNo}-${category.substring(0, 3)}-${Date.now().toString().slice(-4)}`;
                const [newTask] = await tx.insert(installTasks).values({
                    tenantId,
                    taskNo,
                    sourceType: 'ORDER',
                    orderId: order.id,
                    customerId: order.customerId,
                    customerName: order.customerName,
                    customerPhone: order.customerPhone,
                    address: order.deliveryAddress,
                    category: category as 'CURTAIN' | 'WALLPAPER' | 'WALLCLOTH' | 'OTHER',
                    status: 'PENDING_DISPATCH',
                    salesId: order.salesId,
                }).returning();

                createdTaskIds.push(newTask.id);

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

            revalidatePath(`/orders/${orderId}`);
            revalidatePath(`/installation`);

            return { success: true, data: { createdTaskIds } };
        });
    }
);

export async function generateInstallTasksFromOrder(params: GenerateInstallTasksInput) {
    return generateInstallTasksFromOrderActionInternal(params);
}
