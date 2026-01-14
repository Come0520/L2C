'use server';

import { db } from '@/shared/api/db';
import { productSuppliers, suppliers } from '@/shared/api/schema';
import { eq, and, ne } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Zod Schemas
 */
const addProductSupplierSchema = z.object({
    productId: z.string().uuid(),
    supplierId: z.string().uuid(),
    purchasePrice: z.coerce.number().min(0).default(0),
    leadTimeDays: z.coerce.number().int().min(0).default(7),
    isDefault: z.boolean().default(false),
});

const updateProductSupplierSchema = z.object({
    id: z.string().uuid(),
    purchasePrice: z.coerce.number().min(0).optional(),
    leadTimeDays: z.coerce.number().int().min(0).optional(),
    isDefault: z.boolean().optional(),
});

const removeProductSupplierSchema = z.object({
    id: z.string().uuid(),
    productId: z.string().uuid(), // Needed for revalidation context
});

const getProductSuppliersSchema = z.object({
    productId: z.string().uuid(),
});

/**
 * 查询产品的关联供应商列表
 */
export const getProductSuppliers = createSafeAction(getProductSuppliersSchema, async ({ productId }, { session }) => {
    // Permission check: View products or supply chain
    // if (!session?.user) throw new Error('Unauthorized'); 

    const result = await db
        .select({
            id: productSuppliers.id,
            supplierId: productSuppliers.supplierId,
            supplierName: suppliers.name,
            purchasePrice: productSuppliers.purchasePrice,
            leadTimeDays: productSuppliers.leadTimeDays,
            isDefault: productSuppliers.isDefault,
        })
        .from(productSuppliers)
        .leftJoin(suppliers, eq(productSuppliers.supplierId, suppliers.id))
        .where(
            and(
                eq(productSuppliers.tenantId, session.user.tenantId),
                eq(productSuppliers.productId, productId)
            )
        );

    return result;
});

/**
 * 添加供应商关联
 */
export const addProductSupplier = createSafeAction(addProductSupplierSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    // Check if relation already exists
    const existing = await db.query.productSuppliers.findFirst({
        where: and(
            eq(productSuppliers.tenantId, session.user.tenantId),
            eq(productSuppliers.productId, data.productId),
            eq(productSuppliers.supplierId, data.supplierId)
        )
    });

    if (existing) {
        return { error: '该供应商已关联此产品' };
    }

    // If new one is default, unset other defaults
    if (data.isDefault) {
        await db.update(productSuppliers)
            .set({ isDefault: false })
            .where(
                and(
                    eq(productSuppliers.tenantId, session.user.tenantId),
                    eq(productSuppliers.productId, data.productId)
                )
            );
    }

    await db.insert(productSuppliers).values({
        tenantId: session.user.tenantId,
        productId: data.productId,
        supplierId: data.supplierId,
        purchasePrice: data.purchasePrice.toString(),
        leadTimeDays: data.leadTimeDays,
        isDefault: data.isDefault,
    });

    revalidatePath(`/supply-chain/products`);
    return { success: true };
});

/**
 * 更新供应商关联信息 (价格, 货期, 默认状态)
 */
export const updateProductSupplier = createSafeAction(updateProductSupplierSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    const current = await db.query.productSuppliers.findFirst({
        where: eq(productSuppliers.id, data.id)
    });

    if (!current) return { error: '关联记录不存在' };

    // Handle default toggle logic
    if (data.isDefault) {
        await db.update(productSuppliers)
            .set({ isDefault: false })
            .where(
                and(
                    eq(productSuppliers.tenantId, session.user.tenantId),
                    eq(productSuppliers.productId, current.productId),
                    ne(productSuppliers.id, data.id)
                )
            );
    }

    await db.update(productSuppliers)
        .set({
            ...(data.purchasePrice !== undefined ? { purchasePrice: data.purchasePrice.toString() } : {}),
            ...(data.leadTimeDays !== undefined ? { leadTimeDays: data.leadTimeDays } : {}),
            ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
        })
        .where(eq(productSuppliers.id, data.id));

    revalidatePath(`/supply-chain/products`);
    return { success: true };
});

/**
 * 移除供应商关联
 */
export const removeProductSupplier = createSafeAction(removeProductSupplierSchema, async ({ id }, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.MANAGE);

    await db.delete(productSuppliers)
        .where(
            and(
                eq(productSuppliers.tenantId, session.user.tenantId),
                eq(productSuppliers.id, id)
            )
        );

    revalidatePath(`/supply-chain/products`);
    return { success: true };
});
