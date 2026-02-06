'use server';

import { db } from '@/shared/api/db';
import { orders, orderItems, paymentSchedules } from '@/shared/api/schema';
import { eq, and, desc, asc, like } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getOrders(params?: {
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.tenantId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const conditions = [eq(orders.tenantId, session.user.tenantId)];

        if (params?.status && params.status !== 'ALL') {
            conditions.push(eq(orders.status, params.status as any));
        }

        if (params?.search) {
            conditions.push(like(orders.orderNo, `%${params.search}%`));
        }

        // Simple fetch without extensive pagination logic for now (limit 50)
        const list = await db.query.orders.findMany({
            where: and(...conditions),
            orderBy: [desc(orders.createdAt)],
            limit: 50,
            with: {
                customer: {
                    columns: { name: true }
                }
            }
        });

        return { success: true, data: list };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to fetch orders' };
    }
}

export async function getOrderDetail(id: string) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.tenantId) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const order = await db.query.orders.findFirst({
            where: and(eq(orders.id, id), eq(orders.tenantId, session.user.tenantId)),
            with: {
                items: true,
                paymentSchedules: {
                    orderBy: [asc(paymentSchedules.createdAt)]
                },
                customer: {
                    columns: { name: true, phone: true }
                }
            }
        });

        if (!order) return { success: false, error: 'Order not found' };

        return { success: true, data: order };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to fetch order detail' };
    }
}

export async function createOrderPayment(data: {
    scheduleId: string;
    actualAmount: string;
    proofImg: string;
    paymentMethod: string;
    orderId: string; // Ensure context
}) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.tenantId) {
        return { success: false, error: 'Unauthorized' };
    }

    const { scheduleId, actualAmount, proofImg, paymentMethod, orderId } = data;

    if (!scheduleId || !actualAmount || !proofImg || !paymentMethod) {
        return { success: false, error: 'Missing Required Info' };
    }

    try {
        return await db.transaction(async (tx) => {
            const schedule = await tx.query.paymentSchedules.findFirst({
                where: and(eq(paymentSchedules.id, scheduleId), eq(paymentSchedules.tenantId, session.user.tenantId))
            });

            if (!schedule) throw new Error('Schedule not found');
            if (schedule.status === 'PAID') throw new Error('Already Paid');

            // Update Schedule
            await tx.update(paymentSchedules)
                .set({
                    status: 'PAID',
                    actualAmount: actualAmount,
                    paymentMethod: paymentMethod as any,
                    proofImg: proofImg,
                    actualDate: new Date().toISOString(),
                    updatedAt: new Date()
                })
                .where(eq(paymentSchedules.id, scheduleId));

            // Update Order
            const order = await tx.query.orders.findFirst({
                where: eq(orders.id, orderId)
            });

            if (!order) throw new Error("Order missing");

            const newPaid = (parseFloat(order.paidAmount as string) + parseFloat(actualAmount)).toFixed(2);
            const newBalance = (parseFloat(order.totalAmount as string) - parseFloat(newPaid)).toFixed(2);

            let statusToSet = order.status;
            if ((order.status === 'PENDING_PAYMENT' || order.status === 'DRAFT') && parseFloat(newPaid) > 0) {
                statusToSet = 'IN_PRODUCTION';
            }

            await tx.update(orders)
                .set({
                    paidAmount: newPaid,
                    balanceAmount: newBalance,
                    status: statusToSet,
                    updatedAt: new Date()
                })
                .where(eq(orders.id, orderId));

            revalidatePath(`/orders/${orderId}`);
            revalidatePath(`/orders`);

            return { success: true };
        });
    } catch (error: any) {
        console.error(error);
        return { success: false, error: error.message || 'Payment Failed' };
    }
}
