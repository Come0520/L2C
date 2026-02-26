'use server';

import { db } from '@/shared/api/db';
import { suppliers, purchaseOrders, afterSalesTickets, liabilityNotices } from '@/shared/api/schema';
import { eq, desc, and, sql, count, gte, lte, inArray } from 'drizzle-orm';
import { checkPermission, auth } from '@/shared/lib/auth';
import { generateDocNo } from '@/shared/lib/utils';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import { createSafeAction } from '@/shared/lib/server-action';
import { PERMISSIONS } from '@/shared/config/permissions';
import { z } from 'zod';
import { AuditService } from '@/shared/lib/audit-service';
import {
    createSupplierSchema,
    getSuppliersSchema,
    getSupplierByIdSchema,
    updateSupplierSchema,
    deleteSupplierSchema
} from '../schemas';
import { SUPPLY_CHAIN_PATHS } from '../constants';
import { ActionState } from '@/shared/lib/server-action';
import {
    SupplierRating,
    SupplierRanking
} from '../types';
import { logger } from '@/shared/lib/logger';


const createSupplierActionInternal = createSafeAction(createSupplierSchema, async (data, { session }) => {
    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.SUPPLIER_MANAGE);
        logger.info('[supply-chain] 创建供应商:', { name: data.name, tenantId: session.user.tenantId });

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

        logger.info('[supply-chain] createSupplier 创建成功:', supplier.id);
        revalidatePath(SUPPLY_CHAIN_PATHS.SUPPLIERS);

        // 添加审计日志
        await AuditService.recordFromSession(session, 'suppliers', supplier.id, 'CREATE', {
            new: {
                supplierNo: supplier.supplierNo,
                name: supplier.name,
                supplierType: supplier.supplierType
            }
        });

        return { id: supplier.id };
    } catch (error) {
        logger.error('[supply-chain] 创建供应商失败:', error);
        throw error;
    }
});

/**
 * 创建新供应商
 * 
 * @description 核心逻辑：校验重名，自动生成 SUP- 前缀编号，支持录入资质、合同及收付款财务信息。包含审计日志。
 * @param params 符合 createSupplierSchema 的输入数据，包含以下关键字段：
 * - `name` (string): 供应商名称
 * - `supplierType` ('SUPPLIER' | 'PROCESSOR' | 'BOTH'): 合作伙伴类型
 * - `contactPerson` (string, optional): 联系人姓名
 * - `phone` (string, optional): 联系电话
 * @returns {Promise<{id: string}>} 创建成功的供应商 ID
 */
export async function createSupplier(params: z.infer<typeof createSupplierSchema>) {
    logger.info('[supply-chain] createSupplier 开始执行:', { name: params.name });
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

    const dataPromise = db.query.suppliers.findMany({
        where: whereClause,
        orderBy: [desc(suppliers.createdAt)],
        limit: params.pageSize,
        offset: offset,
    });

    const totalResultPromise = db
        .select({ count: sql<number>`count(*)` })
        .from(suppliers)
        .where(whereClause);

    const [data, totalResult] = await Promise.all([dataPromise, totalResultPromise]);

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
 * 分页获取供应商列表
 * 
 * @description 支持根据类型（供应商/加工厂/两者）进行过滤。内置 ILIKE 模糊搜索功能。
 * @param params 包含以下属性：
 * - `page` (number): 页码
 * - `pageSize` (number): 每页条数
 * - `query` (string, optional): 名称或编号搜索词
 * - `type` ('SUPPLIER' | 'PROCESSOR' | 'BOTH', optional): 列表按类型过滤
 * @returns {Promise<{data: (typeof suppliers.$inferSelect)[], total: number, page: number, pageSize: number, totalPages: number}>} 分页后的供应商数据集
 */
export async function getSuppliers(params: z.infer<typeof getSuppliersSchema>) {
    logger.info('[supply-chain] getSuppliers 查询参数:', params);
    return getSuppliersActionInternal(params);
}

const getSupplierByIdActionInternal = createSafeAction(getSupplierByIdSchema, async ({ id }, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);

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
 * 根据 ID 获取供应商详情
 * 
 * @description 包含租户隔离校验。获取单个供应商的全部注册字段信息。
 * @param params 包含 `id` (string) 供应商 ID 的对象
 * @returns {Promise<typeof suppliers.$inferSelect>} 完整的供应商数据行对象
 */
export async function getSupplierById(params: z.infer<typeof getSupplierByIdSchema>) {
    logger.info('[supply-chain] getSupplierById 查询 ID:', params.id);
    return getSupplierByIdActionInternal(params);
}

const updateSupplierActionInternal = createSafeAction(updateSupplierSchema, async (data, { session }) => {
    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.SUPPLIER_MANAGE);
        const { id, ...updates } = data;
        logger.info('[supply-chain] 更新供应商:', { id, tenantId: session.user.tenantId });

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

        // 添加审计日志
        await AuditService.recordFromSession(session, 'suppliers', id, 'UPDATE', {
            new: updates
        });

        revalidatePath(SUPPLY_CHAIN_PATHS.SUPPLIERS);
        revalidateTag(`supplier-rating-${id}`, {});
        return { id: supplier.id };
    } catch (error) {
        logger.error('[supply-chain] 更新供应商失败:', error);
        throw error;
    }
});

