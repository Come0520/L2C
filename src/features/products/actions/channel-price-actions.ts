'use server';
import { logger } from "@/shared/lib/logger";

/**
 * 渠道专属价 Server Actions
 * 
 * 管理商品针对特定渠道的专属结算价格
 */

import { db } from '@/shared/api/db';
import { channelSpecificPrices } from '@/shared/api/schema/supply-chain';
import { marketChannels, products } from '@/shared/api/schema/catalogs';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { AuditService } from '@/shared/services/audit-service';

// 辅助函数：获取 tenantId
async function getTenantIdFromSession() {
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('未授权');
    }
    return session.user.tenantId;
}

// =============================================
// Schema 定义
// =============================================

const channelPriceSchema = z.object({
    channelId: z.string().uuid(),
    specialPrice: z.string().or(z.number()),
});

const updateChannelPriceSchema = z.object({
    specialPrice: z.string().or(z.number()),
    isActive: z.boolean().optional(),
});

// =============================================
// 渠道专属价 CRUD
// =============================================

/**
 * 获取商品的渠道专属价列表
 */
export async function getChannelPrices(productId: string) {
    try {
        const tenantId = await getTenantIdFromSession();
        if (!tenantId) return { success: false, error: '未授权' };

        const data = await db
            .select({
                id: channelSpecificPrices.id,
                productId: channelSpecificPrices.productId,
                channelId: channelSpecificPrices.channelId,
                specialPrice: channelSpecificPrices.specialPrice,
                isActive: channelSpecificPrices.isActive,
                createdAt: channelSpecificPrices.createdAt,
                channel: {
                    id: marketChannels.id,
                    name: marketChannels.name,
                    code: marketChannels.code,
                }
            })
            .from(channelSpecificPrices)
            .leftJoin(marketChannels, eq(channelSpecificPrices.channelId, marketChannels.id))
            .where(and(
                eq(channelSpecificPrices.productId, productId),
                eq(channelSpecificPrices.tenantId, tenantId)
            ))
            .orderBy(desc(channelSpecificPrices.createdAt));

        return { success: true, data };
    } catch (error) {
        logger.error('获取渠道专属价失败:', error);
        return { success: false, error: '获取渠道专属价失败' };
    }
}

/**
 * 获取所有渠道专属价列表（用于设置页面）
 */
export async function getAllChannelPrices() {
    try {
        const tenantId = await getTenantIdFromSession();
        if (!tenantId) return { success: false, error: '未授权' };

        const data = await db
            .select({
                id: channelSpecificPrices.id,
                productId: channelSpecificPrices.productId,
                channelId: channelSpecificPrices.channelId,
                specialPrice: channelSpecificPrices.specialPrice,
                isActive: channelSpecificPrices.isActive,
                createdAt: channelSpecificPrices.createdAt,
                channel: {
                    id: marketChannels.id,
                    name: marketChannels.name,
                    code: marketChannels.code,
                },
                product: {
                    id: products.id,
                    name: products.name,
                    sku: products.sku,
                    retailPrice: products.retailPrice,
                }
            })
            .from(channelSpecificPrices)
            .leftJoin(marketChannels, eq(channelSpecificPrices.channelId, marketChannels.id))
            .leftJoin(products, eq(channelSpecificPrices.productId, products.id))
            .where(eq(channelSpecificPrices.tenantId, tenantId))
            .orderBy(desc(channelSpecificPrices.createdAt));

        return { success: true, data };
    } catch (error) {
        logger.error('获取所有渠道专属价失败:', error);
        return { success: false, error: '获取渠道专属价列表失败' };
    }
}

/**
 * 添加渠道专属价
 */
export async function addChannelPrice(productId: string, input: z.infer<typeof channelPriceSchema>) {
    try {
        const tenantId = await getTenantIdFromSession();
        if (!tenantId) return { success: false, error: '未授权' };

        const validated = channelPriceSchema.parse(input);

        // 检查是否已存在
        const [existing] = await db
            .select()
            .from(channelSpecificPrices)
            .where(and(
                eq(channelSpecificPrices.productId, productId),
                eq(channelSpecificPrices.channelId, validated.channelId),
                eq(channelSpecificPrices.tenantId, tenantId)
            ));

        if (existing) {
            return { success: false, error: '该渠道已存在专属价' };
        }

        const [created] = await db
            .insert(channelSpecificPrices)
            .values({
                tenantId,
                productId,
                channelId: validated.channelId,
                specialPrice: String(validated.specialPrice),
            })
            .returning();

        const session = await auth();
        await AuditService.log(db, {
            tenantId,
            userId: session?.user?.id || 'system',
            tableName: 'channel_specific_prices',
            recordId: created.id,
            action: 'CREATE',
            newValues: created
        });

        revalidatePath(`/products/${productId}`);
        return { success: true, data: created };
    } catch (error) {
        logger.error('添加渠道专属价失败:', error);
        return { success: false, error: '添加渠道专属价失败' };
    }
}

