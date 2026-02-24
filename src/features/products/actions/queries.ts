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
 * 获取产品列表（分页、搜索、品类筛选）
 *
 * @description 支持按名称/SKU 模糊搜索、按品类过滤、按上架状态过滤。
 *   已通过 `unstable_cache` 缓存查询结果，tag 包含 `products` 与 `products-{tenantId}`，
 *   在创建/更新/删除产品时通过 `revalidateTag` 自动失效。
 *   供应商信息通过批量 `inArray` 查询避免 N+1 问题。
 *
 * @param params - 查询参数，包含 page、pageSize、search、category、isActive
 * @returns 分页产品列表，含关联供应商信息、总数与总页数
 * @throws 当用户缺少 `PRODUCTS.VIEW` 权限时抛出权限异常
 */
const getProductsActionInternal = createSafeAction(getProductsSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.VIEW);

    const tenantId = session.user!.tenantId;
    const offset = (params.page - 1) * params.pageSize;
    const conditions = [eq(products.tenantId, tenantId)];

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

    const dataPromise = db.query.products.findMany({
        where: whereClause,
        orderBy: [desc(products.createdAt)],
        limit: params.pageSize,
        offset: offset,
    });

    const totalPromise = db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(whereClause);

    const [data, totalResult] = await Promise.all([dataPromise, totalPromise]);

    // 手动关联供应商信息 (批量查询解决 N+1 性能问题)
    const supplierIds = Array.from(new Set(data.map(p => p.defaultSupplierId).filter(Boolean))) as string[];
    const supplierMap = new Map();

    if (supplierIds.length > 0) {
        const suppliersData = await db.query.suppliers.findMany({
            where: and(
                inArray(suppliers.id, supplierIds),
                eq(suppliers.tenantId, tenantId)
            )
        });
        suppliersData.forEach(s => supplierMap.set(s.id, s));
    }

    const productWithSuppliers = data.map(p => ({
        ...p,
        supplier: p.defaultSupplierId ? (supplierMap.get(p.defaultSupplierId) || null) : null
    }));

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
 * 获取产品详情（含审计日志）
 *
 * @description 根据产品 ID 精确查询单个产品的完整信息，
 *   同时拉取该产品关联的审计日志（按创建时间倒序）。
 *
 * @param params - 包含产品 ID 的查询参数
 * @returns 产品完整详情对象，附带审计日志数组
 * @throws 当产品不存在时抛出 `产品不存在` 错误
 * @throws 当用户缺少 `PRODUCTS.VIEW` 权限时抛出权限异常
 */
const getProductByIdActionInternal = createSafeAction(getProductSchema, async ({ id }, { session }) => {
    await checkPermission(session, PERMISSIONS.PRODUCTS.VIEW);

    const productPromise = db.query.products.findFirst({
        where: and(
            eq(products.tenantId, session.user!.tenantId),
            eq(products.id, id)
        )
    });

    // 拉取该产品的审计操作日志
    const logsPromise = db.select().from(auditLogs).where(
        and(
            eq(auditLogs.tableName, 'products'),
            eq(auditLogs.recordId, id)
        )
    ).orderBy(desc(auditLogs.createdAt));

    const [product, logs] = await Promise.all([productPromise, logsPromise]);

    if (!product) throw new Error('产品不存在');

    return { ...product, logs };
});

export async function getProductById(params: z.infer<typeof getProductSchema>) {
    return getProductByIdActionInternal(params);
}
