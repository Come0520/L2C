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
import { unstable_cache } from 'next/cache';

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
        orderBy: desc(quotes.version)
    });
}

/**
 * 获取报价单列表（支持分页、状态筛选、关键词搜索及日期范围过滤）
 * 【租户隔离】强制校验当前用户的租户归属
 * 【安全防护】强制限制 pageSize 在 [1, 100] 范围内，防御深度分页攻击
 * 【缓存策略】使用 unstable_cache 缓存查询结果，标签为 'quotes'
 * 
 * @param params - 筛选参数对象
 * @param params.page - 当前页码（从 1 开始）
 * @param params.pageSize - 每页记录数（最大 100）
 * @param params.statuses - 状态筛选列表
 * @param params.search - 关键词（支持报价单号、客户姓名、电话、地址及小区搜索）
 * @param params.customerId - 按客户 ID 筛选
 * @param params.dateRange - 创建时间范围筛选
 * @returns 包含数据列表及分页元数据的 Promise 对象
 */
export async function getQuotes(
    params: {
        page?: number;
        pageSize?: number;
        statuses?: string[];
        search?: string;
        customerId?: string;
        dateRange?: { from?: Date; to?: Date };
    } = {}
) {
    // 安全检查：获取当前用户并验证租户
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('未授权访问');
    }
    const tenantId = session.user.tenantId;

    return getCachedQuotes(tenantId, params);
}

const getCachedQuotes = unstable_cache(
    async (
        tenantId: string,
        params: {
            page?: number;
            pageSize?: number;
            statuses?: string[];
            search?: string;
            customerId?: string;
            dateRange?: { from?: Date; to?: Date };
        }
    ) => {
        const {
            page = 1,
            pageSize = 10,
            statuses,
            search,
            customerId,
            dateRange,
        } = params;

        // 安全防护：硬性限制 pageSize 范围 [1, 100]，防止深分页攻击
        const safePageSize = Math.min(Math.max(pageSize, 1), 100);
        const offset = (page - 1) * safePageSize;
        const conditions = [];

        // 0. 租户隔离 (必须条件)
        conditions.push(eq(quotes.tenantId, tenantId));

        // 1. Status Filter (支持多状态筛选)
        if (statuses && statuses.length > 0) {
            conditions.push(inArray(quotes.status, statuses as typeof quoteStatusEnum.enumValues[number][]));
        }

        // 2. Customer Filter
        if (customerId) {
            conditions.push(eq(quotes.customerId, customerId));
        }

        // 3. Date Range Filter
        if (dateRange?.from) {
            conditions.push(gte(quotes.createdAt, new Date(dateRange.from)));
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
                .where(and(
                    eq(customers.tenantId, tenantId), // 客户也需要租户隔离
                    or(
                        ilike(customers.name, term),
                        ilike(customers.phone, term),
                        ilike(customerAddresses.address, term),
                        ilike(customerAddresses.community, term)
                    )
                ));

            conditions.push(or(
                ilike(quotes.quoteNo, term),
                inArray(quotes.customerId, matchingCustomerIds)
            ));
        }

        const whereCondition = and(...conditions);

        // Fetch Data and Total Count concurrently
        const dataPromise = db.query.quotes.findMany({
            where: whereCondition,
            limit: safePageSize,
            offset: offset,
            orderBy: [desc(quotes.createdAt)],
            with: {
                customer: true,
                creator: true,
            },
        });

        const countPromise = db
            .select({ count: count() })
            .from(quotes)
            .where(whereCondition);

        const [data, countResult] = await Promise.all([dataPromise, countPromise]);

        const total = countResult[0]?.count || 0;

        return {
            data,
            meta: {
                page,
                pageSize: safePageSize,
                total,
                totalPages: Math.ceil(total / safePageSize)
            }
        };
    },
    ['quotes-list'],
    { tags: ['quotes'] }
);

/**
 * 获取单个报价单的详细信息
 * 【租户隔离】强制校验当前用户的租户归属
 * 【缓存策略】基于报价单 ID 缓存详情信息，标签为 'quotes'
 * 
 * @param id - 报价单 ID (UUID)
 * @returns 包含报价单基础数据、客户信息、房间及行项目的嵌套对象
 */
