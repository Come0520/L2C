import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { afterSalesTickets, orders } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateNo } from '@/shared/lib/generators';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { getMiniprogramUser } from '../../auth-utils';



export async function POST(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('Unauthorized', 401);
        }

        const body = await request.json();
        const { orderId, type, description, photos } = body;

        if (!orderId || !type || !description) {
            return apiError('Missing required fields', 400);
        }

        // Verify order belongs to this customer/user needs a link between user and customer
        // Currently, assuming user.id is LINKED to customer or we just trust the token owner context.
        // For MVP, simplistic validation:

        // Ensure Order exists
        const order = await db.query.orders.findFirst({
            where: and(eq(orders.id, orderId), eq(orders.tenantId, user.tenantId)),
            columns: { id: true, customerId: true } // Need customerId
        });

        if (!order) {
            return apiError('Order not found', 404);
        }

        const ticketNo = generateNo('TKT');

        await db.insert(afterSalesTickets).values({
            tenantId: user.tenantId,
            ticketNo: ticketNo,
            orderId: orderId,
            customerId: order.customerId,
            type,
            description,
            photos: photos || [],
            status: 'PENDING',
            createdBy: user.id
        });

        return apiSuccess({ ticketNo });

    } catch (error) {
        console.error('Create Ticket Error:', error);
        return apiError('Internal Error', 500);
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('Unauthorized', 401);
        }

        // List tickets created by this user OR (if we link user to customer) for this customer
        const list = await db.query.afterSalesTickets.findMany({
            where: and(
                eq(afterSalesTickets.tenantId, user.tenantId),
                eq(afterSalesTickets.createdBy, user.id)
            ),
            orderBy: [desc(afterSalesTickets.createdAt)],
            with: {
                // order: { columns: { orderNo: true } } // Optional info
            }
        });

        return apiSuccess(list);

    } catch {
        return apiError('Fetch failed', 500);
    }
}
