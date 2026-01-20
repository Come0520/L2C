'use server';

import { db } from '@/shared/api/db';
import { customers } from '@/shared/api/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { z } from 'zod';
import { getCustomersSchema } from '@/features/customers/schemas';

export async function getCustomers(params: z.infer<typeof getCustomersSchema>) {
    const { page, pageSize, search, type, level, assignedSalesId } = getCustomersSchema.parse(params);
    const offset = (page - 1) * pageSize;

    const whereConditions = [];

    if (search) {
        whereConditions.push(
            sql`(${customers.name} ILIKE ${`%${search}%`} OR ${customers.phone} ILIKE ${`%${search}%`} OR ${customers.customerNo} ILIKE ${`%${search}%`})`
        );
    }

    if (type) {
        whereConditions.push(eq(customers.type, type));
    }

    if (level) {
        whereConditions.push(eq(customers.level, level as any));
    }

    if (assignedSalesId) {
        whereConditions.push(eq(customers.assignedSalesId, assignedSalesId));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

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

export async function getCustomerDetail(id: string) {
    const customer = await db.query.customers.findFirst({
        where: eq(customers.id, id),
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

import { orders, arStatements } from '@/shared/api/schema';
import { sum, count, max } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';

const getCustomerProfileSchema = z.object({
    customerId: z.string().uuid(),
});

/**
 * 获取客户画像统计数据
 * 包含：累计交易金额、最近购买时间、购买频次、RFM 价值标签
 */
export const getCustomerProfile = createSafeAction(getCustomerProfileSchema, async ({ customerId }, { session }) => {
    const tenantId = session.user.tenantId;

    // 获取客户基本信息
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

    // 统计订单数据
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

    // 计算 RFM 指标
    const now = new Date();
    const lastOrder = stats.lastOrderDate ? new Date(stats.lastOrderDate) : null;
    const daysSinceLastOrder = lastOrder
        ? Math.floor((now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

    const totalAmount = parseFloat(stats.totalAmount?.toString() || '0');
    const orderCount = Number(stats.orderCount) || 0;

    // RFM 评分（简化版）
    const recencyScore = daysSinceLastOrder <= 30 ? 5 : daysSinceLastOrder <= 90 ? 4 : daysSinceLastOrder <= 180 ? 3 : daysSinceLastOrder <= 365 ? 2 : 1;
    const frequencyScore = orderCount >= 10 ? 5 : orderCount >= 5 ? 4 : orderCount >= 3 ? 3 : orderCount >= 1 ? 2 : 1;
    const monetaryScore = totalAmount >= 100000 ? 5 : totalAmount >= 50000 ? 4 : totalAmount >= 20000 ? 3 : totalAmount >= 5000 ? 2 : 1;

    // 价值标签
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

// ============================================================
// [Customer-03] 转介绍追踪
// ============================================================

const getReferralChainSchema = z.object({
    customerId: z.string().uuid(),
});

/**
 * 获取转介绍关系链
 */
export const getReferralChain = createSafeAction(getReferralChainSchema, async ({ customerId }, { session }) => {
    const tenantId = session.user.tenantId;

    // 获取客户及其推荐人
    const customer = await db.query.customers.findFirst({
        where: and(
            eq(customers.id, customerId),
            eq(customers.tenantId, tenantId)
        ),
        with: {
            referrer: true,
            referrals: {
                with: {
                    referrals: true, // 二级推荐
                }
            }
        }
    });

    if (!customer) {
        return { error: '客户不存在' };
    }

    // 构建推荐链
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
            // TODO: 计算推荐奖励
        }
    };

    return referralTree;
});
