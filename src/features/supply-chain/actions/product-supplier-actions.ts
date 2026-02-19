'use server';

/**
 * 商品-供应商关联管理 (Product-Supplier Association)
 *
 * 管理 productSuppliers 表的 CRUD 操作，
 * 支持设置默认供应商、采购价格、前置期等信息。
 */

import { db } from '@/shared/api/db';
import {
    productSuppliers,
    suppliers,
} from '@/shared/api/schema';
import { products } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { auth, checkPermission } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { PERMISSIONS } from '@/shared/config/permissions';
import { AuditService } from '@/shared/lib/audit-service';

// ============ Schema 定义 ============

/** 新增/更新 商品-供应商关联的校验 Schema */
const productSupplierSchema = z.object({
    productId: z.string().uuid('商品 ID 无效'),
    supplierId: z.string().uuid('供应商 ID 无效'),
    purchasePrice: z.coerce.number().min(0, '采购价不能为负').optional(),
    logisticsCost: z.coerce.number().min(0, '物流成本不能为负').optional(),
    processingCost: z.coerce.number().min(0, '加工成本不能为负').optional(),
    leadTimeDays: z.coerce.number().int().min(0, '前置期不能为负').optional(),
    minOrderQuantity: z.coerce.number().min(0, '最小订货量不能为负').optional(),
    isDefault: z.boolean().optional(),
});

/** 更新时部分字段可选 */
const updateProductSupplierSchema = productSupplierSchema.partial().omit({
    productId: true,
    supplierId: true,
});

// ============ 查询 ============

/**
 * 获取指定商品的所有活跃供应商关联信息
 *
 * @description 返回包含供应商基本资料（名称、联系人等）及关联属性（价格、前置期等）的列表。
 * @param productId 商品 ID
 * @returns 格式化后的关联信息列表
 */
export async function getProductSuppliers(productId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权', data: [] };

    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);
    } catch {
        return { success: false, error: '无供应链查看权限', data: [] };
    }

    const tenantId = session.user.tenantId;

    const results = await db.select({
        ps: productSuppliers,
        supplier: {
            id: suppliers.id,
            name: suppliers.name,
            contactPerson: suppliers.contactPerson,
            phone: suppliers.phone,
        },
    })
        .from(productSuppliers)
        .leftJoin(suppliers, eq(productSuppliers.supplierId, suppliers.id))
        .where(and(
            eq(productSuppliers.productId, productId),
            eq(productSuppliers.tenantId, tenantId),
            eq(productSuppliers.isActive, true)
        ))
        .orderBy(desc(productSuppliers.createdAt));

    const data = results.map(r => ({
        id: r.ps.id,
        supplierId: r.ps.supplierId,
        supplierName: r.supplier?.name || '未知供应商',
        contactPerson: r.supplier?.contactPerson || '-',
        phone: r.supplier?.phone || '-',
        purchasePrice: r.ps.purchasePrice ? Number(r.ps.purchasePrice) : null,
        logisticsCost: r.ps.logisticsCost ? Number(r.ps.logisticsCost) : null,
        processingCost: r.ps.processingCost ? Number(r.ps.processingCost) : null,
        leadTimeDays: r.ps.leadTimeDays,
        minOrderQuantity: r.ps.minOrderQuantity ? Number(r.ps.minOrderQuantity) : null,
        isDefault: r.ps.isDefault ?? false,
        createdAt: r.ps.createdAt,
    }));

    return { success: true, data };
}

// ============ 新增 ============

/**
 * 建立商品与供应商的关联
 *
 * @description 校验规则：
 * 1. 同一商品下同一活跃供应商不可重复。
 * 2. 若设为默认，自动取消该商品下其他供应商的默认标记。
 * 3. 包含审计日志记录。
 * 
 * @param data 关联信息（支持采购价、物流费、加工费、前置期及最小订货量）
 */
