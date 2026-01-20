'use server';

import { db } from '@/shared/api/db';
import { measureTasks, measureSheets, users } from '@/shared/api/schema';
import { eq, and, desc, or, ilike, count, gte, lte } from 'drizzle-orm';


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
 * 支持筛选条件：
 * - status: 任务状态
 * - search: 搜索（测量单号、备注、地址、渠道、客户）
 * - workerId: 测量师 ID
 * - salesId: 销售 ID 
 * - address: 地址关键词
 * - channel: 渠道
 * - customerName: 客户名称
 * - dateFrom/dateTo: 预约日期范围
 */
export async function getMeasureTasks(filters: MeasureTaskQueryFilters) {
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

    const whereConditions = [];

    // 状态筛选
    if (status) {
        // @ts-expect-error - 兼容枚举类型不匹配
        whereConditions.push(eq(measureTasks.status, status));
    }

    // 测量师筛选
    if (workerId) {
        whereConditions.push(eq(measureTasks.assignedWorkerId, workerId));
    }

    // 日期范围筛选
    if (dateFrom) {
        whereConditions.push(gte(measureTasks.scheduledAt, new Date(dateFrom)));
    }
    if (dateTo) {
        // 日期结束包含当天，设置为当天 23:59:59
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereConditions.push(lte(measureTasks.scheduledAt, endDate));
    }

    // 通用搜索（测量单号、备注）
    if (search) {
        whereConditions.push(or(
            ilike(measureTasks.measureNo, `%${search}%`),
            ilike(measureTasks.remark, `%${search}%`)
        ));
    }

    const whereClause = and(...whereConditions);

    const [total] = await db
        .select({ count: count() })
        .from(measureTasks)
        .where(whereClause);

    // 查询任务列表（包含关联数据）
    let rows = await db.query.measureTasks.findMany({
        where: whereClause,
        with: {
            assignedWorker: true,
            lead: true,
            customer: true,
        },
        orderBy: [desc(measureTasks.createdAt)],
        limit: pageSize,
        offset: (page - 1) * pageSize,
    });

    // 关联表筛选（在应用层过滤）
    // 注意：Drizzle ORM 的 with 查询暂不支持在关联表上直接过滤
    // 如需严格分页准确性，应使用 SQL JOIN 查询
    if (salesId) {
        rows = rows.filter(row => row.lead?.assignedSalesId === salesId);
    }
    if (address) {
        const addressLower = address.toLowerCase();
        rows = rows.filter(row =>
            row.lead?.address?.toLowerCase().includes(addressLower) ||
            row.lead?.community?.toLowerCase().includes(addressLower)
        );
    }
    if (channel) {
        rows = rows.filter(row => row.lead?.channelId === channel);
    }
    if (customerName) {
        const nameLower = customerName.toLowerCase();
        rows = rows.filter(row =>
            row.customer?.name?.toLowerCase().includes(nameLower)
        );
    }

    return {
        success: true,
        data: rows,
        total: total?.count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((total?.count || 0) / pageSize),
    };
}

/**
 * 获取测量任务详情 (包含最新的测量单和明细)
 */
export async function getMeasureTaskById(id: string) {
    const task = await db.query.measureTasks.findFirst({
        where: eq(measureTasks.id, id),
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

    return { success: true, data: task };
}

/**
 * 获取可指派的测量师傅列表
 */
export async function getAvailableWorkers() {
    // 假设角色为 WORKER 的用户是测量师傅
    const workers = await db.query.users.findMany({
        where: eq(users.role, 'WORKER'),
    });
    return { success: true, data: workers };
}

/**
 * 获取测量任务的版本历史 (所有测量单)
 */
export async function getMeasureTaskVersions(taskId: string) {
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
 */
export async function checkMeasureFeeStatus(taskId: string) {
    const task = await db.query.measureTasks.findFirst({
        where: eq(measureTasks.id, taskId),
        with: {
            customer: {
                with: {
                    orders: true
                }
            },
            lead: true
        }
    });

    if (!task) return { success: false, error: 'Task not found' };

    // 1. 检查是否获免
    if (task.isFeeExempt) {
        return {
            success: true,
            feeStatus: 'WAIVED',
            canDispatch: true,
            message: '已获免测量费'
        };
    }

    // 2. 检查是否有已支付的定金订单
    // TODO: Require 'type' field in orders schema to distinguish EARNEST_MONEY orders strictly.
    // For now, checking for any PAID order with sufficient amount.
    const earnestOrder = task.customer.orders.find(o =>
        o.status === 'PAID' &&
        // @ts-expect-error - Assuming 'type' might be added later or using naming convention logic if needed
        (o['type'] === 'EARNEST_MONEY' || o.orderNo.startsWith('EM'))
    );

    // 假设标准测量费 (未来应从配置读取)
    const STANDARD_MEASURE_FEE = 200;

    // Fallback: If no strict earnest money order, check if ANY paid order covers the fee (loose check)
    const hasSufficientPayment = (earnestOrder && Number(earnestOrder.totalAmount) >= STANDARD_MEASURE_FEE) ||
        task.customer.orders.some(o => o.status === 'PAID' && Number(o.totalAmount) >= STANDARD_MEASURE_FEE);

    if (hasSufficientPayment) {
        return {
            success: true,
            feeStatus: 'PAID',
            canDispatch: true,
            message: '定金已支付'
        };
    }

    return {
        success: true,
        feeStatus: 'PENDING',
        canDispatch: false,
        message: '需支付定金或申请豁免'
    };
}
