'use server';

import { db } from "@/shared/api/db";
import {
    workOrders,
    workOrderItems,
    suppliers,
    orders,
    orderItems,
    products
} from "@/shared/api/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { auth, checkPermission } from "@/shared/lib/auth";
import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/shared/config/permissions";
import { SUPPLY_CHAIN_PATHS } from "../constants";
import { AuditService } from "@/shared/lib/audit-service";

/**
 * 加工单状态枚举
 * 与数据库 workOrderStatusEnum 保持一致
 */
export type ProcessingOrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

/**
 * 获取加工单列表
 */
/**
 * 分页获取加工单列表
 * 
 * @description 结合供应商和订单信息，分页查询加工单。支持状态过滤和单号模糊搜索。
 * @param params 查询参数对象：
 * - `page` (number, optional): 页码，默认 1
 * - `pageSize` (number, optional): 每页数量，默认 20
 * - `status` (string, optional): 加工单状态过滤
 * - `search` (string, optional): 加工单号模糊搜索关键词
 * @returns {Promise<{success: boolean, data: any[], total: number, ...}>} 返回数据列表及分页信息
 */
export async function getProcessingOrders(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
}) {
    console.warn('[supply-chain] getProcessingOrders 查询参数:', params);
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权', data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    // ... (保持原有逻辑)

    // 权限检查
    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);
    } catch {
        return { success: false, error: '无供应链查看权限', data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };
    }

    const { page = 1, pageSize = 20, status, search } = params;
    const tenantId = session.user.tenantId;

    // 构建查询条件
    const conditions = [eq(workOrders.tenantId, tenantId)];

    if (status && status !== 'ALL') {
        conditions.push(eq(workOrders.status, status as ProcessingOrderStatus));
    }

    if (search) {
        conditions.push(sql`(${workOrders.woNo} ILIKE ${`%${search}%`})`);
    }

    // 基础查询
    const results = await db.select({
        wo: workOrders,
        supplier: {
            id: suppliers.id,
            name: suppliers.name,
        },
        order: {
            id: orders.id,
            orderNo: orders.orderNo,
        },
    })
        .from(workOrders)
        .leftJoin(suppliers, eq(workOrders.supplierId, suppliers.id))
        .leftJoin(orders, eq(workOrders.orderId, orders.id))
        .where(and(...conditions))
        .orderBy(desc(workOrders.createdAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

    // 获取总数
    const [{ total: totalCount }] = await db.select({ total: count() })
        .from(workOrders)
        .where(and(...conditions));

    const total = Number(totalCount);

    // 映射数据
    const data = results.map(r => ({
        id: r.wo.id,
        processingNo: r.wo.woNo,
        status: r.wo.status || 'PENDING',
        processorName: r.supplier?.name || '未知加工厂',
        order: {
            id: r.order?.id,
            orderNo: r.order?.orderNo || '-',
        },
        startedAt: r.wo.startAt ? new Date(r.wo.startAt).toLocaleDateString('zh-CN') : '-',
        completedAt: r.wo.completedAt ? new Date(r.wo.completedAt).toLocaleDateString('zh-CN') : null,
        createdAt: r.wo.createdAt ? new Date(r.wo.createdAt).toLocaleDateString('zh-CN') : '-',
        remark: r.wo.remark,
    }));

    return {
        success: true,
        data,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

/**
 * 根据 ID 获取加工单详细信息
 * 
 * @description 获取加工单主表数据及其关联的供应商、订单和对应的加工项明细明细。
 * @param params 包含 `id` (string) 加工单 ID 的对象
 * @returns {Promise<{success: boolean, data?: any, error?: string}>} 返回加工单详情对象
 */
export async function getProcessingOrderById({ id }: { id: string }) {
    console.warn('[supply-chain] getProcessingOrderById 查询 ID:', id);
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权' };
    // ... (保持原有逻辑)

    // 权限检查
    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);
    } catch {
        return { success: false, error: '无供应链查看权限' };
    }

    const result = await db.select({
        wo: workOrders,
        supplier: suppliers,
        order: orders
    })
        .from(workOrders)
        .leftJoin(suppliers, eq(workOrders.supplierId, suppliers.id))
        .leftJoin(orders, eq(workOrders.orderId, orders.id))
        .where(and(
            eq(workOrders.id, id),
            eq(workOrders.tenantId, session.user.tenantId)
        ));

    const record = result[0];
    if (!record) return { success: false, error: '加工单不存在' };

    const { wo, supplier, order } = record;

    // 获取明细
    const items = await db.select({
        woItem: workOrderItems,
        orderItem: orderItems,
        product: products
    })
        .from(workOrderItems)
        .leftJoin(orderItems, eq(workOrderItems.orderItemId, orderItems.id))
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(workOrderItems.woId, wo.id));

    const mapped = {
        id: wo.id,
        processingNo: wo.woNo,
        status: wo.status,
        processorName: supplier?.name || '未知',
        order: {
            id: order?.id,
            orderNo: order?.orderNo || '-'
        },
        items: items.map(i => ({
            id: i.woItem.id,
            productName: i.orderItem?.productName || '未知产品',
            sku: i.product?.sku || '-',
            quantity: i.orderItem?.quantity || 1,
            status: i.woItem.status,
        })),
        startedAt: wo.startAt,
        completedAt: wo.completedAt,
        remark: wo.remark,
        createdAt: wo.createdAt,
    };

    return { success: true, data: mapped };
}

