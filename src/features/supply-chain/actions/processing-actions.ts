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
import { eq, and, desc, count } from "drizzle-orm";
import { auth, checkPermission } from "@/shared/lib/auth";
import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/shared/config/permissions";

/**
 * 加工单状态枚举
 * 与数据库 workOrderStatusEnum 保持一致
 */
export type ProcessingOrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

/**
 * 获取加工单列表
 */
export async function getProcessingOrders(params: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权', data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 };

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

    // 应用层搜索过滤（如有）
    let filteredResults = results;
    if (search) {
        const searchLower = search.toLowerCase();
        filteredResults = results.filter(r =>
            r.wo.woNo.toLowerCase().includes(searchLower) ||
            r.order?.orderNo?.toLowerCase().includes(searchLower) ||
            r.supplier?.name?.toLowerCase().includes(searchLower)
        );
    }

    // 获取总数
    const [{ total: totalCount }] = await db.select({ total: count() })
        .from(workOrders)
        .where(and(...conditions));

    const total = Number(totalCount);

    // 映射数据
    const data = filteredResults.map(r => ({
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
 * 获取加工单详情
 */
export async function getProcessingOrderById({ id }: { id: string }) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: '未授权' };

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

    revalidatePath('/supply-chain/processing-orders');
    return { success: true };
}

/**
 * 创建加工单 (占位)
 */
export async function createProcessingOrder(_data: unknown) {
    return { success: true, message: '功能开发中' };
}

/**
 * 更新加工单 (占位)
 */
export async function updateProcessingOrder(_id: string, _data: unknown) {
    return { success: true, message: '功能开发中' };
}

