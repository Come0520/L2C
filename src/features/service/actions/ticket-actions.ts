'use server';

import { db } from '@/shared/api/db';
import { afterSalesTickets, customers, orders } from '@/shared/api/schema';
import { eq, desc, and, count, ilike, or } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';

// Types for filters
export interface TicketFilters {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    type?: string;
}

export async function getServiceTickets(filters: TicketFilters = {}) {
    const session = await auth();
    if (!session || !session.user?.tenantId) return { success: false, error: 'Unauthorized', data: [], total: 0 };

    const { page = 1, pageSize = 20, search, status } = filters;
    const offset = (page - 1) * pageSize;

    try {
        const query = db.select({
            ticket: afterSalesTickets,
            customer: customers,
            order: orders,
        })
            .from(afterSalesTickets)
            .leftJoin(customers, eq(afterSalesTickets.customerId, customers.id))
            .leftJoin(orders, eq(afterSalesTickets.orderId, orders.id));

        const whereConditions = [eq(afterSalesTickets.tenantId, session.user.tenantId)];

        if (status && status !== 'all') {
            whereConditions.push(eq(afterSalesTickets.status, status as any));
        }

        if (search) {
            const searchLower = `%${search.toLowerCase()}%`;
            whereConditions.push(or(
                ilike(afterSalesTickets.ticketNo, searchLower),
                ilike(afterSalesTickets.description, searchLower),
                ilike(customers.name, searchLower)
            ));
        }

        const dataQuery = await query
            .where(and(...whereConditions)!)
            .limit(pageSize)
            .offset(offset)
            .orderBy(desc(afterSalesTickets.createdAt));

        const countResult = await db.select({ count: count(afterSalesTickets.id) })
            .from(afterSalesTickets)
            .leftJoin(customers, eq(afterSalesTickets.customerId, customers.id))
            .where(and(...whereConditions)!);

        const total = countResult[0]?.count || 0;
        const totalPages = Math.ceil(total / pageSize);

        const formattedData = dataQuery.map(row => ({
            ...row.ticket,
            customer: row.customer,
            order: row.order
        }));

        return {
            success: true,
            data: formattedData,
            total,
            page,
            totalPages
        };

    } catch (e) {
        console.error('getServiceTickets error:', e);
        return { success: false, error: 'Failed to fetch tickets', data: [], total: 0 };
    }
}

export async function updateTicketStatus(id: string, status: 'PENDING' | 'PROCESSING' | 'PENDING_VERIFY' | 'CLOSED', result?: string) {
    const session = await auth();
    if (!session || !session.user?.tenantId) return { success: false, error: 'Unauthorized' };

    try {
        await db.update(afterSalesTickets)
            .set({
                status: status as any, // Schema enum
                result: result || undefined,
                updatedAt: new Date(),
                // handlerId not in schema? let's check. 
                // Schema has assignedTo, createdBy. But maybe handlerId was removed or I missed it.
                // Checking previous view_file of ticket-actions.ts, it had handlerId: session.user.id
                // But view_file of schema (after-sales.ts) does NOT have handlerId, only assignedTo.
                // I should use assignedTo or just ignore if not applicable.
                // Let's use assignedTo if it means current handler.
                assignedTo: session.user.id
            })
            .where(and(
                eq(afterSalesTickets.id, id),
                eq(afterSalesTickets.tenantId, session.user.tenantId)
            ));

        revalidatePath('/service');
        return { success: true };
    } catch (e) {
        console.error('updateTicketStatus error:', e);
        return { success: false, error: 'Update failed' };
    }
}
