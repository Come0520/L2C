'use server';


import { db } from '@/shared/api/db';
import { leads, orders, measureTasks, arStatements, installTasks } from '@/shared/api/schema';
import { eq, and, count, inArray, sql } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { createLogger } from '@/shared/lib/logger';

const logger = createLogger('DashboardStatsAction');

export { getDashboardConfigAction, saveDashboardConfigAction, resetDashboardConfigAction } from './actions/config';

// 定义角色枚举以供校验
const roleSchema = z.enum(['ADMIN', 'MANAGER', 'SALES', 'WORKER', 'FINANCE', 'SUPPLY', 'GUEST']);

export type DashboardStats = {
    role: string;
    cards: {
        title: string;
        value: number | string;
        subValue?: string;
        icon: 'dollar' | 'users' | 'activity' | 'credit-card' | 'clipboard' | 'truck' | 'wrench';
        color: 'emerald' | 'blue' | 'amber' | 'rose' | 'purple' | 'cyan';
        link?: string;
    }[];
};

import { unstable_cache } from 'next/cache';

/**
 * 仪表盘统计核心数据获取（带缓存）
 * 缓存级别：tenantId + userId + role 组合
 * TTL: 300秒 (5分钟)
 */
const getCachedStatsData = unstable_cache(
    async (tenantId: string, userId: string, currentRole: string, userName: string | null | undefined): Promise<DashboardStats> => {
        const stats: DashboardStats = {
            role: currentRole,
            cards: []
        };

        if (currentRole === 'ADMIN' || currentRole === 'MANAGER') {
            const [leadRes, orderRes, measureRes, arRes, installRes] = await Promise.all([
                db.select({ value: count() }).from(leads).where(eq(leads.tenantId, tenantId)),
                db.select({ value: count() }).from(orders).where(and(eq(orders.tenantId, tenantId), inArray(orders.status, ['SIGNED', 'PAID']))),
                db.select({ value: count() }).from(measureTasks).where(and(eq(measureTasks.tenantId, tenantId), eq(measureTasks.status, 'PENDING'))),
                db.select({ sum: sql<number>`COALESCE(SUM(${arStatements.totalAmount}), 0)` }).from(arStatements).where(and(eq(arStatements.tenantId, tenantId), eq(arStatements.status, 'PARTIAL'))),
                db.select({ value: count() }).from(installTasks).where(and(eq(installTasks.tenantId, tenantId), eq(installTasks.status, 'PENDING_DISPATCH')))
            ]);

            stats.cards = [
                { title: '全量线索', value: leadRes[0]?.value || 0, subValue: '所有时间', icon: 'users', color: 'blue' },
                { title: '进行中订单', value: orderRes[0]?.value || 0, subValue: '当前活跃', icon: 'clipboard', color: 'emerald' },
                { title: '待派测量', value: measureRes[0]?.value || 0, subValue: '待处理', icon: 'activity', color: 'amber' },
                { title: '待收款金额', value: `¥${Number(arRes[0]?.sum || 0).toLocaleString()}`, subValue: '未结算', icon: 'credit-card', color: 'rose' },
                { title: '待派安装', value: installRes[0]?.value || 0, subValue: '待排期', icon: 'wrench', color: 'purple' },
            ];
        } else if (currentRole === 'SALES') {
            const [myLeadRes, myOrderRes] = await Promise.all([
                db.select({ value: count() }).from(leads).where(and(eq(leads.tenantId, tenantId), eq(leads.assignedSalesId, userId))),
                db.select({ value: count() }).from(orders).where(and(eq(orders.tenantId, tenantId), eq(orders.salesId, userId)))
            ]);

            stats.cards = [
                { title: '我的线索', value: myLeadRes[0]?.value || 0, icon: 'users', color: 'blue', link: '/leads' },
                { title: '我的订单', value: myOrderRes[0]?.value || 0, icon: 'clipboard', color: 'emerald', link: '/orders' },
                { title: '本月业绩', value: '¥0', icon: 'dollar', color: 'amber' }
            ];
        } else if (currentRole === 'WORKER') {
            const [myMeasureRes, myInstallRes] = await Promise.all([
                db.select({ value: count() }).from(measureTasks).where(and(eq(measureTasks.tenantId, tenantId), eq(measureTasks.status, 'PENDING'))),
                db.select({ value: count() }).from(installTasks).where(and(eq(installTasks.tenantId, tenantId), eq(installTasks.status, 'PENDING_DISPATCH')))
            ]);

            stats.cards = [
                { title: '待处理测量', value: myMeasureRes[0]?.value || 0, icon: 'activity', color: 'blue', link: '/service/measurement' },
                { title: '待处理安装', value: myInstallRes[0]?.value || 0, icon: 'wrench', color: 'cyan', link: '/service/installation' }
            ];
        }

        // 默认显示
        if (stats.cards.length === 0) {
            stats.cards.push({
                title: '欢迎回来',
                value: userName || '用户',
                icon: 'users',
                color: 'blue'
            });
        }

        return stats;
    },
    ['dashboard-stats'],
    { revalidate: 300, tags: ['dashboard-stats'] }
);

/**
 * 获取仪表盘统计数据 (Server Action)
 * L3 安全增强：加入 Zod 校验与角色白名单
 * L5 性能优化：加入 unstable_cache 和 300秒 缓存失效时间
 *
 * @returns {Promise<DashboardStats>} 仪表盘统计卡片列表
 */
export const getDashboardStats = createSafeAction(
    z.object({}),
    async (_, { session }): Promise<DashboardStats> => {
        const { role, id: userId, tenantId } = session.user;

        // 安全校验：由于 session.user.role 是 string | undefined，需要确保其在合法枚举内
        const validatedRole = roleSchema.safeParse(role);
        const currentRole = validatedRole.success ? validatedRole.data : 'GUEST';

        try {
            logger.info('请求获取仪表盘统计数据', { userId, tenantId, currentRole });

            // 使用缓存获取数据
            const stats = await getCachedStatsData(tenantId, userId, currentRole, session.user.name);

            logger.info('成功获取仪表盘统计数据', { userId, tenantId, cardCount: stats.cards.length });
            return stats;
        } catch (error) {
            logger.error('获取仪表盘统计失败', { userId, tenantId }, error);
            throw new Error('获取统计数据失败');
        }
    }
);
