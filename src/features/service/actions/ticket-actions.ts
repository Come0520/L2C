'use server';

import { db } from '@/shared/api/db';
import { afterSalesTickets, customers, orders } from '@/shared/api/schema';
import { eq, desc, and, count, ilike, or } from 'drizzle-orm';
import { auth, checkPermission } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { logger } from '@/shared/lib/logger';
import { PERMISSIONS } from '@/shared/config/permissions';

// Types for filters
export interface TicketFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  type?: string;
}

/**
 * 根据分页和条件查询并获取售后服务工单列表
 * @param filters - (TicketFilters) 提供页数、页容量、匹配状态及关键词的条件映射
 * @returns 包含格式化后工单、该页面总计信息等属性的响应对象
 */
export async function getServiceTickets(filters: TicketFilters = {}) {
  const session = await auth();
  if (!session || !session.user?.tenantId)
    return { success: false, error: 'Unauthorized', data: [], total: 0 };

  const { page = 1, pageSize = 20, search, status } = filters;
  const offset = (page - 1) * pageSize;

  try {
    const query = db
      .select({
        ticket: afterSalesTickets,
        customer: customers,
        order: orders,
      })
      .from(afterSalesTickets)
      .leftJoin(customers, eq(afterSalesTickets.customerId, customers.id))
      .leftJoin(orders, eq(afterSalesTickets.orderId, orders.id));

    const whereConditions = [eq(afterSalesTickets.tenantId, session.user.tenantId)];

    if (status && status !== 'all') {
      whereConditions.push(eq(afterSalesTickets.status, status as "PENDING" | "PROCESSING" | "PENDING_VERIFY" | "CLOSED"));
    }

    if (search) {
      const searchLower = `%${search.toLowerCase()}%`;
      whereConditions.push(
        or(
          ilike(afterSalesTickets.ticketNo, searchLower),
          ilike(afterSalesTickets.description, searchLower),
          ilike(customers.name, searchLower)
        )!
      );
    }

    const dataQuery = await query
      .where(and(...whereConditions)!)
      .limit(pageSize)
      .offset(offset)
      .orderBy(desc(afterSalesTickets.createdAt));

    const countResult = await db
      .select({ count: count(afterSalesTickets.id) })
      .from(afterSalesTickets)
      .leftJoin(customers, eq(afterSalesTickets.customerId, customers.id))
      .where(and(...whereConditions)!);

    const total = countResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    const formattedData = dataQuery.map((row) => ({
      ...row.ticket,
      customer: row.customer,
      order: row.order,
    }));

    return {
      success: true,
      data: formattedData,
      total,
      page,
      totalPages,
    };
  } catch (e) {
    logger.error('getServiceTickets error:', e);
    return { success: false, error: 'Failed to fetch tickets', data: [], total: 0 };
  }
}

/**
 * 更新指定售后工单的状态信息以及处理结果
 * @param id - 需要操作更改工单对应数据实体的唯一主键
 * @param status - 全新的流转或处理状态 ('PENDING' | 'PROCESSING' | 'PENDING_VERIFY' | 'CLOSED')
 * @param result - (可选) 支持备注处理结论或修复方案信息
 * @returns 代表状态变更结果（是否成功、有无报错）的实例
 */
export async function updateTicketStatus(
  id: string,
  status: 'PENDING' | 'PROCESSING' | 'PENDING_VERIFY' | 'CLOSED',
  result?: string
) {
  const session = await auth();
  if (!session || !session.user?.tenantId) return { success: false, error: 'Unauthorized' };

  // P0-2 Fix: Add permission check
  await checkPermission(session, PERMISSIONS.AFTER_SALES.MANAGE);

  try {
    // 【防御性逻辑】：不允许对已关闭状态的工单继续操作流转
    const existingTicket = await db.query.afterSalesTickets.findFirst({
      where: and(
        eq(afterSalesTickets.id, id),
        eq(afterSalesTickets.tenantId, session.user.tenantId)
      )
    });

    if (existingTicket?.status === 'CLOSED' && status !== 'CLOSED') {
      return { success: false, error: '已关闭的工单不能直接重新打开或流转' };
    }

    await db
      .update(afterSalesTickets)
      .set({
        status, // Schema enum
        resolution: result || undefined,
        updatedAt: new Date(),
        // P0-1 Fix: Removed unconditional assignedTo override.
        // Assignment should be handled by a dedicated action or only when claiming the ticket.
      })
      .where(
        and(eq(afterSalesTickets.id, id), eq(afterSalesTickets.tenantId, session.user.tenantId))
      );

    revalidatePath('/service');
    return { success: true };
  } catch (e) {
    logger.error('updateTicketStatus error:', e);
    return { success: false, error: 'Update failed' };
  }
}
