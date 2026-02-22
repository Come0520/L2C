import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { orders, paymentSchedules } from '@/shared/api/schema';
import { eq, and, asc } from 'drizzle-orm';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { logger } from '@/shared/lib/logger';
import { getMiniprogramUser } from '../../auth-utils';



export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('Unauthorized', 401);
        }

        const { id: orderId } = await params;

        const order = await db.query.orders.findFirst({
            where: and(eq(orders.id, orderId), eq(orders.tenantId, user.tenantId)),
            with: {
                items: true, // Fetch items
                paymentSchedules: {
                    orderBy: [asc(paymentSchedules.createdAt)]
                }
            }
        });

        if (!order) {
            return apiError('Order not found', 404);
        }

        return apiSuccess(order);

    } catch (error) {
        logger.error('Get Order Detail Error:', error);
        return apiError('Internal Error', 500);
    }
}
