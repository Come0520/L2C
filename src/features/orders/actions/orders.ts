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
import { logger } from '@/shared/lib/logger';

// 导入 Schema
import {
  cancelOrderSchema,
  confirmInstallationSchema,
  closeOrderSchema,
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
 * 
 * @param params 包含分页参数（page、pageSize）及状态过滤条件（status）
 * @returns 包含查询结果数组的 Promise
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
 * 
 * @param input 包含需取消的订单 ID (`orderId`) 及其关联的版本号 (`version`) 还有取消原因 (`reason`)
 * @returns 操作成功则返回 `{ success: true }`
 */
export async function cancelOrderAction(input: z.infer<typeof cancelOrderSchema>) {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id) throw new Error('Unauthorized');
  const tenantId = getTenantId(session);

  await checkPermission(session, PERMISSIONS.ORDER.MANAGE);

  const validated = cancelOrderSchema.parse(input);

  try {
    const [updatedOrder] = await db.update(orders)
      .set({
        status: 'CANCELLED',
        version: validated.version + 1,
        updatedAt: new Date(),
      })
      .where(and(
        eq(orders.id, validated.orderId),
        eq(orders.tenantId, tenantId),
        eq(orders.version, validated.version)
      ))
      .returning({ id: orders.id });

    if (!updatedOrder) {
      throw new Error('订单版本冲突，请刷新后重试');
    }

    await AuditService.record({
      tenantId,
      userId: user.id,
      tableName: 'orders',
      recordId: validated.orderId,
      action: 'ORDER_CANCELLED',
      newValues: { status: 'CANCELLED', reason: validated.reason },
    });

    logger.info('[orders] 取消订单:', { orderId: validated.orderId, tenantId, reason: validated.reason });

    return { success: true };
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('[orders] 取消订单失败:', { error });
    throw new Error(error.message || 'Failed to cancel order');
  }
}

/**
 * 确认安装完成 Action
 * 
 * @param input 包含已安装订单的 ID (`orderId`) 及其版本号 (`version`)
 * @returns 操作成功则返回 `{ success: true }`
 */
export async function confirmInstallationAction(input: z.infer<typeof confirmInstallationSchema>) {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id) throw new Error('Unauthorized');
  const tenantId = getTenantId(session);

  await checkPermission(session, PERMISSIONS.ORDER.MANAGE); // 使用统一权限项

  try {
    const validated = confirmInstallationSchema.parse(input);
    await OrderService.confirmInstallation(validated.orderId, tenantId, validated.version, user.id);

    await AuditService.record({
      tenantId,
      userId: user.id,
      tableName: 'orders',
      recordId: validated.orderId,
      action: 'ORDER_INSTALLED',
      newValues: { status: 'INSTALLED' },
    });

    logger.info('[orders] 确认安装完成:', { orderId: validated.orderId, tenantId });

    return { success: true };
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('[orders] 确认安装完成失败:', { error });
    throw new Error(error.message || 'Failed to confirm installation');
  }
}

/**
 * 顾客通过验收 Action
 * 
 * @param input 包含要确认的订单 ID (`orderId`) 及版本号 (`version`)
 * @returns 操作成功则返回 `{ success: true }`
 */
export async function customerAcceptAction(input: z.infer<typeof requestCustomerConfirmationSchema>) {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id) throw new Error('Unauthorized');
  const tenantId = getTenantId(session);

  await checkPermission(session, PERMISSIONS.ORDER.MANAGE);

  try {
    const validated = requestCustomerConfirmationSchema.parse(input);
    await OrderService.customerAccept(validated.orderId, tenantId, validated.version);

    await AuditService.record({
      tenantId,
      userId: user.id,
      tableName: 'orders',
      recordId: validated.orderId,
      action: 'ORDER_CUSTOMER_ACCEPTED',
      newValues: { status: 'COMPLETED' },
    });

    logger.info('[orders] 顾客通过验收:', { orderId: validated.orderId, tenantId });

    return { success: true };
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('[orders] 顾客通过验收失败:', { error });
    throw new Error(error.message || 'Failed to accept order');
  }
}

