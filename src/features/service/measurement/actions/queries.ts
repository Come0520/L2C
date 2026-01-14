'use server';

import { db } from '@/shared/api/db';
import { measureTasks, measureSheets, measureItems, users } from '@/shared/api/schema';
import { eq, and, desc, or, ilike, count } from 'drizzle-orm';
import { z } from 'zod';

/**
 * 获取测量任务列表
 */
export async function getMeasureTasks(filters: {
    status?: string;
    search?: string;
    page?: number;
    pageSize?: number;
}) {
    const { status, search, page = 1, pageSize = 10 } = filters;
    const whereConditions = [];

    if (status) {
        // @ts-ignore - 兼容枚举
        whereConditions.push(eq(measureTasks.status, status));
    }

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

    const rows = await db.query.measureTasks.findMany({
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
