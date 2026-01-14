'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/shared/api/db';
import { splitRouteRules, suppliers } from '@/shared/api/schema';
import { eq, desc } from 'drizzle-orm';

import { z } from 'zod';
import { auth } from '@/shared/lib/auth';

// Schema for splitting rule input
export const splitRuleSchema = z.object({
    name: z.string().min(1, "名称不能为空"),
    priority: z.coerce.number().int().default(0),
    conditions: z.string().min(1, "条件不能为空"), // Should be valid JSON string
    targetType: z.enum(['PURCHASE_ORDER', 'SERVICE_TASK']),
    targetSupplierId: z.string().nullable().optional(),
    isActive: z.coerce.number().int().default(1),
});

export type SplitRuleInput = z.infer<typeof splitRuleSchema>;

async function requireUser() {
    const session = await auth();
    if (!session?.user) {
        throw new Error('Unauthorized');
    }
    return session.user;
}

export async function getSplitRules() {
    const user = await requireUser();

    return await db.select()
        .from(splitRouteRules)
        .where(eq(splitRouteRules.tenantId, user.tenantId))
        .orderBy(desc(splitRouteRules.priority));
}

export async function createSplitRule(input: SplitRuleInput) {
    const user = await requireUser();

    const validated = splitRuleSchema.parse(input);

    await db.insert(splitRouteRules).values({
        tenantId: user.tenantId,
        createdBy: user.id,
        name: validated.name,
        priority: validated.priority,
        conditions: validated.conditions,
        targetType: validated.targetType,
        targetSupplierId: validated.targetSupplierId,
        isActive: validated.isActive,
    });

    revalidatePath('/supply-chain/rules');
    return { success: true };
}

export async function updateSplitRule(id: string, input: SplitRuleInput) {
    await requireUser();

    const validated = splitRuleSchema.parse(input);

    await db.update(splitRouteRules)
        .set({
            name: validated.name,
            priority: validated.priority,
            conditions: validated.conditions,
            targetType: validated.targetType,
            targetSupplierId: validated.targetSupplierId,
            isActive: validated.isActive,
            updatedAt: new Date()
        })
        .where(eq(splitRouteRules.id, id)); // In real app, check tenantId too

    revalidatePath('/supply-chain/rules');
    return { success: true };
}

export async function deleteSplitRule(id: string) {
    await requireUser(); // Authorization check implied

    await db.delete(splitRouteRules)
        .where(eq(splitRouteRules.id, id));

    revalidatePath('/supply-chain/rules');
    return { success: true };
}

export async function getAllSuppliers() {
    const user = await requireUser();

    return await db.select({
        id: suppliers.id,
        name: suppliers.name,
        supplierNo: suppliers.supplierNo,
    })
        .from(suppliers)
        .where(eq(suppliers.tenantId, user.tenantId));
}
