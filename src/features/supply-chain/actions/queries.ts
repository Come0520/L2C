'use server';

import { db } from '@/shared/api/db';
import { suppliers } from '@/shared/api/schema';
import { eq, and, desc, ilike, sql } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { auth } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { getSuppliersSchema, getSupplierByIdSchema } from '../schemas';

export async function getSuppliers(input: { page?: number; pageSize?: number; query?: string }) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    // View permission check
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);

    const { page = 1, pageSize = 20, query } = input;
    const offset = (page - 1) * pageSize;

    const whereConditions = and(
        eq(suppliers.tenantId, session.user.tenantId),
        eq(suppliers.isActive, true),
        query ? ilike(suppliers.name, `%${query}%`) : undefined
    );

    const [data, totalResult] = await Promise.all([
        db.select()
            .from(suppliers)
            .where(whereConditions)
            .orderBy(desc(suppliers.createdAt))
            .limit(pageSize)
            .offset(offset),
        db.select({ count: sql<number>`count(*)` })
            .from(suppliers)
            .where(whereConditions)
    ]);

    return {
        data,
        total: Number(totalResult[0]?.count || 0),
        page,
        pageSize,
        totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / pageSize)
    };
}

export async function getSupplierById(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);

    const supplier = await db.query.suppliers.findFirst({
        where: and(
            eq(suppliers.id, id),
            eq(suppliers.tenantId, session.user.tenantId)
        )
    });

    if (!supplier) throw new Error('Supplier not found');

    return supplier;
}
