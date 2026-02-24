'use server';

import { db } from '../../../shared/api/db';
import { customers, orders } from '../../../shared/api/schema';
import { eq, and, desc, sql, isNull, sum, max, count } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';
import { z } from 'zod';
import { getCustomersSchema, customerLifecycleStages, customerPipelineStatuses, getReferralChainSchema } from '../schemas';
import { auth, checkPermission } from '@/shared/lib/auth';
import { createSafeAction } from '@/shared/lib/server-action';
import { PERMISSIONS } from '@/shared/config/permissions';
import { CustomerListItem, CustomerDetail, CustomerProfile, ReferralChain } from '../types';
import { logger } from '@/shared/lib/logger';
import { AppError, ERROR_CODES } from '@/shared/lib/errors';

/**
 * 获取分页客户列表
 * 
 * 安全检查：自动从 session 获取 tenantId 实现租户隔离
 */
export async function getCustomers(params: z.input<typeof getCustomersSchema>): Promise<{ data: CustomerListItem[], pagination: { page: number, pageSize: number, total: number, totalPages: number } }> {
    const session = await auth();
    if (!session?.user?.tenantId) throw new AppError('Unauthorized', ERROR_CODES.PERMISSION_DENIED, 401);
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            const startTime = Date.now();
            try {
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
                    whereConditions.push(eq(customers.assignedSalesId, session.user.id));
                } else if (assignedSalesId) {
                    whereConditions.push(eq(customers.assignedSalesId, assignedSalesId));
                }

                if (search) {
                    const escapedSearch = search.replace(/[%_]/g, '\\$&');
                    whereConditions.push(
                        sql`(${customers.name} ILIKE ${`%${escapedSearch}%`} OR ${customers.phone} ILIKE ${`%${escapedSearch}%`} OR ${customers.customerNo} ILIKE ${`%${escapedSearch}%`})`
                    );
                }

                if (type) whereConditions.push(eq(customers.type, type));
                if (level && ['A', 'B', 'C', 'D'].includes(level)) {
                    whereConditions.push(eq(customers.level, level as 'A' | 'B' | 'C' | 'D'));
                }
                if (lifecycleStage) {
                    whereConditions.push(eq(customers.lifecycleStage, lifecycleStage as (typeof customerLifecycleStages)[number]));
                }
                if (pipelineStatus) {
                    whereConditions.push(eq(customers.pipelineStatus, pipelineStatus as (typeof customerPipelineStatuses)[number]));
                }

                const whereClause = and(...whereConditions);

                const dataPromise = db.query.customers.findMany({
                    where: whereClause,
                    with: { assignedSales: true },
                    orderBy: [desc(customers.createdAt)],
                    limit: safePageSize,
                    offset: offset,
                }).catch((error) => {
                    logger.error('Error fetching customers fallback:', error, { tenantId, params });
                    return db.query.customers.findMany({
                        where: whereClause,
                        orderBy: [desc(customers.createdAt)],
                        limit: safePageSize,
                        offset: offset,
                    });
                });

                const countPromise = db.select({ count: sql<number>`count(*)` })
                    .from(customers)
                    .where(whereClause);

                const [data, countResult] = await Promise.all([dataPromise, countPromise]);
                const total = Number(countResult[0].count);

                const formattedData = data.map((customer) => {
                    const c = customer as typeof customer & { assignedSales?: { name: string | null } | null };
                    return {
                        ...customer,
                        assignedSalesName: c.assignedSales?.name || null
                    };
                });

                const duration = Date.now() - startTime;
                logger.info('[customers] 获取客户列表 (Cached) 完成:', { count: data.length, total, duration });

                return {
                    data: formattedData as unknown as CustomerListItem[],
                    pagination: { page, pageSize: safePageSize, total, totalPages: Math.ceil(total / safePageSize) }
                };
            } catch (error) {
                logger.error('[customers] 获取客户列表失败:', error);
                throw error;
            }
        },
        [`customers-list-${tenantId}-${JSON.stringify(params)}`],
        { revalidate: 60, tags: [`customers-list-${tenantId}`] }
    )();
}

/**
 * 获取客户详情
 * 
 * 安全检查：自动从 session 获取 tenantId 实现租户隔离
 */