export async function addProductSupplier(data: z.infer<typeof productSupplierSchema>) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权' };

    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.MANAGE);
    } catch {
        return { success: false, error: '无供应链管理权限' };
    }

    const parsed = productSupplierSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || '输入校验失败' };
    }

    const { productId, supplierId, purchasePrice, logisticsCost, processingCost, leadTimeDays, minOrderQuantity, isDefault } = parsed.data;
    const tenantId = session.user.tenantId;

    // 检查是否已存在活跃关联
    const [existing] = await db.select({ id: productSuppliers.id })
        .from(productSuppliers)
        .where(and(
            eq(productSuppliers.productId, productId),
            eq(productSuppliers.supplierId, supplierId),
            eq(productSuppliers.tenantId, tenantId),
            eq(productSuppliers.isActive, true)
        ))
        .limit(1);

    if (existing) {
        return { success: false, error: '该供应商已关联此商品' };
    }

    // 验证商品和供应商存在
    const [product] = await db.select({ id: products.id })
        .from(products)
        .where(and(eq(products.id, productId), eq(products.tenantId, tenantId)))
        .limit(1);
    if (!product) return { success: false, error: '商品不存在' };

    const [supplier] = await db.select({ id: suppliers.id })
        .from(suppliers)
        .where(and(eq(suppliers.id, supplierId), eq(suppliers.tenantId, tenantId)))
        .limit(1);
    if (!supplier) return { success: false, error: '供应商不存在' };

    await db.transaction(async (tx) => {
        // 如果设为默认，先清除该商品其他默认标记
        if (isDefault) {
            await tx.update(productSuppliers)
                .set({ isDefault: false })
                .where(and(
                    eq(productSuppliers.productId, productId),
                    eq(productSuppliers.tenantId, tenantId),
                    eq(productSuppliers.isActive, true)
                ));
        }

        const [inserted] = await tx.insert(productSuppliers).values({
            tenantId,
            productId,
            supplierId,
            purchasePrice: purchasePrice?.toString() ?? null,
            logisticsCost: logisticsCost?.toString() ?? null,
            processingCost: processingCost?.toString() ?? null,
            leadTimeDays: leadTimeDays ?? 7,
            minOrderQuantity: minOrderQuantity?.toString() ?? null,
            isDefault: isDefault ?? false,
        }).returning();

        // 添加审计日志
        await AuditService.recordFromSession(session, 'productSuppliers', inserted.id, 'CREATE', {
            new: {
                productId,
                supplierId,
                purchasePrice,
                isDefault: isDefault ?? false
            }
        }, tx);
    });

    revalidatePath(`/products/${productId}`);
    return { success: true };
}

// ============ 更新 ============

/**
 * 更新已有的商品-供应商关联信息
 *
 * @description 仅支持更新采购成本、物理指标及默认状态。
 * 若更新为默认供应商，将同步处理同一商品下的其他关联。
 * 
 * @param id 关联记录的 ID
 * @param data 待更新的字段
 */
