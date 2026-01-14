'use server';

import { db } from '@/shared/api/db';
import { notifications } from '@/shared/api/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { Notification } from './types';

const getNotificationsSchema = z.object({
    page: z.number().default(1),
    limit: z.number().default(20),
    onlyUnread: z.boolean().default(false),
});

const markAsReadSchema = z.object({
    ids: z.array(z.string()),
});

interface SessionUser {
    id: string;
    tenantId: string;
}

interface GetNotificationsParams {
    page: number;
    limit: number;
    onlyUnread: boolean;
}

interface NotificationResult {
    data: Notification[];
    meta: {
        total: number;
        page: number;
        limit: number;
    };
}

export async function getNotificationsPure(session: SessionUser, params: GetNotificationsParams): Promise<NotificationResult> {
    const { page, limit, onlyUnread } = params;
    const tenantId = session.tenantId;
    const userId = session.id;

    const whereCondition = and(
        eq(notifications.tenantId, tenantId),
        eq(notifications.userId, userId),
        onlyUnread ? eq(notifications.isRead, false) : undefined
    );

    const data = await db.query.notifications.findMany({
        where: whereCondition,
        orderBy: [desc(notifications.createdAt)],
        limit: limit,
        offset: (page - 1) * limit,
    });

    const [{ count }] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(notifications)
        .where(whereCondition);

    return {
        data: data,
        meta: {
            total: count,
            page,
            limit,
        }
    };
}

export const getNotificationsAction = createSafeAction(getNotificationsSchema, async (params, { session }) => {
    const result = await getNotificationsPure(session.user, params);
    return {
        success: true,
        ...result
    };
});

export const getUnreadCountAction = createSafeAction(z.object({}), async (params, { session }) => {
    const tenantId = session.user.tenantId;
    const userId = session.user.id;

    const [{ count }] = await db
        .select({ count: sql<number>`cast(count(*) as int)` })
        .from(notifications)
        .where(and(
            eq(notifications.tenantId, tenantId),
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
        ));

    return { success: true, data: { count } };
});

export const markAsReadAction = createSafeAction(markAsReadSchema, async (params, { session }) => {
    const { ids } = params;
    const userId = session.user.id;

    if (ids.length === 0) return { success: true };

    await db.update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(
            eq(notifications.userId, userId),
            inArray(notifications.id, ids)
        ));

    return { success: true };
});

export const markAllAsReadAction = createSafeAction(z.object({}), async (params, { session }) => {
    const userId = session.user.id;

    await db.update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
        ));

    return { success: true };
});

import { slaChecker } from './sla-checker';

export const runSLACheckAction = createSafeAction(z.object({}), async (params, { session }) => {
    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'MANAGER') {
        throw new Error('Unauthorized: Only Admin or Manager can run SLA checks.');
    }

    const results = await slaChecker.runAllChecks();
    return { success: true, data: results };
});
