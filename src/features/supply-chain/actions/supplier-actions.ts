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

const createSupplierActionInternal = createSafeAction(createSupplierSchema, async (data, { session }) => {
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
        // [NEW] 供应商类型和加工厂字段
        supplierType: data.supplierType,
        processingPrices: data.processingPrices,
        contractUrl: data.contractUrl,
        contractExpiryDate: data.contractExpiryDate,
        businessLicenseUrl: data.businessLicenseUrl,
        bankAccount: data.bankAccount,
        bankName: data.bankName,

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

export async function createSupplier(params: z.infer<typeof createSupplierSchema>) {
    return createSupplierActionInternal(params);
}

const getSuppliersActionInternal = createSafeAction(getSuppliersSchema, async (params, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);

    const offset = (params.page - 1) * params.pageSize;
    const conditions = [eq(suppliers.tenantId, session.user.tenantId)];

    // [NEW] 类型筛选
    if (params.type && params.type !== 'BOTH') {
        if (params.type === 'PROCESSOR') {
            conditions.push(sql`${suppliers.supplierType} IN ('PROCESSOR', 'BOTH')`);
        } else if (params.type === 'SUPPLIER') {
            conditions.push(sql`${suppliers.supplierType} IN ('SUPPLIER', 'BOTH')`);
        }
    }

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

export async function getSuppliers(params: z.infer<typeof getSuppliersSchema>) {
    return getSuppliersActionInternal(params);
}

const getSupplierByIdActionInternal = createSafeAction(getSupplierByIdSchema, async ({ id }, { session }) => {
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

export async function getSupplierById(params: z.infer<typeof getSupplierByIdSchema>) {
    return getSupplierByIdActionInternal(params);
}

const updateSupplierActionInternal = createSafeAction(updateSupplierSchema, async (data, { session }) => {
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

export async function updateSupplier(params: z.infer<typeof updateSupplierSchema>) {
    return updateSupplierActionInternal(params);
}

// ============================================================
// [Supply-02] 供应商评价体系
// ============================================================

import { purchaseOrders, afterSalesTickets, liabilityNotices } from '@/shared/api/schema';
import { count, gte, lte } from 'drizzle-orm';
import { z } from 'zod';

const getSupplierRatingSchema = z.object({
    supplierId: z.string().uuid(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

const getSupplierRatingActionInternal = createSafeAction(getSupplierRatingSchema, async ({ supplierId, startDate, endDate }, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);
    const tenantId = session.user.tenantId;

    // 获取供应商基本信息
    const supplier = await db.query.suppliers.findFirst({
        where: and(
            eq(suppliers.id, supplierId),
            eq(suppliers.tenantId, tenantId)
        )
    });

    if (!supplier) throw new Error('供应商不存在');

    // 时间范围条件
    const dateConditions = [];
    if (startDate) {
        dateConditions.push(gte(purchaseOrders.createdAt, new Date(startDate)));
    }
    if (endDate) {
        dateConditions.push(lte(purchaseOrders.createdAt, new Date(endDate)));
    }

    // 1. 交期准时率
    const allDeliveredPOs = await db.query.purchaseOrders.findMany({
        where: and(
            eq(purchaseOrders.supplierId, supplierId),
            eq(purchaseOrders.tenantId, tenantId),
            eq(purchaseOrders.status, 'DELIVERED'),
            ...dateConditions
        ),
        columns: {
            id: true,
            shippedAt: true,
            createdAt: true,
        }
    });

    const totalDelivered = allDeliveredPOs.length;
    const defaultLeadDays = 7;
    const onTimeCount = allDeliveredPOs.filter(po => {
        if (!po.shippedAt || !po.createdAt) return false;
        const shipped = new Date(po.shippedAt);
        const expected = new Date(new Date(po.createdAt).getTime() + defaultLeadDays * 24 * 60 * 60 * 1000);
        return shipped <= expected;
    }).length;

    const onTimeRate = totalDelivered > 0 ? Math.round((onTimeCount / totalDelivered) * 100) : null;

    // 2. 质量合格率
    const qualityIssues = await db
        .select({ count: count(liabilityNotices.id) })
        .from(liabilityNotices)
        .innerJoin(afterSalesTickets, eq(liabilityNotices.afterSalesId, afterSalesTickets.id))
        .where(and(
            eq(afterSalesTickets.tenantId, tenantId),
            eq(liabilityNotices.liablePartyType, 'FACTORY'),
            eq(liabilityNotices.status, 'CONFIRMED'),
        ));

    const issueCount = Number(qualityIssues[0]?.count || 0);
    const qualityRate = totalDelivered > 0
        ? Math.max(0, Math.round((1 - issueCount / totalDelivered) * 100))
        : null;

    // 3. 综合评分
    const overallScore = (onTimeRate !== null && qualityRate !== null)
        ? Math.round(onTimeRate * 0.4 + qualityRate * 0.6)
        : null;

    const starRating = overallScore !== null
        ? (overallScore >= 90 ? 5 : overallScore >= 75 ? 4 : overallScore >= 60 ? 3 : overallScore >= 40 ? 2 : 1)
        : null;

    const ratingLabel = starRating !== null
        ? { 5: '优秀', 4: '良好', 3: '合格', 2: '待改进', 1: '不合格' }[starRating]
        : '数据不足';

    return {
        supplierId,
        supplierName: supplier.name,
        metrics: { onTimeRate, qualityRate, overallScore, starRating, ratingLabel },
        details: { totalDeliveredPOs: totalDelivered, onTimePOs: onTimeCount, qualityIssueCount: issueCount },
        period: { startDate: startDate || '全部', endDate: endDate || '至今' }
    };
});

export async function getSupplierRating(params: z.infer<typeof getSupplierRatingSchema>) {
    return getSupplierRatingActionInternal(params);
}

const getSupplierRankingsSchema = z.object({});

const getSupplierRankingsActionInternal = createSafeAction(getSupplierRankingsSchema, async (_params, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);
    const tenantId = session.user.tenantId;

    const allSuppliers = await db.query.suppliers.findMany({
        where: eq(suppliers.tenantId, tenantId),
        columns: { id: true, name: true, supplierNo: true }
    });

    const poStats = await db
        .select({
            supplierId: purchaseOrders.supplierId,
            totalCount: count(purchaseOrders.id),
        })
        .from(purchaseOrders)
        .where(and(
            eq(purchaseOrders.tenantId, tenantId),
            eq(purchaseOrders.status, 'DELIVERED')
        ))
        .groupBy(purchaseOrders.supplierId);

    const statsMap = new Map(poStats.map(s => [s.supplierId, Number(s.totalCount)]));

    const rankings = allSuppliers.map(s => ({
        id: s.id,
        name: s.name,
        supplierNo: s.supplierNo,
        deliveredPOs: statsMap.get(s.id) || 0,
    })).sort((a, b) => b.deliveredPOs - a.deliveredPOs);

    return { rankings, total: rankings.length };
});

export async function getSupplierRankings() {
    return getSupplierRankingsActionInternal({});
}
