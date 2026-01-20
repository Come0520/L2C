'use server';

import { db } from '@/shared/api/db';
import { suppliers } from '@/shared/api/schema';
import { eq, and, desc, ilike, sql } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { auth } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { getSuppliersSchema, getSupplierByIdSchema } from '../schemas';

export async function getSuppliers(input: { page?: number; pageSize?: number; query?: string }) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    // View permission check
    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);

    const { page = 1, pageSize = 20, query } = input;
    const offset = (page - 1) * pageSize;

    const whereConditions = and(
        eq(suppliers.tenantId, session.user.tenantId),
        eq(suppliers.isActive, true),
        query ? ilike(suppliers.name, `%${query}%`) : undefined
    );

    const [data, totalResult] = await Promise.all([
        db.select()
            .from(suppliers)
            .where(whereConditions)
            .orderBy(desc(suppliers.createdAt))
            .limit(pageSize)
            .offset(offset),
        db.select({ count: sql<number>`count(*)` })
            .from(suppliers)
            .where(whereConditions)
    ]);

    return {
        data,
        total: Number(totalResult[0]?.count || 0),
        page,
        pageSize,
        totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / pageSize)
    };
}

export async function getSupplierById(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);

    const supplier = await db.query.suppliers.findFirst({
        where: and(
            eq(suppliers.id, id),
            eq(suppliers.tenantId, session.user.tenantId)
        )
    });

    if (!supplier) throw new Error('Supplier not found');

    return supplier;
}

// ============================================================
// 采购单查询函数
// ============================================================

import { purchaseOrders, orders } from '@/shared/api/schema';

/**
 * 获取采购单列表
 */
export async function getPurchaseOrders(input?: {
    page?: number;
    pageSize?: number;
    status?: string;
    supplierId?: string;
    paymentStatus?: string;
    search?: string;
}) {
    const session = await auth();
    if (!session?.user) throw new Error('Unauthorized');

    await checkPermission(session, PERMISSIONS.SUPPLY_CHAIN.VIEW);

    const { page = 1, pageSize = 20, status, supplierId, paymentStatus, search } = input || {};
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const whereConditions = and(
        eq(purchaseOrders.tenantId, session.user.tenantId),
        status ? eq(purchaseOrders.status, status as any) : undefined,
        supplierId ? eq(purchaseOrders.supplierId, supplierId) : undefined,
        paymentStatus ? eq(purchaseOrders.paymentStatus, paymentStatus as any) : undefined,
        search ? ilike(purchaseOrders.poNo, `%${search}%`) : undefined
    );

    const [data, totalResult] = await Promise.all([
        db.select({
            id: purchaseOrders.id,
            poNo: purchaseOrders.poNo,
            orderId: purchaseOrders.orderId,
            supplierId: purchaseOrders.supplierId,
            supplierName: purchaseOrders.supplierName,
            type: purchaseOrders.type,
            status: purchaseOrders.status,
            totalAmount: purchaseOrders.totalAmount,
            paymentStatus: purchaseOrders.paymentStatus,
            logisticsCompany: purchaseOrders.logisticsCompany,
            logisticsNo: purchaseOrders.logisticsNo,
            createdAt: purchaseOrders.createdAt,
            createdBy: purchaseOrders.createdBy,
        })
            .from(purchaseOrders)
            .where(whereConditions)
            .orderBy(desc(purchaseOrders.createdAt))
            .limit(pageSize)
            .offset(offset),
        db.select({ count: sql<number>`count(*)` })
            .from(purchaseOrders)
            .where(whereConditions)
    ]);

    // 获取关联的订单编号
    const orderIds = data.filter(po => po.orderId).map(po => po.orderId!);
    let orderMap: Record<string, string> = {};

    if (orderIds.length > 0) {
        const orderData = await db
            .select({ id: orders.id, orderNo: orders.orderNo })
            .from(orders)
            .where(sql`${orders.id} = ANY(${orderIds})`);
        orderMap = Object.fromEntries(orderData.map(o => [o.id, o.orderNo]));
    }

    // 合并订单编号
    const enrichedData = data.map(po => ({
        ...po,
        orderNo: po.orderId ? orderMap[po.orderId] : null
    }));

    return {
        data: enrichedData,
        total: Number(totalResult[0]?.count || 0),
        page,
        pageSize,
        totalPages: Math.ceil(Number(totalResult[0]?.count || 0) / pageSize)
    };
}

