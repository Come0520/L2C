'use server';

import { db } from '@/shared/api/db';
import { auditLogs, users } from '@/shared/api/schema';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { eq, desc, and, gte, lte, like, or } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';

/**
 * 获取审计日志列表
 * [Settings-03] 操作日志查看
 */
const getAuditLogsSchema = z.object({
    page: z.number().min(1).default(1),
    pageSize: z.number().min(10).max(100).default(20),
    tableName: z.string().optional(),
    action: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
    userId: z.string().uuid().optional(),
    startDate: z.string().optional(), // ISO date string
    endDate: z.string().optional(),
    search: z.string().optional(),
});

export const getAuditLogsAction = createSafeAction(getAuditLogsSchema, async (params, { session }) => {
    // 只有管理员可以查看审计日志
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

    const { page, pageSize, tableName, action, userId, startDate, endDate, search } = params;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions = [
        eq(auditLogs.tenantId, session.user.tenantId),
    ];

    if (tableName) {
        conditions.push(eq(auditLogs.tableName, tableName));
    }
    if (action) {
        conditions.push(eq(auditLogs.action, action));
    }
    if (userId) {
        conditions.push(eq(auditLogs.userId, userId));
    }
    if (startDate) {
        conditions.push(gte(auditLogs.createdAt, new Date(startDate)));
    }
    if (endDate) {
        conditions.push(lte(auditLogs.createdAt, new Date(endDate)));
    }
    if (search) {
        conditions.push(
            or(
                like(auditLogs.tableName, `%${search}%`),
                like(auditLogs.recordId, `%${search}%`)
            )!
        );
    }

    // 查询日志
    const logs = await db
        .select({
            id: auditLogs.id,
            tableName: auditLogs.tableName,
            recordId: auditLogs.recordId,
            action: auditLogs.action,
            userId: auditLogs.userId,
            userName: users.name,
            changedFields: auditLogs.changedFields,
            oldValues: auditLogs.oldValues,
            newValues: auditLogs.newValues,
            createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .leftJoin(users, eq(auditLogs.userId, users.id))
        .where(and(...conditions))
        .orderBy(desc(auditLogs.createdAt))
        .limit(pageSize)
        .offset(offset);

    // 获取总数（简化版，实际可用 count）
    const total = logs.length < pageSize && page === 1 ? logs.length : pageSize * page + 1;

    return {
        logs,
        pagination: {
            page,
            pageSize,
            total,
            hasMore: logs.length === pageSize,
        }
    };
});

/**
 * 获取可用的表名列表（用于筛选）
 */
export const getAuditTableNamesAction = createSafeAction(z.object({}), async (_, { session }) => {
    await checkPermission(session, PERMISSIONS.SETTINGS.MANAGE);

    const result = await db
        .selectDistinct({ tableName: auditLogs.tableName })
        .from(auditLogs)
        .where(eq(auditLogs.tenantId, session.user.tenantId))
        .limit(50);

    return result.map(r => r.tableName);
});
