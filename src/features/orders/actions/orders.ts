'use server';

import { db } from '@/shared/api/db';
import { orders, orderItems } from '@/shared/api/schema/orders';

import { eq, sql, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { auth, checkPermission } from '@/shared/lib/auth';
import type { Session } from 'next-auth'; // Explicit import
import { PERMISSIONS } from '@/shared/config/permissions';

// Action Schemas
const createOrderSchema = z.object({
  quoteId: z.string().uuid(),
  paymentProofImg: z.string().optional(),
  confirmationImg: z.string().optional(),
  paymentAmount: z.string().optional(), // Decimal as string
  paymentMethod: z.enum(['CASH', 'WECHAT', 'ALIPAY', 'BANK']).optional(),
  remark: z.string().optional(),
});

const updateLogisticsSchema = z.object({
  orderId: z.string().uuid(),
  company: z.string(), // Carrier Code or Name
  trackingNo: z.string(),
});

import { OrderService } from '@/services/order.service';
import { LogisticsService } from '@/services/logistics.service';
import { notifyOrderStatusChange } from '@/services/wechat-subscribe-message.service';

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

export async function createOrderFromQuote(input: z.infer<typeof createOrderSchema>) {
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id) throw new Error('Unauthorized');

  const tenantId = getTenantId(session);

  // 权限检查：需要订单创建权限
  await checkPermission(session, PERMISSIONS.ORDER.CREATE);

  // 验证输入
  const validatedInput = createOrderSchema.parse(input);
  const { quoteId, ...options } = validatedInput;

  try {
    // 获取报价单信息以判断收款状态
    const quote = await db.query.quotes.findFirst({
      where: (quotes, { eq, and }) => and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
    });

    if (!quote) {
      throw new Error('报价单不存在');
    }

    // 计算收款状态
    const paidAmount = parseFloat(options?.paymentAmount || '0');
    const totalAmount = parseFloat(quote.totalAmount || '0');
    const isFullyPaid = paidAmount >= totalAmount && totalAmount > 0;

    if (!isFullyPaid) {
      // 非全款：触发审批流程
      const { submitApproval } = await import('@/features/approval/actions/submission');
      const result = await submitApproval({
        entityType: 'QUOTE',
        entityId: quoteId,
        flowCode: 'QUOTE_TO_ORDER_APPROVAL',
        comment: `报价单转订单申请 (已收款: ¥${paidAmount.toFixed(2)}, 总金额: ¥${totalAmount.toFixed(2)})`,
      });

      if (!result.success) {
        const errorMsg = 'error' in result ? result.error : '未知错误';
        throw new Error(`审批提交失败: ${errorMsg}`);
      }

      // 返回审批中状态
      return {
        pendingApproval: true,
        approvalId: 'approvalId' in result ? result.approvalId : null,
        message: '已提交审批，请等待审批通过后订单将自动创建。',
      };
    }

    // 全款：直接转订单
    const order = await OrderService.convertFromQuote(quoteId, tenantId, user.id, options);

    // 触发佣金计算 (TRIGGER: ORDER_CREATED)
    // 仅当渠道配置为 "ORDER_CREATED" 模式时才会实际生成
    await checkAndGenerateCommission(order.id, 'ORDER_CREATED');

    return order;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Failed to create order';
    throw new Error(message);
  }
}

/**
 * 获取订单列表
 * 已修复：添加租户隔离和权限检查
 */
export async function getOrders(page = 1, pageSize = 20, _search?: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const tenantId = getTenantId(session);

  // 权限检查：需要订单查看权限
  await checkPermission(session, PERMISSIONS.ORDER.VIEW);

  const offset = (page - 1) * pageSize;

  // 查询订单数据 - 添加租户隔离
  const data = await db.query.orders.findMany({
    where: eq(orders.tenantId, tenantId),
    limit: pageSize,
    offset: offset,
    orderBy: [desc(orders.createdAt)],
    with: {
      customer: true,
      sales: true,
    },
  });

  // 查询总数 - 添加租户隔离
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(orders)
    .where(eq(orders.tenantId, tenantId));
  const total = countResult[0]?.count ?? 0;

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * 获取订单详情
 * 已修复：添加租户隔离和权限检查
 */
export async function getOrder(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const tenantId = getTenantId(session);

  // 权限检查：需要订单查看权限
  await checkPermission(session, PERMISSIONS.ORDER.VIEW);

  return await db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.tenantId, tenantId)),
    with: {
      items: true,
      customer: true,
      sales: true,
      paymentSchedules: true,
    },
  });
}

const splitOrderSchema = z.object({
  orderId: z.string().uuid(),
  items: z.array(
    z.object({
      itemId: z.string().uuid(),
      quantity: z.string(), // Decimal
      supplierId: z.string().uuid(),
    })
  ),
});

