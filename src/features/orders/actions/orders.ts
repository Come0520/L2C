
'use server';

import { db } from '@/shared/api/db';
import { orders } from '@/shared/api/schema/orders';

import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { auth, checkPermission } from '@/shared/lib/auth';
import type { Session } from 'next-auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { AuditService } from '@/shared/lib/audit-service';
import { OrderService } from '@/services/order.service';

// 导入子模块以进行重导
export { createOrderFromQuote } from './creation';
export { confirmOrderProduction, splitOrder } from './production';
export { requestDelivery, updateLogistics } from './logistics';

// 导入 Schema
import {
  cancelOrderSchema,
  requestCustomerConfirmationSchema,
  customerRejectSchema
} from '../action-schemas';

/**
 * 辅助函数：安全获取用户的 tenantId
 */
function getTenantId(session: Session | null): string {
  const tenantId = session?.user?.tenantId;
  if (!tenantId) {
    throw new Error('Unauthorized: 缺少租户信息');
  }
  return tenantId;
}

/**
 * 获取订单列表 Action
 */
export async function getOrders(params: { page?: number; pageSize?: number; status?: string }) {
  const session = await auth();
  const tenantId = getTenantId(session);

  const { page = 1, pageSize = 10, status } = params;

  const offset = (page - 1) * pageSize;

  const results = await db.query.orders.findMany({
    where: (orders, { eq, and }) => {
      const conditions = [eq(orders.tenantId, tenantId)];
      if (status) conditions.push(eq(orders.status, status as typeof orders.status._.data));
      return and(...conditions);
    },
    limit: pageSize,
    offset,
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  });

  return results;
}

/**
 * 取消订单 Action
 */
export async function cancelOrderAction(input: z.infer<typeof cancelOrderSchema>) {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id) throw new Error('Unauthorized');
  const tenantId = getTenantId(session);

  await checkPermission(session, PERMISSIONS.ORDER.MANAGE);

  const validated = cancelOrderSchema.parse(input);

  try {
    await db.update(orders)
      .set({
        status: 'CANCELLED',
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, validated.orderId), eq(orders.tenantId, tenantId)));

    await AuditService.record({
      tenantId,
      userId: user.id,
      tableName: 'orders',
      recordId: validated.orderId,
      action: 'ORDER_CANCELLED',
      newValues: { status: 'CANCELLED', reason: validated.reason },
    });

    return { success: true };
  } catch (e: unknown) {
    const error = e as Error;
    throw new Error(error.message || 'Failed to cancel order');
  }
}

/**
 * 确认安装完成 Action
 */
export async function confirmInstallationAction(orderId: string) {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id) throw new Error('Unauthorized');
  const tenantId = getTenantId(session);

  await checkPermission(session, PERMISSIONS.ORDER.MANAGE); // 使用统一权限项

  const cleanId = typeof orderId === 'string' ? orderId.trim() : orderId;

  try {
    await OrderService.confirmInstallation(cleanId, tenantId, user.id);

    await AuditService.record({
      tenantId,
      userId: user.id,
      tableName: 'orders',
      recordId: cleanId,
      action: 'ORDER_INSTALLED',
      newValues: { status: 'INSTALLED' },
    });

    return { success: true };
  } catch (e: unknown) {
    const error = e as Error;
    throw new Error(error.message || 'Failed to confirm installation');
  }
}

/**
 * 顾客通过验收 Action
 */
export async function customerAcceptAction(orderId: string) {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id) throw new Error('Unauthorized');
  const tenantId = getTenantId(session);

  await checkPermission(session, PERMISSIONS.ORDER.MANAGE);

  const cleanId = typeof orderId === 'string' ? orderId.trim() : orderId;

  try {
    await OrderService.customerAccept(cleanId, tenantId);

    await AuditService.record({
      tenantId,
      userId: user.id,
      tableName: 'orders',
      recordId: cleanId,
      action: 'ORDER_CUSTOMER_ACCEPTED',
      newValues: { status: 'COMPLETED' },
    });

    return { success: true };
  } catch (e: unknown) {
    const error = e as Error;
    throw new Error(error.message || 'Failed to accept order');
  }
}

/**
 * 关闭订单 Action
 */
export async function closeOrderAction(orderId: string) {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id) throw new Error('Unauthorized');
  const tenantId = getTenantId(session);

  await checkPermission(session, PERMISSIONS.ORDER.MANAGE);

  const cleanId = typeof orderId === 'string' ? orderId.trim() : orderId;

  try {
    await db.update(orders)
      .set({
        status: 'COMPLETED' as typeof orders.status._.data,
        updatedAt: new Date(),
      })
      .where(and(eq(orders.id, cleanId), eq(orders.tenantId, tenantId)));

    await AuditService.record({
      tenantId,
      userId: user.id,
      tableName: 'orders',
      recordId: cleanId,
      action: 'ORDER_CLOSED',
      newValues: { status: 'COMPLETED' },
    });

    return { success: true };
  } catch (e: unknown) {
    const error = e as Error;
    throw new Error(error.message || 'Failed to close order');
  }
}

/**
 * 请求客户确认 Action
 */
export async function requestCustomerConfirmationAction(input: z.infer<typeof requestCustomerConfirmationSchema>) {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id) throw new Error('Unauthorized');
  const tenantId = getTenantId(session);

  const validated = requestCustomerConfirmationSchema.parse(input);

  try {
    await OrderService.requestCustomerConfirmation(validated.orderId, tenantId);

    await AuditService.record({
      tenantId,
      userId: user.id,
      tableName: 'orders',
      recordId: validated.orderId,
      action: 'ORDER_REQUEST_CONFIRMATION',
      newValues: { status: 'PENDING_CONFIRMATION' },
    });

    return { success: true };
  } catch (e: unknown) {
    const error = e as Error;
    throw new Error(error.message || '操作失败');
  }
}

/**
 * 客户拒绝 Action
 */
export async function customerRejectAction(input: z.infer<typeof customerRejectSchema>) {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id) throw new Error('Unauthorized');
  const tenantId = getTenantId(session);

  const validated = customerRejectSchema.parse(input);

  try {
    await OrderService.customerReject(validated.orderId, tenantId, validated.reason);

    await AuditService.record({
      tenantId,
      userId: user.id,
      tableName: 'orders',
      recordId: validated.orderId,
      action: 'ORDER_CUSTOMER_REJECTED',
      newValues: { status: 'INSTALLATION_REJECTED', reason: validated.reason },
    });

    return { success: true };
  } catch (e: unknown) {
    const error = e as Error;
    throw new Error(error.message || '操作失败');
  }
}
