/**
 * 监控与工作台 Server Actions (Phase 9)
 */

'use server';

import { db } from '@/shared/api/db';
import {
    leads,
    measureTasks,
    installTasks,
    arStatements,
    customers
} from '@/shared/api/schema';
import { eq, and, or, lt, count, inArray } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';

export type TodoItem = {
    id: string;
    type: 'LEAD' | 'QUOTE' | 'ORDER' | 'MEASURE' | 'INSTALL' | 'AR' | 'AP' | 'AFTER_SALES';
    title: string;
    description: string;
    status: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    dueDate?: Date;
    href: string;
    entityData?: {
        leadNo?: string;
        customerName?: string;
        customerPhone?: string;
        assignedSalesId?: string | null;
        assignedSalesName?: string | null;
        sourceCategoryName?: string;
        sourceChannelName?: string;
        intentionLevel?: string | null;
        tags?: string[] | null;
        lostReason?: string | null;
        createdAt?: Date | null;
    };
};

export type AlertItem = {
    type: string;
    module: string;
    level: string;
    message: string;
    href: string;
};

const getWorkbenchTodosSchema = z.object({});
const getAlertsSchema = z.object({});

interface SessionUser {
    id: string;
    tenantId: string;
    role?: string;
}

/**
 * 纯函数版本：获取工作台待办事项列表（用于服务端组件）
 */
export async function getWorkbenchTodosPure(session: SessionUser): Promise<TodoItem[]> {
    const tenantId = session.tenantId;
    const userId = session.id;
    const userRole = session.role || 'SALES';

    const todos: TodoItem[] = [];

    if (userRole === 'SALES' || userRole === 'ADMIN') {
        const pendingLeads = await db.query.leads.findMany({
            where: and(eq(leads.tenantId, tenantId), eq(leads.assignedSalesId, userId), eq(leads.status, 'PENDING_FOLLOWUP')),
            limit: 5,
            with: {
                assignedSales: {
                    columns: {
                        id: true,
                        name: true,
                        role: true,
                    }
                },
                sourceCategory: {
                    columns: {
                        id: true,
                        name: true,
                    }
                },
                sourceChannel: {
                    columns: {
                        id: true,
                        name: true,
                    }
                },
            }
        });
        pendingLeads.forEach(l => todos.push({
            id: l.id,
            type: 'LEAD',
            title: `跟进线索: ${l.customerName}`,
            description: `详情: ${l.sourceDetail || ''}`,
            status: (l.status || 'PENDING') as string,
            priority: 'HIGH',
            href: `/leads/${l.id}`,
            entityData: {
                leadNo: l.leadNo,
                customerName: l.customerName,
                customerPhone: l.customerPhone,
                assignedSalesId: l.assignedSalesId,
                assignedSalesName: l.assignedSales?.name,
                sourceCategoryName: l.sourceCategory?.name,
                sourceChannelName: l.sourceChannel?.name,
                intentionLevel: l.intentionLevel,
                tags: l.tags,
                lostReason: l.lostReason,
                createdAt: l.createdAt,
            }
        }));
    }

    if (userRole === 'SALES' || userRole === 'ADMIN') {
        // 先查�?measureTasks，不使用 with 子句
        const pendingConfirmMeasureTasks = await db.select({
            id: measureTasks.id,
            measureNo: measureTasks.measureNo,
            customerId: measureTasks.customerId,
            createdAt: measureTasks.createdAt,
        })
            .from(measureTasks)
            .where(and(
                eq(measureTasks.tenantId, tenantId),
                eq(measureTasks.salesId, userId),
                eq(measureTasks.status, 'PENDING_CONFIRM')
            ))
            .limit(5);

        // 提取所�?customerId
        const customerIds = pendingConfirmMeasureTasks
            .map(task => task.customerId)
            .filter((id): id is string => id !== null);

        // 如果�?customerId，查询对应的客户信息
        const customersMap = new Map<string, { name: string; phone: string }>();
        if (customerIds.length > 0) {
            const foundCustomers = await db.select({
                id: customers.id,
                name: customers.name,
                phone: customers.phone,
            })
                .from(customers)
                .where(inArray(customers.id, customerIds));
            
            foundCustomers.forEach(customer => {
                customersMap.set(customer.id, { name: customer.name, phone: customer.phone });
            });
        }

        // 构造待办事�?
        pendingConfirmMeasureTasks.forEach(task => {
            const customer = task.customerId ? customersMap.get(task.customerId) : undefined;
            todos.push({
                id: task.id,
                type: 'MEASURE',
                title: `测量待确�? ${task.measureNo}`,
                description: `客户: ${customer?.name || '未知'}`,
                status: 'PENDING_CONFIRM',
                priority: 'HIGH',
                href: `/service/measurement/${task.id}`,
                entityData: {
                    customerName: customer?.name,
                    customerPhone: customer?.phone,
                    createdAt: task.createdAt,
                }
            });
        });
    }

    if (userRole === 'DISPATCHER' || userRole === 'ADMIN') {
        // 修复 pendingMeasure 查询
        const pendingMeasureTasks = await db.select({
            id: measureTasks.id,
            measureNo: measureTasks.measureNo,
            customerId: measureTasks.customerId,
            createdAt: measureTasks.createdAt,
        })
            .from(measureTasks)
            .where(and(
                eq(measureTasks.tenantId, tenantId),
                eq(measureTasks.status, 'PENDING')
            ))
            .limit(5);

        const measureCustomerIds = pendingMeasureTasks
            .map(task => task.customerId)
            .filter((id): id is string => id !== null);

        const measureCustomersMap = new Map<string, { name: string; phone: string }>();
        if (measureCustomerIds.length > 0) {
            const foundMeasureCustomers = await db.select({
                id: customers.id,
                name: customers.name,
                phone: customers.phone,
            })
                .from(customers)
                .where(inArray(customers.id, measureCustomerIds));
            
            foundMeasureCustomers.forEach(customer => {
                measureCustomersMap.set(customer.id, { name: customer.name, phone: customer.phone });
            });
        }

        pendingMeasureTasks.forEach(task => {
            const customer = task.customerId ? measureCustomersMap.get(task.customerId) : undefined;
            todos.push({
                id: task.id,
                type: 'MEASURE',
                title: `待派测量: ${customer?.name || task.measureNo}`,
                description: '无地址信息',
                status: 'PENDING',
                priority: 'HIGH',
                href: `/service/measurement/${task.id}`,
                entityData: {
                    customerName: customer?.name,
                    customerPhone: customer?.phone,
                    createdAt: task.createdAt,
                }
            });
        });

        // 修复 pendingInstall 查询
        const pendingInstallTasks = await db.select({
            id: installTasks.id,
            taskNo: installTasks.taskNo,
            customerId: installTasks.customerId,
            status: installTasks.status,
            createdAt: installTasks.createdAt,
        })
            .from(installTasks)
            .where(and(
                eq(installTasks.tenantId, tenantId),
                eq(installTasks.status, 'PENDING_DISPATCH')
            ))
            .limit(5);

        const installCustomerIds = pendingInstallTasks
            .map(task => task.customerId)
            .filter((id): id is string => id !== null);

        const installCustomersMap = new Map<string, { name: string; phone: string }>();
        if (installCustomerIds.length > 0) {
            const foundInstallCustomers = await db.select({
                id: customers.id,
                name: customers.name,
                phone: customers.phone,
            })
                .from(customers)
                .where(inArray(customers.id, installCustomerIds));
            
            foundInstallCustomers.forEach(customer => {
                installCustomersMap.set(customer.id, { name: customer.name, phone: customer.phone });
            });
        }

        pendingInstallTasks.forEach(task => {
            const customer = task.customerId ? installCustomersMap.get(task.customerId) : undefined;
            todos.push({
                id: task.id,
                type: 'INSTALL',
                title: `待派安装: ${customer?.name || task.taskNo}`,
                description: '无地址信息',
                status: task.status as string,
                priority: 'HIGH',
                href: `/service/installation/${task.id}`,
                entityData: {
                    customerName: customer?.name,
                    customerPhone: customer?.phone,
                    createdAt: task.createdAt,
                }
            });
        });
    }

    if (userRole === 'FINANCE' || userRole === 'ADMIN') {
        try {
            // 简化查询，只查询必要字�?
            const pendingAr = await db.select({
                id: arStatements.id,
                statementNo: arStatements.statementNo,
                status: arStatements.status,
                totalAmount: arStatements.totalAmount,
                paidAmount: arStatements.paidAmount,
            })
                .from(arStatements)
                .where(and(
                    eq(arStatements.tenantId, tenantId),
                    or(
                        eq(arStatements.status, 'PENDING_PAYMENT'),
                        eq(arStatements.status, 'PARTIAL')
                    )
                ))
                .limit(5);
            
            pendingAr.forEach(ar => {
                // 计算待回款金�?
                const pendingAmount = ar.totalAmount - ar.paidAmount;
                todos.push({
                    id: ar.id,
                    type: 'AR',
                    title: `催收账款: ${ar.statementNo}`,
                    description: `待回款金�?${pendingAmount}`,
                    status: (ar.status || 'PENDING') as string,
                    priority: 'HIGH',
                    href: `/finance/ar/${ar.id}`
                });
            });
        } catch (error) {
            console.error('查询 AR 账款失败:', error);
            // 即使查询失败，也不影响页面其他部分的渲染
        }
    }

    return todos;
}

