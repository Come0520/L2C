'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { revalidatePath, updateTag } from 'next/cache';
import { cache } from 'react';
import { db } from '@/shared/api/db';
import { eq, desc, and, ilike, sql } from 'drizzle-orm';
import { afterSalesTickets, orders, auditLogs, liabilityNotices } from '@/shared/api/schema';
import Decimal from 'decimal.js';
import { afterSalesStatusEnum } from '@/shared/api/schema/enums';
import { auth } from '@/shared/lib/auth';
import { generateTicketNo, escapeLikePattern, maskPhoneNumber } from '../utils';
import { isValidTransition } from '../logic/state-machine';
import { AuditService } from '@/shared/services/audit-service';
import { createTicketSchema, updateStatusSchema, _placeholderSchema } from './schemas';
import { logger } from '@/shared/lib/logger';

/**
 * 分页获取售后工单列表 (Server Action)
 * 包含多维度的租户隔离、状态过滤、优先级和工单号模糊搜索。
 * 供售后看板及列表页展示使用。
 *
 * @param params - 包含 page, pageSize, status, search, type, priority 等分页和过滤参数对象
 * @returns 包含经过手机号隐私脱敏后的工单列表及成功状态标识
 */
export const getAfterSalesTickets = cache(
  async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    search?: string;
    type?: string;
    priority?: string;
    isWarranty?: string;
  }) => {
    // 安全校验：认证和租户隔离
    const session = await auth();
    if (!session?.user?.tenantId) {
      return { success: false, error: '未授权', data: [] };
    }
    const tenantId = session.user.tenantId;

    if (tenantId === '__PLATFORM__') {
      return { success: true, data: [], total: 0 };
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const offset = (page - 1) * pageSize;

    const conditions = [
      eq(afterSalesTickets.tenantId, tenantId), // 租户隔离
    ];
    if (params?.status) {
      conditions.push(
        eq(
          afterSalesTickets.status,
          params.status as (typeof afterSalesStatusEnum.enumValues)[number]
        )
      );
    }
    if (params?.search) {
      const safeSearch = escapeLikePattern(params.search);
      conditions.push(ilike(afterSalesTickets.ticketNo, `%${safeSearch}%`));
    }
    if (params?.type && params.type !== 'all') {
      conditions.push(eq(afterSalesTickets.type, params.type));
    }
    if (params?.priority && params.priority !== 'all') {
      conditions.push(eq(afterSalesTickets.priority, params.priority));
    }
    if (params?.isWarranty !== undefined && params.isWarranty !== 'all') {
      conditions.push(eq(afterSalesTickets.isWarranty, params.isWarranty === 'true'));
    }

    const data = await db.query.afterSalesTickets.findMany({
      where: and(...conditions),
      limit: pageSize,
      offset: offset,
      orderBy: [desc(afterSalesTickets.createdAt)],
      with: {
        customer: true,
        order: true,
        assignee: true,
        creator: true,
      },
    });

    // P1 FIX (AS-D-02): 增加分页 count，补充精确的 tenantId 条件
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(afterSalesTickets)
      .where(and(...conditions));

    // P1 FIX (AS-15): 列表页手机号脱敏
    const safeData = data.map((ticket) => ({
      ...ticket,
      customer: ticket.customer
        ? {
          ...ticket.customer,
          phone: maskPhoneNumber(ticket.customer.phone),
          phoneSecondary: maskPhoneNumber(ticket.customer.phoneSecondary),
        }
        : null,
    }));

    return { success: true, data: safeData, total: Number(count) };
  }
);

/**
 * 创建售后工单 (Server Action)
 * 执行订单所属权验证、工单号生成及审计记录。
 */
