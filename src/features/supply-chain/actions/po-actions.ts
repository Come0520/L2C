'use server';

import { db } from "@/shared/api/db";
import {
    purchaseOrders,
    purchaseOrderItems,
    suppliers,
    products,
    inventory,
    inventoryLogs,
    warehouses,
    poPayments
} from "@/shared/api/schema";
import { eq, and, desc, sql, inArray, notInArray } from "drizzle-orm";
import { auth, checkPermission } from "@/shared/lib/auth";
import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/shared/config/permissions";
import { SUPPLY_CHAIN_PATHS, VALID_PO_TRANSITIONS, isValidPoTransition } from "../constants";
import { type POStatus } from "../constants";
import { generateDocNo } from "@/shared/lib/utils";
import { createSafeAction } from "@/shared/lib/server-action";
import { z } from "zod";
import { AuditService } from "@/shared/lib/audit-service";

// 状态转换矩阵已迁移到 constants.ts（使用 VALID_PO_TRANSITIONS）

// --- Schemas (可以在 schemas.ts 中定义，这里简化) ---
// --- Schemas (可以在 schemas.ts 中定义，这里简化) ---
import { createPOSchema } from "../schemas";

const batchUpdateStatusSchema = z.object({
    poIds: z.array(z.string()),
    status: z.enum([
        'DRAFT', 'PENDING_CONFIRMATION', 'PENDING_PAYMENT', 'IN_PRODUCTION',
        'READY', 'SHIPPED', 'PARTIALLY_RECEIVED', 'DELIVERED', 'COMPLETED', 'CANCELLED'
    ])
});

const batchDeleteSchema = z.object({
    poIds: z.array(z.string())
});

// --- Actions ---

/**
 * 分页获取采购单列表
 * 
 * @description 支持根据状态、供应商、付款状态和单号搜索过滤。包含权限校验和租户隔离。
 * @param params 分页及过滤参数
 */
export async function getPurchaseOrders(params: {
    page?: number;
    pageSize?: number;
    status?: string | string[];
    supplierId?: string;
    paymentStatus?: string;
    search?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权', data: [], total: 0 };

    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);

    const { page = 1, pageSize = 20, status, supplierId, paymentStatus, search } = params;
    const conditions = [eq(purchaseOrders.tenantId, session.user.tenantId)];

    if (status && status !== 'ALL' && status !== 'all') {
        if (Array.isArray(status)) {
            conditions.push(inArray(purchaseOrders.status, status as POStatus[]));
        } else {
            conditions.push(eq(purchaseOrders.status, status as POStatus));
        }
    }
    if (supplierId) {
        conditions.push(eq(purchaseOrders.supplierId, supplierId));
    }
    if (paymentStatus && paymentStatus !== 'ALL') {
        conditions.push(eq(purchaseOrders.paymentStatus, paymentStatus as "PAID" | "PENDING" | "PARTIAL"));
    }
    if (search) {
        conditions.push(sql`(${purchaseOrders.poNo} ILIKE ${`%${search}%`})`);
    }

    const data = await db.query.purchaseOrders.findMany({
        where: and(...conditions),
        orderBy: [desc(purchaseOrders.createdAt)],
        limit: pageSize,
        offset: (page - 1) * pageSize,
        with: {
            order: true,
            items: true
        }
    });

    const total = await db.$count(purchaseOrders, and(...conditions));

    return {
        success: true,
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
    };
}

/**
 * 根据 ID 获取采购单详细信息
 * 
 * @description 包含关联的订单、明细及创建人信息。
 * @param params 包含 ID 的参数对象
 */
export async function getPoById({ id }: { id: string }) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权' };

    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);

    const po = await db.query.purchaseOrders.findFirst({
        where: and(
            eq(purchaseOrders.id, id),
            eq(purchaseOrders.tenantId, session.user.tenantId)
        ),
        with: {
            order: true,
            items: true,
            creator: true
        }
    });

    if (!po) return { success: false, error: '采购单不存在' };

    return { success: true, data: po };
}

/**
 * 创建新的采购单
 * 
 * @description 核心逻辑：校验供应商状态、计算总价、插入主表及明细表，并记录审计日志。
 * @param data 符合 createPOSchema 的输入数据
 */