export async function getCustomerDetail(id: string): Promise<CustomerDetail | undefined> {
    const session = await auth();
    if (!session?.user?.tenantId) throw new AppError('Unauthorized', ERROR_CODES.PERMISSION_DENIED, 401);
    const tenantId = session.user.tenantId;

    return unstable_cache(
        async () => {
            const startTime = Date.now();
            const customer = await db.query.customers.findFirst({
                where: and(eq(customers.id, id), eq(customers.tenantId, tenantId)),
                with: {
                    assignedSales: true,
                    creator: true,
                    addresses: true,
                    referrer: true,
                    referrals: {
                        limit: 5,
                        orderBy: desc(customers.createdAt)
                    }
                },
            });

            if (!customer) return undefined;

            const prefs = (customer.preferences as Record<string, unknown>) || {};
            const duration = Date.now() - startTime;
            logger.info('[customers] 获取客户详情 (Cached) 完成:', { customerId: id, duration });

            return {
                ...customer,
                source: customer.source || (prefs.source as string) || null,
                referrerName: customer.referrerName || (prefs.referrerName as string) || null,
            } as CustomerDetail;
        },
        [`customer-detail-${tenantId}-${id}`],
        { revalidate: 300, tags: [`customer-detail-${id}`] }
    )();
}

// ============================================================
// [Customer-01] 客户画像增强
// ============================================================


const getCustomerProfileSchema = z.object({
    customerId: z.string().uuid(),
});

const getCustomerProfileActionInternal = createSafeAction(getCustomerProfileSchema, async ({ customerId }: { customerId: string }, { session }) => {
    if (!session.user.tenantId) throw new AppError('Unauthorized', ERROR_CODES.PERMISSION_DENIED, 401);
    const tenantId = session.user.tenantId;

    const startTime = Date.now();

    // [Optimization] 并发执行客户信息与订单统计查询
    const [customerResult, orderStatsResult] = await Promise.all([
        db.query.customers.findFirst({
            where: and(
                eq(customers.id, customerId),
                eq(customers.tenantId, tenantId)
            ),
            with: {
                assignedSales: true,
                referrer: true,
            }
        }).catch(error => {
            logger.error('Error fetching customer profile fallback:', { error });
            return db.query.customers.findFirst({
                where: and(
                    eq(customers.id, customerId),
                    eq(customers.tenantId, tenantId)
                ),
            });
        }),
        db.select({
            orderCount: count(orders.id),
            totalAmount: sum(orders.totalAmount),
            lastOrderDate: max(orders.createdAt),
        })
            .from(orders)
            .where(and(
                eq(orders.customerId, customerId),
                eq(orders.tenantId, tenantId)
            ))
    ]);

    const customer = customerResult;
    if (!customer) {
        throw new AppError('Customer not found', ERROR_CODES.CUSTOMER_NOT_FOUND, 404);
    }
    const stats = orderStatsResult[0] || { orderCount: 0, totalAmount: '0', lastOrderDate: null };

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

    const duration = Date.now() - startTime;
    logger.info('[customers] 获取客户画像完成:', { customerId, duration });

    return {
        customer: {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            type: customer.type,
            level: customer.level,
            assignedSalesName: (customer as typeof customer & { assignedSales?: { name: string | null } | null }).assignedSales?.name,
            referrerName: (customer as typeof customer & { referrer?: { name: string | null } | null }).referrer?.name,
            createdAt: customer.createdAt,
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
 * 获取客户画像
 * 聚合客户基本信息、订单统计和 RFM 分析数据
 * @param params 包含 customerId 的参数对象
 */
export const getCustomerProfile = async (params: z.infer<typeof getCustomerProfileSchema>) => {
    logger.info('[customers] 获取客户画像:', { customerId: params.customerId });
    return getCustomerProfileActionInternal(params);
};

// ============================================================
// [Customer-03] 转介绍追踪
// ============================================================

const getReferralChainActionInternal = createSafeAction(getReferralChainSchema, async ({ customerId }: { customerId: string }, { session }) => {
    const startTime = Date.now();
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

    const duration = Date.now() - startTime;
    logger.info('[customers] 获取客户转介绍链完成:', { customerId, duration });

    return referralTree as ReferralChain;
});

/**
 * 获取客户转介绍链
 * 构建包含推荐人、直接下级和二级下级的树状结构
 * @param params 包含 customerId 的参数对象
 */
export const getReferralChain = async (params: z.infer<typeof getReferralChainSchema>) => {
    logger.info('[customers] 获取客户转介绍链:', { customerId: params.customerId });
    return getReferralChainActionInternal(params);
};