/**
 * 更新供应商信息
 * 
 * @description 仅变更提供的非空字段，支持更新财务、资质信息。触发评价体系缓存失效。
 * @param params 包含 `id` 及其余待更新字段的对象
 * @returns {Promise<{id: string}>} 更新后的记录 ID
 */
export async function updateSupplier(params: z.infer<typeof updateSupplierSchema>) {
    logger.info('[supply-chain] updateSupplier 开始更新:', { id: params.id });
    return updateSupplierActionInternal(params);
}

// ============================================================
// [Supply-02] 供应商评价体系
// ============================================================

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
    // P1-06 修复：覆盖 DELIVERED、COMPLETED、PARTIALLY_RECEIVED 状态
    const completedStatuses = ['DELIVERED', 'COMPLETED', 'PARTIALLY_RECEIVED'] as const;
    const allDeliveredPOsPromise = db.query.purchaseOrders.findMany({
        where: and(
            eq(purchaseOrders.supplierId, supplierId),
            eq(purchaseOrders.tenantId, tenantId),
            inArray(purchaseOrders.status, [...completedStatuses]),
            ...dateConditions
        ),
        columns: {
            id: true,
            shippedAt: true,
            deliveredAt: true,
            expectedDate: true,
            createdAt: true,
        }
    });

    // 2. 质量合格率
    // P1-02 修复（2/3）：通过 liablePartyId 关联当前供应商，避免所有供应商共享同一质量数据
    const qualityIssuesPromise = db
        .select({ count: count(liabilityNotices.id) })
        .from(liabilityNotices)
        .innerJoin(afterSalesTickets, eq(liabilityNotices.afterSalesId, afterSalesTickets.id))
        .where(and(
            eq(afterSalesTickets.tenantId, tenantId),
            eq(liabilityNotices.liablePartyType, 'FACTORY'),
            eq(liabilityNotices.liablePartyId, supplierId),
            eq(liabilityNotices.status, 'CONFIRMED'),
        ));

    const [allDeliveredPOs, qualityIssues] = await Promise.all([
        allDeliveredPOsPromise,
        qualityIssuesPromise
    ]);

    const totalDelivered = allDeliveredPOs.length;
    // P1-02 修复（1/3）：使用 expectedDate 作为交期基准，回退到 createdAt + 7天
    const DEFAULT_LEAD_DAYS = 7;
    const onTimeCount = allDeliveredPOs.filter(po => {
        // 用实际到货日期（deliveredAt）或发货日期（shippedAt）作为完成基准
        const actualDate = po.deliveredAt || po.shippedAt;
        if (!actualDate || !po.createdAt) return false;

        const actual = new Date(actualDate);
        // 优先使用预期交期，否则回退到创建日期 + 默认交期
        const expected = po.expectedDate
            ? new Date(po.expectedDate)
            : new Date(new Date(po.createdAt).getTime() + DEFAULT_LEAD_DAYS * 24 * 60 * 60 * 1000);
        return actual <= expected;
    }).length;

    const onTimeRate = totalDelivered > 0 ? Math.round((onTimeCount / totalDelivered) * 100) : null;

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