export const createPurchaseOrder = createSafeAction(createPOSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.PO_MANAGE);

    return await db.transaction(async (tx) => {
        const poNo = generateDocNo('PO');

        // 1. 获取供应商信息
        const supplier = await tx.query.suppliers.findFirst({
            where: and(eq(suppliers.id, data.supplierId), eq(suppliers.tenantId, session.user.tenantId))
        });
        if (!supplier) throw new Error('供应商不存在');

        // P1-07 修复：校验供应商是否启用
        if (supplier.isActive === false) {
            throw new Error(`供应商「${supplier.name}」已停用，无法创建采购单`);
        }

        // 2. 计算总金额
        const totalAmount = data.items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

        // 3. 创建 PO
        const [po] = await tx.insert(purchaseOrders).values({
            tenantId: session.user.tenantId,
            poNo,
            supplierId: data.supplierId,
            supplierName: supplier.name,
            orderId: data.orderId,
            type: data.type, // P1-04 修复：使用 schema 传入的类型
            status: 'DRAFT',
            totalAmount: totalAmount.toString(),
            createdBy: session.user.id,
        }).returning();

        // 4. 创建 Items
        if (data.items.length > 0) {
            // 需要获取产品名称等信息
            for (const item of data.items) {
                const product = await tx.query.products.findFirst({
                    where: and(
                        eq(products.id, item.productId),
                        eq(products.tenantId, session.user.tenantId)
                    )
                });

                if (!product) {
                    throw new Error(`产品 ${item.productId} 不存在或无权访问`);
                }

                await tx.insert(purchaseOrderItems).values({
                    tenantId: session.user.tenantId,
                    poId: po.id,
                    productId: item.productId,
                    productName: product?.name || '未知产品',
                    quantity: item.quantity.toString(),
                    unitPrice: item.unitCost.toString(),
                    subtotal: (item.quantity * item.unitCost).toString(),
                });
            }
        }

        revalidatePath(SUPPLY_CHAIN_PATHS.PURCHASE_ORDERS);

        // 添加审计日志
        await AuditService.recordFromSession(session, 'purchaseOrders', po.id, 'CREATE', {
            new: {
                poNo: po.poNo,
                supplierId: data.supplierId,
                supplierName: supplier.name,
                totalAmount: totalAmount.toString(),
                type: data.type,
                status: 'DRAFT'
            }
        }, tx);

        return { id: po.id };
    });
});

/**
 * 更新采购单状态
 * 
 * @description 严格遵循 VALID_PO_TRANSITIONS 状态机转换规则，记录操作审计日志。
 * @param params 包含待更新 PO ID 和目标状态
 */
export async function updatePoStatus({ poId, status }: { poId: string; status: string }) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权' };

    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.PO_MANAGE);

    // 获取当前 PO 状态并校验租户隔离
    const currentPO = await db.query.purchaseOrders.findFirst({
        where: and(
            eq(purchaseOrders.id, poId),
            eq(purchaseOrders.tenantId, session.user.tenantId)
        ),
        columns: { status: true }
    });
    if (!currentPO) return { success: false, error: '采购单不存在' };

    // 校验状态转换合法性
    const allowed = VALID_PO_TRANSITIONS[currentPO.status!] || [];
    if (!allowed.includes(status)) {
        return { success: false, error: `状态不允许从「${currentPO.status}」转换为「${status}」` };
    }

    await db.update(purchaseOrders)
        .set({
            status: status as POStatus,
            updatedAt: new Date()
        })
        .where(and(
            eq(purchaseOrders.id, poId),
            eq(purchaseOrders.tenantId, session.user.tenantId)
        ));

    // 添加审计日志
    await AuditService.recordFromSession(session, 'purchaseOrders', poId, 'UPDATE', {
        old: { status: currentPO.status },
        new: { status },
        changed: { status }
    });

    revalidatePath(SUPPLY_CHAIN_PATHS.PURCHASE_ORDERS);
    return { success: true };
}

/**
 * 添加/更新采购单物流信息 (旧版)
 * 
 * @deprecated 建议优先使用 shipment-actions.ts 中的 createShipment 记录多次发货。
 * @param data 物流详情及关联 PO ID
 */
