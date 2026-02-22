'use server';

/**
 * 待采购池 Actions (Pending Purchase Pool)
 *
 * 管理拆单引擎生成的 DRAFT PO、PENDING 加工任务以及未匹配供应商的订单项。
 * 提供查询、手动分配供应商、批量提交审批等操作。
 */

import { db } from '@/shared/api/db';
import { and, eq, inArray, isNull, sql, desc } from 'drizzle-orm';
import {
    purchaseOrders,
    purchaseOrderItems,
    suppliers,
    productionTasks,
} from '@/shared/api/schema/supply-chain';
import { orderItems } from '@/shared/api/schema/orders';
import { products } from '@/shared/api/schema/catalogs';
import { z } from 'zod';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { PO_STATUS } from '../constants';
import { generateDocNo } from '@/shared/lib/utils';
import { AuditService } from '@/shared/lib/audit-service';
import type { Session } from 'next-auth';
import { logger } from '@/shared/lib/logger';

// ============ 辅助函数 ============

/**
 * 安全获取当前会话的租户 ID
 * 
 * @param session 当前用户会话
 * @returns {string} 租户 ID
 * @throws {Error} 若缺少租户信息则抛出未授权错误
 */
function getTenantId(session: Session | null): string {
    const tenantId = session?.user?.tenantId;
    if (!tenantId) throw new Error('Unauthorized: 缺少租户信息');
    return tenantId;
}

// ============ Schema 定义 ============

const getPendingItemsSchema = z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(1).max(100).default(20),
    /** 筛选条件 */
    productType: z.enum(['FINISHED', 'CUSTOM']).optional(),
    supplierId: z.string().uuid().optional(),
    orderId: z.string().uuid().optional(),
    /** DRAFT_PO = 草稿采购单, PENDING_WO = 待分配加工单, UNMATCHED = 未匹配项 */
    itemType: z.enum(['DRAFT_PO', 'PENDING_WO', 'UNMATCHED', 'ALL']).default('ALL'),
});

const assignToSupplierSchema = z.object({
    /** 订单项 ID 列表 */
    orderItemIds: z.array(z.string().uuid()).min(1),
    /** 目标供应商 ID */
    supplierId: z.string().uuid(),
    /** PO 类型：FINISHED 或 FABRIC */
    poType: z.enum(['FINISHED', 'FABRIC']).default('FINISHED'),
});

const submitForApprovalSchema = z.object({
    /** 采购单 ID 列表 */
    poIds: z.array(z.string().uuid()).min(1),
});

// ============ 查询操作 ============

/**
 * 分页获取待采购池中的项目列表
 *
 * @description 聚合三个来源的数据：
 * 1. DRAFT 状态的 PO：已生成但未提交的采购单。
 * 2. PENDING 状态的加工任务：待分配给加工厂的任务。
 * 3. UNMATCHED 订单项：拆单引擎无法自动匹配供应商的项目，需人工介入。
 * @param input 包含分页、筛选类型（成品/定制）及项类型（PO/任务/未匹配）的参数
 */
