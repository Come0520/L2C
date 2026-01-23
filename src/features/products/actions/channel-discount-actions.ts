'use server';

/**
 * 渠道等级折扣 Server Actions
 * 
 * 提供渠道等级折扣的配置管理功能：
 * - 全局默认折扣配置（存储在 tenants.settings）
 * - 品类/商品覆盖规则（存储在 channel_discount_overrides 表）
 */

import { db } from '@/shared/api/db';
import { channelDiscountOverrides } from '@/shared/api/schema/supply-chain';
import { tenants } from '@/shared/api/schema/infrastructure';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// =============================================
// Schema 定义
// =============================================

/**
 * 全局折扣配置 Schema
 */
const globalDiscountSchema = z.object({
    sLevel: z.number().min(0).max(200),
    aLevel: z.number().min(0).max(200),
    bLevel: z.number().min(0).max(200),
    cLevel: z.number().min(0).max(200),
    // 特殊规则
    packageNoDiscount: z.boolean().optional(),
    bundleSeparateDiscount: z.boolean().optional(),
});

/**
 * 覆盖规则 Schema
 */
const overrideSchema = z.object({
    scope: z.enum(['CATEGORY', 'PRODUCT']),
    targetId: z.string().min(1),
    targetName: z.string().optional(),
    sLevelDiscount: z.number().min(0).max(200).optional(),
    aLevelDiscount: z.number().min(0).max(200).optional(),
    bLevelDiscount: z.number().min(0).max(200).optional(),
    cLevelDiscount: z.number().min(0).max(200).optional(),
});

// =============================================
// 辅助函数
// =============================================

/**
 * 获取当前用户的 tenantId
 */
async function getTenantIdFromSession(): Promise<string> {
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('未授权访问');
    }
    return session.user.tenantId;
}

// =============================================
// 全局折扣配置
// =============================================

/**
 * 获取全局渠道折扣配置
 */
export async function getGlobalDiscountConfig() {
    try {
        const tenantId = await getTenantIdFromSession();

        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId),
        });

        if (!tenant) {
            throw new Error('租户不存在');
        }

        // 从 settings JSONB 中获取折扣配置
        const settings = tenant.settings as Record<string, unknown> || {};
        const discountConfig = settings.channelDiscounts as Record<string, unknown> || {};

        return {
            data: {
                sLevel: Number(discountConfig.sLevel) || 95,
                aLevel: Number(discountConfig.aLevel) || 98,
                bLevel: Number(discountConfig.bLevel) || 100,
                cLevel: Number(discountConfig.cLevel) || 102,
                packageNoDiscount: Boolean(discountConfig.packageNoDiscount),
                bundleSeparateDiscount: Boolean(discountConfig.bundleSeparateDiscount),
            }
        };
    } catch (error) {
        return { error: error instanceof Error ? error.message : '获取配置失败' };
    }
}

/**
 * 更新全局渠道折扣配置
 */
export async function updateGlobalDiscountConfig(input: z.infer<typeof globalDiscountSchema>) {
    try {
        const tenantId = await getTenantIdFromSession();
        const validated = globalDiscountSchema.parse(input);

        // 获取当前 settings
        const tenant = await db.query.tenants.findFirst({
            where: eq(tenants.id, tenantId),
        });

        if (!tenant) {
            throw new Error('租户不存在');
        }

        const currentSettings = tenant.settings as Record<string, unknown> || {};

        // 更新 channelDiscounts 配置
        await db.update(tenants)
            .set({
                settings: {
                    ...currentSettings,
                    channelDiscounts: validated,
                },
                updatedAt: new Date(),
            })
            .where(eq(tenants.id, tenantId));

        revalidatePath('/settings/products');
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : '更新配置失败' };
    }
}

// =============================================
// 覆盖规则管理
// =============================================

/**
 * 获取所有覆盖规则
 */
export async function getDiscountOverrides() {
    try {
        const tenantId = await getTenantIdFromSession();

        const overrides = await db.select()
            .from(channelDiscountOverrides)
            .where(eq(channelDiscountOverrides.tenantId, tenantId))
            .orderBy(desc(channelDiscountOverrides.createdAt));

        return { data: overrides };
    } catch (error) {
        return { error: error instanceof Error ? error.message : '获取覆盖规则失败' };
    }
}

/**
 * 创建覆盖规则
 */
export async function createDiscountOverride(input: z.infer<typeof overrideSchema>) {
    try {
        const tenantId = await getTenantIdFromSession();
        const validated = overrideSchema.parse(input);

        // 检查是否已存在相同的覆盖规则
        const existing = await db.query.channelDiscountOverrides.findFirst({
            where: and(
                eq(channelDiscountOverrides.tenantId, tenantId),
                eq(channelDiscountOverrides.scope, validated.scope),
                eq(channelDiscountOverrides.targetId, validated.targetId)
            ),
        });

        if (existing) {
            throw new Error('该覆盖规则已存在');
        }

        const [override] = await db.insert(channelDiscountOverrides)
            .values({
                tenantId,
                scope: validated.scope,
                targetId: validated.targetId,
                targetName: validated.targetName,
                sLevelDiscount: validated.sLevelDiscount?.toString(),
                aLevelDiscount: validated.aLevelDiscount?.toString(),
                bLevelDiscount: validated.bLevelDiscount?.toString(),
                cLevelDiscount: validated.cLevelDiscount?.toString(),
            })
            .returning();

        revalidatePath('/settings/products');
        return { data: override };
    } catch (error) {
        return { error: error instanceof Error ? error.message : '创建覆盖规则失败' };
    }
}

