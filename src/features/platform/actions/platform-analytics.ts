'use server';

/**
 * 平台管理仪表盘统计 Server Actions
 *
 * 提供平台级别的统计数据：
 * - 租户总览（活跃/待审批/暂停/拒绝 数量）
 * - 注册趋势（近 30 天每日注册量）
 * - 认证统计（已认证/待认证/驳回 数量）
 */

import { db } from '@/shared/api/db';
import { tenants } from '@/shared/api/schema';
import { eq, sql, gte, and } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { users } from '@/shared/api/schema';
import { logger } from '@/shared/lib/logger';
import { unstable_cache } from 'next/cache';

// ============ 类型定义 ============

/** 平台仪表盘概览数据 */
export interface PlatformOverview {
    /** 活跃租户数 */
    activeCount: number;
    /** 待审批租户数 */
    pendingCount: number;
    /** 已暂停租户数 */
    suspendedCount: number;
    /** 已拒绝租户数 */
    rejectedCount: number;
    /** 租户总数 */
    totalCount: number;
    /** 认证统计 */
    verification: {
        verified: number;
        pending: number;
        rejected: number;
    };
}

/** 注册趋势数据点 */
export interface RegistrationTrendItem {
    date: string;
    count: number;
}

// ============ 权限验证 ============

/**
 * 验证当前用户是否为平台管理员
 * @throws Error 如果用户未登录或无权限
 */
async function requirePlatformAdmin(): Promise<string> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('未登录');
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { isPlatformAdmin: true },
    });

    if (!user?.isPlatformAdmin) {
        throw new Error('无平台管理权限');
    }

    return session.user.id;
}

// ============ Server Actions ============

/**
 * 获取平台概览统计（含缓存，5分钟 revalidate）
 */
export async function getPlatformOverview(): Promise<{
    success: boolean;
    data?: PlatformOverview;
    error?: string;
}> {
    try {
        await requirePlatformAdmin();

        const data = await unstable_cache(
            async () => {
                // 租户状态分布
                const statusCounts = await db
                    .select({
                        status: tenants.status,
                        count: sql<number>`COUNT(*)`,
                    })
                    .from(tenants)
                    .groupBy(tenants.status);

                const statusMap = Object.fromEntries(
                    statusCounts.map(r => [r.status, Number(r.count)])
                );

                // 认证状态分布
                const verificationCounts = await db
                    .select({
                        status: tenants.verificationStatus,
                        count: sql<number>`COUNT(*)`,
                    })
                    .from(tenants)
                    .groupBy(tenants.verificationStatus);

                const verificationMap = Object.fromEntries(
                    verificationCounts.map(r => [r.status, Number(r.count)])
                );

                const totalCount = Object.values(statusMap).reduce((a, b) => a + b, 0);

                return {
                    activeCount: statusMap['active'] || 0,
                    pendingCount: statusMap['pending_approval'] || 0,
                    suspendedCount: statusMap['suspended'] || 0,
                    rejectedCount: statusMap['rejected'] || 0,
                    totalCount,
                    verification: {
                        verified: verificationMap['verified'] || 0,
                        pending: verificationMap['pending'] || 0,
                        rejected: verificationMap['rejected'] || 0,
                    },
                };
            },
            ['platform-overview'],
            { tags: ['platform-stats'], revalidate: 300 } // 5分钟缓存
        )();

        return { success: true, data };
    } catch (error) {
        logger.error('获取平台概览失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '获取失败',
        };
    }
}

/**
 * 获取近 30 天注册趋势（含缓存，5分钟 revalidate）
 */
export async function getRegistrationTrend(): Promise<{
    success: boolean;
    data?: RegistrationTrendItem[];
    error?: string;
}> {
    try {
        await requirePlatformAdmin();

        const data = await unstable_cache(
            async () => {
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

                const trend = await db
                    .select({
                        date: sql<string>`DATE(${tenants.createdAt})`,
                        count: sql<number>`COUNT(*)`,
                    })
                    .from(tenants)
                    .where(gte(tenants.createdAt, thirtyDaysAgo))
                    .groupBy(sql`DATE(${tenants.createdAt})`)
                    .orderBy(sql`DATE(${tenants.createdAt})`);

                return trend.map(item => ({
                    date: String(item.date),
                    count: Number(item.count),
                }));
            },
            ['platform-registration-trend'],
            { tags: ['platform-stats'], revalidate: 300 }
        )();

        return { success: true, data };
    } catch (error) {
        logger.error('获取注册趋势失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '获取失败',
        };
    }
}

/**
 * 获取平台最近活动日志摘要
 */
export async function getRecentPlatformActivity(): Promise<{
    success: boolean;
    data?: {
        recentApprovals: number;
        recentRejections: number;
        recentSuspensions: number;
    };
    error?: string;
}> {
    try {
        await requirePlatformAdmin();

        const data = await unstable_cache(
            async () => {
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

                // 近 7 天审批通过
                const [approved] = await db
                    .select({ count: sql<number>`COUNT(*)` })
                    .from(tenants)
                    .where(and(
                        eq(tenants.status, 'active'),
                        gte(tenants.reviewedAt, sevenDaysAgo),
                    ));

                // 近 7 天拒绝
                const [rejected] = await db
                    .select({ count: sql<number>`COUNT(*)` })
                    .from(tenants)
                    .where(and(
                        eq(tenants.status, 'rejected'),
                        gte(tenants.reviewedAt, sevenDaysAgo),
                    ));

                // 近 7 天暂停
                const [suspended] = await db
                    .select({ count: sql<number>`COUNT(*)` })
                    .from(tenants)
                    .where(and(
                        eq(tenants.status, 'suspended'),
                        gte(tenants.updatedAt, sevenDaysAgo),
                    ));

                return {
                    recentApprovals: Number(approved?.count || 0),
                    recentRejections: Number(rejected?.count || 0),
                    recentSuspensions: Number(suspended?.count || 0),
                };
            },
            ['platform-recent-activity'],
            { tags: ['platform-stats'], revalidate: 300 }
        )();

        return { success: true, data };
    } catch (error) {
        logger.error('获取平台活动失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '获取失败',
        };
    }
}
