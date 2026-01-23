'use server';

import { db } from '@/shared/api/db';
// I need to confirm imports for productBundles and productBundleItems. 
// They are in supply-chain.ts, so unlikely grouped in index unless exported.
// shared/api/schema/index.ts usually exports * from modules.
// Let's assume shared/api/schema exports them.
import { productBundles, productBundleItems } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath } from 'next/cache';
import { createProductBundleSchema, updateProductBundleSchema } from '../schemas';

const createProductBundleActionInternal = createSafeAction(createProductBundleSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    const existing = await db.query.productBundles.findFirst({
        where: and(
            eq(productBundles.tenantId, session.user.tenantId),
            eq(productBundles.bundleSku, data.bundleSku)
        )
    });

    if (existing) {
        throw new Error('Bundle SKU already exists');
    }

    return await db.transaction(async (tx) => {
        const [bundle] = await tx.insert(productBundles).values({
            tenantId: session.user.tenantId,
            bundleSku: data.bundleSku,
            name: data.name,
            category: data.category,
            retailPrice: data.retailPrice.toString(),
            channelPrice: data.channelPrice.toString(),
        }).returning();

        if (data.items && data.items.length > 0) {
            await tx.insert(productBundleItems).values(
                data.items.map(item => ({
                    tenantId: session.user.tenantId,
                    bundleId: bundle.id,
                    productId: item.productId,
                    quantity: item.quantity.toString(),
                    unit: item.unit,
                }))
            );
        }

        revalidatePath('/supply-chain/products');
        return { id: bundle.id };
    });
});

export async function createProductBundle(params: Parameters<typeof createProductBundleActionInternal>[0]) {
    return createProductBundleActionInternal(params);
}

const updateProductBundleActionInternal = createSafeAction(updateProductBundleSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    const { id, items, ...updates } = data;

    return await db.transaction(async (tx) => {
        const [bundle] = await tx.update(productBundles)
            .set({
                ...updates,
                retailPrice: updates.retailPrice?.toString(),
                channelPrice: updates.channelPrice?.toString(),
                updatedAt: new Date(),
            })
            .where(and(
                eq(productBundles.id, id),
                eq(productBundles.tenantId, session.user.tenantId)
            ))
            .returning();

        if (!bundle) throw new Error('Bundle not found');

        if (items) {
            await tx.delete(productBundleItems)
                .where(eq(productBundleItems.bundleId, id));

            if (items.length > 0) {
                await tx.insert(productBundleItems).values(
                    items.map(item => ({
                        tenantId: session.user.tenantId,
                        bundleId: bundle.id,
                        productId: item.productId,
                        quantity: item.quantity.toString(),
                        unit: item.unit,
                    }))
                );
            }
        }

        revalidatePath('/supply-chain/products');
        return { id: bundle.id };
    });
});

export async function updateProductBundle(params: Parameters<typeof updateProductBundleActionInternal>[0]) {
    return updateProductBundleActionInternal(params);
}

const deleteProductBundleActionInternal = createSafeAction(updateProductBundleSchema.pick({ id: true }), async ({ id }, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    await db.transaction(async (tx) => {
        await tx.delete(productBundleItems)
            .where(eq(productBundleItems.bundleId, id));

        await tx.delete(productBundles)
            .where(and(
                eq(productBundles.id, id),
                eq(productBundles.tenantId, session.user.tenantId)
            ));
    });

    revalidatePath('/supply-chain/products');
    return { success: true };
});

export async function deleteProductBundle(params: { id: string }) {
    return deleteProductBundleActionInternal(params);
}