/**
 * 更新加工单状态
 * 
 * @description 根据目标状态更新加工单，流转规则遵循：PENDING -> PROCESSING -> COMPLETED。
 * 进入 PROCESSING 时自动记录 startAt，进入 COMPLETED 时记录 completedAt。
 * @param id 加工单 ID
 * @param status 目标状态 ('PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED')
 * @returns {Promise<{success: boolean, error?: string}>} 返回执行结果状态
 * @throws {Error} 更新失败时记录异常日志
 */
export async function updateProcessingOrderStatus(id: string, status: ProcessingOrderStatus) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权' };

    // 权限检查
    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.MANAGE);
    } catch {
        return { success: false, error: '无供应链管理权限' };
    }

    console.warn('[supply-chain] updateProcessingOrderStatus 开始更新:', { id, status });
    try {
        await db.update(workOrders)
            .set({
                status,
                ...(status === 'PROCESSING' ? { startAt: new Date() } : {}),
                ...(status === 'COMPLETED' ? { completedAt: new Date() } : {}),
                updatedAt: new Date(),
            })
            .where(and(
                eq(workOrders.id, id),
                eq(workOrders.tenantId, session.user.tenantId)
            ));

        // 记录审计日志
        await AuditService.recordFromSession(session, 'workOrders', id, 'UPDATE', {
            new: { status }
        });

        console.warn('[supply-chain] updateProcessingOrderStatus 更新成功');
        revalidatePath(SUPPLY_CHAIN_PATHS.PROCESSING_ORDERS);
        return { success: true };
    } catch (error) {
        console.error('[supply-chain] updateProcessingOrderStatus 更新失败:', error);
        return { success: false, error: '更新加工单状态失败' };
    }
}

// ============ 创建/更新 Schema ============

import { z } from 'zod';
import { generateDocNo } from '@/shared/lib/utils';

/** 创建加工单输入校验 */
const createProcessingOrderSchema = z.object({
    orderId: z.string().uuid('请选择关联订单'),
    poId: z.string().uuid('请选择关联采购单'),
    supplierId: z.string().uuid('请选择加工厂'),
    remark: z.string().max(500).optional(),
    items: z.array(z.object({
        orderItemId: z.string().uuid(),
    })).min(1, '至少需要一个加工项'),
});

/** 更新加工单输入校验 */
const updateProcessingOrderSchema = z.object({
    supplierId: z.string().uuid().optional(),
    remark: z.string().max(500).optional(),
});

/**
 * 创建新加工单
 *
 * @description 开启数据库事务，包含生成加工单号 (WO-*)、创建主表记录及关联插入加工明细。
 * @param data 符合 createProcessingOrderSchema 定义的对象，包含关联 ID、供应商及明细
 * @returns {Promise<{success: boolean, id?: string, woNo?: string, error?: string}>} 返回创建成功的单据信息
 */
