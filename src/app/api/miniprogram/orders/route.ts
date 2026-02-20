import { NextRequest } from 'next/server';
import { db } from '@/shared/api/db';
import { orders, orderItems, quotes, paymentSchedules } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateOrderNo } from '@/shared/lib/generators';
import { apiSuccess, apiError } from '@/shared/lib/api-response';
import { getMiniprogramUser } from '../auth-utils';



export async function GET(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const conditions = [eq(orders.tenantId, user.tenantId)];
        const VALID_STATUSES = ['PENDING', 'PENDING_PO', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'Draft']; // Add other statuses as needed
        if (status && status !== 'ALL' && VALID_STATUSES.includes(status)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        return apiSuccess(list);

    } catch (error) {
        console.error('Get Orders Error:', error);
        return apiError('Internal Error', 500);
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getMiniprogramUser(request);
        if (!user || !user.tenantId) {
            return apiError('Unauthorized', 401);
        }

        const body = await request.json();
        const { quoteId } = body;

        if (!quoteId) {
            return apiError('Quote ID required', 400);
        }

        // 1. Fetch Quote
        const quote = await db.query.quotes.findFirst({
            where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, user.tenantId)),
            with: {
                items: true
            }
        });

        if (!quote) {
            return apiError('Quote not found', 404);
        }

        // Logic Check: Quote must be ORDERED
        if (quote.status !== 'ORDERED') {
            return apiError('Quote must be confirmed first', 400);
        }

        // NOTE: Check if order already exists for this quote? (Optional but good practice)

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
                // customerName: order.customer?.name,
                // customerPhone: order.customer?.phone,
                totalAmount: quote.totalAmount,
                paidAmount: "0",
                balanceAmount: quote.totalAmount,
                settlementType: 'CASH', // Default to Cash
                status: 'PENDING_PO',
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
                    roomName: item.roomName || 'Unknown Room',
                    productId: item.productId,
                    productName: item.productName,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    category: item.category as any,
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

            return apiSuccess(newOrder);
        });

    } catch (error) {
        console.error('Create Order Error:', error);
        return apiError('Internal Error', 500);
    }
}