export async function updateProductSupplier(
    id: string,
    data: z.infer<typeof updateProductSupplierSchema>
) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权' };

    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.MANAGE);
    } catch {
        return { success: false, error: '无供应链管理权限' };
    }

    const parsed = updateProductSupplierSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || '输入校验失败' };
    }

    const tenantId = session.user.tenantId;

    // 检查关联存在性 + 租户隔离
    const [existing] = await db.select({
        id: productSuppliers.id,
        productId: productSuppliers.productId,
    })
        .from(productSuppliers)
        .where(and(
            eq(productSuppliers.id, id),
            eq(productSuppliers.tenantId, tenantId)
        ))
        .limit(1);

    if (!existing) {
        return { success: false, error: '关联记录不存在' };
    }

    const updateFields: Record<string, unknown> = {};

    if (parsed.data.purchasePrice !== undefined)
        updateFields.purchasePrice = parsed.data.purchasePrice.toString();
    if (parsed.data.logisticsCost !== undefined)
        updateFields.logisticsCost = parsed.data.logisticsCost.toString();
    if (parsed.data.processingCost !== undefined)
        updateFields.processingCost = parsed.data.processingCost.toString();
    if (parsed.data.leadTimeDays !== undefined)
        updateFields.leadTimeDays = parsed.data.leadTimeDays;
    if (parsed.data.minOrderQuantity !== undefined)
        updateFields.minOrderQuantity = parsed.data.minOrderQuantity.toString();

    await db.transaction(async (tx) => {
        // 如果设为默认，先取消同商品其他默认
        if (parsed.data.isDefault === true) {
            await tx.update(productSuppliers)
                .set({ isDefault: false })
                .where(and(
                    eq(productSuppliers.productId, existing.productId),
                    eq(productSuppliers.tenantId, tenantId),
                    eq(productSuppliers.isActive, true)
                ));
            updateFields.isDefault = true;
        } else if (parsed.data.isDefault === false) {
            updateFields.isDefault = false;
        }

        await tx.update(productSuppliers)
            .set(updateFields)
            .where(and(
                eq(productSuppliers.id, id),
                eq(productSuppliers.tenantId, tenantId)
            ));

        // 添加审计日志
        await AuditService.recordFromSession(session, 'productSuppliers', id, 'UPDATE', {
            new: updateFields
        }, tx);
    });

    revalidatePath(`/products/${existing.productId}`);
    return { success: true };
}

// ============ 删除（软删除）============

/**
 * 移除商品-供应商关联
 * 
 * @description 采用软删除方式（isActive = false），并保留审计追踪。
 * @param id 关联记录的 ID
 */
export async function removeProductSupplier(id: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权' };

    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.MANAGE);
    } catch {
        return { success: false, error: '无供应链管理权限' };
    }

    const tenantId = session.user.tenantId;

    const [existing] = await db.select({ id: productSuppliers.id })
        .from(productSuppliers)
        .where(and(
            eq(productSuppliers.id, id),
            eq(productSuppliers.tenantId, tenantId)
        ))
        .limit(1);

    if (!existing) {
        return { success: false, error: '关联记录不存在' };
    }

    await db.update(productSuppliers)
        .set({ isActive: false })
        .where(and(
            eq(productSuppliers.id, id),
            eq(productSuppliers.tenantId, tenantId)
        ));

    // 添加审计日志
    await AuditService.recordFromSession(session, 'productSuppliers', id, 'DELETE');

    return { success: true };
}

// ============ 设置默认供应商 ============

/**
 * 设为默认供应商
 *
 * @description 原子化操作：先清除该商品所有关联的默认标记，再将目标关联设为默认。
 * @param productId 商品 ID
 * @param supplierId 供应商 ID
 */
export async function setDefaultSupplier(productId: string, supplierId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权' };

    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.MANAGE);
    } catch {
        return { success: false, error: '无供应链管理权限' };
    }

    const tenantId = session.user.tenantId;

    // 检查目标关联是否存在
    const [target] = await db.select({ id: productSuppliers.id })
        .from(productSuppliers)
        .where(and(
            eq(productSuppliers.productId, productId),
            eq(productSuppliers.supplierId, supplierId),
            eq(productSuppliers.tenantId, tenantId),
            eq(productSuppliers.isActive, true)
        ))
        .limit(1);

    if (!target) {
        return { success: false, error: '该供应商未关联此商品' };
    }

    await db.transaction(async (tx) => {
        // 清除该商品所有默认标记
        await tx.update(productSuppliers)
            .set({ isDefault: false })
            .where(and(
                eq(productSuppliers.productId, productId),
                eq(productSuppliers.tenantId, tenantId),
                eq(productSuppliers.isActive, true)
            ));

        // 设置目标为默认
        await tx.update(productSuppliers)
            .set({ isDefault: true })
            .where(eq(productSuppliers.id, target.id));

        // 添加审计日志
        await AuditService.recordFromSession(session, 'productSuppliers', target.id, 'UPDATE', {
            new: { isDefault: true }
        }, tx);
    });

    revalidatePath(`/products/${productId}`);
    return { success: true };
}