/**
 * 更新渠道专属价
 */
export async function updateChannelPrice(id: string, input: z.infer<typeof updateChannelPriceSchema>) {
    try {
        const tenantId = await getTenantIdFromSession();
        if (!tenantId) return { success: false, error: '未授权' };

        const validated = updateChannelPriceSchema.parse(input);

        const [updated] = await db
            .update(channelSpecificPrices)
            .set({
                specialPrice: String(validated.specialPrice),
                isActive: validated.isActive,
            })
            .where(and(
                eq(channelSpecificPrices.id, id),
                eq(channelSpecificPrices.tenantId, tenantId)
            ))
            .returning();

        const session = await auth();
        await AuditService.log(db, {
            tenantId,
            userId: session?.user?.id || 'system',
            tableName: 'channel_specific_prices',
            recordId: updated.id,
            action: 'UPDATE',
            newValues: { specialPrice: validated.specialPrice, isActive: validated.isActive },
            oldValues: { id }
        });

        revalidatePath('/products');
        return { success: true, data: updated };
    } catch (error) {
        logger.error('更新渠道专属价失败:', error);
        return { success: false, error: '更新渠道专属价失败' };
    }
}

/**
 * 删除渠道专属价
 */
export async function removeChannelPrice(id: string) {
    try {
        const tenantId = await getTenantIdFromSession();
        if (!tenantId) return { success: false, error: '未授权' };

        await db
            .delete(channelSpecificPrices)
            .where(and(
                eq(channelSpecificPrices.id, id),
                eq(channelSpecificPrices.tenantId, tenantId)
            ));

        const session = await auth();
        await AuditService.log(db, {
            tenantId,
            userId: session?.user?.id || 'system',
            tableName: 'channel_specific_prices',
            recordId: id,
            action: 'DELETE',
            oldValues: { id }
        });

        revalidatePath('/products');
        return { success: true };
    } catch (error) {
        logger.error('删除渠道专属价失败:', error);
        return { success: false, error: '删除渠道专属价失败' };
    }
}

// =============================================
// 价格查询辅助
// =============================================

/**
 * 获取商品的最终价格（考虑渠道专属价）
 */
export async function getProductPriceForChannel(productId: string, channelId?: string) {
    try {
        const tenantId = await getTenantIdFromSession();
        if (!tenantId) return { success: false, error: '未授权' };

        // 获取商品基础价格
        const [product] = await db
            .select({
                retailPrice: products.retailPrice,
                channelPrice: products.channelPrice,
                channelPriceMode: products.channelPriceMode,
                channelDiscountRate: products.channelDiscountRate,
            })
            .from(products)
            .where(and(
                eq(products.id, productId),
                eq(products.tenantId, tenantId)
            ));

        if (!product) return { success: false, error: '商品不存在' };

        // 如果没有指定渠道，返回零售价
        if (!channelId) {
            return {
                success: true,
                data: {
                    price: parseFloat(product.retailPrice || '0'),
                    priceType: 'RETAIL',
                }
            };
        }

        // 查找渠道专属价
        const [specificPrice] = await db
            .select()
            .from(channelSpecificPrices)
            .where(and(
                eq(channelSpecificPrices.productId, productId),
                eq(channelSpecificPrices.channelId, channelId),
                eq(channelSpecificPrices.tenantId, tenantId),
                eq(channelSpecificPrices.isActive, true)
            ));

        if (specificPrice) {
            return {
                success: true,
                data: {
                    price: parseFloat(specificPrice.specialPrice),
                    priceType: 'SPECIAL',
                }
            };
        }

        // 使用标准渠道价
        let channelFinalPrice: number;
        if (product.channelPriceMode === 'DISCOUNT') {
            const discountRate = parseFloat(product.channelDiscountRate || '1');
            channelFinalPrice = parseFloat(product.retailPrice || '0') * discountRate;
        } else {
            channelFinalPrice = parseFloat(product.channelPrice || '0');
        }

        return {
            success: true,
            data: {
                price: channelFinalPrice,
                priceType: 'CHANNEL',
            }
        };
    } catch (error) {
        logger.error('获取商品价格失败:', error);
        return { success: false, error: '获取商品价格失败' };
    }
}
