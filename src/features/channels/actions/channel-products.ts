'use server';

import { db } from '@/shared/api/db';
import { products } from '@/shared/api/schema/catalogs';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { eq, and, isNotNull, gt, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { AuditService } from '@/shared/services/audit-service';

/**
 * 获取已设置渠道底价的商品列表
 */
export async function getChannelProducts() {
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权', data: [] };
    }

    // P2 Fix: Add permission check
    try {
        await checkPermission(session, PERMISSIONS.CHANNEL.VIEW);
    } catch {
        return { success: false, error: '无权限查看渠道商品', data: [] };
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

    // P2 Fix: Add permission check
    try {
        await checkPermission(session, PERMISSIONS.CHANNEL.VIEW);
    } catch {
        return { success: false, error: '无权限查看可用商品', data: [] };
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

    const [updated] = await db.update(products)
        .set({
            channelPrice: validated.data.channelPrice.toString(),
            updatedAt: new Date(),
        })
        .where(and(
            eq(products.id, validated.data.productId),
            eq(products.tenantId, session.user.tenantId)
        ))
        .returning();

    // P1 Fix: Audit log
    if (updated) {
        await AuditService.log(db, {
            tableName: 'products',
            recordId: validated.data.productId,
            action: 'UPDATE',
            userId: session.user.id,
            tenantId: session.user.tenantId,
            newValues: { channelPrice: validated.data.channelPrice },
            details: { reason: 'Update channel price' }
        });
    }

    revalidatePath('/settings/channels/products');
    return { success: true };
}

const batchUpdateSchema = z.object({
    updates: z.array(z.object({
        productId: z.string().uuid(),
        channelPrice: z.number().min(0),
    })).max(100, '批量更新数量不能超过100条'), // P2 Fix: Batch size limit
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

    // The max(100) validation is now handled by the schema
    const validated = batchUpdateSchema.safeParse(input);
    if (!validated.success) {
        return { success: false, error: validated.error.message };
    }

    // 批量更新
    await db.transaction(async (tx) => {
        for (const update of validated.data.updates) {
            const [updated] = await tx.update(products)
                .set({
                    channelPrice: update.channelPrice.toString(),
                    updatedAt: new Date(),
                })
                .where(and(
                    eq(products.id, update.productId),
                    eq(products.tenantId, session.user.tenantId)
                ))
                .returning();

            // P1 Fix: Audit log for each update in batch
            if (updated) {
                await AuditService.log(tx, {
                    tableName: 'products',
                    recordId: update.productId,
                    action: 'UPDATE',
                    userId: session.user.id,
                    tenantId: session.user.tenantId,
                    newValues: { channelPrice: update.channelPrice },
                    details: { reason: 'Batch update channel price' }
                });
            }
        }
    });

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

    // P2 Fix: UUID 校验
    const parseResult = z.string().uuid().safeParse(productId);
    if (!parseResult.success) {
        return { success: false, error: '无效的商品ID' };
    }

    const [updated] = await db.update(products)
        .set({
            channelPrice: null,
            updatedAt: new Date(),
        })
        .where(and(
            eq(products.id, productId),
            eq(products.tenantId, session.user.tenantId)
        ))
        .returning();

    // P1 Fix: Audit log
    if (updated) {
        await AuditService.log(db, {
            tableName: 'products',
            recordId: productId,
            action: 'UPDATE',
            userId: session.user.id,
            tenantId: session.user.tenantId,
            newValues: { channelPrice: null },
            details: { reason: 'Remove from channel pool' }
        });
    }

    revalidatePath('/settings/channels/products');
    return { success: true };
}