export async function addPOLogistics(data: {
    poId: string;
    company: string;
    trackingNo: string;
    shippedAt: Date;
    remark?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权' };

    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.PO_MANAGE);

    try {
        await db
            .update(purchaseOrders)
            .set({
                logisticsCompany: data.company,
                logisticsNo: data.trackingNo,
                shippedAt: data.shippedAt,
                remark: data.remark,
                status: 'SHIPPED',
                updatedAt: new Date(),
            })
            .where(and(
                eq(purchaseOrders.id, data.poId),
                eq(purchaseOrders.tenantId, session.user.tenantId)
            ));

        // 添加审计日志
        await AuditService.recordFromSession(session, 'purchaseOrders', data.poId, 'UPDATE', {
            new: {
                logisticsCompany: data.company,
                logisticsNo: data.trackingNo,
                shippedAt: data.shippedAt,
                status: 'SHIPPED'
            }
        });

        revalidatePath(SUPPLY_CHAIN_PATHS.PURCHASE_ORDERS);
        return { success: true };
    } catch (error) {
        console.error('Failed to add PO logistics:', error);
        return { success: false, error: '添加物流信息失败' };
    }
}


/**
 * 批量更新采购单状态
 * 
 * @description 针对选中的一组 PO 进行统一的状态变更，包含批量审计记录。
 * @param data 包含 poIds 数组和目标状态
 */
export const batchUpdatePoStatus = createSafeAction(batchUpdateStatusSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.PO_MANAGE);

    if (data.poIds.length === 0) {
        throw new Error('至少选择一个采购单');
    }

    await db.update(purchaseOrders)
        .set({
            status: data.status as POStatus,
            updatedAt: new Date()
        })
        .where(and(
            inArray(purchaseOrders.id, data.poIds),
            eq(purchaseOrders.tenantId, session.user.tenantId)
        ));

    // 批量添加审计日志
    for (const poId of data.poIds) {
        await AuditService.recordFromSession(session, 'purchaseOrders', poId, 'UPDATE', {
            new: { status: data.status }
        });
    }

    revalidatePath(SUPPLY_CHAIN_PATHS.PURCHASE_ORDERS);
    return { success: true };
});

/**
 * 批量删除草稿状态的采购单
 * 
 * @description 仅限 DRAFT 状态。操作会级联删除采购明细。
 * @param data 待删除的 PO ID 数组
 */
export const batchDeleteDraftPOs = createSafeAction(batchDeleteSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.PO_MANAGE);

    if (data.poIds.length === 0) {
        throw new Error('至少选择一个采购单');
    }

    // 这里由于有外键约束，需要先删除 items，或者依赖 cascade。
    // 假设 purchaseOrderItems 表有 ON DELETE CASCADE。如果没有，需要手动删。
    // 为了安全，先手动删 Items。

    // Verify all are DRAFT? The requirement says "batchDeleteDraftPOs".
    // Should we enforce check?
    // Let's enforce check.
    const invalidPos = await db.query.purchaseOrders.findMany({
        where: and(
            inArray(purchaseOrders.id, data.poIds),
            eq(purchaseOrders.tenantId, session.user.tenantId),
            // status != 'DRAFT'
            sql`${purchaseOrders.status} != 'DRAFT'`
        )
    });

    if (invalidPos.length > 0) {
        throw new Error('只能删除草稿状态的采购单');
    }

    await db.transaction(async (tx) => {
        await tx.delete(purchaseOrderItems)
            .where(and(
                inArray(purchaseOrderItems.poId, data.poIds),
                eq(purchaseOrderItems.tenantId, session.user.tenantId)
            ));

        for (const poId of data.poIds) {
            await AuditService.recordFromSession(session, 'purchaseOrders', poId, 'DELETE', undefined, tx);
        }

        await tx.delete(purchaseOrders)
            .where(and(
                inArray(purchaseOrders.id, data.poIds),
                eq(purchaseOrders.tenantId, session.user.tenantId)
            ));
    });

    revalidatePath(SUPPLY_CHAIN_PATHS.PURCHASE_ORDERS);
    return { success: true };
});

// ============ PO 生命周期 Actions ============

/**
 * 确认报价 Schema
 */