/**
 * 关闭订单 Action
 * 
 * @param input 包含需关闭的订单 ID (`orderId`) 及其版本号 (`version`) 和关闭原因 (`reason`)
 * @returns 操作成功则返回 `{ success: true }`
 */
export async function closeOrderAction(input: z.infer<typeof closeOrderSchema>) {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id) throw new Error('Unauthorized');
  const tenantId = getTenantId(session);

  await checkPermission(session, PERMISSIONS.ORDER.MANAGE);

  const validated = closeOrderSchema.parse(input);

  try {
    const [updatedOrder] = await db.update(orders)
      .set({
        status: 'COMPLETED' as typeof orders.status._.data,
        version: validated.version + 1,
        updatedAt: new Date(),
      })
      .where(and(
        eq(orders.id, validated.orderId),
        eq(orders.tenantId, tenantId),
        eq(orders.version, validated.version)
      ))
      .returning({ id: orders.id });

    if (!updatedOrder) {
      throw new Error('订单版本冲突，请刷新后重试');
    }

    await AuditService.record({
      tenantId,
      userId: user.id,
      tableName: 'orders',
      recordId: validated.orderId,
      action: 'ORDER_CLOSED',
      newValues: { status: 'COMPLETED' },
    });

    logger.info('[orders] 订单被主动关闭:', { orderId: validated.orderId, tenantId });

    return { success: true };
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('[orders] 主动关闭订单失败:', { error });
    throw new Error(error.message || 'Failed to close order');
  }
}

/**
 * 请求客户确认 Action
 * 
 * @param input 包含被请求确认的订单 ID (`orderId`) 及版本号 (`version`)
 * @returns 操作成功则返回 `{ success: true }`
 */
export async function requestCustomerConfirmationAction(input: z.infer<typeof requestCustomerConfirmationSchema>) {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id) throw new Error('Unauthorized');
  const tenantId = getTenantId(session);

  const validated = requestCustomerConfirmationSchema.parse(input);

  try {
    await OrderService.requestCustomerConfirmation(validated.orderId, tenantId, validated.version, user.id);

    await AuditService.record({
      tenantId,
      userId: user.id,
      tableName: 'orders',
      recordId: validated.orderId,
      action: 'ORDER_REQUEST_CONFIRMATION',
      newValues: { status: 'PENDING_CONFIRMATION' },
    });

    logger.info('[orders] 请求客户确认:', { orderId: validated.orderId, tenantId });

    return { success: true };
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('[orders] 请求客户确认失败:', { error });
    throw new Error(error.message || '操作失败');
  }
}

/**
 * 客户拒绝 Action
 * 
 * @param input 包含被拒绝的订单 ID (`orderId`) 以及拒绝验收的原因 (`reason`) 和版本号 (`version`)
 * @returns 操作成功则返回 `{ success: true }`
 */
export async function customerRejectAction(input: z.infer<typeof customerRejectSchema>) {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id) throw new Error('Unauthorized');
  const tenantId = getTenantId(session);

  const validated = customerRejectSchema.parse(input);

  try {
    await OrderService.customerReject(validated.orderId, tenantId, validated.version, validated.reason);

    await AuditService.record({
      tenantId,
      userId: user.id,
      tableName: 'orders',
      recordId: validated.orderId,
      action: 'ORDER_CUSTOMER_REJECTED',
      newValues: { status: 'INSTALLATION_REJECTED', reason: validated.reason },
    });

    logger.info('[orders] 客户决绝并退回:', { orderId: validated.orderId, tenantId, reason: validated.reason });

    return { success: true };
  } catch (e: unknown) {
    const error = e as Error;
    logger.error('[orders] 记录客户拒绝失败:', { error });
    throw new Error(error.message || '操作失败');
  }
}
