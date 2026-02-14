import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { afterSalesTickets, orders } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { generateNo } from '@/shared/lib/generators';

// Helper: Get User Info
async function getUser(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    try {
        const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
        const { payload } = await jwtVerify(authHeader.slice(7), secret);
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
        const { orderId, type, description, photos } = body;

        if (!orderId || !type || !description) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
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
            return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
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

        return NextResponse.json({ success: true, data: { ticketNo } });

    } catch (error) {
        console.error('Create Ticket Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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

        return NextResponse.json({ success: true, data: list });

    } catch (error) {
        return NextResponse.json({ success: false, error: 'Fetch failed' }, { status: 500 });
    }
}