const confirmQuoteSchema = z.object({
    poId: z.string().uuid(),
    /** 实际报价金额 */
    totalAmount: z.coerce.number().min(0),
    /** 供应商报价单图片 URL */
    supplierQuoteImg: z.string().url().optional(),
    /** 备注 */
    remark: z.string().max(500).optional(),
});

/**
 * 确认采购单报价
 *
 * @description 采购员确认供应商提交的报价金额及附件。
 * @param data 包含 PO ID、报价金额、报价单图片及备注
 * @status 流转：PENDING_CONFIRMATION → PENDING_PAYMENT
 */
export const confirmPoQuote = createSafeAction(confirmQuoteSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.PO_MANAGE);

    const po = await db.query.purchaseOrders.findFirst({
        where: and(
            eq(purchaseOrders.id, data.poId),
            eq(purchaseOrders.tenantId, session.user.tenantId)
        ),
        columns: { id: true, status: true }
    });

    if (!po) throw new Error('采购单不存在');
    if (!isValidPoTransition(po.status!, 'PENDING_PAYMENT')) {
        throw new Error(`当前状态「${po.status}」不允许确认报价，需要先处于「PENDING_CONFIRMATION」状态`);
    }

    await db.update(purchaseOrders)
        .set({
            totalAmount: data.totalAmount.toString(),
            supplierQuoteImg: data.supplierQuoteImg,
            remark: data.remark ?? undefined,
            status: 'PENDING_PAYMENT' as POStatus,
            updatedAt: new Date(),
        })
        .where(and(
            eq(purchaseOrders.id, data.poId),
            eq(purchaseOrders.tenantId, session.user.tenantId)
        ));

    // 添加审计日志
    await AuditService.recordFromSession(session, 'purchaseOrders', data.poId, 'UPDATE', {
        old: { status: po.status },
        new: {
            totalAmount: data.totalAmount.toString(),
            status: 'PENDING_PAYMENT'
        }
    });

    revalidatePath(SUPPLY_CHAIN_PATHS.PURCHASE_ORDERS);
    return { success: true };
});

/**
 * 确认付款 Schema
 */
export const confirmPaymentSchema = z.object({
    poId: z.string(),
    paymentMethod: z.enum(['CASH', 'WECHAT', 'ALIPAY', 'BANK']),
    paymentAmount: z.number().min(0.01, "付款金额必须大于0"),
    paymentTime: z.string(),
    paymentVoucherImg: z.string().optional(),
    remark: z.string().optional(),
});

/**
 * 确认采购单付款
 * 
 * @description 记录付款详情并插入 poPayments 表。
 * @param data 符合 confirmPaymentSchema 的付款信息
 * @status 流转：PENDING_PAYMENT → IN_PRODUCTION
 */
export const confirmPoPayment = createSafeAction(confirmPaymentSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.PO_MANAGE);

    return await db.transaction(async (tx) => {
        const po = await tx.query.purchaseOrders.findFirst({
            where: and(
                eq(purchaseOrders.id, data.poId),
                eq(purchaseOrders.tenantId, session.user.tenantId)
            ),
            columns: { id: true, status: true, totalAmount: true }
        });

        if (!po) throw new Error('采购单不存在');
        if (!isValidPoTransition(po.status!, 'IN_PRODUCTION')) {
            throw new Error(`当前状态「${po.status}」不允许确认付款，需要先处于「PENDING_PAYMENT」状态`);
        }

        // P0-04 修复：使用独立的 poPayments 表存储付款记录，不再覆盖 remark
        await tx.insert(poPayments).values({
            tenantId: session.user.tenantId,
            poId: data.poId,
            paymentMethod: data.paymentMethod,
            amount: data.paymentAmount.toString(),
            transactionTime: new Date(data.paymentTime),
            voucherUrl: data.paymentVoucherImg,
            remark: data.remark,
            createdBy: session.user.id,
        });

        // 更新采购单状态
        await tx.update(purchaseOrders)
            .set({
                paymentStatus: 'PAID',
                status: 'IN_PRODUCTION' as POStatus,
                updatedAt: new Date(),
            })
            .where(and(
                eq(purchaseOrders.id, data.poId),
                eq(purchaseOrders.tenantId, session.user.tenantId)
            ));

        // 添加审计日志
        await AuditService.recordFromSession(session, 'purchaseOrders', data.poId, 'UPDATE', {
            old: { status: po.status, paymentStatus: 'PENDING' },
            new: { status: 'IN_PRODUCTION', paymentStatus: 'PAID' }
        }, tx);

        revalidatePath(SUPPLY_CHAIN_PATHS.PURCHASE_ORDERS);
        return { success: true };
    });
});