/**
 * 更新覆盖规则
 */
export async function updateDiscountOverride(
    id: string,
    input: Partial<z.infer<typeof overrideSchema>>
) {
    try {
        const tenantId = await getTenantIdFromSession();

        // 验证规则存在且属于当前租户
        const existing = await db.query.channelDiscountOverrides.findFirst({
            where: and(
                eq(channelDiscountOverrides.id, id),
                eq(channelDiscountOverrides.tenantId, tenantId)
            ),
        });

        if (!existing) {
            throw new Error('覆盖规则不存在');
        }

        const [updated] = await db.update(channelDiscountOverrides)
            .set({
                ...(input.targetName !== undefined && { targetName: input.targetName }),
                ...(input.sLevelDiscount !== undefined && { sLevelDiscount: input.sLevelDiscount.toString() }),
                ...(input.aLevelDiscount !== undefined && { aLevelDiscount: input.aLevelDiscount.toString() }),
                ...(input.bLevelDiscount !== undefined && { bLevelDiscount: input.bLevelDiscount.toString() }),
                ...(input.cLevelDiscount !== undefined && { cLevelDiscount: input.cLevelDiscount.toString() }),
                updatedAt: new Date(),
            })
            .where(eq(channelDiscountOverrides.id, id))
            .returning();

        revalidatePath('/settings/products');
        return { data: updated };
    } catch (error) {
        return { error: error instanceof Error ? error.message : '更新覆盖规则失败' };
    }
}

/**
 * 删除覆盖规则
 */
export async function deleteDiscountOverride(id: string) {
    try {
        const tenantId = await getTenantIdFromSession();

        // 验证规则存在且属于当前租户
        const existing = await db.query.channelDiscountOverrides.findFirst({
            where: and(
                eq(channelDiscountOverrides.id, id),
                eq(channelDiscountOverrides.tenantId, tenantId)
            ),
        });

        if (!existing) {
            throw new Error('覆盖规则不存在');
        }

        await db.delete(channelDiscountOverrides)
            .where(eq(channelDiscountOverrides.id, id));

        revalidatePath('/settings/products');
        return { success: true };
    } catch (error) {
        return { error: error instanceof Error ? error.message : '删除覆盖规则失败' };
    }
}

// =============================================
// 折扣计算辅助
// =============================================

/**
 * 获取商品的最终折扣率
 * 
 * 优先级：商品级覆盖 > 品类级覆盖 > 全局默认
 * 
 * @param productId 商品ID
 * @param category 商品品类
 * @param channelLevel 渠道等级 (S/A/B/C)
 */
export async function getProductDiscountRate(
    productId: string,
    category: string,
    channelLevel: 'S' | 'A' | 'B' | 'C'
) {
    try {
        const tenantId = await getTenantIdFromSession();

        // 1. 获取全局配置
        const globalResult = await getGlobalDiscountConfig();
        if (globalResult.error) {
            throw new Error(globalResult.error);
        }
        const globalConfig = globalResult.data!;

        // 2. 查找商品级覆盖
        const productOverride = await db.query.channelDiscountOverrides.findFirst({
            where: and(
                eq(channelDiscountOverrides.tenantId, tenantId),
                eq(channelDiscountOverrides.scope, 'PRODUCT'),
                eq(channelDiscountOverrides.targetId, productId),
                eq(channelDiscountOverrides.isActive, true)
            ),
        });

        if (productOverride) {
            const levelKey = `${channelLevel.toLowerCase()}LevelDiscount` as keyof typeof productOverride;
            const discount = productOverride[levelKey];
            if (discount !== null && discount !== undefined) {
                return { data: Number(discount) };
            }
        }

        // 3. 查找品类级覆盖
        const categoryOverride = await db.query.channelDiscountOverrides.findFirst({
            where: and(
                eq(channelDiscountOverrides.tenantId, tenantId),
                eq(channelDiscountOverrides.scope, 'CATEGORY'),
                eq(channelDiscountOverrides.targetId, category),
                eq(channelDiscountOverrides.isActive, true)
            ),
        });

        if (categoryOverride) {
            const levelKey = `${channelLevel.toLowerCase()}LevelDiscount` as keyof typeof categoryOverride;
            const discount = categoryOverride[levelKey];
            if (discount !== null && discount !== undefined) {
                return { data: Number(discount) };
            }
        }

        // 4. 返回全局默认
        const globalKey = `${channelLevel.toLowerCase()}Level` as keyof typeof globalConfig;
        return { data: globalConfig[globalKey] as number };
    } catch (error) {
        return { error: error instanceof Error ? error.message : '获取折扣率失败' };
    }
}