/**
 * 获取供应商绩效评价数据
 * 
 * @description 依托 unstable_cache 实现的高性能指标计算 API。涵盖：
 * 1. 交期准时率 (权重 40%): 延迟对比基于 expectedDate 字段。
 * 2. 质量合格率 (权重 60%): 关联 liabilityNotices 中已 CONFIRMED 的记录。
 * 3. 综合星级: 依据加权分判定 1-5 星等级。
 * 缓存策略：有效期 300 秒，通过 `supplier-rating-${supplierId}` 标签联动刷新。
 * @param params 包含 `supplierId` 及可选 `startDate`, `endDate`
 * @returns {Promise<SupplierRating>} 详细的供应商绩效评价报告
 */
export async function getSupplierRating(params: z.infer<typeof getSupplierRatingSchema>): Promise<ActionState<SupplierRating>> {
    const session = await auth();

    if (!session?.user?.id) throw new Error('未授权');

    const { supplierId, startDate = '', endDate = '' } = params;
    logger.info('[supply-chain] getSupplierRating 获取评分:', { supplierId, period: `${startDate} ~ ${endDate}` });

    return unstable_cache(
        async () => getSupplierRatingActionInternal(params),
        [`supplier-rating-${supplierId}-${startDate}-${endDate}`],
        {
            revalidate: 300,
            tags: [`supplier-rating-${supplierId}`]
        }
    )();
}

const getSupplierRankingsSchema = z.object({});

const getSupplierRankingsActionInternal = createSafeAction(getSupplierRankingsSchema, async (_params, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);
    const tenantId = session.user.tenantId;

    const allSuppliersPromise = db.query.suppliers.findMany({
        where: eq(suppliers.tenantId, tenantId),
        columns: { id: true, name: true, supplierNo: true }
    });

    const poStatsPromise = db
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

    const [allSuppliers, poStats] = await Promise.all([allSuppliersPromise, poStatsPromise]);

    const statsMap = new Map(poStats.map(s => [s.supplierId, Number(s.totalCount)]));

    const rankings = allSuppliers.map(s => ({
        id: s.id,
        name: s.name,
        supplierNo: s.supplierNo,
        deliveredPOs: statsMap.get(s.id) || 0,
    })).sort((a, b) => b.deliveredPOs - a.deliveredPOs);

    return { rankings, total: rankings.length };
});

const deleteSupplierActionInternal = createSafeAction(deleteSupplierSchema, async ({ id }, { session }) => {
    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.SUPPLIER_MANAGE);
        logger.info('[supply-chain] 删除供应商:', { id, tenantId: session.user.tenantId });

        // 检查是否有依赖数据（如采购单等）
        const poExists = await db.query.purchaseOrders.findFirst({
            where: and(
                eq(purchaseOrders.supplierId, id),
                eq(purchaseOrders.tenantId, session.user.tenantId)
            )
        });

        if (poExists) {
            throw new Error('该供应商已有采购数据，无法删除');
        }

        await db.delete(suppliers).where(and(
            eq(suppliers.id, id),
            eq(suppliers.tenantId, session.user.tenantId)
        ));

        // 添加审计日志
        await AuditService.recordFromSession(session, 'suppliers', id, 'DELETE');

        revalidatePath(SUPPLY_CHAIN_PATHS.SUPPLIERS);
        return { success: true };
    } catch (error) {
        logger.error('[supply-chain] 删除供应商失败:', error);
        throw error;
    }
});

/**
 * 删除供应商
 * 
 * @description 仅限没有任何采购关联数据的供应商。
 * @param params 包含供应商 ID
 * @returns {Promise<{success: boolean}>} 执行成功状态
 */
export async function deleteSupplier(params: z.infer<typeof deleteSupplierSchema>) {
    return deleteSupplierActionInternal(params);
}

/**
 * 获取供应商交付量排名
 * 
 * @description 统计所有已交付 (DELIVERED) 的历史采购单总量进行排名，用于大盘数据展示。
 * @returns {Promise<{rankings: SupplierRanking[], total: number}>} 排序后的供应商榜单
 */
export async function getSupplierRankings(): Promise<ActionState<{ rankings: SupplierRanking[], total: number }>> {
    logger.info('[supply-chain] getSupplierRankings 开始统计排行');
    return getSupplierRankingsActionInternal({});
}

