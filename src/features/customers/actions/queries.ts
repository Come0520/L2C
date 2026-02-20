'use server';

import { db } from '../../../shared/api/db';
import { customers } from '../../../shared/api/schema';
import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { getCustomersSchema, customerLifecycleStages, customerPipelineStatuses } from '../schemas';
import { auth, checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { CustomerListItem, CustomerDetail, CustomerProfile, ReferralChain } from '../types';
import { logger } from '@/shared/lib/logger';
import { AppError, ERROR_CODES } from '@/shared/lib/errors';

/**
 * Get a paginated list of customers
 * 获取客户列表
 * 
 * Security check: Automatically gets tenantId from session for tenant isolation (安全检查：自动从 session 获取 tenantId 实现租户隔离)
 */
export async function getCustomers(params: z.input<typeof getCustomersSchema>): Promise<{ data: CustomerListItem[], pagination: { page: number, pageSize: number, total: number, totalPages: number } }> {
    const session = await auth();
    if (!session?.user?.tenantId) throw new AppError('Unauthorized', ERROR_CODES.PERMISSION_DENIED, 401);

    const tenantId = session.user.tenantId;
    const parsedArgs = getCustomersSchema.parse(params);
    const { page, search, type, level, assignedSalesId, lifecycleStage, pipelineStatus } = parsedArgs;
    const safePageSize = Math.min(parsedArgs.pageSize, 100);
    const offset = (page - 1) * safePageSize;

    // 首先添加租户隔离条件
    // [Fix 1.1] 过滤已合并和已删除的客户
    const whereConditions = [
        eq(customers.tenantId, tenantId),
        eq(customers.isMerged, false),
        isNull(customers.deletedAt)
    ];

    // [Fix 1.4] 数据范围权限控制
    // 如果没有 ALL_VIEW 权限，强制只能查看自己名下的客户
    const hasAllView = await checkPermission(session, PERMISSIONS.CUSTOMER.ALL_VIEW);
    if (!hasAllView) {
        // 如果用户尝试查询其他人的数据，或者是默认查询，都强制加上 assignedSalesId = userId
        // 注意：如果用户传了 assignedSalesId 且不等于 userId，查询结果将为空 (userId AND otherId)
        whereConditions.push(eq(customers.assignedSalesId, session.user.id));
    } else if (assignedSalesId) {
        // 如果有 ALL_VIEW 权限且指定了 assignedSalesId，则按指定筛选
        whereConditions.push(eq(customers.assignedSalesId, assignedSalesId));
    }

    if (search) {
        // [Fix 3.2] SQL 注入与通配符转义
        // 虽然 sql 模板是参数化的，但 LIKE 模式中的 % 和 _ 需要转义防止模式匹配攻击
        const escapedSearch = search.replace(/[%_]/g, '\\$&');
        whereConditions.push(
            sql`(${customers.name} ILIKE ${`%${escapedSearch}%`} OR ${customers.phone} ILIKE ${`%${escapedSearch}%`} OR ${customers.customerNo} ILIKE ${`%${escapedSearch}%`})`
        );
    }

    if (type) {
        whereConditions.push(eq(customers.type, type));
    }

    if (level) {
        if (['A', 'B', 'C', 'D'].includes(level)) {
            whereConditions.push(eq(customers.level, level as 'A' | 'B' | 'C' | 'D'));
        }
    }

    // [Fix 1.5] 新增字段过滤
    if (lifecycleStage) {
        whereConditions.push(eq(customers.lifecycleStage, lifecycleStage as (typeof customerLifecycleStages)[number]));
    }

    if (pipelineStatus) {
        whereConditions.push(eq(customers.pipelineStatus, pipelineStatus as (typeof customerPipelineStatuses)[number]));
    }

    const whereClause = and(...whereConditions);

    let data;
    try {
        data = await db.query.customers.findMany({
            where: whereClause,
            with: {
                assignedSales: true,
            },
            orderBy: [desc(customers.createdAt)],
            limit: safePageSize,
            offset: offset,
        });
    } catch (error) {
        logger.error('Error fetching customers with relations, falling back to basic query:', error, { tenantId, params });
        // Fallback: try fetching without relations if the join fails (e.g. schema mismatch)
        data = await db.query.customers.findMany({
            where: whereClause,
            orderBy: [desc(customers.createdAt)],
            limit: safePageSize,
            offset: offset,
        });
    }

    // Count for pagination
    const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(whereClause);

    const total = Number(countResult[0].count);

    return {
        data,
        pagination: {
            page,
            pageSize: safePageSize,
            total,
            totalPages: Math.ceil(total / safePageSize),
        },
    } as { data: CustomerListItem[], pagination: { page: number, pageSize: number, total: number, totalPages: number } };
}

/**
 * Get customer details
 * 获取客户详情
 * 
 * Security check: Automatically gets tenantId from session for tenant isolation (安全检查：自动从 session 获取 tenantId 实现租户隔离)
 */
export async function getCustomerDetail(id: string): Promise<CustomerDetail | undefined> {
    const session = await auth();
    if (!session?.user?.tenantId) throw new AppError('Unauthorized', ERROR_CODES.PERMISSION_DENIED, 401);

    const tenantId = session.user.tenantId;

    const customer = await db.query.customers.findFirst({
        where: and(eq(customers.id, id), eq(customers.tenantId, tenantId)),
        with: {
            assignedSales: true,
            creator: true,
            addresses: true,
            referrer: true,
            referrals: {
                limit: 5, // Just show a few recent referrals
                orderBy: desc(customers.createdAt)
            }
        },
    });

    if (!customer) return undefined;

    // 兼容性处理：如果新字段为空，尝试从 preferences 读取 (用于旧数据迁移过渡)
    // 注意：customer.preferences 类型可能是 unknown，需断言
    const prefs = (customer.preferences as Record<string, unknown>) || {};

    return {
        ...customer,
        source: customer.source || (prefs.source as string) || null,
        referrerName: customer.referrerName || (prefs.referrerName as string) || null,
    };
}

// ============================================================
// [Customer-01] 客户画像增强
// ============================================================

import { orders } from '@/shared/api/schema';
import { sum, count, max } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';

const getCustomerProfileSchema = z.object({
    customerId: z.string().uuid(),
});

const getCustomerProfileActionInternal = createSafeAction(getCustomerProfileSchema, async ({ customerId }, { session }) => {
    if (!session.user.tenantId) throw new AppError('Unauthorized', ERROR_CODES.PERMISSION_DENIED, 401);
    const tenantId = session.user.tenantId;

    let customer;
    try {
        customer = await db.query.customers.findFirst({
            where: and(
                eq(customers.id, customerId),
                eq(customers.tenantId, tenantId)
            ),
            with: {
                assignedSales: true,
                referrer: true,
            }
        });
    } catch (error) {
        console.error('Error fetching customer profile with relations, falling back:', error);
        customer = await db.query.customers.findFirst({
            where: and(
                eq(customers.id, customerId),
                eq(customers.tenantId, tenantId)
            ),
        });
    }

    if (!customer) {
        return { error: '客户不存在' };
    }

    // Typecast to avoid missing property errors when fallback query runs
    const customerWithRelations = customer as typeof customer & { assignedSales?: { name: string } | null; referrer?: { name: string } | null };

    const orderStats = await db
        .select({
            orderCount: count(orders.id),
            totalAmount: sum(orders.totalAmount),
            lastOrderDate: max(orders.createdAt),
        })
        .from(orders)
        .where(and(
            eq(orders.customerId, customerId),
            eq(orders.tenantId, tenantId)
        ));

    const stats = orderStats[0] || { orderCount: 0, totalAmount: '0', lastOrderDate: null };

    const now = new Date();
    const lastOrder = stats.lastOrderDate ? new Date(stats.lastOrderDate) : null;
    const daysSinceLastOrder = lastOrder
        ? Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

    const totalAmount = parseFloat(stats.totalAmount?.toString() || '0');
    const orderCount = Number(stats.orderCount) || 0;

    const recencyScore = daysSinceLastOrder <= 30 ? 5 : daysSinceLastOrder <= 90 ? 4 : daysSinceLastOrder <= 180 ? 3 : daysSinceLastOrder <= 365 ? 2 : 1;
    const frequencyScore = orderCount >= 10 ? 5 : orderCount >= 5 ? 4 : orderCount >= 3 ? 3 : orderCount >= 1 ? 2 : 1;
    const monetaryScore = totalAmount >= 100000 ? 5 : totalAmount >= 50000 ? 4 : totalAmount >= 20000 ? 3 : totalAmount >= 5000 ? 2 : 1;

    const rfmAvg = (recencyScore + frequencyScore + monetaryScore) / 3;
    let valueLabel: 'HIGH_VALUE' | 'POTENTIAL' | 'NORMAL' | 'SLEEPING' | 'LOST';
    if (rfmAvg >= 4) {
        valueLabel = 'HIGH_VALUE';
    } else if (rfmAvg >= 3 && monetaryScore >= 3) {
        valueLabel = 'POTENTIAL';
    } else if (daysSinceLastOrder > 180) {
        valueLabel = daysSinceLastOrder > 365 ? 'LOST' : 'SLEEPING';
    } else {
        valueLabel = 'NORMAL';
    }

    return {
        customer: {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            type: customer.type,
            level: customerWithRelations.level,
            assignedSalesName: customerWithRelations.assignedSales?.name,
            referrerName: customerWithRelations.referrer?.name,
            createdAt: customerWithRelations.createdAt,
        },
        stats: {
            totalAmount,
            orderCount,
            lastOrderDate: stats.lastOrderDate,
            daysSinceLastOrder: lastOrder ? daysSinceLastOrder : null,
            avgOrderAmount: orderCount > 0 ? Math.round(totalAmount / orderCount) : 0,
        },
        rfm: {
            recencyScore,
            frequencyScore,
            monetaryScore,
            avgScore: Math.round(rfmAvg * 10) / 10,
        },
        valueLabel,
        valueLabelText: {
            HIGH_VALUE: '高价值客户',
            POTENTIAL: '潜力客户',
            NORMAL: '普通客户',
            SLEEPING: '沉睡客户',
            LOST: '流失客户',
        }[valueLabel],
    } as CustomerProfile;
});

/**
 * Get customer profile
 * 获取客户画像
 * Aggregates basic customer info, order stats, and RFM analytical data. 
 * (聚合客户基本信息、订单统计和 RFM 分析数据)
 */
export async function getCustomerProfile(params: z.infer<typeof getCustomerProfileSchema>) {
    return getCustomerProfileActionInternal(params);
}

// ============================================================
// [Customer-03] 转介绍追踪
// ============================================================

const getReferralChainSchema = z.object({
    customerId: z.string().uuid(),
});

const getReferralChainActionInternal = createSafeAction(getReferralChainSchema, async ({ customerId }, { session }) => {
    if (!session.user.tenantId) throw new AppError('Unauthorized', ERROR_CODES.PERMISSION_DENIED, 401);
    const tenantId = session.user.tenantId;

    const customer = await db.query.customers.findFirst({
        where: and(
            eq(customers.id, customerId),
            eq(customers.tenantId, tenantId)
        ),
        with: {
            referrer: true,
            referrals: {
                with: {
                    referrals: true,
                }
            }
        }
    });

    if (!customer) {
        return { error: '客户不存在' };
    }

    const referralTree = {
        customer: {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
        },
        referrer: customer.referrer ? {
            id: customer.referrer.id,
            name: customer.referrer.name,
        } : null,
        referrals: (customer.referrals || []).map((r: typeof customer.referrals[0]) => ({
            id: r.id,
            name: r.name,
            phone: r.phone,
            referralsCount: r.referrals?.length || 0,
        })),
        stats: {
            directReferralsCount: customer.referrals?.length || 0,
        }
    };

    return referralTree as ReferralChain;
});

/**
 * Get customer referral chain
 * 获取客户转介绍链
 * Builds a tree structure containing referrer, immediate downstream, and secondary downstream.
 * (构建包含推荐人、直接下级和二级下级的树状结构)
 */
export async function getReferralChain(params: z.infer<typeof getReferralChainSchema>) {
    return getReferralChainActionInternal(params);
}
