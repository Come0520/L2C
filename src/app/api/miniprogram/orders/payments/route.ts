import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { orders, paymentSchedules } from '@/shared/api/schema';
import { eq, and, sql } from 'drizzle-orm';
import { jwtVerify } from 'jose';

// Helper: Get User Info
async function getUser(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.slice(7);
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, payload.userId as string),
            columns: { id: true, role: true, tenantId: true },
        });
    } catch {
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { scheduleId, actualAmount, proofImg, paymentMethod } = body;

        // Validation
        if (!scheduleId || !actualAmount || !proofImg || !paymentMethod) {
            return NextResponse.json({ success: false, error: 'Missing required payment info' }, { status: 400 });
        }

        // 1. Get Schedule
        const schedule = await db.query.paymentSchedules.findFirst({
            where: and(eq(paymentSchedules.id, scheduleId), eq(paymentSchedules.tenantId, user.tenantId)),
        });

        if (!schedule) {
            return NextResponse.json({ success: false, error: 'Schedule not found' }, { status: 404 });
        }

        if (schedule.status === 'PAID') {
            return NextResponse.json({ success: false, error: 'Already paid' }, { status: 400 });
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

            const nextStatus = parseFloat(newBalance) <= 0.01 ? 'IN_PRODUCTION' : order.status; // Auto move to production if fully paid? Or keep PENDING_PAYMENT until first pay?
            // Simple logic: If it was PENDING_PAYMENT, and we paid something, maybe move to IN_PRODUCTION? 
            // Typically deposit moves to production.
            // Let's say if Deposit is paid, we can move to production. 
            // For MVP, if paidAmount > 0, status -> IN_PRODUCTION (if it was DRAFT or PENDING_PAYMENT)

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
                .where(eq(orders.id, schedule.orderId));

            return NextResponse.json({ success: true });
        });

    } catch (error) {
        console.error('Payment Entry Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
