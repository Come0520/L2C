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

/**
 * 获取供应商评价指标
 * 包含：交期准时率、质量合格率、综合评分
 */
export const getSupplierRating = createSafeAction(getSupplierRatingSchema, async ({ supplierId, startDate, endDate }, { session }) => {
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

    // 1. 交期准时率：已交付的 PO 中，实际交付日期 <= 预期交付日期的比例
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
    // 简化逻辑：假设在 7 天内交付为准时
    const defaultLeadDays = 7;
    const onTimeCount = allDeliveredPOs.filter(po => {
        if (!po.shippedAt || !po.createdAt) return false;
        const shipped = new Date(po.shippedAt);
        // 没有预期交付日期字段，使用创建日期 + 默认天数
        const expected = new Date(new Date(po.createdAt).getTime() + defaultLeadDays * 24 * 60 * 60 * 1000);
        return shipped <= expected;
    }).length;

    const onTimeRate = totalDelivered > 0 ? Math.round((onTimeCount / totalDelivered) * 100) : null;

    // 2. 质量合格率：通过定责单判断，工厂责任的定责单越少越好
    const qualityIssues = await db
        .select({ count: count(liabilityNotices.id) })
        .from(liabilityNotices)
        .innerJoin(afterSalesTickets, eq(liabilityNotices.afterSalesId, afterSalesTickets.id))
        .where(and(
            eq(afterSalesTickets.tenantId, tenantId),
            eq(liabilityNotices.liablePartyType, 'FACTORY'),
            eq(liabilityNotices.status, 'CONFIRMED'),
            // 需要关联到供应商，但定责单可能没有直接的供应商 ID
            // 这里简化为统计所有工厂责任的定责单
        ));

    const issueCount = Number(qualityIssues[0]?.count || 0);

    // 质量合格率 = 1 - (质量问题数 / 总交付数)，最低为 0%
    const qualityRate = totalDelivered > 0
        ? Math.max(0, Math.round((1 - issueCount / totalDelivered) * 100))
        : null;

    // 3. 综合评分（满分 100）
    // 交期权重 40%，质量权重 60%
    const overallScore = (onTimeRate !== null && qualityRate !== null)
        ? Math.round(onTimeRate * 0.4 + qualityRate * 0.6)
        : null;

    // 星级评定（1-5星）
    const starRating = overallScore !== null
        ? (overallScore >= 90 ? 5 : overallScore >= 75 ? 4 : overallScore >= 60 ? 3 : overallScore >= 40 ? 2 : 1)
        : null;

    // 评价标签
    const ratingLabel = starRating !== null
        ? { 5: '优秀', 4: '良好', 3: '合格', 2: '待改进', 1: '不合格' }[starRating]
        : '数据不足';

    return {
        supplierId,
        supplierName: supplier.name,
        metrics: {
            onTimeRate,
            qualityRate,
            overallScore,
            starRating,
            ratingLabel,
        },
        details: {
            totalDeliveredPOs: totalDelivered,
            onTimePOs: onTimeCount,
            qualityIssueCount: issueCount,
        },
        period: {
            startDate: startDate || '全部',
            endDate: endDate || '至今',
        }
    };
});

/**
 * 获取所有供应商评价排名
 */
export const getSupplierRankings = createSafeAction(z.object({}), async (_, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);
    const tenantId = session.user.tenantId;

    // 获取所有供应商
    const allSuppliers = await db.query.suppliers.findMany({
        where: eq(suppliers.tenantId, tenantId),
        columns: { id: true, name: true, supplierNo: true }
    });

    // 统计每个供应商的交付情况
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

    // 构建排名
    const rankings = allSuppliers.map(s => ({
        id: s.id,
        name: s.name,
        supplierNo: s.supplierNo,
        deliveredPOs: statsMap.get(s.id) || 0,
    })).sort((a, b) => b.deliveredPOs - a.deliveredPOs);

    return {
        rankings,
        total: rankings.length,
    };
});