export async function getPendingPurchaseItems(
    input: z.infer<typeof getPendingItemsSchema>
) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const tenantId = getTenantId(session);
    await checkPermission(session, PERMISSIONS.ORDER.VIEW);

    console.warn('[supply-chain] getPendingPurchaseItems 开始执行:', { itemType, productType, supplierId, orderId, page });
    const validated = getPendingItemsSchema.parse(input);
    const { page, pageSize, itemType, productType, supplierId, orderId } = validated;
    const offset = (page - 1) * pageSize;

    // 1. 查询 DRAFT PO 列表（含明细数量）
    let draftPOs: Array<{
        id: string;
        poNo: string;
        orderId: string | null;
        supplierId: string;
        supplierName: string;
        type: string | null;
        status: string | null;
        totalAmount: string | null;
        createdAt: Date | null;
        itemCount: number;
    }> = [];

    if (itemType === 'ALL' || itemType === 'DRAFT_PO') {
        const poConditions = [
            eq(purchaseOrders.tenantId, tenantId),
            eq(purchaseOrders.status, PO_STATUS.DRAFT),
        ];

        if (supplierId) poConditions.push(eq(purchaseOrders.supplierId, supplierId));
        if (orderId) poConditions.push(eq(purchaseOrders.orderId, orderId));

        const posQuery = await db
            .select({
                id: purchaseOrders.id,
                poNo: purchaseOrders.poNo,
                orderId: purchaseOrders.orderId,
                supplierId: purchaseOrders.supplierId,
                supplierName: purchaseOrders.supplierName,
                type: purchaseOrders.type,
                status: purchaseOrders.status,
                totalAmount: purchaseOrders.totalAmount,
                createdAt: purchaseOrders.createdAt,
                itemCount: sql<number>`(SELECT count(*) FROM purchase_order_items WHERE po_id = ${purchaseOrders.id})`,
            })
            .from(purchaseOrders)
            .where(and(...poConditions))
            .orderBy(desc(purchaseOrders.createdAt))
            .limit(pageSize)
            .offset(offset);

        draftPOs = posQuery;
    }

    // 2. 查询 PENDING 加工任务
    let pendingTasks: Array<{
        id: string;
        taskNo: string;
        orderId: string;
        orderItemId: string | null;
        workshop: string;
        status: string | null;
        createdAt: Date | null;
    }> = [];

    if (itemType === 'ALL' || itemType === 'PENDING_WO') {
        const taskConditions = [
            eq(productionTasks.tenantId, tenantId),
            eq(productionTasks.status, 'PENDING'),
        ];

        if (orderId) taskConditions.push(eq(productionTasks.orderId, orderId));

        pendingTasks = await db
            .select({
                id: productionTasks.id,
                taskNo: productionTasks.taskNo,
                orderId: productionTasks.orderId,
                orderItemId: productionTasks.orderItemId,
                workshop: productionTasks.workshop,
                status: productionTasks.status,
                createdAt: productionTasks.createdAt,
            })
            .from(productionTasks)
            .where(and(...taskConditions))
            .orderBy(desc(productionTasks.createdAt))
            .limit(pageSize);
    }

    // 3. 查询未匹配供应商的订单项
    let unmatchedItems: Array<{
        id: string;
        orderId: string;
        productId: string | null;
        productName: string;
        category: string;
        quantity: string;
        unitPrice: string;
        subtotal: string;
        productType: string | null;
        status: string | null;
    }> = [];

    if (itemType === 'ALL' || itemType === 'UNMATCHED') {
        const unmatchedConditions = [
            eq(orderItems.tenantId, tenantId),
            isNull(orderItems.poId),
            eq(orderItems.status, 'PENDING'),
        ];

        if (orderId) unmatchedConditions.push(eq(orderItems.orderId, orderId));

        const unmatchedQuery = await db
            .select({
                id: orderItems.id,
                orderId: orderItems.orderId,
                productId: orderItems.productId,
                productName: orderItems.productName,
                category: orderItems.category,
                quantity: orderItems.quantity,
                unitPrice: orderItems.unitPrice,
                subtotal: orderItems.subtotal,
                productType: products.productType,
                status: orderItems.status,
            })
            .from(orderItems)
            .leftJoin(products, eq(orderItems.productId, products.id))
            .where(and(...unmatchedConditions))
            .orderBy(desc(orderItems.createdAt))
            .limit(pageSize);

        // 按 productType 过滤
        if (productType) {
            unmatchedItems = unmatchedQuery.filter(i => i.productType === productType);
        } else {
            unmatchedItems = unmatchedQuery;
        }
    }

    console.warn('[supply-chain] getPendingPurchaseItems 执行完成', {
        draftPOCount: draftPOs.length,
        pendingTaskCount: pendingTasks.length,
        unmatchedItemCount: unmatchedItems.length
    });
    return {
        draftPOs,
        pendingTasks,
        unmatchedItems,
        page,
        pageSize,
    };
}

// ============ 手动分配操作 ============

/**
 * 为未匹配项手动分配供应商
 *
 * @description 将待采购池中的未匹配订单项分配给选定供应商，并自动创建 DRAFT 状态的 PO。
 * 逻辑上会按订单 ID 进行分组，同一订单的项合入同一个 PO。
 * @param input 订单项 ID 列表、目标供应商 ID 及 PO 类型
 */
