'use server';
import { logger } from "@/shared/lib/logger";

/**
 * 套餐管理 Server Actions
 * 
 * 提供套餐的 CRUD 操作、套餐商品关联管理和价格计算功能
 */

import { db } from '@/shared/api/db';
import { productPackages, packageProducts } from '@/shared/api/schema/supply-chain';
import { products } from '@/shared/api/schema/catalogs';
import { eq, and, desc } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { AuditService } from '@/shared/services/audit-service';

// =============================================
// Schema 定义
// =============================================

export const createPackageSchema = z.object({
    packageNo: z.string().min(1, '套餐编号不能为空'),
    packageName: z.string().min(1, '套餐名称不能为空'),
    packageType: z.enum(['QUANTITY', 'COMBO', 'CATEGORY', 'TIME_LIMITED']),
    packagePrice: z.string().or(z.number()),
    originalPrice: z.string().or(z.number()).optional(),
    description: z.string().optional(),
    rules: z.record(z.string(), z.unknown()).optional(),
    overflowMode: z.enum(['FIXED_PRICE', 'IGNORE', 'ORIGINAL', 'DISCOUNT']).optional(),
    overflowPrice: z.string().or(z.number()).optional(),
    overflowDiscountRate: z.string().or(z.number()).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

const updatePackageSchema = createPackageSchema.partial();

const packageProductSchema = z.object({
    productId: z.string().uuid(),
    isRequired: z.boolean().optional(),
    minQuantity: z.string().or(z.number()).optional(),
    maxQuantity: z.string().or(z.number()).optional(),
});

// 辅助函数：获取 tenantId
async function getTenantIdFromSession() {
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('未授权');
    }
    return session.user.tenantId;
}

// =============================================
// 套餐 CRUD
// =============================================

/**
 * 获取套餐列表
 */
export async function getPackages() {
    try {
        const tenantId = await getTenantIdFromSession();

        const data = await db
            .select()
            .from(productPackages)
            .where(eq(productPackages.tenantId, tenantId))
            .orderBy(desc(productPackages.createdAt));

        return { success: true, data };
    } catch (error) {
        logger.error('获取套餐列表失败:', error);
        return { success: false, error: '获取套餐列表失败' };
    }
}

/**
 * 获取套餐详情
 */
export async function getPackageById(id: string) {
    try {
        const tenantId = await getTenantIdFromSession();
        if (!tenantId) return { success: false, error: '未授权' };

        const [data] = await db
            .select()
            .from(productPackages)
            .where(and(
                eq(productPackages.id, id),
                eq(productPackages.tenantId, tenantId)
            ));

        if (!data) return { success: false, error: '套餐不存在' };

        // 获取套餐关联的商品
        const packageProductsList = await db
            .select({
                id: packageProducts.id,
                productId: packageProducts.productId,
                isRequired: packageProducts.isRequired,
                minQuantity: packageProducts.minQuantity,
                maxQuantity: packageProducts.maxQuantity,
                product: {
                    id: products.id,
                    sku: products.sku,
                    name: products.name,
                    retailPrice: products.retailPrice,
                }
            })
            .from(packageProducts)
            .leftJoin(products, eq(packageProducts.productId, products.id))
            .where(eq(packageProducts.packageId, id));

        return { success: true, data: { ...data, products: packageProductsList } };
    } catch (error) {
        logger.error('获取套餐详情失败:', error);
        return { success: false, error: '获取套餐详情失败' };
    }
}

/**
 * 创建套餐
 */
export async function createPackage(input: z.infer<typeof createPackageSchema>) {
    try {
        const session = await auth();
        if (!session?.user?.tenantId || !session?.user?.id) return { success: false, error: '未授权' };
        const tenantId = session.user.tenantId;

        const validated = createPackageSchema.parse(input);

        const [created] = await db
            .insert(productPackages)
            .values({
                tenantId,
                packageNo: validated.packageNo,
                packageName: validated.packageName,
                packageType: validated.packageType,
                packagePrice: String(validated.packagePrice),
                originalPrice: validated.originalPrice ? String(validated.originalPrice) : undefined,
                description: validated.description,
                rules: validated.rules || {},
                overflowMode: validated.overflowMode,
                overflowPrice: validated.overflowPrice ? String(validated.overflowPrice) : undefined,
                overflowDiscountRate: validated.overflowDiscountRate ? String(validated.overflowDiscountRate) : undefined,
                startDate: validated.startDate ? new Date(validated.startDate) : undefined,
                endDate: validated.endDate ? new Date(validated.endDate) : undefined,
            })
            .returning();

        await AuditService.log(db, {
            tenantId,
            userId: session.user.id,
            tableName: 'product_packages',
            recordId: created.id,
            action: 'CREATE',
            newValues: { packageData: created }
        });

        revalidatePath('/products/packages');
        return { success: true, data: created };
    } catch (error) {
        logger.error('创建套餐失败:', error);
        return { success: false, error: '创建套餐失败' };
    }
}

/**
 * 更新套餐
 */
export async function updatePackage(id: string, input: z.infer<typeof updatePackageSchema>) {
    try {
        const session = await auth();
        if (!session?.user?.tenantId || !session?.user?.id) return { success: false, error: '未授权' };
        const tenantId = session.user.tenantId;

        const validated = updatePackageSchema.parse(input);

        const updateData: Record<string, unknown> = {};
        if (validated.packageNo) updateData.packageNo = validated.packageNo;
        if (validated.packageName) updateData.packageName = validated.packageName;
        if (validated.packageType) updateData.packageType = validated.packageType;
        if (validated.packagePrice) updateData.packagePrice = String(validated.packagePrice);
        if (validated.originalPrice) updateData.originalPrice = String(validated.originalPrice);
        if (validated.description !== undefined) updateData.description = validated.description;
        if (validated.rules) updateData.rules = validated.rules;
        if (validated.overflowMode) updateData.overflowMode = validated.overflowMode;
        if (validated.overflowPrice) updateData.overflowPrice = String(validated.overflowPrice);
        if (validated.overflowDiscountRate) updateData.overflowDiscountRate = String(validated.overflowDiscountRate);
        if (validated.startDate) updateData.startDate = new Date(validated.startDate);
        if (validated.endDate) updateData.endDate = new Date(validated.endDate);

        const [updated] = await db
            .update(productPackages)
            .set({ ...updateData, updatedAt: new Date() })
            .where(and(
                eq(productPackages.id, id),
                eq(productPackages.tenantId, tenantId)
            ))
            .returning();

        await AuditService.log(db, {
            tenantId,
            userId: session.user.id,
            tableName: 'product_packages',
            recordId: id,
            action: 'UPDATE',
            newValues: { updatedFields: updateData }
        });

        revalidatePath('/products/packages');
        return { success: true, data: updated };
    } catch (error) {
        logger.error('更新套餐失败:', error);
        return { success: false, error: '更新套餐失败' };
    }
}

/**
 * 删除套餐
 */
export async function deletePackage(id: string) {
    try {
        const session = await auth();
        if (!session?.user?.tenantId || !session?.user?.id) return { success: false, error: '未授权' };
        const tenantId = session.user.tenantId;

        // 先删除关联的商品
        await db
            .delete(packageProducts)
            .where(eq(packageProducts.packageId, id));

        // 再删除套餐
        await db
            .delete(productPackages)
            .where(and(
                eq(productPackages.id, id),
                eq(productPackages.tenantId, tenantId)
            ));

        await AuditService.log(db, {
            tenantId,
            userId: session.user.id,
            tableName: 'product_packages',
            recordId: id,
            action: 'DELETE',
            newValues: { action: 'PACKAGE_DELETED' }
        });

        revalidatePath('/products/packages');
        return { success: true };
    } catch (error) {
        logger.error('删除套餐失败:', error);
        return { success: false, error: '删除套餐失败' };
    }
}

/**
 * 切换套餐状态（启用/禁用）
 */
export async function togglePackageStatus(id: string, isActive: boolean) {
    try {
        const session = await auth();
        if (!session?.user?.tenantId || !session?.user?.id) return { success: false, error: '未授权' };
        const tenantId = session.user.tenantId;

        const [updated] = await db
            .update(productPackages)
            .set({ isActive, updatedAt: new Date() })
            .where(and(
                eq(productPackages.id, id),
                eq(productPackages.tenantId, tenantId)
            ))
            .returning();

        await AuditService.log(db, {
            tenantId,
            userId: session.user.id,
            tableName: 'product_packages',
            recordId: id,
            action: 'UPDATE',
            newValues: { action: 'TOGGLE_STATUS', isActive }
        });

        revalidatePath('/products/packages');
        return { success: true, data: updated };
    } catch (error) {
        logger.error('切换套餐状态失败:', error);
        return { success: false, error: '切换套餐状态失败' };
    }
}

// =============================================
// 套餐商品关联管理
// =============================================

/**
 * 获取套餐商品列表
 */
export async function getPackageProducts(packageId: string) {
    try {
        const data = await db
            .select({
                id: packageProducts.id,
                productId: packageProducts.productId,
                isRequired: packageProducts.isRequired,
                minQuantity: packageProducts.minQuantity,
                maxQuantity: packageProducts.maxQuantity,
                product: {
                    id: products.id,
                    sku: products.sku,
                    name: products.name,
                    retailPrice: products.retailPrice,
                    category: products.category,
                }
            })
            .from(packageProducts)
            .leftJoin(products, eq(packageProducts.productId, products.id))
            .where(eq(packageProducts.packageId, packageId));

        return { success: true, data };
    } catch (error) {
        logger.error('获取套餐商品失败:', error);
        return { success: false, error: '获取套餐商品失败' };
    }
}

/**
 * 添加套餐商品
 */
export async function addPackageProduct(packageId: string, input: z.infer<typeof packageProductSchema>) {
    try {
        const session = await auth();
        if (!session?.user?.tenantId || !session?.user?.id) return { success: false, error: '未授权' };
        const tenantId = session.user.tenantId;

        const validated = packageProductSchema.parse(input);

        const [created] = await db
            .insert(packageProducts)
            .values({
                tenantId,
                packageId,
                productId: validated.productId,
                isRequired: validated.isRequired ?? false,
                minQuantity: validated.minQuantity ? String(validated.minQuantity) : undefined,
                maxQuantity: validated.maxQuantity ? String(validated.maxQuantity) : undefined,
            })
            .returning();

        await AuditService.log(db, {
            tenantId,
            userId: session.user.id,
            tableName: 'product_packages',
            recordId: packageId,
            action: 'CREATE',
            newValues: { action: 'ADD_PRODUCT', product: created }
        });

        revalidatePath('/products/packages');
        return { success: true, data: created };
    } catch (error) {
        logger.error('添加套餐商品失败:', error);
        return { success: false, error: '添加套餐商品失败' };
    }
}

/**
 * 移除套餐商品
 */
export async function removePackageProduct(packageId: string, productId: string) {
    try {
        const session = await auth();
        if (!session?.user?.tenantId || !session?.user?.id) return { success: false, error: '未授权' };
        const tenantId = session.user.tenantId;

        await db
            .delete(packageProducts)
            .where(and(
                eq(packageProducts.packageId, packageId),
                eq(packageProducts.productId, productId)
            ));

        await AuditService.log(db, {
            tenantId,
            userId: session.user.id,
            tableName: 'product_packages',
            recordId: packageId,
            action: 'DELETE',
            newValues: { action: 'REMOVE_PRODUCT', productId }
        });

        revalidatePath('/products/packages');
        return { success: true };
    } catch (error) {
        logger.error('移除套餐商品失败:', error);
        return { success: false, error: '移除套餐商品失败' };
    }
}

// =============================================
// 套餐价格计算
// =============================================

interface PackageItem {
    productId: string;
    quantity: number;
}

/**
 * 计算套餐价格
 * 
 * 根据套餐规则计算最终价格，包括超出处理
 */
export async function calculatePackagePrice(packageId: string, items: PackageItem[]) {
    try {
        const tenantId = await getTenantIdFromSession();
        if (!tenantId) return { success: false, error: '未授权' };

        // 获取套餐信息
        const [pkg] = await db
            .select()
            .from(productPackages)
            .where(and(
                eq(productPackages.id, packageId),
                eq(productPackages.tenantId, tenantId)
            ));

        if (!pkg) return { success: false, error: '套餐不存在' };

        // 获取套餐商品规则
        const pkgProducts = await db
            .select()
            .from(packageProducts)
            .where(eq(packageProducts.packageId, packageId));

        // 获取商品价格信息
        const productPrices = await db
            .select({ id: products.id, retailPrice: products.retailPrice })
            .from(products)
            .where(eq(products.tenantId, tenantId));

        const priceMap = new Map(productPrices.map(p => [p.id, parseFloat(p.retailPrice || '0')]));

        const totalPrice = parseFloat(pkg.packagePrice || '0');
        let overflowAmount = 0;

        // 计算超出部分
        for (const item of items) {
            const rule = pkgProducts.find(p => p.productId === item.productId);
            if (rule && rule.maxQuantity) {
                const maxQty = parseFloat(rule.maxQuantity);
                if (item.quantity > maxQty) {
                    const overflow = item.quantity - maxQty;
                    const unitPrice = priceMap.get(item.productId) || 0;

                    switch (pkg.overflowMode) {
                        case 'FIXED_PRICE':
                            overflowAmount += overflow * parseFloat(pkg.overflowPrice || '0');
                            break;
                        case 'IGNORE':
                            // 不计费
                            break;
                        case 'ORIGINAL':
                            overflowAmount += overflow * unitPrice;
                            break;
                        case 'DISCOUNT':
                        default:
                            const discountRate = parseFloat(pkg.overflowDiscountRate || '1');
                            overflowAmount += overflow * unitPrice * discountRate;
                            break;
                    }
                }
            }
        }

        return {
            success: true,
            data: {
                packagePrice: totalPrice,
                overflowPrice: overflowAmount,
                totalPrice: totalPrice + overflowAmount,
            }
        };
    } catch (error) {
        logger.error('计算套餐价格失败:', error);
        return { success: false, error: '计算套餐价格失败' };
    }
}
