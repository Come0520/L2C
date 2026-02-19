'use server';

import { db } from '@/shared/api/db';
import { measureTasks, measureSheets, users, leads, customers } from '@/shared/api/schema';
import { eq, and, desc, or, ilike, gte, lte, count } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { MeasureTaskStatus } from '../types';
import { checkDispatchAdmission } from '../logic/fee-admission';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';

/**
 * 测量任务查询筛选参数
 */
export interface MeasureTaskQueryFilters {
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
    // 扩展筛选参数
    workerId?: string;       // 测量师
    salesId?: string;        // 销售
    address?: string;        // 地址模糊搜索
    channel?: string;        // 渠道
    customerName?: string;   // 客户名称
    dateFrom?: string;       // 预约日期开始
    dateTo?: string;         // 预约日期结束
}

/**
 * 获取测量任务列表
 * 
 * 使用 React cache() 进行请求级去重，避免同一请求周期内重复查询数据库。
 * 由于列表查询条件复杂，不适合使用 key-based 缓存。
 * 
 * @param filters - 筛选条件
 * @returns 任务列表分页数据
 */
export const getMeasureTasks = cache(async (filters: MeasureTaskQueryFilters) => {
    // 🔒 安全校验：强制租户隔离
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权访问' };
    }
    const tenantId = session.user.tenantId;

    const {
        status,
        search,
        page = 1,
        pageSize = 10,
        workerId,
        salesId,
        address,
        channel,
        customerName,
        dateFrom,
        dateTo,
    } = filters;

    const offset = (page - 1) * pageSize;
    const conditions = [eq(measureTasks.tenantId, tenantId)];

    if (status && status !== 'ALL') {
        conditions.push(eq(measureTasks.status, status as MeasureTaskStatus));
    }

    if (workerId) {
        conditions.push(eq(measureTasks.assignedWorkerId, workerId));
    }

    if (salesId) {
        conditions.push(eq(leads.assignedSalesId, salesId));
    }

    if (channel) {
        conditions.push(eq(leads.channelId, channel));
    }

    if (address) {
        const pattern = `%${address}%`;
        conditions.push(or(
            ilike(leads.address, pattern),
            ilike(leads.community, pattern)
        )!);
    }

    if (customerName) {
        conditions.push(ilike(customers.name, `%${customerName}%`));
    }

    if (dateFrom) {
        conditions.push(gte(measureTasks.scheduledAt, new Date(dateFrom)));
    }

    if (dateTo) {
        // End of the day
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        conditions.push(lte(measureTasks.scheduledAt, endDate));
    }

    if (search) {
        const pattern = `%${search}%`;
        conditions.push(or(
            ilike(measureTasks.measureNo, pattern),
            ilike(measureTasks.remark, pattern),
            ilike(customers.name, pattern),
            ilike(customers.phone, pattern),
            ilike(leads.address, pattern),
            ilike(leads.community, pattern)
        )!);
    }

    try {
        const tasks = await db.select({
            id: measureTasks.id,
            measureNo: measureTasks.measureNo,
            status: measureTasks.status,
            scheduledAt: measureTasks.scheduledAt,
            createdAt: measureTasks.createdAt,
            rejectCount: measureTasks.rejectCount,
            rejectReason: measureTasks.rejectReason,
            tenantId: measureTasks.tenantId,
            customerId: measureTasks.customerId,
            customer: {
                name: customers.name,
                phone: customers.phone
            },
            lead: {
                community: leads.community,
                address: leads.address
            },
            assignedWorker: {
                id: users.id,
                name: users.name
            },
        })
            .from(measureTasks)
            .leftJoin(customers, eq(measureTasks.customerId, customers.id))
            .leftJoin(leads, eq(measureTasks.leadId, leads.id))
            .leftJoin(users, eq(measureTasks.assignedWorkerId, users.id))
            .where(and(...conditions))
            .orderBy(desc(measureTasks.createdAt))
            .limit(pageSize)
            .offset(offset);

        const [totalResult] = await db.select({ count: count() })
            .from(measureTasks)
            .leftJoin(customers, eq(measureTasks.customerId, customers.id))
            .leftJoin(leads, eq(measureTasks.leadId, leads.id))
            .leftJoin(users, eq(measureTasks.assignedWorkerId, users.id))
            .where(and(...conditions));

        return {
            success: true,
            data: tasks.map(t => ({
                ...t,
                scheduledAt: t.scheduledAt?.toISOString() || null,
                createdAt: t.createdAt?.toISOString() || null,
                address: t.lead ? `${t.lead.community || ''} ${t.lead.address || ''}`.trim() : ''
            })),
            total: totalResult?.count || 0
        };
    } catch (error) {
        console.error('getMeasureTasks error:', error);
        return { success: false, error: '获取列表失败', data: [] };
    }
});

/**
 * 获取测量任务详情 (包含最新的测量单和明细)
 * 
 * 使用 unstable_cache 进行缓存，缓存标签为 `measure-task-${id}`。
 * 任何任务修改（状态变更、派工、费用豁免）都应触发此标签失效。
 * 
 * @param id - 任务 ID
 * @returns 任务详情
 */
