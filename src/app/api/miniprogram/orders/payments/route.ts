import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { orders, paymentSchedules } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { getMiniprogramUser } from '../../auth-utils';



export async function POST(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('Unauthorized', 401);
        }

        const body = await request.json();
        const { scheduleId, actualAmount, proofImg, paymentMethod } = body;

        // Validation
        if (!scheduleId || !actualAmount || !proofImg || !paymentMethod) {
            return apiError('Missing required payment info', 400);
        }

        // 1. Get Schedule
        const schedule = await db.query.paymentSchedules.findFirst({
            where: and(eq(paymentSchedules.id, scheduleId), eq(paymentSchedules.tenantId, user.tenantId)),
        });

        if (!schedule) {
            return apiError('Schedule not found', 404);
        }

        if (schedule.status === 'PAID') {
            return apiError('Already paid', 400);
        }

        return await db.transaction(async (tx) => {
            // 2. Update Schedule
            await tx.update(paymentSchedules)
                .set({
                    status: 'PAID',
                    actualAmount: actualAmount,
                    paymentMethod: paymentMethod,
                    proofImg: proofImg,
                    actualDate: new Date().toISOString(),
                    updatedAt: new Date()
                })
                .where(eq(paymentSchedules.id, scheduleId));

            // 3. Update Order Totals
            // We need to fetch current order totals first or recalc.
            // Let's recalc based on all PAID schedules for safety? Or just increment.
            // Increment is faster but recalc is safer. Let's increment for now.
            // Actually, querying the order is safe.
            const order = await tx.query.orders.findFirst({
                where: eq(orders.id, schedule.orderId)
            });

            if (!order) throw new Error("Order missing");

            const newPaid = (parseFloat(order.paidAmount as string) + parseFloat(actualAmount)).toFixed(2);
            const newBalance = (parseFloat(order.totalAmount as string) - parseFloat(newPaid)).toFixed(2);

            // Simple logic: If it was PENDING_PAYMENT, and we paid something, maybe move to IN_PRODUCTION? 
            // Typically deposit moves to production.
            // Let's say if Deposit is paid, we can move to production. 
            // For MVP, if paidAmount > 0, status -> IN_PRODUCTION (if it was DRAFT or PENDING_PAYMENT)

            let statusToSet = order.status;
            if (((order.status as string) === 'PENDING_PAYMENT' || order.status === 'DRAFT') && parseFloat(newPaid) > 0) {
                statusToSet = 'IN_PRODUCTION';
            }

            await tx.update(orders)
                .set({
                    paidAmount: newPaid,
                    balanceAmount: newBalance,
                    status: statusToSet,
                    updatedAt: new Date()
                })
                .where(eq(orders.id, schedule.orderId));

            return apiSuccess(null);
        });

    } catch (error) {
        console.error('Payment Entry Error:', error);
        return apiError('Internal Error', 500);
    }
}
