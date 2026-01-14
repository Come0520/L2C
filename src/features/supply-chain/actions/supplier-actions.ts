'use server';

import { db } from '@/shared/api/db';
import { suppliers } from '@/shared/api/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { generateDocNo } from '@/shared/lib/utils';
import { revalidatePath } from 'next/cache';
import { createSafeAction } from '@/shared/lib/server-action';
import { PERMISSIONS } from '@/shared/config/permissions';
import {
    createSupplierSchema,
    getSuppliersSchema,
    getSupplierByIdSchema,
    updateSupplierSchema
} from '../schemas';

/**
 * 供应商管理 - 创建
 */
export const createSupplier = createSafeAction(createSupplierSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.SUPPLIER_MANAGE);

    const existing = await db.query.suppliers.findFirst({
        where: and(
            eq(suppliers.tenantId, session.user.tenantId),
            eq(suppliers.name, data.name)
        )
    });

    if (existing) {
        throw new Error('供应商名称已存在');
    }

    const supplierNo = generateDocNo('SUP');

    const [supplier] = await db.insert(suppliers).values({
        tenantId: session.user.tenantId,
        supplierNo,
        name: data.name,
        contactPerson: data.contactPerson,
        phone: data.phone,
        paymentPeriod: data.paymentPeriod,
        address: data.address,
        remark: data.remark,
        createdBy: session.user.id,
    }).returning();

    revalidatePath('/supply-chain/suppliers');
    return { id: supplier.id };
});

/**
 * 获取供应商列表
 */
export const getSuppliers = createSafeAction(getSuppliersSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);

    const offset = (params.page - 1) * params.pageSize;
    const conditions = [eq(suppliers.tenantId, session.user.tenantId)];

    if (params.query) {
        conditions.push(sql`(${suppliers.name} ILIKE ${`%${params.query}%`} OR ${suppliers.supplierNo} ILIKE ${`%${params.query}%`})`);
    }

    const whereClause = and(...conditions);

    const data = await db.query.suppliers.findMany({
        where: whereClause,
        orderBy: [desc(suppliers.createdAt)],
        limit: params.pageSize,
        offset: offset,
    });

    const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(suppliers)
        .where(whereClause);

    const total = Number(totalResult[0]?.count || 0);

    return {
        data,
        total,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: Math.ceil(total / params.pageSize),
    };
});

/**
 * 获取供应商详情
 */
export const getSupplierById = createSafeAction(getSupplierByIdSchema, async ({ id }, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.SUPPLIER_MANAGE);

    const supplier = await db.query.suppliers.findFirst({
        where: and(
            eq(suppliers.tenantId, session.user.tenantId),
            eq(suppliers.id, id)
        )
    });

    if (!supplier) throw new Error('找不到该供应商');

    return supplier;
});

/**
 * 供应商管理 - 更新
 */
export const updateSupplier = createSafeAction(updateSupplierSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.SUPPLIER_MANAGE);

    const { id, ...updates } = data;

    const [supplier] = await db.update(suppliers)
        .set({
            ...updates,
            updatedAt: new Date(),
        })
        .where(and(
            eq(suppliers.id, id),
            eq(suppliers.tenantId, session.user.tenantId)
        ))
        .returning();

    if (!supplier) throw new Error('更新失败，未找到供应商');

    revalidatePath('/supply-chain/suppliers');
    return { id: supplier.id };
});
