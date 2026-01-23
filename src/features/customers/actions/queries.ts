'use server';

import { db } from '@/shared/api/db';
import { customers } from '@/shared/api/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getCustomersSchema } from '@/features/customers/schemas';
import { auth } from '@/shared/lib/auth';

/**
 * 获取客户列表
 * 
 * 安全检查：自动从 session 获取 tenantId 实现租户隔离
 */
export async function getCustomers(params: z.input<typeof getCustomersSchema>) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

    const tenantId = session.user.tenantId;
    const { page, pageSize, search, type, level, assignedSalesId } = getCustomersSchema.parse(params);
    const offset = (page - 1) * pageSize;

    // 首先添加租户隔离条件
    const whereConditions = [eq(customers.tenantId, tenantId)];

    if (search) {
        whereConditions.push(
            sql`(${customers.name} ILIKE ${`%${search}%`} OR ${customers.phone} ILIKE ${`%${search}%`} OR ${customers.customerNo} ILIKE ${`%${search}%`})`
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

    if (assignedSalesId) {
        whereConditions.push(eq(customers.assignedSalesId, assignedSalesId));
    }

    const whereClause = and(...whereConditions);

    const data = await db.query.customers.findMany({
        where: whereClause,
        with: {
            assignedSales: true,
        },
        orderBy: [desc(customers.createdAt)],
        limit: pageSize,
        offset: offset,
    });

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
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
        },
    };
}

/**
 * 获取客户详情
 * 
 * 安全检查：自动从 session 获取 tenantId 实现租户隔离
 */
export async function getCustomerDetail(id: string) {
    const session = await auth();
    if (!session?.user?.tenantId) throw new Error('Unauthorized');

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

    return customer;
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
    const tenantId = session.user.tenantId;

    const customer = await db.query.customers.findFirst({
        where: and(
            eq(customers.id, customerId),
            eq(customers.tenantId, tenantId)
        ),
        with: {
            assignedSales: true,
            referrer: true,
        }
    });

    if (!customer) {
        return { error: '客户不存在' };
    }

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
            level: customer.level,
            assignedSalesName: customer.assignedSales?.name,
            referrerName: customer.referrer?.name,
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
    };
});

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

    return referralTree;
});

export async function getReferralChain(params: z.infer<typeof getReferralChainSchema>) {
    return getReferralChainActionInternal(params);
}
