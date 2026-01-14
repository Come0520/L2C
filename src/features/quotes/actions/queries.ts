'use server';

import { db } from '@/shared/api/db';
import { quotes, quoteItems, quoteRooms } from '@/shared/api/schema/quotes';
import { customers } from '@/shared/api/schema/customers';
import { eq, desc, and, sql } from 'drizzle-orm';
import { users } from '@/shared/api/schema/infrastructure';

export const getQuotes = async ({
    page = 1,
    pageSize = 10,
    status,
    search
}: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
} = {}) => {
    // Current tenant context should be handled by authentication/middleware, 
    // assuming we filter by tenant if necessary. 
    // For now, listing all for simplicity or verify how tenant context is passed.
    // Usually via auth().

    const offset = (page - 1) * pageSize;

    const conditions = [];
    if (status) {
        conditions.push(eq(quotes.status, status));
    }
    // Search logic not implemented yet due to complexity with joined tables

    const data = await db.query.quotes.findMany({
        where: conditions.length ? and(...conditions) : undefined,
        limit: pageSize,
        offset: offset,
        orderBy: [desc(quotes.createdAt)],
        with: {
            customer: true,
            creator: true,
        },
    });

    // Total count logic omitted for brevity, can be added.
    return { data };
};

export const getQuote = async (id: string) => {
    const data = await db.query.quotes.findFirst({
        where: eq(quotes.id, id),
        with: {
            customer: true,
            rooms: {
                orderBy: (rooms, { asc }) => [asc(rooms.sortOrder)],
                with: {
                    items: {
                        orderBy: (items, { asc }) => [asc(items.sortOrder)],
                    }
                }
            },
            items: {
                where: (items, { isNull }) => isNull(items.roomId), // Items without room
                orderBy: (items, { asc }) => [asc(items.sortOrder)],
            }
        }
    });

    return { data };
};