export async function createProcessingOrder(data: z.infer<typeof createProcessingOrderSchema>) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权' };

    // 权限检查
    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.MANAGE);
    } catch {
        return { success: false, error: '无供应链管理权限' };
    }

    console.warn('[supply-chain] createProcessingOrder 开始创建:', { orderId: data.orderId, supplierId: data.supplierId });
    // 校验输入
    const parsed = createProcessingOrderSchema.safeParse(data);
    if (!parsed.success) {
        console.warn('[supply-chain] createProcessingOrder 输入校验失败:', parsed.error.issues);
        return { success: false, error: parsed.error.issues[0]?.message || '输入校验失败' };
    }

    const { orderId, poId, supplierId, remark, items } = parsed.data;
    const tenantId = session.user.tenantId;

    try {

        // 验证关联订单存在且属于当前租户
        const [orderRecord] = await db.select({ id: orders.id })
            .from(orders)
            .where(and(
                eq(orders.id, orderId),
                eq(orders.tenantId, tenantId)
            ))
            .limit(1);

        if (!orderRecord) {
            console.warn('[supply-chain] createProcessingOrder 订单验证未通过:', orderId);
            return { success: false, error: '关联订单不存在或无权访问' };
        }

        // 生成加工单号
        const woNo = generateDocNo('WO');

        // 事务：创建主记录 + 明细
        const result = await db.transaction(async (tx) => {
            // 创建 workOrders 主记录
            const [wo] = await tx.insert(workOrders).values({
                tenantId,
                woNo,
                orderId,
                poId,
                supplierId,
                status: 'PENDING',
                remark: remark || null,
                createdBy: session.user.id,
            }).returning({ id: workOrders.id });

            // 批量创建 workOrderItems
            if (items.length > 0) {
                await tx.insert(workOrderItems).values(
                    items.map(item => ({
                        woId: wo.id,
                        orderItemId: item.orderItemId,
                        status: 'PENDING' as const,
                    }))
                );
            }

            // 记录审计日志
            await AuditService.recordFromSession(session, 'workOrders', wo.id, 'CREATE', {
                new: {
                    woNo,
                    orderId,
                    supplierId,
                    itemCount: items.length
                }
            }, tx);

            return wo;
        });

        console.warn('[supply-chain] createProcessingOrder 创建成功:', result.id);
        revalidatePath(SUPPLY_CHAIN_PATHS.PROCESSING_ORDERS);
        return { success: true, id: result.id, woNo };
    } catch (error) {
        console.error('[supply-chain] createProcessingOrder 创建内部错误:', error);
        return { success: false, error: '创建加工单失败' };
    }
}

/**
 * 更新加工单基本信息
 *
 * @description 仅限 PENDING 状态。允许修改加工厂及备注。
 * @param id 加工单 ID
 * @param data 更新字段（供应商 ID 或备注）
 */
export async function updateProcessingOrder(id: string, data: z.infer<typeof updateProcessingOrderSchema>) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权' };

    // 权限检查
    try {
        await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.MANAGE);
    } catch {
        return { success: false, error: '无供应链管理权限' };
    }

    // 校验输入
    const parsed = updateProcessingOrderSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || '输入校验失败' };
    }

    const tenantId = session.user.tenantId;

    console.warn('[supply-chain] 更新加工单基本信息:', { id, tenantId });
    try {

        // 检查加工单存在性 + 租户隔离 + 状态
        const [existing] = await db.select({
            id: workOrders.id,
            status: workOrders.status,
        })
            .from(workOrders)
            .where(and(
                eq(workOrders.id, id),
                eq(workOrders.tenantId, tenantId)
            ))
            .limit(1);

        if (!existing) {
            return { success: false, error: '加工单不存在或无权访问' };
        }

        if (existing.status !== 'PENDING') {
            return { success: false, error: `当前状态 ${existing.status} 不允许修改` };
        }

        // 构建更新字段
        const updateFields: Record<string, unknown> = {
            updatedAt: new Date(),
        };

        if (parsed.data.supplierId) updateFields.supplierId = parsed.data.supplierId;
        if (parsed.data.remark !== undefined) updateFields.remark = parsed.data.remark;

        await db.update(workOrders)
            .set(updateFields)
            .where(and(
                eq(workOrders.id, id),
                eq(workOrders.tenantId, tenantId)
            ));

        // 记录审计日志
        await AuditService.recordFromSession(session, 'workOrders', id, 'UPDATE', {
            new: updateFields
        });

        revalidatePath(SUPPLY_CHAIN_PATHS.PROCESSING_ORDERS);
        return { success: true };
    } catch (error) {
        console.error('[supply-chain] 更新加工单基本信息失败:', error);
        return { success: false, error: '更新加工单失败' };
    }
}