export async function assignToSupplier(
    input: z.infer<typeof assignToSupplierSchema>
) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const tenantId = getTenantId(session);
    await checkPermission(session, PERMISSIONS.ORDER.EDIT);

    const validated = assignToSupplierSchema.parse(input);
    const { orderItemIds, supplierId, poType } = validated;
    console.warn('[supply-chain] assignToSupplier 开始执行:', { orderItemIdsCount: orderItemIds.length, supplierId, poType });

    // 验证供应商存在
    const supplier = await db.query.suppliers.findFirst({
        where: and(eq(suppliers.id, supplierId), eq(suppliers.tenantId, tenantId)),
    });

    if (!supplier) throw new Error('供应商不存在或无权操作');

    // 查询待分配的订单项
    const items = await db
        .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            productName: orderItems.productName,
            category: orderItems.category,
            quantity: orderItems.quantity,
            unitPrice: orderItems.unitPrice,
            width: orderItems.width,
            height: orderItems.height,
            subtotal: orderItems.subtotal,
            quoteItemId: orderItems.quoteItemId,
            poId: orderItems.poId,
            status: orderItems.status,
        })
        .from(orderItems)
        .where(
            and(
                eq(orderItems.tenantId, tenantId),
                inArray(orderItems.id, orderItemIds),
                isNull(orderItems.poId), // 仅处理未关联 PO 的项
            )
        );

    if (items.length === 0) {
        throw new Error('没有可分配的订单项，可能已被分配或不存在');
    }

    // 按订单 ID 分组（一个 PO 只能关联一个订单）
    const orderGroups = new Map<string, typeof items>();
    for (const item of items) {
        const group = orderGroups.get(item.orderId) ?? [];
        group.push(item);
        orderGroups.set(item.orderId, group);
    }

    const createdPOIds: string[] = [];

    await db.transaction(async (tx) => {
        for (const [groupOrderId, groupItems] of orderGroups) {
            const poNo = generateDocNo('PO');

            const [newPO] = await tx.insert(purchaseOrders).values({
                tenantId,
                poNo,
                orderId: groupOrderId,
                supplierId,
                supplierName: supplier.name,
                type: poType as 'FINISHED' | 'FABRIC' | 'STOCK',
                status: PO_STATUS.DRAFT,
                createdBy: session.user.id,
            }).returning({ id: purchaseOrders.id });

            if (!newPO) continue;
            createdPOIds.push(newPO.id);

            // 记录审计日志 (PO 生成)
            await AuditService.recordFromSession(session, 'purchaseOrders', newPO.id, 'CREATE', {
                new: {
                    poNo,
                    supplierId,
                    supplierName: supplier.name,
                    itemCount: groupItems.length,
                    type: 'ASSIGN_FROM_POOL'
                }
            }, tx);

            // 创建 PO 明细
            const poItemValues = groupItems.map(item => ({
                tenantId,
                poId: newPO.id,
                orderItemId: item.id,
                productId: item.productId,
                productName: item.productName,
                category: item.category,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                width: item.width,
                height: item.height,
                subtotal: item.subtotal,
                quoteItemId: item.quoteItemId,
            }));

            await tx.insert(purchaseOrderItems).values(poItemValues);

            // 更新订单项关联
            const itemIds = groupItems.map(i => i.id);
            await tx
                .update(orderItems)
                .set({
                    poId: newPO.id,
                    supplierId,
                    status: 'PROCESSING',
                })
                .where(inArray(orderItems.id, itemIds));
        }
    });

    console.warn('[supply-chain] assignToSupplier 执行成功:', { createdPOCount: createdPOIds.length, assignedCount: items.length });
    return {
        success: true,
        createdPOIds,
        assignedCount: items.length,
    };
}

// ============ 审批操作 ============

/**
 * 批量提交采购单进行审批
 *
 * @description 将 DRAFT 状态的采购单批量流转至 PENDING_CONFIRMATION 状态。
 * 使用数据库事务确保操作的原子性，并记录每个 PO 的审计日志。
 * @param input 待提交的采购单 ID 列表
 */
