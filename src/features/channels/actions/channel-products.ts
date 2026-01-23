'use server';

import { db } from '@/shared/api/db';
import { products } from '@/shared/api/schema/catalogs';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { eq, and, isNotNull, gt, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * 获取已设置渠道底价的商品列表
 */
export async function getChannelProducts() {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权', data: [] };
    }

    const data = await db.query.products.findMany({
        where: and(
            eq(products.tenantId, session.user.tenantId),
            eq(products.isActive, true),
            isNotNull(products.channelPrice),
            gt(products.channelPrice, '0')
        ),
        columns: {
            id: true,
            sku: true,
            name: true,
            category: true,
            retailPrice: true,
            channelPrice: true,
            channelPriceMode: true,
            channelDiscountRate: true,
        },
        orderBy: [desc(products.updatedAt)],
    });

    return { success: true, data };
}

/**
 * 获取所有可用商品（用于添加到渠道选品池）
 */
export async function getAvailableProducts() {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权', data: [] };
    }

    const data = await db.query.products.findMany({
        where: and(
            eq(products.tenantId, session.user.tenantId),
            eq(products.isActive, true)
        ),
        columns: {
            id: true,
            sku: true,
            name: true,
            category: true,
            retailPrice: true,
            channelPrice: true,
        },
        orderBy: [desc(products.updatedAt)],
    });

    return { success: true, data };
}

const updateChannelPriceSchema = z.object({
    productId: z.string().uuid(),
    channelPrice: z.number().min(0),
});

/**
 * 更新商品渠道底价
 */
export async function updateProductChannelPrice(input: z.infer<typeof updateChannelPriceSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    try {
        await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
    } catch {
        return { success: false, error: '无权限执行此操作' };
    }

    const validated = updateChannelPriceSchema.safeParse(input);
    if (!validated.success) {
        return { success: false, error: validated.error.message };
    }

    // 验证商品归属
    const product = await db.query.products.findFirst({
        where: and(
            eq(products.id, validated.data.productId),
            eq(products.tenantId, session.user.tenantId)
        ),
    });

    if (!product) {
        return { success: false, error: '商品不存在' };
    }

    await db.update(products)
        .set({
            channelPrice: validated.data.channelPrice.toString(),
            updatedAt: new Date(),
        })
        .where(eq(products.id, validated.data.productId));

    revalidatePath('/settings/channels/products');
    return { success: true };
}

const batchUpdateSchema = z.object({
    updates: z.array(z.object({
        productId: z.string().uuid(),
        channelPrice: z.number().min(0),
    })),
});

/**
 * 批量更新商品渠道底价
 */
export async function batchUpdateChannelPrices(input: z.infer<typeof batchUpdateSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    try {
        await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
    } catch {
        return { success: false, error: '无权限执行此操作' };
    }

    const validated = batchUpdateSchema.safeParse(input);
    if (!validated.success) {
        return { success: false, error: validated.error.message };
    }

    // 批量更新
    for (const update of validated.data.updates) {
        await db.update(products)
            .set({
                channelPrice: update.channelPrice.toString(),
                updatedAt: new Date(),
            })
            .where(and(
                eq(products.id, update.productId),
                eq(products.tenantId, session.user.tenantId)
            ));
    }

    revalidatePath('/settings/channels/products');
    return { success: true };
}

/**
 * 移除商品的渠道底价（从选品池移除）
 */
export async function removeFromChannelPool(productId: string) {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权' };
    }

    try {
        await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);
    } catch {
        return { success: false, error: '无权限执行此操作' };
    }

    await db.update(products)
        .set({
            channelPrice: '0',
            updatedAt: new Date(),
        })
        .where(and(
            eq(products.id, productId),
            eq(products.tenantId, session.user.tenantId)
        ));

    revalidatePath('/settings/channels/products');
    return { success: true };
}