/**
 * 完工确认 Schema
 */
const confirmCompletionSchema = z.object({
    poId: z.string().uuid(),
    /** 完工备注 */
    remark: z.string().max(500).optional(),
});

/**
 * 确认完工
 *
 * @description 确认供应商已完成生产，准备发货。
 * @param data 包含 PO ID 和完工备注
 * @status 流转：IN_PRODUCTION → READY
 */
export const confirmPoCompletion = createSafeAction(confirmCompletionSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.PO_MANAGE);

    const po = await db.query.purchaseOrders.findFirst({
        where: and(
            eq(purchaseOrders.id, data.poId),
            eq(purchaseOrders.tenantId, session.user.tenantId)
        ),
        columns: { id: true, status: true }
    });

    if (!po) throw new Error('采购单不存在');
    if (!isValidPoTransition(po.status!, 'READY')) {
        throw new Error(`当前状态「${po.status}」不允许确认完工，需要先处于「IN_PRODUCTION」状态`);
    }

    await db.update(purchaseOrders)
        .set({
            remark: data.remark ?? undefined,
            status: 'READY' as POStatus,
            updatedAt: new Date(),
        })
        .where(and(
            eq(purchaseOrders.id, data.poId),
            eq(purchaseOrders.tenantId, session.user.tenantId)
        ));

    // 添加审计日志
    await AuditService.recordFromSession(session, 'purchaseOrders', data.poId, 'UPDATE', {
        old: { status: po.status },
        new: { status: 'READY' }
    });

    revalidatePath(SUPPLY_CHAIN_PATHS.PURCHASE_ORDERS);
    return { success: true };
});

/**
 * 确认收货 Schema
 * 支持部分收货：每个商品可以指定本次收货数量
 */
export const confirmReceiptSchema = z.object({
    poId: z.string().uuid(),
    warehouseId: z.string().uuid(),
    receivedDate: z.string().refine((val) => !isNaN(Date.parse(val)), "无效的日期"),
    remark: z.string().max(500).optional(),
    items: z.array(z.object({
        /** 采购单明细 ID，用于幂等性校验 */
        poItemId: z.string().uuid(),
        productId: z.string(),
        /** 本次收货数量 */
        quantity: z.number().min(0),
    })),
});

/**
 * 确认收货/入库
 *
 * @description 核心逻辑：支持部分收货，计算收货进度并更新 PO 状态。原子性更新库存信息并记录库存日志。
 * @param data 符合 confirmReceiptSchema 的收货明细
 * @status 流转：READY/SHIPPED → PARTIALLY_RECEIVED / COMPLETED
 */
