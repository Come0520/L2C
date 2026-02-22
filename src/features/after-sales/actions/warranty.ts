'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { db } from '@/shared/api/db';
import { eq, and } from 'drizzle-orm';
import { orders, tenants } from '@/shared/api/schema';
import { checkWarrantySchema } from './schemas';

/**
 * 判定订单保修状态 (Server Action)
 * 策略：从租户设置中读取保修月数，计算相对于订单完成日期/创建日期的保修终点。
 */
const checkWarrantyStatusAction = createSafeAction(checkWarrantySchema, async ({ orderId }, { session }) => {
    const tenantId = session.user.tenantId;

    // 获取订单信息
    const order = await db.query.orders.findFirst({
        where: and(
            eq(orders.id, orderId),
            eq(orders.tenantId, tenantId)
        ),
        columns: {
            id: true,
            orderNo: true,
            status: true,
            completedAt: true,
            createdAt: true,
        }
    });

    if (!order) {
        return { error: '订单不存在' };
    }

    // P1 FIX (AS-12): 从租户配置中读取保修期
    const tenant = await db.query.tenants.findFirst({
        where: eq(tenants.id, tenantId),
        columns: { settings: true }
    });

    // 默认保修期从租户配置读取，缺省为 12 个月
    const tenantSettings = tenant?.settings as { afterSales?: { warrantyMonths?: number } } | null;
    const warrantyMonths = tenantSettings?.afterSales?.warrantyMonths || 12;
    const now = new Date();

    // 使用完成日期或创建日期作为保修起点
    const warrantyStartDate = order.completedAt ? new Date(order.completedAt) : (order.createdAt ? new Date(order.createdAt) : new Date());
    const warrantyEndDate = new Date(warrantyStartDate);
    warrantyEndDate.setMonth(warrantyEndDate.getMonth() + warrantyMonths);

    const isInWarranty = now <= warrantyEndDate;
    const daysRemaining = isInWarranty
        ? Math.ceil((warrantyEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
    const daysExpired = !isInWarranty
        ? Math.ceil((now.getTime() - warrantyEndDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    return {
        orderId: order.id,
        orderNo: order.orderNo,
        warrantyStartDate: warrantyStartDate.toISOString().slice(0, 10),
        warrantyEndDate: warrantyEndDate.toISOString().slice(0, 10),
        warrantyMonths,
        isInWarranty,
        daysRemaining: isInWarranty ? daysRemaining : null,
        daysExpired: !isInWarranty ? daysExpired : null,
        statusLabel: isInWarranty ? '保修期内' : `已过保 ${daysExpired} 天`,
    };
});

/**
 * 依据公司或租户政策以及原订单完成日期时间轴测算当前产品是否享有保修红利
 * 这可能决定其后的任何售后维修是作为免费保内处理，还是转换为有偿的按单付费。
 * 
 * @param data - 指向可能触发保内报修服务的订单源 ID 实例
 * @returns 返回明确保内测算时间判定点和天数差值的保修有效状态说明
 */
export async function checkWarrantyStatus(data: z.infer<typeof checkWarrantySchema>) {
    return checkWarrantyStatusAction(data);
}
