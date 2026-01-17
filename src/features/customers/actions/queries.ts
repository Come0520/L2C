import 'server-only';

import { db } from '@/shared/api/db';
import { customers } from '@/shared/api/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getCustomersSchema } from '@/features/customers/schemas';

export async function getCustomers(params: z.infer<typeof getCustomersSchema>) {
    const { page, pageSize, search, type, level, assignedSalesId } = getCustomersSchema.parse(params);
    const offset = (page - 1) * pageSize;

    const whereConditions = [];

    if (search) {
        whereConditions.push(
            sql`(${customers.name} ILIKE ${`%${search}%`} OR ${customers.phone} ILIKE ${`%${search}%`} OR ${customers.customerNo} ILIKE ${`%${search}%`})`
        );
    }

    if (type) {
        whereConditions.push(eq(customers.type, type));
    }

    if (level) {
        whereConditions.push(eq(customers.level, level as any));
    }

    if (assignedSalesId) {
        whereConditions.push(eq(customers.assignedSalesId, assignedSalesId));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const data = await db.query.customers.findMany({
        where: whereClause,
        with: {
            assignedSales: true,
        },
        orderBy: [desc(customers.createdAt)],
        limit: pageSize,
        offset: offset,
    });

    // Count for pagination
    const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(whereClause);

    const total = Number(countResult[0].count);

    return {
        data,
        pagination: {
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
        },
    };
}

export async function getCustomerDetail(id: string) {
    const customer = await db.query.customers.findFirst({
        where: eq(customers.id, id),
        with: {
            assignedSales: true,
            creator: true,
            addresses: true,
            referrer: true,
            referrals: {
                limit: 5, // Just show a few recent referrals
                orderBy: desc(customers.createdAt)
            }
        },
    });

    return customer;
}