export async function getMeasureTaskById(id: string) {
    // 🔒 安全校验：强制租户隔离
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权访问' };
    }
    const tenantId = session.user.tenantId;

    const getTask = unstable_cache(
        async () => {
            return await db.query.measureTasks.findFirst({
                where: and(
                    eq(measureTasks.id, id),
                    eq(measureTasks.tenantId, tenantId) // 🔒 强制租户过滤
                ),
                with: {
                    assignedWorker: true,
                    lead: true,
                    customer: true,
                    sheets: {
                        orderBy: [desc(measureSheets.createdAt)],
                        limit: 1,
                        with: {
                            items: true,
                        }
                    }
                }
            });
        },
        [`measure-task-${id}`],
        {
            tags: [`measure-task-${id}`, 'measure-task'],
            revalidate: 3600 // 1 hour default
        }
    );

    const task = await getTask();

    if (!task) {
        return { success: false, error: '任务不存在或无权访问' };
    }

    return { success: true, data: task };
}

/**
 * 获取可指派的测量师傅列表
 * 
 * 使用 unstable_cache 缓存，缓存标签为 `workers-${tenantId}`。
 * 缓存时间 1小时。
 * 
 * @returns 测量师列表
 */
export async function getAvailableWorkers() {
    // 🔒 安全校验：强制租户隔离
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权访问' };
    }
    const tenantId = session.user.tenantId;

    const getWorkers = unstable_cache(
        async () => {
            // 只返回当前租户的测量师傅（角色为 WORKER）
            return await db.query.users.findMany({
                where: and(
                    eq(users.role, 'WORKER'),
                    eq(users.tenantId, tenantId) // 🔒 强制租户过滤
                ),
            });
        },
        [`workers-${tenantId}`],
        {
            tags: [`workers-${tenantId}`, 'workers'],
            revalidate: 3600 // 1 hour
        }
    );

    const workers = await getWorkers();
    return { success: true, data: workers };
}

/**
 * 获取测量任务的版本历史 (所有测量单)
 * 
 * @param taskId - 任务 ID
 * @returns 测量单列表
 */
export async function getMeasureTaskVersions(taskId: string) {
    // 🔒 安全校验：强制租户隔离
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权访问' };
    }
    const tenantId = session.user.tenantId;

    // 先验证任务归属
    const task = await db.query.measureTasks.findFirst({
        where: and(
            eq(measureTasks.id, taskId),
            eq(measureTasks.tenantId, tenantId)
        ),
        columns: { id: true }
    });

    if (!task) {
        return { success: false, error: '任务不存在或无权访问' };
    }

    const sheets = await db.query.measureSheets.findMany({
        where: eq(measureSheets.taskId, taskId),
        with: {
            items: true,
        },
        orderBy: [desc(measureSheets.round), desc(measureSheets.variant)],
    });
    return { success: true, data: sheets };
}

/**
 * 检查测量任务的费用状态 (定金检查)
 * 
 * @param taskId - 任务 ID
 * @returns 费用状态及派工许可
 */
export async function checkMeasureFeeStatus(taskId: string) {
    // 🔒 安全校验：强制租户隔离
    const session = await auth();
    if (!session?.user?.tenantId) {
        return { success: false, error: '未授权访问' };
    }
    const tenantId = session.user.tenantId;

    const task = await db.query.measureTasks.findFirst({
        where: and(
            eq(measureTasks.id, taskId),
            eq(measureTasks.tenantId, tenantId) // 🔒 强制租户过滤
        ),
        with: {
            customer: {
                with: {
                    orders: true
                }
            },
            lead: true
        }
    });

    if (!task) return { success: false, error: '任务不存在或无权访问' };

    // 1. 检查是否获免
    if (task.isFeeExempt) {
        return {
            success: true,
            feeStatus: 'WAIVED',
            canDispatch: true,
            message: '已获免测量费'
        };
    }

    // 2. 使用统一的费用准入/定金检查逻辑
    // 由于 checkMeasureFeeStatus 通常在派单前调用，我们使用 checkDispatchAdmission

    // 获取关联订单ID (如果没有直接绑定，尝试查找最近的有效订单)
    // 假设 measureTasks 没有 orderId 字段（Schema confirmed usually attached to lead/customer）
    // 我们尝试从 customer.orders 中找一个 'PAID' 或 'PARTIAL_PAID' 的订单，或者最近的订单?
    // checkDispatchAdmission 需要 orderId。如果没有 Order，它认为 "现场收费"。

    // 优先查找有效订单 (已付定金的)
    // TODO: 应该有一个明确的 Link 关系。如果业务逻辑是 "关联任意有效订单即可"，则：
    const validOrder = task.customer?.orders?.find(o =>
        (o.status === 'PAID') && Number(o.totalAmount) > 0
    );

    const checkResult = await checkDispatchAdmission(
        validOrder?.id || null,
        task.leadId || '',
        tenantId
    );

    return {
        success: true,
        feeStatus: checkResult.canDispatch ? 'PAID' : 'PENDING',
        canDispatch: checkResult.canDispatch,
        message: checkResult.reason || (checkResult.canDispatch ? '费用检查通过' : '需支付定金')
    };
}
