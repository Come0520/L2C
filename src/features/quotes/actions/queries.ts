'use server';

import { db } from '@/shared/api/db';
import { cache } from 'react';
import { quotes } from '@/shared/api/schema/quotes';
import { eq, desc, and, or } from 'drizzle-orm';
import { users } from '@/shared/api/schema/infrastructure';
import { auditLogs } from '@/shared/api/schema/audit';

export const getQuoteVersions = cache(async (rootId: string) => {
    if (!rootId) return [];
    return await db.query.quotes.findMany({
        columns: { id: true, version: true, status: true, createdAt: true, quoteNo: true },
        where: or(eq(quotes.rootQuoteId, rootId), eq(quotes.id, rootId)),
        orderBy: desc(quotes.version)
    });
});

export const getQuotes = cache(async ({
    page = 1,
    pageSize = 10,
    status,
}: {
    page?: number;
    pageSize?: number;
    status?: string;
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
});


export const getQuote = cache(async (id: string) => {

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
});

export const getQuoteBundleById = async ({ id }: { id: string }) => {
    const { data } = await getQuote(id);
    if (!data) return { success: false, message: 'Quote not found' };
    return { success: true, data };
};

export const getQuoteAuditLogs = cache(async (quoteId: string) => {
    return await db.select({
        id: auditLogs.id,
        action: auditLogs.action,
        createdAt: auditLogs.createdAt,
        userName: users.name,
    })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(
            and(
                eq(auditLogs.tableName, 'quotes'),
                eq(auditLogs.recordId, quoteId)
            )
        )
        .orderBy(desc(auditLogs.createdAt));
});
