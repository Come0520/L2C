'use server';

import { db } from '@/shared/api/db';
import { suppliers } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const createSupplierSchema = z.object({
    name: z.string().min(1, '供应商名称不能为空').max(200),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    paymentPeriod: z.enum(['CASH', 'MONTHLY']).default('CASH'),
});

const updateSupplierSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(200).optional(),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    paymentPeriod: z.enum(['CASH', 'MONTHLY']).optional().nullable(),
    isActive: z.boolean().optional(),
});

const deleteSupplierSchema = z.object({
    id: z.string().uuid(),
});

export const createSupplier = createSafeAction(createSupplierSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.MANAGE);

    const [supplier] = await db.insert(suppliers).values({
        tenantId: session.user.tenantId,
        supplierNo: `SUP${Date.now()}`,
        name: data.name,
        contactPerson: data.contactPerson ?? null,
        phone: data.phone ?? null,
        paymentPeriod: data.paymentPeriod,
        createdBy: session.user.id,
    }).returning();

    revalidatePath('/supply-chain/suppliers');
    return { id: supplier.id };
});

export const updateSupplier = createSafeAction(updateSupplierSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.MANAGE);

    const { id, ...updates } = data;

    const [supplier] = await db.update(suppliers)
        .set({
            ...updates,
            updatedAt: new Date(),
        })
        .where(and(
            eq(suppliers.id, id),
            eq(suppliers.tenantId, session.user.tenantId)
        ))
        .returning();

    if (!supplier) throw new Error('供应商未找到');

    revalidatePath('/supply-chain/suppliers');
    return { id: supplier.id };
});

export const deleteSupplier = createSafeAction(deleteSupplierSchema, async ({ id }, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.MANAGE);

    await db.delete(suppliers)
        .where(and(
            eq(suppliers.id, id),
            eq(suppliers.tenantId, session.user.tenantId)
        ));

    revalidatePath('/supply-chain/suppliers');
    return { success: true };
});