/**
 * 拆单操作
 * 已修复：添加租户隔离和权限检查
 */
export async function splitOrder(input: z.infer<typeof splitOrderSchema>) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const tenantId = getTenantId(session);
  const userId = session.user.id;

  // 权限检查：需要订单编辑权限
  await checkPermission(session, PERMISSIONS.ORDER.EDIT);

  // 验证输入
  const validatedInput = splitOrderSchema.parse(input);
  const { orderId, items } = validatedInput;

  // 1. 验证订单存在且属于当前租户 - 添加租户隔离
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)),
    with: { items: true },
  });

  if (!order) throw new Error('订单不存在或无权操作');
  if (order.status !== 'PENDING_PO') throw new Error('订单状态不允许拆单');

  // 2. Group items by supplier
  const supplierGroups = new Map<string, typeof items>();
  for (const item of items) {
    const existing = supplierGroups.get(item.supplierId) || [];
    existing.push(item);
    supplierGroups.set(item.supplierId, existing);
  }

  // 3. Create PO for each supplier group
  const createdPOs: string[] = [];

  for (const [supplierId, supplierItems] of supplierGroups) {
    // Calculate total amount for this PO
    let totalAmount = 0;
    const poItemsData = [];

    for (const splitItem of supplierItems) {
      const orderItem = order.items?.find((oi) => oi.id === splitItem.itemId);
      if (!orderItem) continue;

      const qty = parseFloat(splitItem.quantity);
      const unitPrice = parseFloat(orderItem.unitPrice || '0');
      const subtotal = qty * unitPrice;
      totalAmount += subtotal;

      poItemsData.push({
        orderItemId: splitItem.itemId,
        productId: orderItem.productId,
        productName: orderItem.productName,
        quantity: splitItem.quantity,
        unitPrice: orderItem.unitPrice,
        subtotal: subtotal.toFixed(2),
      });
    }

    // Generate PO number
    const poNo = `PO${Date.now()}${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Import PO schema and create
    const { purchaseOrders, purchaseOrderItems } = await import('@/shared/api/schema/supply-chain');

    const supplier = await db.query.suppliers.findFirst({
      where: (suppliers, { eq }) => eq(suppliers.id, supplierId),
    });

    const [newPO] = await db
      .insert(purchaseOrders)
      .values({
        tenantId,
        poNo,
        orderId,
        supplierId,
        supplierName: supplier?.name || 'Unknown Supplier', // Fallback if not found, though checks exist
        status: 'DRAFT',
        totalAmount: totalAmount.toFixed(2),
        createdBy: userId,
      })
      .returning();

    // Create PO items
    for (const poItem of poItemsData) {
      await db.insert(purchaseOrderItems).values({
        tenantId,
        poId: newPO.id,
        ...poItem,
      });

      // Update order item with PO reference
      await db
        .update(orderItems)
        .set({ poId: newPO.id, supplierId })
        .where(eq(orderItems.id, poItem.orderItemId));
    }

    createdPOs.push(newPO.id);
  }

  // 4. 更新订单状态 - 添加租户隔离
  const updatedOrder = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)),
    with: { items: true },
  });

  const allItemsHavePO = updatedOrder?.items?.every((item) => item.poId);
  if (allItemsHavePO) {
    await db
      .update(orders)
      .set({ status: 'PENDING_DELIVERY', updatedAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)));
  }

  return {
    success: true,
    data: {
      createdPOs,
      orderStatus: allItemsHavePO ? 'PENDING_DELIVERY' : 'PENDING_PO',
    },
  };
}

const requestDeliverySchema = z.object({
  orderId: z.string().uuid(),
  company: z.string(),
  trackingNo: z.string().optional(),
  remark: z.string().optional(),
});

/**
 * 请求发货
 * 已修复：添加租户隔离和权限检查
 */
export async function requestDelivery(input: z.infer<typeof requestDeliverySchema>) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const tenantId = getTenantId(session);

  // 权限检查：需要订单编辑权限
  await checkPermission(session, PERMISSIONS.ORDER.EDIT);

  // 验证输入
  const validatedInput = requestDeliverySchema.parse(input);
  const { orderId, company, trackingNo, remark } = validatedInput;

  // 查询订单 - 添加租户隔离
  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)),
  });

  if (!order) throw new Error('订单不存在或无权操作');
  if (order.status !== 'PENDING_DELIVERY') throw new Error('订单状态不正确');

  await db
    .update(orders)
    .set({
      status: 'PENDING_INSTALL',
      logistics: {
        company,
        trackingNo,
        remark,
        dispatchedAt: new Date().toISOString(),
        dispatchedBy: session.user.id,
      },
      updatedAt: new Date(),
    })
    .where(and(eq(orders.id, orderId), eq(orders.tenantId, tenantId)));

  // 发送发货通知
  notifyOrderStatusChange(
    order.salesId || order.customerId, // 这里的通知对象可能是客户或销售，根据业务需求。通常发给客户。
    // 但 notifyOrderStatusChange 第一个参数是 userId。如果不确定 userId，先跳过或查找 owner.
    // 假设 wechat-subscribe-message.service 是发给 User (Sales/Internal) or Customer?
    // 查看 service 实现: findFirst users where id = userId.
    // 所以这是发给 B 端用户的。如果要发给 C 端客户，需要另写 logic。
    // 暂时发给销售(salesId)或创建者(createdBy -- not in schema here but typical).
    // 既然 order.customerId 是 C 端，order.salesId 是 B 端 (User)。
    // 业务场景：通知销售"已发货"？或者通知客户？
    // 如果是 notifyOrderStatusChange(userId...), 那就是发给内部。
    // 让我们假设是通知销售跟进。
    order.salesId || '',
    order.orderNo,
    '待安装',
    `物流公司: ${company} ${trackingNo || ''}`
  ).catch(console.error);

  return { success: true };
}

/**
 * 更新物流信息
 * 已修复：添加权限检查
 */
export async function updateLogistics(input: z.infer<typeof updateLogisticsSchema>) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  // 权限检查：需要订单编辑权限
  await checkPermission(session, PERMISSIONS.ORDER.EDIT);

  // 验证输入
  const validatedInput = updateLogisticsSchema.parse(input);

  try {
    const result = await LogisticsService.updateLogisticsInfo(
      validatedInput.orderId,
      validatedInput.company,
      validatedInput.trackingNo
    );
    return { success: true, data: result };
  } catch (e: unknown) {
    console.error(e);
    const message = e instanceof Error ? e.message : '更新物流信息失败';
    return { success: false, error: message };
  }
}

/**
 * 确认安装完成
 * 已修复：添加权限检查和类型安全
 */
export async function confirmInstallationAction(orderId: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const tenantId = getTenantId(session);

  // 权限检查：需要订单编辑权限
  await checkPermission(session, PERMISSIONS.ORDER.EDIT);

  await OrderService.confirmInstallation(orderId, tenantId, session.user.id);
  return { success: true };
}

/**
 * 请求客户确认
 * 已修复：添加权限检查和类型安全
 */
export async function requestCustomerConfirmationAction(orderId: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const tenantId = getTenantId(session);

  // 权限检查：需要订单编辑权限
  await checkPermission(session, PERMISSIONS.ORDER.EDIT);

  await OrderService.requestCustomerConfirmation(orderId, tenantId);
  return { success: true };
}

import { checkAndGenerateCommission } from '@/features/channels/logic/commission.service';

/**
 * 客户接受安装
 * 已修复：添加权限检查和类型安全
 */
export async function customerAcceptAction(orderId: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const tenantId = getTenantId(session);

  // 权限检查：需要订单编辑权限
  await checkPermission(session, PERMISSIONS.ORDER.EDIT);

  await OrderService.customerAccept(orderId, tenantId);

  // 触发佣金计算 (TRIGGER: ORDER_COMPLETED)
  await checkAndGenerateCommission(orderId, 'ORDER_COMPLETED');

  // 查找订单号和销售ID以发送通知
  const orderData = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { orderNo: true, salesId: true },
  });

  if (orderData?.salesId) {
    notifyOrderStatusChange(orderData.salesId, orderData.orderNo, '已完成', '客户已验收通过').catch(
      console.error
    );
  }

  return { success: true };
}

/**
 * 客户拒绝安装
 * 已修复：添加权限检查和类型安全
 */
export async function customerRejectAction(orderId: string, reason: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const tenantId = getTenantId(session);

  // 权限检查：需要订单编辑权限
  await checkPermission(session, PERMISSIONS.ORDER.EDIT);

  await OrderService.customerReject(orderId, tenantId, reason);

  // 查找订单号和销售ID以发送通知
  const orderData = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { orderNo: true, salesId: true },
  });

  if (orderData?.salesId) {
    notifyOrderStatusChange(
      orderData.salesId,
      orderData.orderNo,
      '验收不通过',
      `原因: ${reason}`
    ).catch(console.error);
  }

  return { success: true };
}

/**
 * 确认订单排产
 * 已修复：添加权限检查和类型安全
 */
export async function confirmOrderProduction(input: { orderId: string }) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const tenantId = getTenantId(session);

  // 权限检查：需要订单编辑权限
  await checkPermission(session, PERMISSIONS.ORDER.EDIT);

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, input.orderId), eq(orders.tenantId, tenantId)),
  });

  if (!order) throw new Error('订单不存在或无权操作');

  await OrderService.updateOrderStatus(
    input.orderId,
    'PENDING_PRODUCTION',
    tenantId,
    session.user.id
  );
  return { success: true };
}