export async function submitForApproval(
    input: z.infer<typeof submitForApprovalSchema>
) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const tenantId = getTenantId(session);
    await checkPermission(session, PERMISSIONS.ORDER.EDIT);

    const validated = submitForApprovalSchema.parse(input);
    const { poIds } = validated;
    console.warn('[supply-chain] submitForApproval 开始执行:', { poIdsCount: poIds.length });

    // P1-05 修复：使用事务包裹批量操作，确保原子性
    return await db.transaction(async (tx) => {
        // 校验 PO 存在且为 DRAFT 状态
        const pos = await tx
            .select({ id: purchaseOrders.id, status: purchaseOrders.status })
            .from(purchaseOrders)
            .where(
                and(
                    eq(purchaseOrders.tenantId, tenantId),
                    inArray(purchaseOrders.id, poIds),
                )
            );

        const draftPos = pos.filter(po => po.status === PO_STATUS.DRAFT);
        if (draftPos.length === 0) {
            throw new Error('没有可提交的采购单（只有 DRAFT 状态的采购单可以提交）');
        }

        const draftPoIds = draftPos.map(po => po.id);

        // 批量更新状态为 PENDING
        await tx
            .update(purchaseOrders)
            .set({
                status: PO_STATUS.PENDING_CONFIRMATION,
                updatedAt: new Date(),
            })
            .where(inArray(purchaseOrders.id, draftPoIds));

        // 记录审计日志 (批量提交审批)
        for (const id of draftPoIds) {
            await AuditService.recordFromSession(session, 'purchaseOrders', id, 'UPDATE', {
                old: { status: PO_STATUS.DRAFT },
                new: { status: PO_STATUS.PENDING_CONFIRMATION, action: 'SUBMIT_FOR_APPROVAL' },
            }, tx);
        }

        console.warn('[supply-chain] submitForApproval 执行成功:', { submittedCount: draftPoIds.length });
        return {
            success: true,
            submittedCount: draftPoIds.length,
            skippedCount: poIds.length - draftPoIds.length,
        };
    });
}

// ============ 跨订单合并采购 ============

const mergeToPurchaseOrderSchema = z.object({
    /**
     * 待合并的订单项 ID 列表
     * 可以来自不同订单，但 productType 必须一致
     */
    orderItemIds: z.array(z.string().uuid()).min(1),
    /**
     * 指定供应商（可选）
     * 若不指定，则按各订单项的 defaultSupplierId 自动分组
     */
    supplierId: z.string().uuid().optional(),
});

/**
 * 跨订单合并采购
 *
 * @description 待采购池的高级功能：将来自不同订单、但属于同一类型（成品/面料）的项，
 * 按照供应商进行自动分组，为每个供应商生成一个合并后的 DRAFT 采购单。
 * 旨在通过集采降低成本、提高采购效率。
 * @param input 订单项 ID 列表及可选的强制供应商 ID
 */