const createAfterSalesTicketAction = createSafeAction(createTicketSchema, async (data, ctx) => {
  if (ctx.session.user.tenantId === '__PLATFORM__') {
    return { success: false, message: '平台管理员不能创建工单' };
  }

  try {
    const newTicket = await db.transaction(async (tx) => {
      // P0 FIX (AS-01): 添加租户隔离，防止跨租户工单注入
      const order = await tx.query.orders.findFirst({
        where: and(
          eq(orders.id, data.orderId),
          eq(orders.tenantId, ctx.session.user.tenantId) // 租户隔离校验
        ),
        columns: { id: true, tenantId: true, customerId: true, orderNo: true },
      });

      if (!order) {
        throw new Error('关联订单不存在或无权操作');
      }

      // P1 FIX (R2-05): 透传事务 tx 确保并发安全
      const ticketNo = await generateTicketNo(ctx.session.user.tenantId, tx);

      const userId = ctx.session?.user?.id;
      if (!userId) throw new Error('用户未登录');

      const [inserted] = await tx
        .insert(afterSalesTickets)
        .values({
          tenantId: order.tenantId,
          ticketNo: ticketNo,
          orderId: order.id,
          customerId: order.customerId,
          type: data.type,
          description: data.description,
          photos: data.photos,
          priority: data.priority,
          assignedTo: data.assignedTo,
          createdBy: userId,
          status: 'PENDING',
        })
        .returning();

      return inserted;
    });

    // 记录审计日志
    await AuditService.recordFromSession(
      ctx.session,
      'after_sales_tickets',
      newTicket.id,
      'CREATE',
      {
        new: newTicket as Record<string, unknown>,
      }
    );

    logger.info(
      `[After Sales] Successfully created ticket: ${newTicket.id} for order: ${data.orderId}`
    );

    revalidatePath('/after-sales');
    return { success: true, data: newTicket, message: '售后工单创建成功' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '服务器内部错误';
    logger.error('[After Sales] Create Ticket Failed:', { error: err });
    return { success: false, message };
  }
});

/**
 * 向系统中请求创建一条新的售后工单记录
 * 需先通过 `createTicketSchema` 的入参合法性校验验证。
 * 它封装了生成防重规则单号以及校验调用者身份的强安全操作。
 *
 * @param data - 由前端页面组装并传入的新工单数据模型
 * @returns 包含建立的工单实例和成功标识的对象
 */
export async function createAfterSalesTicket(data: z.infer<typeof createTicketSchema>) {
  return createAfterSalesTicketAction(data);
}

/**
 * 获取工单详情 (Server Action)
 * 包含关联的客户、订单、责任单及处理记录。
 */
const getAfterSalesTicketDetailAction = createSafeAction(
  z.object({ id: z.string().uuid() }),
  async ({ id }, { session }) => {
    const tenantId = session.user.tenantId;

    if (tenantId === '__PLATFORM__') return { success: false, message: '平台管理员不能查看工单详情' };

    // 1. 获取核心单据及直接的一对一关联数据
    const ticketPromise = db.query.afterSalesTickets.findFirst({
      where: and(
        eq(afterSalesTickets.id, id),
        eq(afterSalesTickets.tenantId, tenantId) // 租户隔离
      ),
      with: {
        customer: true,
        order: true,
        assignee: true,
        creator: true,
        installTask: true,
      },
    });

    // 2. 独立获取复杂的关联集合数据 (与核心查询并行)
    const noticesPromise = db.query.liabilityNotices.findMany({
      where: and(eq(liabilityNotices.afterSalesId, id), eq(liabilityNotices.tenantId, tenantId)),
      with: {
        confirmer: true,
        sourcePurchaseOrder: true,
        sourceInstallTask: true,
      },
      orderBy: (notices, { desc }) => [desc(notices.createdAt)],
    });

    const [ticket, notices] = await Promise.all([ticketPromise, noticesPromise]);

    if (!ticket) return { success: false, message: '工单不存在' };

    // 3. 填装分离的嵌套数据 (Notices)
    const assembledTicket: any = {
      ...ticket,
      notices,
    };

    // 4. 按需并行获取 Order 下面的其它一对多集合（如果原 order 存在）
    if (ticket.order) {
      const [installTasks, purchaseOrders] = await Promise.all([
        db.query.installTasks.findMany({
          where: eq(sql`"orderId"`, ticket.order.id),
        }),
        db.query.purchaseOrders.findMany({
          where: eq(sql`"orderId"`, ticket.order.id),
        }),
      ]);
      assembledTicket.order = {
        ...ticket.order,
        installTasks,
        purchaseOrders,
      };
    }

    // P1 FIX (AS-15): 详情页手机号脱敏
    if (assembledTicket.customer) {
      assembledTicket.customer = {
        ...assembledTicket.customer,
        phone: maskPhoneNumber(assembledTicket.customer.phone),
        phoneSecondary: maskPhoneNumber(assembledTicket.customer.phoneSecondary),
      };
    }

    return { success: true, data: assembledTicket };
  }
);

/**
 * 获取指定售后工单的详尽信息展示数据
 * 穿透包含：客户基础资料、关联的原始订单、责任判决及处理跟踪记录等。
 * 已对客户手机进行默认脱敏响应，可安全传递至前端展示层。
 *
 * @param ticketId - 指定查询的唯一售后工单标识 ID
 * @returns 包含完整聚合数据的单据模型
 */
export const getTicketDetail = cache(async (ticketId: string) => {
  return getAfterSalesTicketDetailAction({ id: ticketId });
});

/**
 * 更新工单状态 (Server Action)
 * 核心逻辑：基于状态机的流转校验，并记录审计日志。
 */
const updateTicketStatusAction = createSafeAction(updateStatusSchema, async (data, { session }) => {
  const tenantId = session.user.tenantId;

  if (tenantId === '__PLATFORM__') return { success: false, message: '平台管理员不能操作工单' };

  // 安全校验：确保工单属于当前租户
  const ticket = await db.query.afterSalesTickets.findFirst({
    where: and(eq(afterSalesTickets.id, data.ticketId), eq(afterSalesTickets.tenantId, tenantId)),
    columns: { id: true, status: true, version: true },
  });

  if (!ticket) {
    return { success: false, message: '工单不存在或无权操作' };
  }

  // P1 FIX (AS-07): 状态流转校验
  if (!isValidTransition(ticket.status, data.status)) {
    return {
      success: false,
      message: `无法从 ${ticket.status} 状态变更为 ${data.status}`,
    };
  }

  // 乐观锁检查 (AS-P-03): 如果传入了期望版本号，则进行校验
  if (data.expectedVersion !== undefined && ticket.version !== data.expectedVersion) {
    return { success: false, message: '工单已被修改，请刷新后重试 (版本过期)' };
  }

  const result = await db
    .update(afterSalesTickets)
    .set({
      status: data.status,
      resolution: data.resolution,
      updatedAt: new Date(),
      version: ticket.version + 1, // 版本号自增
    })
    .where(
      and(
        eq(afterSalesTickets.id, data.ticketId),
        eq(afterSalesTickets.tenantId, tenantId),
        eq(afterSalesTickets.version, ticket.version) // 严格版乐观锁：数据库层面再次校验
      )
    )
    .returning({ updatedId: afterSalesTickets.id });

  if (result.length === 0) {
    return { success: false, message: '并发更新失败，工单已被修改，请刷新重试' };
  }

  // 记录审计日志
  await AuditService.recordFromSession(session, 'after_sales_tickets', data.ticketId, 'UPDATE', {
    old: { status: ticket.status },
    new: { status: data.status, resolution: data.resolution },
    changed: { status: data.status },
  });

  logger.info(
    `[After Sales] Ticket ${data.ticketId} status updated to ${data.status} by user ${session.user.id}`
  );

  updateTag(`after-sales-ticket-${data.ticketId}`);
  return { success: true, message: '状态更新成功' };
});

/**
 * 手动向系统提交状态运转及最终处理方案的保存操作
 * 基于严格的状态机流程检查，不允许断层流转或回退流转。
 * 更新后将自动记录全量的系统级别核心参数变化监控及快照至审计表中。
 *
 * @param data - 需要更新的工单状态和（如需要）处理结果意见的格式化字符串
 * @returns 通知前后端刷新并返回状态文字描述结果的封装对象
 */
export async function updateTicketStatus(data: z.infer<typeof updateStatusSchema>) {
  return updateTicketStatusAction(data);
}

/**
 * 获取工单随时间的动作审计日志历史记录
 * 这些审计日志常用于前端展示追踪时间轴，以及追溯异常流转。
 *
 * @param ticketId - 需要查询日志历史轨迹的目标工单 ID
 * @returns 单据所有带有时间戳的历史状态快照集
 */
export const getTicketLogs = cache(async (ticketId: string) => {
  const session = await auth();
  if (!session?.user?.tenantId) return { success: false, message: '未授权' };
  if (session.user.tenantId === '__PLATFORM__') return { success: true, data: [] };

  const logs = await db.query.auditLogs.findMany({
    where: and(
      eq(auditLogs.tableName, 'after_sales_tickets'),
      eq(auditLogs.recordId, ticketId),
      eq(auditLogs.tenantId, session.user.tenantId)
    ),
    with: {
      user: true,
    },
    orderBy: [desc(auditLogs.createdAt)],
  });

  return { success: true, data: logs };
});

/**
 * 进行单据层面的退款及衍生赔付成本全额结案操作
 * 根据最终所有的核算损失更新定结属性，并将系统的账务和状态予以永久关闭。
 *
 * @param ticketId - 待核算结案的工单 UUID
 * @returns 返回标记系统内部财务确认节点成功的消息
 */
export async function closeResolutionCostClosure(ticketId: string, expectedVersion?: number) {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.tenantId) return { success: false, error: '未授权' };
  if (session.user.tenantId === '__PLATFORM__') return { success: false, error: '平台管理员不能操作工单' };

  try {
    const ticket = await db.query.afterSalesTickets.findFirst({
      where: and(
        eq(afterSalesTickets.id, ticketId),
        eq(afterSalesTickets.tenantId, session.user.tenantId) // AS-S-01 修复跨越权查询
      ),
    });

    if (!ticket) return { success: false, error: '工单不存在或无权操作' };
    if (expectedVersion !== undefined && ticket.version !== expectedVersion) {
      return { success: false, error: '工单已被修改，请刷新后重试 (版本过期)' };
    }

    // 使用精度较高的计算，防止丢精度
    const actualCost = new Decimal(ticket.totalActualCost || 0);
    const actualDeduction = new Decimal(ticket.actualDeduction || 0);

    // AS-Q-01: 若 internalLoss 为负数，说明扣超出成本，内部不仅没损失反而 "盈利"，此时在服务中心账务上应记为 0（超出部分进入债转或扣款冻结，而不应体现为负向内耗损失）
    const computedLoss = actualCost.minus(actualDeduction);
    const internalLoss = computedLoss.isNegative() ? new Decimal(0) : computedLoss;

    const result = await db
      .update(afterSalesTickets)
      .set({
        internalLoss: internalLoss.toString(),
        status: 'CLOSED',
        closedAt: new Date(),
        updatedAt: new Date(),
        version: ticket.version + 1, // 版本自增
      })
      .where(
        and(
          eq(afterSalesTickets.id, ticketId),
          eq(afterSalesTickets.tenantId, session.user.tenantId),
          eq(afterSalesTickets.version, ticket.version) // 乐观锁保障
        )
      )
      .returning({ updatedId: afterSalesTickets.id });

    if (result.length === 0) {
      return { success: false, error: '并发结案失败，工单已被修改' };
    } // 安全保护

    await AuditService.recordFromSession(session, 'after_sales_tickets', ticketId, 'UPDATE', {
      changed: { internalLoss: internalLoss.toString(), status: 'CLOSED' },
    });

    logger.info(
      `[After Sales] Ticket ${ticketId} financially closed with internal loss: ${internalLoss}`
    );

    updateTag(`after-sales-ticket-${ticketId}`);
    return { success: true, message: '成本结案成功' };
  } catch (err) {
    logger.error(`[After Sales] Failed to close cost for ticket ${ticketId}:`, { error: err });
    return { success: false, error: '结案执行过程中发生系统异常，详见错误日志' };
  }
}