export async function getQuote(id: string) {
    // 安全检查：获取当前用户并验证租户
    const session = await auth();
    if (!session?.user?.tenantId) {
        throw new Error('未授权访问');
    }
    const tenantId = session.user.tenantId;

    return getCachedQuote(id, tenantId);
}

const getCachedQuote = unstable_cache(
    async (id: string, tenantId: string) => {
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
                            columns: {
                                id: true,
                                quoteId: true,
                                parentId: true,
                                roomId: true,
                                category: true,
                                productId: true,
                                productName: true,
                                productSku: true,
                                roomName: true,
                                unit: true,
                                unitPrice: true,
                                quantity: true,
                                width: true,
                                height: true,
                                foldRatio: true,
                                processFee: true,
                                subtotal: true,
                                attributes: true,
                                calculationParams: true,
                                remark: true,
                                sortOrder: true,
                            },
                        }
                    }
                },
                items: {
                    where: (items, { isNull }) => isNull(items.roomId), // Items without room
                    orderBy: (items, { asc }) => [asc(items.sortOrder)],
                    columns: {
                        id: true,
                        quoteId: true,
                        parentId: true,
                        roomId: true,
                        category: true,
                        productId: true,
                        productName: true,
                        productSku: true,
                        roomName: true,
                        unit: true,
                        unitPrice: true,
                        quantity: true,
                        width: true,
                        height: true,
                        foldRatio: true,
                        processFee: true,
                        subtotal: true,
                        attributes: true,
                        calculationParams: true,
                        remark: true,
                        sortOrder: true,
                    },
                }
            }
        });

        return { data };
    },
    ['quote-detail'],
    { tags: ['quotes'] }
);

/**
 * 获取报价单套餐（捆绑包）及其包含的所有子报价单
 * 【租户隔离】强制校验当前用户的租户归属
 * 
 * @param params - 查询参数
 * @param params.id - 套餐（作为根报价单）的 ID
 * @returns 包含套餐详细数据及子报价单数组的响应对象
 */
export async function getQuoteBundleById({ id }: { id: string }) {
    // 安全检查：获取当前用户并验证租户
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, message: '未授权访问' };
    }
    const tenantId = session.user.tenantId;

    const data = await db.query.quotes.findFirst({
        where: and(
            eq(quotes.id, id),
            eq(quotes.tenantId, tenantId)
        ),
        with: {
            customer: true,
            subQuotes: {
                orderBy: (subQuotes, { asc }) => [asc(subQuotes.createdAt)],
                with: {
                    items: {
                        columns: {
                            id: true,
                            quoteId: true,
                            parentId: true,
                            roomId: true,
                            category: true,
                            productId: true,
                            productName: true,
                            productSku: true,
                            roomName: true,
                            unit: true,
                            unitPrice: true,
                            quantity: true,
                            width: true,
                            height: true,
                            foldRatio: true,
                            processFee: true,
                            subtotal: true,
                            attributes: true,
                            calculationParams: true,
                            remark: true,
                            sortOrder: true,
                        },
                    }, // 加载子报价的明细，用于计算或其他展示
                }
            }
        }
    });

    if (!data) return { success: false, message: 'Quote not found' };

    // 映射 subQuotes 到 quotes 以匹配前端/测试预期
    return { success: true, data: { ...data, quotes: data.subQuotes } };
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
        where: and(
            eq(quotes.id, quoteId),
            eq(quotes.tenantId, tenantId)
        ),
        columns: { id: true }
    });

    if (!quote) {
        throw new Error('报价单不存在或无权访问');
    }

    return await db.select({
        id: auditLogs.id,
        action: auditLogs.action,
        createdAt: auditLogs.createdAt,
        userName: users.name,
    })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(
            and(
                eq(auditLogs.tableName, 'quotes'),
                eq(auditLogs.recordId, quoteId)
            )
        )
        .orderBy(desc(auditLogs.createdAt));
}