/**
 * 纯函数版本：获取集中预警信息（用于服务端组件�?
 */
export async function getAlertsPure(session: SessionUser): Promise<AlertItem[]> {
    const tenantId = session.tenantId;
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const alerts = [];

    const lateLeads = await db.select({ count: count() })
        .from(leads)
        .where(and(
            eq(leads.tenantId, tenantId),
            eq(leads.status, 'PENDING_FOLLOWUP'),
            lt(leads.createdAt, oneDayAgo)
        ));
    if (lateLeads[0].count > 0) {
        alerts.push({
            type: 'LATENCY',
            module: 'LEAD',
            level: 'RED',
            message: `�?${lateLeads[0].count} 条线索超�?24h 未跟进`,
            href: '/leads?status=PENDING_FOLLOWUP'
        });
    }

    const lateMeasure = await db.select({ count: count() })
        .from(measureTasks)
        .where(and(
            eq(measureTasks.tenantId, tenantId),
            or(eq(measureTasks.status, 'PENDING'), eq(measureTasks.status, 'DISPATCHING')),
            lt(measureTasks.scheduledAt, now)
        ));
    if (lateMeasure[0].count > 0) {
        alerts.push({
            type: 'LATENCY',
            module: 'MEASURE',
            level: 'RED',
            message: `�?${lateMeasure[0].count} 个测量任务已过预约时间`,
            href: '/service/measurement'
        });
    }

    return alerts;
}

/**
 * 获取工作台待办事项列�?(Server Action)
 */
export const getWorkbenchTodos = createSafeAction(getWorkbenchTodosSchema, async (params, { session }) => {
    const todos = await getWorkbenchTodosPure(session.user);
    return { success: true, data: todos };
});

/**
 * 获取集中预警信息 (Server Action)
 */
export const getAlerts = createSafeAction(getAlertsSchema, async (params, { session }) => {
    const alerts = await getAlertsPure(session.user);
    return { success: true, data: alerts };
});
