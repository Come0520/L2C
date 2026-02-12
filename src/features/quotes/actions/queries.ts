'use server';

import { db } from '@/shared/api/db';
import { quotes } from '@/shared/api/schema/quotes';
import { customers } from '@/shared/api/schema/customers';
import { customerAddresses } from '@/shared/api/schema/customer-addresses';
import { eq, desc, and, or, ilike, inArray, gte, lte, count } from 'drizzle-orm';
import { users } from '@/shared/api/schema/infrastructure';
import { auditLogs } from '@/shared/api/schema/audit';
import { quoteStatusEnum } from '@/shared/api/schema/enums';
import { auth } from '@/shared/lib/auth';
import { logger } from '@/shared/lib/logger';

/**
 * 获取报价单版本列表
 * @param rootId - 根报价单 ID
 * @returns 该报价单的所有版本（已添加租户隔离）
 */
export async function getQuoteVersions(rootId: string) {
  if (!rootId) return [];

  // 安全检查：获取当前用户并验证租户
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('未授权访问');
  }
  const tenantId = session.user.tenantId;

  return await db.query.quotes.findMany({
    columns: { id: true, version: true, status: true, createdAt: true, quoteNo: true },
    where: and(
      or(eq(quotes.rootQuoteId, rootId), eq(quotes.id, rootId)),
      eq(quotes.tenantId, tenantId) // 租户隔离
    ),
    orderBy: desc(quotes.version),
  });
}

/**
 * 获取报价单列表（分页）
 * 已添加租户隔离，仅返回当前租户的报价单
 */
export async function getQuotes({
  page = 1,
  pageSize = 10,
  statuses,
  search,
  customerId,
  dateRange,
}: {
  page?: number;
  pageSize?: number;
  statuses?: string[];
  search?: string;
  customerId?: string;
  dateRange?: { from?: Date; to?: Date };
} = {}) {
  // 安全检查：获取当前用户并验证租户
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('未授权访问');
  }
  const tenantId = session.user.tenantId;

  const offset = (page - 1) * pageSize;
  const conditions = [];

  // 0. 租户隔离 (必须条件)
  conditions.push(eq(quotes.tenantId, tenantId));

  // 1. Status Filter (支持多状态筛选)
  if (statuses && statuses.length > 0) {
    conditions.push(
      inArray(quotes.status, statuses as (typeof quoteStatusEnum.enumValues)[number][])
    );
  }

  // 2. Customer Filter
  if (customerId) {
    conditions.push(eq(quotes.customerId, customerId));
  }

  // 3. Date Range Filter
  if (dateRange?.from) {
    conditions.push(gte(quotes.createdAt, dateRange.from));
  }
  if (dateRange?.to) {
    // Include the whole end day
    const endDate = new Date(dateRange.to);
    endDate.setHours(23, 59, 59, 999);
    conditions.push(lte(quotes.createdAt, endDate));
  }

  // 4. Keyword Search (QuoteNo OR Customer Name/Phone OR Address)
  if (search && search.trim()) {
    const term = `%${search.trim()}%`;

    // Subquery to find matching customer IDs (限定当前租户的客户)
    const matchingCustomerIds = db
      .select({ id: customers.id })
      .from(customers)
      .leftJoin(customerAddresses, eq(customers.id, customerAddresses.customerId))
      .where(
        and(
          eq(customers.tenantId, tenantId), // 客户也需要租户隔离
          or(
            ilike(customers.name, term),
            ilike(customers.phone, term),
            ilike(customerAddresses.address, term),
            ilike(customerAddresses.community, term)
          )
        )
      );

    conditions.push(
      or(ilike(quotes.quoteNo, term), inArray(quotes.customerId, matchingCustomerIds))
    );
  }

  const whereCondition = and(...conditions);

  // Fetch Data
  let data;
  try {
    data = await db.query.quotes.findMany({
      where: whereCondition,
      limit: pageSize,
      offset: offset,
      orderBy: [desc(quotes.createdAt)],
      with: {
        customer: true,
        creator: true,
      },
    });
  } catch (error) {
    logger.error('getQuotes Error:', error);
    throw error;
  }

  // Fetch Total Count for Pagination
  const countResult = await db.select({ count: count() }).from(quotes).where(whereCondition);

  const total = countResult[0]?.count || 0;

  return {
    data,
    meta: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * 获取单个报价单详情
 * @param id - 报价单 ID
 * @returns 报价单详情（含房间和明细项）
 */
export async function getQuote(id: string) {
  // 安全检查：获取当前用户并验证租户
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('未授权访问');
  }
  const tenantId = session.user.tenantId;

  const data = await db.query.quotes.findFirst({
    where: and(
      eq(quotes.id, id),
      eq(quotes.tenantId, tenantId) // 租户隔离
    ),
    with: {
      customer: true,
      rooms: {
        orderBy: (rooms, { asc }) => [asc(rooms.sortOrder)],
        with: {
          items: {
            orderBy: (items, { asc }) => [asc(items.sortOrder)],
          },
        },
      },
      items: {
        where: (items, { isNull }) => isNull(items.roomId), // Items without room
        orderBy: (items, { asc }) => [asc(items.sortOrder)],
      },
    },
  });

  return { data };
}

/**
 * 获取报价捆绑包（与 getQuote 功能相同，提供兼容性接口）
 */
export async function getQuoteBundleById({ id }: { id: string }) {
  const { data } = await getQuote(id);
  if (!data) return { success: false, message: 'Quote not found' };
  return { success: true, data };
}

/**
 * 获取报价单审计日志
 * @param quoteId - 报价单 ID
 * @returns 审计日志列表
 */
export async function getQuoteAuditLogs(quoteId: string) {
  // 安全检查：先验证报价单属于当前租户
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('未授权访问');
  }
  const tenantId = session.user.tenantId;

  // 先验证报价单存在且属于当前租户
  const quote = await db.query.quotes.findFirst({
    where: and(eq(quotes.id, quoteId), eq(quotes.tenantId, tenantId)),
    columns: { id: true },
  });

  if (!quote) {
    throw new Error('报价单不存在或无权访问');
  }

  return await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      createdAt: auditLogs.createdAt,
      userName: users.name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.userId, users.id))
    .where(and(eq(auditLogs.tableName, 'quotes'), eq(auditLogs.recordId, quoteId)))
    .orderBy(desc(auditLogs.createdAt));
}