export const confirmPoReceipt = createSafeAction(confirmReceiptSchema, async (data, { session }) => {
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.STOCK_MANAGE);

    return await db.transaction(async (tx) => {
        // 1. 查询采购单 + 明细
        const po = await tx.query.purchaseOrders.findFirst({
            where: and(
                eq(purchaseOrders.id, data.poId),
                eq(purchaseOrders.tenantId, session.user.tenantId)
            ),
            columns: { id: true, status: true, type: true, poNo: true },
            with: { items: true },
        });

        if (!po) throw new Error('采购单不存在');

        // P1-01 修复：校验仓库是否属于当前租户，防止跨租户写入
        const warehouse = await tx.query.warehouses.findFirst({
            where: and(
                eq(warehouses.id, data.warehouseId),
                eq(warehouses.tenantId, session.user.tenantId)
            ),
        });
        if (!warehouse) {
            throw new Error('仓库不存在或无权访问');
        }

        // P0-05 修复：使用状态流转矩阵校验，而非硬编码状态列表
        const canReceive = isValidPoTransition(po.status!, 'PARTIALLY_RECEIVED') ||
            isValidPoTransition(po.status!, 'COMPLETED');
        if (!canReceive) {
            throw new Error(`当前状态「${po.status}」不允许确认收货`);
        }

        // 2. 校验并更新每个明细的 receivedQuantity
        const poItemsMap = new Map(po.items.map(item => [item.id, item]));
        let allFullyReceived = true;

        for (const receiptItem of data.items) {
            if (receiptItem.quantity <= 0) continue;

            const poItem = poItemsMap.get(receiptItem.poItemId);
            if (!poItem) {
                throw new Error(`采购单明细 ${receiptItem.poItemId} 不存在`);
            }

            // P0-02 修复：幂等性校验，检查剩余可收货数量
            const alreadyReceived = Number(poItem.receivedQuantity || 0);
            const ordered = Number(poItem.quantity);
            const remaining = ordered - alreadyReceived;

            if (receiptItem.quantity > remaining) {
                throw new Error(
                    `商品「${poItem.productName}」收货数量(${receiptItem.quantity})超过剩余可收货数量(${remaining})`
                );
            }

            // 更新明细的已收货数量
            await tx.update(purchaseOrderItems)
                .set({
                    receivedQuantity: sql`COALESCE(${purchaseOrderItems.receivedQuantity}, '0')::numeric + ${receiptItem.quantity}`,
                })
                .where(eq(purchaseOrderItems.id, receiptItem.poItemId));

            // 检查该明细是否完全收货
            if (alreadyReceived + receiptItem.quantity < ordered) {
                allFullyReceived = false;
            }
        }

        // 检查未在本次收货中的明细是否已全部收货
        const receivedItemIds = new Set(data.items.map(i => i.poItemId));
        for (const item of po.items) {
            if (!receivedItemIds.has(item.id)) {
                const received = Number(item.receivedQuantity || 0);
                const ordered = Number(item.quantity);
                if (received < ordered) {
                    allFullyReceived = false;
                    break;
                }
            }
        }

        // 3. 根据收货进度决定状态
        const newStatus: POStatus = allFullyReceived ? 'COMPLETED' : 'PARTIALLY_RECEIVED';

        await tx.update(purchaseOrders)
            .set({
                status: newStatus,
                deliveredAt: allFullyReceived ? new Date(data.receivedDate) : undefined,
                updatedAt: new Date(),
            })
            .where(and(
                eq(purchaseOrders.id, data.poId),
                eq(purchaseOrders.tenantId, session.user.tenantId)
            ));

        // 添加审计日志 (PO 状态更新)
        await AuditService.recordFromSession(session, 'purchaseOrders', data.poId, 'UPDATE', {
            old: { status: po.status },
            new: { status: newStatus }
        }, tx);

        // 4. P0-01 修复 ...
        if (po.type === 'FINISHED' || po.type === 'STOCK') {
            for (const item of data.items) {
                if (item.quantity <= 0) continue;

                // 原子性 UPSERT: 存在则增加，不存在则插入
                await tx.execute(sql`
                    INSERT INTO inventory (id, tenant_id, warehouse_id, product_id, quantity, updated_at)
                    VALUES (gen_random_uuid(), ${session.user.tenantId}, ${data.warehouseId}, ${item.productId}, ${item.quantity}, NOW())
                    ON CONFLICT (warehouse_id, product_id)
                    DO UPDATE SET
                        quantity = inventory.quantity + EXCLUDED.quantity,
                        updated_at = NOW()
                `);

                // 查询更新后的余额用于日志
                const [updatedStock] = await tx.select({ quantity: inventory.quantity })
                    .from(inventory)
                    .where(and(
                        eq(inventory.warehouseId, data.warehouseId),
                        eq(inventory.productId, item.productId)
                    ));

                await tx.insert(inventoryLogs).values({
                    tenantId: session.user.tenantId,
                    warehouseId: data.warehouseId,
                    productId: item.productId,
                    type: 'IN',
                    quantity: item.quantity,
                    balanceAfter: Number(updatedStock?.quantity || item.quantity),
                    reason: 'PURCHASE_ORDER',
                    referenceType: 'PO',
                    referenceId: po.id,
                    operatorId: session.user.id,
                    description: `采购入库: ${po.poNo}`,
                });
            }
        }

        revalidatePath(SUPPLY_CHAIN_PATHS.PURCHASE_ORDERS);
        return { success: true, data: { status: newStatus, allFullyReceived } };
    });
});