/**
 * 检验售后工单是否具备执行财务结案的前置状态条件
 * 遍历并检查其产生的所有被扣方关联的定责单是否已完全同入到财务模块完成记账。
 *
 * @param ticketId - 触发财务终结判断的工单凭证
 * @returns 描述是否已经没有遗漏而畅通的校验状态集
 */
export const checkTicketFinancialClosure = cache(async (ticketId: string) => {
  const session = await auth();
  if (!session?.user?.tenantId) return { success: false, error: '未授权' };
  if (session.user.tenantId === '__PLATFORM__') return { success: true, isClosed: true, message: '平台管理员无需校验' };

  const notices = await db.query.liabilityNotices.findMany({
    where: and(
      eq(liabilityNotices.afterSalesId, ticketId),
      eq(liabilityNotices.tenantId, session.user.tenantId) // AS-S-03 防超权
    ),
  });

  if (notices.length === 0) {
    return { success: true, isClosed: true, message: '无定责单，自动通过' };
  }

  const unclosedNotices = notices.filter((n) => n.financeStatus !== 'SYNCED');

  if (unclosedNotices.length > 0) {
    return {
      success: true,
      isClosed: false,
      message: `仍有 ${unclosedNotices.length} 份定责单未完成财务同步`,
    };
  }

  return { success: true, isClosed: true, message: '所有财务流程已闭环' };
});

/**
 * [演示占位] 快捷派生创建关联的换货类型采购工单
 * 未来应进一步与 WMS (仓库管理) 模块对接进行自动的调拨与替换单产生。
 *
 * @param ticketId - 需要被继承的父工单号
 * @returns 基于原订单上下文环境产生的相关全新子订单数据
 */
export async function createExchangeOrder(ticketId: string) {
  const session = await auth();
  if (!session?.user?.tenantId) return { success: false, error: '未授权' };
  if (session.user.tenantId === '__PLATFORM__') return { success: false, error: '平台管理员不能操作工单' };

  const ticket = await db.query.afterSalesTickets.findFirst({
    where: and(
      eq(afterSalesTickets.id, ticketId),
      eq(afterSalesTickets.tenantId, session.user.tenantId) // AS-S-02 跨越权保护
    ),
    with: { order: true },
  });

  if (!ticket) return { success: false, error: '工单不存在或无权访问' };

  // 这里仅作为演示：创建一个关联原订单的草稿订单
  const newOrderNo = `EX${Date.now()}`;

  return {
    success: true,
    message: `换货订单 ${newOrderNo} 已生成 (草稿)`,
    data: { orderNo: newOrderNo },
  };
}
