'use server';

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

// Update Order Status Schema
const updateOrderStatusSchema = z.object({
    id: z.string(),
    status: z.string(),
    reason: z.string().optional(),
});

export const updateOrderStatus = createSafeAction(updateOrderStatusSchema, async (data, ctx) => {
    const { session } = ctx;

    // Verify ownership or permissions here if needed
    // const order = await db.query.orders.findFirst({ ... })

    await db.update(orders)
        .set({
            status: data.status as any, // Cast to enum type if needed
            updatedAt: new Date(),
        })
        .where(
            eq(orders.id, data.id)
        );

    revalidatePath('/orders');
    revalidatePath(`/orders/${data.id}`);

    return { 
        success: true, 
        id: data.id, 
        newStatus: data.status 
    };
});

// Add other mutations as needed based on requirements
// e.g., createOrder, deleteOrder, etc.
