'use server';

import { z } from 'zod';
import { db } from '@/shared/api/db';
import { products, suppliers, auditLogs } from '@/shared/api/schema';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { PERMISSIONS } from '@/shared/config/permissions';
import { getProductsSchema, getProductSchema } from '../schema';

/**
 * 获取产品列表
 */
const getProductsActionInternal = createSafeAction(getProductsSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.VIEW);

    const offset = (params.page - 1) * params.pageSize;
    const conditions = [eq(products.tenantId, session.user!.tenantId)];

    if (params.search) {
        conditions.push(
            sql`(${products.name} ILIKE ${`%${params.search}%`} OR ${products.sku} ILIKE ${`%${params.search}%`})`
        );
    }

    if (params.category && params.category !== 'ALL') {
        conditions.push(eq(products.category, params.category as "CURTAIN" | "WALLPAPER" | "WALLCLOTH" | "MATTRESS" | "OTHER" | "CURTAIN_FABRIC" | "CURTAIN_SHEER" | "CURTAIN_TRACK" | "MOTOR" | "CURTAIN_ACCESSORY"));
    }

    if (params.isActive !== undefined) {
        conditions.push(eq(products.isActive, params.isActive));
    }

    const whereClause = and(...conditions);

    const data = await db.query.products.findMany({
        where: whereClause,
        orderBy: [desc(products.createdAt)],
        limit: params.pageSize,
        offset: offset,
    });

    // 手动关联供应商信息 (解决 N+1 查询性能问题)
    const supplierIds = Array.from(new Set(data.map(p => p.defaultSupplierId).filter(Boolean))) as string[];
    const supplierMap = new Map();

    if (supplierIds.length > 0) {
        const suppliersData = await db.query.suppliers.findMany({
            where: and(
                inArray(suppliers.id, supplierIds),
                eq(suppliers.tenantId, session.user!.tenantId)
            )
        });
        suppliersData.forEach(s => supplierMap.set(s.id, s));
    }

    const productWithSuppliers = data.map(p => ({
        ...p,
        supplier: p.defaultSupplierId ? (supplierMap.get(p.defaultSupplierId) || null) : null
    }));

    const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(whereClause);

    const total = Number(totalResult[0]?.count || 0);

    return {
        data: productWithSuppliers,
        total,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: Math.ceil(total / params.pageSize),
    };
});

export async function getProducts(params: z.infer<typeof getProductsSchema>) {
    return getProductsActionInternal(params);
}

/**
 * 获取产品详情
 */
const getProductByIdActionInternal = createSafeAction(getProductSchema, async ({ id }, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.VIEW);

    const product = await db.query.products.findFirst({
        where: and(
            eq(products.tenantId, session.user!.tenantId),
            eq(products.id, id)
        )
    });

    if (!product) throw new Error('产品不存在');

    // Fetch Audit Logs
    const logs = await db.select().from(auditLogs).where(
        and(
            eq(auditLogs.tableName, 'products'),
            eq(auditLogs.recordId, id)
        )
    ).orderBy(desc(auditLogs.createdAt));

    return { ...product, logs };
});

export async function getProductById(params: z.infer<typeof getProductSchema>) {
    return getProductByIdActionInternal(params);
}
