import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/api/db';
import { orders, orderItems, quotes, quoteItems, paymentSchedules } from '@/shared/api/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { generateOrderNo } from '@/shared/lib/generators';

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

export async function GET(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const conditions = [eq(orders.tenantId, user.tenantId)];
        if (status && status !== 'ALL') {
            conditions.push(eq(orders.status, status as any));
        }

        const list = await db.query.orders.findMany({
            where: and(...conditions),
            orderBy: [desc(orders.createdAt)],
            with: {
                customer: {
                    columns: { name: true } // Denormalized name is on order, but fetch relation just in case
                }
            }
        });

        return NextResponse.json({ success: true, data: list });

    } catch (error) {
        console.error('Get Orders Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user || !user.tenantId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { quoteId } = body;

        if (!quoteId) {
            return NextResponse.json({ success: false, error: 'Quote ID required' }, { status: 400 });
        }

        // 1. Fetch Quote
        const quote = await db.query.quotes.findFirst({
            where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, user.tenantId)),
            with: {
                items: true
            }
        });

        if (!quote) {
            return NextResponse.json({ success: false, error: 'Quote not found' }, { status: 404 });
        }

        // Logic Check: Quote must be CONFIRMED
        if (quote.status !== 'CONFIRMED') {
            return NextResponse.json({ success: false, error: 'Quote must be confirmed first' }, { status: 400 });
        }

        // TODO: Check if order already exists for this quote? (Optional but good practice)

        // 2. Create Order
        const orderNo = await generateOrderNo(user.tenantId);

        return await db.transaction(async (tx) => {
            // A. Insert Order
            const [newOrder] = await tx.insert(orders).values({
                tenantId: user.tenantId,
                orderNo: orderNo,
                quoteId: quote.id,
                quoteVersionId: quote.id, // Simplifying for now, assuming quote is latest
                customerId: quote.customerId,
                customerName: quote.customerName,
                customerPhone: quote.customerPhone,
                totalAmount: quote.totalAmount,
                paidAmount: "0",
                balanceAmount: quote.totalAmount,
                settlementType: 'PHASED', // Default to Phased
                status: 'PENDING_PAYMENT',
                salesId: user.id,
                remark: quote.notes,
                createdBy: user.id
            }).returning();

            // B. Insert Items
            if (quote.items && quote.items.length > 0) {
                const itemsToInsert = quote.items.map(item => ({
                    tenantId: user.tenantId,
                    orderId: newOrder.id,
                    quoteItemId: item.id,
                    roomName: item.roomName,
                    productId: item.productId,
                    productName: item.productName,
                    category: item.category,
                    quantity: item.quantity,
                    width: item.width,
                    height: item.height,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal,
                    status: 'PENDING' as const
                }));
                await tx.insert(orderItems).values(itemsToInsert);
            }

            // C. Create Default Payment Schedules (Deposit 60%, Balance 40%)
            // This logic should ideally be configurable. For MVP hardcode.
            const total = parseFloat(quote.totalAmount as string);
            const deposit = (total * 0.6).toFixed(2);
            const balance = (total - parseFloat(deposit)).toFixed(2);

            await tx.insert(paymentSchedules).values([
                {
                    tenantId: user.tenantId,
                    orderId: newOrder.id,
                    name: '预付款 (60%)',
                    amount: deposit,
                    status: 'PENDING',
                    expectedDate: new Date().toISOString() // Now
                },
                {
                    tenantId: user.tenantId,
                    orderId: newOrder.id,
                    name: '尾款 (40%)',
                    amount: balance,
                    status: 'PENDING',
                    // expectedDate set to later?
                }
            ]);

            // D. Update Quote Status
            await tx.update(quotes)
                .set({ status: 'ORDERED' }) // Assume we add this status or use existing logical equivalent
                .where(eq(quotes.id, quote.id));

            return NextResponse.json({ success: true, data: newOrder });
        });

    } catch (error) {
        console.error('Create Order Error:', error);
        return NextResponse.json({ success: false, error: 'Internal Error' }, { status: 500 });
    }
}