/**
 * 导出采购单数据用于 PDF 渲染
 *
 * @description 仅限已确认状态后的单据导出。返回结构化的 PO 基础信息和明细。
 * @param params 包含待导出 PO ID
 */
export async function exportPoPdf({ poId }: { poId: string }) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权' };

    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.PO_MANAGE);

    const po = await db.query.purchaseOrders.findFirst({
        where: and(
            eq(purchaseOrders.id, poId),
            eq(purchaseOrders.tenantId, session.user.tenantId)
        ),
        with: {
            items: true,
        }
    });

    if (!po) return { success: false, error: '采购单不存在' };

    // 检查状态：DRAFT 和 PENDING_CONFIRMATION 不允许导出
    const nonExportableStatuses = ['DRAFT', 'PENDING_CONFIRMATION'];
    if (nonExportableStatuses.includes(po.status!)) {
        return { success: false, error: '草稿和待审批状态的采购单不能导出' };
    }

    return {
        success: true,
        data: {
            poNo: po.poNo,
            supplierName: po.supplierName,
            status: po.status,
            totalAmount: po.totalAmount,
            createdAt: po.createdAt,
            items: po.items,
            remark: po.remark,
        }
    };
}

/**
 * 获取采购仪表盘统计指标
 * 
 * @description 统计待确认、运输中、已延期及已完成的采购单数量。
 * @returns {Promise<ProcurementMetrics>}
 */
export async function getProcurementDashboardMetrics() {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权', data: null };

    const tenantId = session.user.tenantId;
    const now = new Date();

    try {
        // 1. Pending POs: 状态为 PENDING (待确认) 或 CONFIRMED (已确认/待生产) 或 PENDING_PAYMENT (待付款)
        // 这里根据业务定义，"Pending" 通常指进行中但未发货的状态，或者严格指 "PENDING" 状态。
        // 为了仪表盘更有意义，我们暂时定义为：DRAFT, PENDING, CONFIRMED, PENDING_PAYMENT, IN_PRODUCTION, READY
        // 或者简单点，只统计 "待处理" (PENDING)
        // 让我们先统计 strict 'PENDING'，如果觉得数据太少再调整。
        const [pendingCount] = await db.select({ count: sql<number>`count(*)` })
            .from(purchaseOrders)
            .where(and(
                eq(purchaseOrders.tenantId, tenantId),
                eq(purchaseOrders.status, 'PENDING_CONFIRMATION')
            ));

        // 2. In Transit: 状态为 SHIPPED
        const [inTransitCount] = await db.select({ count: sql<number>`count(*)` })
            .from(purchaseOrders)
            .where(and(
                eq(purchaseOrders.tenantId, tenantId),
                eq(purchaseOrders.status, 'SHIPPED')
            ));

        // 3. Delayed: 未完成/未取消 且 超过预期交货如期
        // 排除状态: COMPLETED, CANCELLED, DELIVERED (已送达不算延期，除非送达时间晚于预期，但这里通常指当前延期未到的)
        const [delayedCount] = await db.select({ count: sql<number>`count(*)` })
            .from(purchaseOrders)
            .where(and(
                eq(purchaseOrders.tenantId, tenantId),
                notInArray(purchaseOrders.status, ['COMPLETED', 'CANCELLED', 'DELIVERED']),
                sql`${purchaseOrders.expectedDate} < ${now.toISOString()}`
            ));

        // 4. Completed: 状态为 COMPLETED
        const [completedCount] = await db.select({ count: sql<number>`count(*)` })
            .from(purchaseOrders)
            .where(and(
                eq(purchaseOrders.tenantId, tenantId),
                eq(purchaseOrders.status, 'COMPLETED')
            ));

        return {
            success: true,
            data: {
                pending: Number(pendingCount.count),
                inTransit: Number(inTransitCount.count),
                delayed: Number(delayedCount.count),
                completed: Number(completedCount.count)
            }
        };
    } catch (error) {
        console.error('Failed to fetch dashboard metrics:', error);
        return { success: false, error: '获取统计数据失败', data: null };
    }
}