export async function mergeToPurchaseOrder(
    input: z.infer<typeof mergeToPurchaseOrderSchema>
) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    const tenantId = getTenantId(session);
    await checkPermission(session, PERMISSIONS.ORDER.EDIT);

    const validated = mergeToPurchaseOrderSchema.parse(input);
    const { orderItemIds, supplierId: forcedSupplierId } = validated;
    console.warn('[supply-chain] mergeToPurchaseOrder 开始执行:', { orderItemIdsCount: orderItemIds.length, forcedSupplierId });

    // 1. 查询所有选中的订单项（含产品信息）
    const items = await db
        .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productId: orderItems.productId,
            productName: orderItems.productName,
            category: orderItems.category,
            quantity: orderItems.quantity,
            unitPrice: orderItems.unitPrice,
            width: orderItems.width,
            height: orderItems.height,
            subtotal: orderItems.subtotal,
            quoteItemId: orderItems.quoteItemId,
            poId: orderItems.poId,
            status: orderItems.status,
            productType: products.productType,
            defaultSupplierId: products.defaultSupplierId,
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(
            and(
                eq(orderItems.tenantId, tenantId),
                inArray(orderItems.id, orderItemIds),
                isNull(orderItems.poId), // 只处理未关联 PO 的项
            )
        );

    if (items.length === 0) {
        throw new Error('没有可合并的订单项，可能已被分配或不存在');
    }

    // 2. 校验 productType 一致性
    const productTypes = new Set(items.map(i => i.productType).filter(Boolean));
    if (productTypes.size > 1) {
        throw new Error('成品和面料不能混入同一采购单，请选择相同类型的商品');
    }

    const mainProductType = productTypes.values().next().value ?? 'FINISHED';
    const poType = mainProductType === 'FINISHED' ? 'FINISHED' : 'FABRIC';

    // 3. 按供应商分组
    const supplierGroups = new Map<string, typeof items>();

    for (const item of items) {
        const targetSupplierId = forcedSupplierId ?? item.defaultSupplierId;
        if (!targetSupplierId) {
            // 没有指定供应商且产品没有默认供应商 → 放入 "UNASSIGNED" 分组
            const group = supplierGroups.get('UNASSIGNED') ?? [];
            group.push(item);
            supplierGroups.set('UNASSIGNED', group);
            continue;
        }

        const group = supplierGroups.get(targetSupplierId) ?? [];
        group.push(item);
        supplierGroups.set(targetSupplierId, group);
    }

    // 4. 为未分配供应商的项报错
    const unassigned = supplierGroups.get('UNASSIGNED');
    if (unassigned && unassigned.length > 0 && !forcedSupplierId) {
        throw new Error(
            `有 ${unassigned.length} 个订单项没有默认供应商且未指定供应商，请手动指定供应商`
        );
    }

    // 移除 UNASSIGNED 分组（如果有 forcedSupplierId 则不会出现）
    supplierGroups.delete('UNASSIGNED');

    // 5. 事务中创建 PO
    const createdPOIds: string[] = [];
    const assignedItemIds: string[] = [];

    await db.transaction(async (tx) => {
        for (const [groupSupplierId, groupItems] of supplierGroups) {
            // 获取供应商名称
            const supplier = await tx.query.suppliers.findFirst({
                where: and(eq(suppliers.id, groupSupplierId), eq(suppliers.tenantId, tenantId)),
                columns: { name: true },
            });

            if (!supplier) {
                logger.warn(`[合并采购] 供应商 ${groupSupplierId} 不存在，跳过`);
                continue;
            }

            const poNo = generateDocNo('PO');

            // 合并采购的 PO 不绑定单个 orderId（因为跨订单）
            const [newPO] = await tx.insert(purchaseOrders).values({
                tenantId,
                poNo,
                orderId: null, // 跨订单不绑定
                supplierId: groupSupplierId,
                supplierName: supplier.name,
                type: poType as 'FINISHED' | 'FABRIC' | 'STOCK',
                status: PO_STATUS.DRAFT,
                createdBy: session.user.id,
            }).returning({ id: purchaseOrders.id });

            if (!newPO) continue;
            createdPOIds.push(newPO.id);

            // 记录审计日志 (合并生成 PO)
            await AuditService.recordFromSession(session, 'purchaseOrders', newPO.id, 'CREATE', {
                new: {
                    poNo,
                    supplierId: groupSupplierId,
                    supplierName: supplier.name,
                    itemCount: groupItems.length,
                    type: 'MERGE_PURCHASE'
                }
            }, tx);

            // 创建 PO 明细
            const poItemValues = groupItems.map(item => ({
                tenantId,
                poId: newPO.id,
                orderItemId: item.id,
                productId: item.productId,
                productName: item.productName,
                category: item.category,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                width: item.width,
                height: item.height,
                subtotal: item.subtotal,
                quoteItemId: item.quoteItemId,
            }));

            await tx.insert(purchaseOrderItems).values(poItemValues);

            // 更新订单项关联
            const itemIds = groupItems.map(i => i.id);
            assignedItemIds.push(...itemIds);

            await tx
                .update(orderItems)
                .set({
                    poId: newPO.id,
                    supplierId: groupSupplierId,
                    status: 'PROCESSING',
                })
                .where(inArray(orderItems.id, itemIds));
        }
    });

    console.warn('[supply-chain] mergeToPurchaseOrder 执行成功:', { createdPOCount: createdPOIds.length, assignedCount: assignedItemIds.length });
    return {
        success: true,
        createdPOIds,
        assignedCount: assignedItemIds.length,
        poCount: createdPOIds.length,
    };
}
