'use server';

import { auth } from '@/shared/lib/auth';
import { db } from '@/shared/api/db';
import { leads, orders, measureTasks, arStatements, installTasks } from '@/shared/api/schema';
import { eq, and, or, count } from 'drizzle-orm';

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

export async function getDashboardStats(): Promise<DashboardStats> {
    const session = await auth();
    if (!session?.user) {
        return { role: 'GUEST', cards: [] };
    }

    const { role, id: userId, tenantId } = session.user;

    // Default stats structure
    const stats: DashboardStats = {
        role: role || 'USER',
        cards: []
    };

    try {
        if (role === 'ADMIN' || role === 'MANAGER') {
            // --- ADMIN / MANAGER VIEW ---

            // 1. Total Revenue (Paid Orders) - simplified for demo
            // In real world, sum payments. Here we count orders or sum amounts.
            // Let's count Active Leads
            const [leadCount] = await db
                .select({ value: count() })
                .from(leads)
                .where(eq(leads.tenantId, tenantId));

            stats.cards.push({
                title: 'Total Leads',
                value: leadCount?.value || 0,
                subValue: 'All time',
                icon: 'users',
                color: 'blue',
                link: '/leads'
            });

            // 2. Active Orders (Not Completed/Cancelled)
            const [activeOrderCount] = await db
                .select({ value: count() })
                .from(orders)
                .where(and(
                    eq(orders.tenantId, tenantId),
                    or(
                        eq(orders.status, 'IN_PRODUCTION'),
                        eq(orders.status, 'PENDING_DELIVERY'),
                        eq(orders.status, 'PENDING_INSTALL')
                    )
                ));

            stats.cards.push({
                title: 'Active Orders',
                value: activeOrderCount?.value || 0,
                subValue: 'In Production/Delivery/Install',
                icon: 'credit-card',
                color: 'emerald',
                link: '/orders'
            });

            // 3. Pending Measurements
            const [pendingMeasureCount] = await db
                .select({ value: count() })
                .from(measureTasks)
                .where(and(
                    eq(measureTasks.tenantId, tenantId),
                    eq(measureTasks.status, 'PENDING_VISIT')
                ));

            stats.cards.push({
                title: 'Pending Measure',
                value: pendingMeasureCount?.value || 0,
                subValue: 'Waiting for dispatch',
                icon: 'clipboard',
                color: 'amber',
                link: '/service/measurement' // Assuming route
            });

            // 4. Pending Finance (AR)
            const [pendingAR] = await db
                .select({ value: count() })
                .from(arStatements)
                .where(and(
                    eq(arStatements.tenantId, tenantId),
                    or(
                        eq(arStatements.status, 'PENDING_RECON'),
                        eq(arStatements.status, 'PARTIAL')
                    )
                ));

            stats.cards.push({
                title: 'Pending AR',
                value: pendingAR?.value || 0,
                subValue: 'To be collected',
                icon: 'dollar',
                color: 'rose',
                link: '/finance/ar'
            });

        } else if (role === 'SALES') {
            // --- SALES VIEW ---

            // 1. My Follow-up Leads
            const [myLeads] = await db
                .select({ value: count() })
                .from(leads)
                .where(and(
                    eq(leads.tenantId, tenantId),
                    eq(leads.assignedSalesId, userId),
                    or(
                        eq(leads.status, 'PENDING_FOLLOWUP'),
                        eq(leads.status, 'FOLLOWING_UP')
                    )
                ));

            stats.cards.push({
                title: 'Leads to Follow',
                value: myLeads?.value || 0,
                icon: 'users',
                color: 'blue',
                link: '/leads?scope=mine'
            });

            // 2. My Orders Pending Payment
            const [unpaidOrders] = await db
                .select({ value: count() })
                .from(orders)
                .where(and(
                    eq(orders.tenantId, tenantId),
                    eq(orders.salesId, userId),
                    eq(orders.status, 'SIGNED') // Signed but maybe not paid/processed fully
                ));

            stats.cards.push({
                title: 'Pending Payment',
                value: unpaidOrders?.value || 0,
                icon: 'credit-card',
                color: 'rose',
                link: '/orders?status=SIGNED'
            });

        } else if (role === 'WORKER') { // Assuming Measurer/Installer shares WORKER role or specific
            // --- WORKER VIEW (Measurer/Installer) ---

            // 1. My Measure Tasks
            const [myMeasure] = await db
                .select({ value: count() })
                .from(measureTasks)
                .where(and(
                    eq(measureTasks.tenantId, tenantId),
                    eq(measureTasks.assignedWorkerId, userId),
                    eq(measureTasks.status, 'PENDING_VISIT')
                ));

            stats.cards.push({
                title: 'Measure Tasks',
                value: myMeasure?.value || 0,
                subValue: 'Pending Visit',
                icon: 'clipboard',
                color: 'amber',
                link: '/service/measurement'
            });

            // 2. My Install Tasks
            const [myInstall] = await db
                .select({ value: count() })
                .from(installTasks)
                .where(and(
                    eq(installTasks.tenantId, tenantId),
                    eq(installTasks.installerId, userId),
                    eq(installTasks.status, 'PENDING_DISPATCH')
                ));

            stats.cards.push({
                title: 'Install Tasks',
                value: myInstall?.value || 0,
                icon: 'wrench',
                color: 'cyan',
                link: '/service/installation'
            });
        }
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Fallback or empty stats
    }

    // If no specific role stats matched or empty, return basic system stats or empty
    if (stats.cards.length === 0) {
        stats.cards.push({
            title: 'Welcome',
            value: 'Hello',
            subValue: session.user.name || 'User',
            icon: 'activity',
            color: 'purple'
        });
    }

    return stats;
}

// ============ 用户仪表盘配置 ============

import { users } from '@/shared/api/schema';

// 从 types.ts 导入并重新导出类型
export type { WidgetType, WidgetConfig, UserDashboardConfig } from './types';
import type { UserDashboardConfig } from './types';

/**
 * 获取用户仪表盘配置
 */
export async function getUserDashboardConfig(): Promise<UserDashboardConfig | null> {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, session.user.id),
            columns: { dashboardConfig: true }
        });

        if (user?.dashboardConfig && typeof user.dashboardConfig === 'object') {
            return user.dashboardConfig as UserDashboardConfig;
        }
        return null;
    } catch (error) {
        console.error('获取仪表盘配置失败:', error);
        return null;
    }
}

/**
 * 保存用户仪表盘配置
 */
export async function saveUserDashboardConfig(config: UserDashboardConfig): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: '未登录' };
    }

    try {
        await db.update(users)
            .set({
                dashboardConfig: config,
                updatedAt: new Date()
            })
            .where(eq(users.id, session.user.id));

        return { success: true };
    } catch (error) {
        console.error('保存仪表盘配置失败:', error);
        return { success: false, error: '保存失败' };
    }
}

/**
 * 重置用户仪表盘配置为默认
 */
export async function resetDashboardConfig(): Promise<{ success: boolean; error?: string }> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: '未登录' };
    }

    try {
        await db.update(users)
            .set({
                dashboardConfig: {},
                updatedAt: new Date()
            })
            .where(eq(users.id, session.user.id));

        return { success: true };
    } catch (error) {
        console.error('重置仪表盘配置失败:', error);
        return { success: false, error: '重置失败' };
    }
}
