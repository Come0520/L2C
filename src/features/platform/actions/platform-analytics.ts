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

/** 平台仪表盘概览数据结构 */
export interface PlatformOverview {
    /** 活跃中的租户总数 */
    activeCount: number;
    /** 等待管理员审批的租户申请数 */
    pendingCount: number;
    /** 因违规或过期被暂停服务的租户数 */
    suspendedCount: number;
    /** 申请被明确驳回的租户数 */
    rejectedCount: number;
    /** 系统中记录的租户总数（包含所有状态） */
    totalCount: number;
    /** 企业实名认证统计信息 */
    verification: {
        /** 已完成实名认证的租户数 */
        verified: number;
        /** 提交了认证申请但尚未审核的租户数 */
        pending: number;
        /** 认证申请被驳回的租户数 */
        rejected: number;
    };
}

/** 每日注册趋势数据项 */
export interface RegistrationTrendItem {
    /** 统计日期 (YYYY-MM-DD) */
    date: string;
    /** 该日期的注册申请数量 */
    count: number;
}

// ============ 权限验证 ============

/**
 * 验证当前用户是否具备平台超级管理权限
 * 
 * 鉴权流程：
 * 1. 检查 Session 是否存在
 * 2. 查询数据库确认该用户的 `isPlatformAdmin` 字段为 true
 * 
 * @returns {Promise<string>} 返回当前管理员的用户 ID
 * @throws {Error} 未登录或权限不足时抛出异常
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
 * 获取平台全局概览统计数据
 * 
 * 性能优化：
 * - 聚合查询租户状态分布和认证状态分布
 * - 使用 `unstable_cache` 缓存策略，每 5 分钟 (300s) 自动刷新
 * - 绑定 `platform-stats` 标签用于手动触发缓存失效
 * 
 * @returns {Promise<{success: boolean; data?: PlatformOverview; error?: string;}>} 统计结果对象
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
                // 1 & 2. 并查租户和认证状态分布
                const [statusCounts, verificationCounts] = await Promise.all([
                    db.select({
                        status: tenants.status,
                        count: sql<number>`COUNT(*)`,
                    })
                        .from(tenants)
                        .groupBy(tenants.status),

                    db.select({
                        status: tenants.verificationStatus,
                        count: sql<number>`COUNT(*)`,
                    })
                        .from(tenants)
                        .groupBy(tenants.verificationStatus)
                ]);

                const statusMap = Object.fromEntries(
                    statusCounts.map(r => [r.status, Number(r.count)])
                );

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
            { tags: ['platform-stats'], revalidate: 300 }
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
 * 获取近 30 天租户注册数量趋势
 * 
 * 业务逻辑：
 * - 仅统计 `createdAt` 在过去 30 天内的租户记录
 * - 按照日期进行分组统计
 * 
 * @returns {Promise<{success: boolean; data?: RegistrationTrendItem[]; error?: string;}>} 趋势序列数据
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
 * 获取平台最近 7 天的运营活动摘要
 * 
 * 包含：
 * - 新通过的审批数
 * - 驳回的申请数
 * - 执行的暂停操作数
 * 
 * @returns {Promise<{success: boolean; data?: ActivitySummary; error?: string;}>} 活动统计信息
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

                // 统计近 7 天激活、拒绝、暂停租户
                const [[approved], [rejected], [suspended]] = await Promise.all([
                    db.select({ count: sql<number>`COUNT(*)` }).from(tenants)
                        .where(and(eq(tenants.status, 'active'), gte(tenants.reviewedAt, sevenDaysAgo))),
                    db.select({ count: sql<number>`COUNT(*)` }).from(tenants)
                        .where(and(eq(tenants.status, 'rejected'), gte(tenants.reviewedAt, sevenDaysAgo))),
                    db.select({ count: sql<number>`COUNT(*)` }).from(tenants)
                        .where(and(eq(tenants.status, 'suspended'), gte(tenants.updatedAt, sevenDaysAgo)))
                ]);

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
