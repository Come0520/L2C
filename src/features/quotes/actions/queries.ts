'use server';

import { db } from '@/shared/api/db';
import { cache } from 'react';
import { quotes } from '@/shared/api/schema/quotes';
import { customers } from '@/shared/api/schema/customers';
import { customerAddresses } from '@/shared/api/schema/customer-addresses';
import { eq, desc, and, or, ilike, inArray, gte, lte, count } from 'drizzle-orm';
import { users } from '@/shared/api/schema/infrastructure';
import { auditLogs } from '@/shared/api/schema/audit';
import { quoteStatusEnum } from '@/shared/api/schema/enums';

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
    search,
    customerId,
    dateRange,
}: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
    customerId?: string;
    dateRange?: { from?: Date; to?: Date };
} = {}) => {
    const offset = (page - 1) * pageSize;
    const conditions = [];

    // 1. Status Filter
    if (status && status !== 'ALL') {
        conditions.push(eq(quotes.status, status as typeof quoteStatusEnum.enumValues[number]));
    }

    // 2. Customer Filter
    if (customerId) {
        conditions.push(eq(quotes.customerId, customerId));
    }

    // 3. Date Range Filter
    if (dateRange?.from) {
        conditions.push(gte(quotes.createdAt, dateRange.from));
    }
    if (dateRange?.to) {
        // Include the whole end day
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(lte(quotes.createdAt, endDate));
    }

    // 4. Keyword Search (QuoteNo OR Customer Name/Phone OR Address)
    if (search && search.trim()) {
        const term = `%${search.trim()}%`;

        // Subquery to find matching customer IDs
        const matchingCustomerIds = db
            .select({ id: customers.id })
            .from(customers)
            .leftJoin(customerAddresses, eq(customers.id, customerAddresses.customerId))
            .where(or(
                ilike(customers.name, term),
                ilike(customers.phone, term),
                ilike(customerAddresses.address, term),
                ilike(customerAddresses.community, term)
            ));

        conditions.push(or(
            ilike(quotes.quoteNo, term),
            inArray(quotes.customerId, matchingCustomerIds)
        ));
    }

    const whereCondition = conditions.length ? and(...conditions) : undefined;

    // Fetch Data
    const data = await db.query.quotes.findMany({
        where: whereCondition,
        limit: pageSize,
        offset: offset,
        orderBy: [desc(quotes.createdAt)],
        with: {
            customer: true,
            creator: true,
        },
    });

    // Fetch Total Count for Pagination
    // Note: db.query doesn't return count directly, need separate query
    // Optimizing by reusing the where condition
    const countResult = await db
        .select({ count: count() })
        .from(quotes)
        .where(whereCondition);

    const total = countResult[0]?.count || 0;

    return {
        data,
        meta: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize)
        }
    };
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
