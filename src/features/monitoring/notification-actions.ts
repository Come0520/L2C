/**
 * 通知系统 Server Actions (Phase 10)
 */

'use server';

import { db } from '@/shared/api/db';
import { notifications } from '@/shared/api/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { revalidatePath } from 'next/cache';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { notificationService } from '@/features/notifications/service';
import { NotificationType } from '@/shared/api/schema';

export type CreateNotificationParams = {
    userId: string;
    title: string;
    content: string;
    type?: 'INFO' | 'WARNING' | 'ERROR';
    link?: string;
    externalChannels?: ('SYSTEM' | 'FEISHU' | 'WECHAT')[];
};

const createNotificationSchema = z.object({
    userId: z.string(),
    title: z.string().min(1),
    content: z.string().min(1),
    type: z.enum(['INFO', 'WARNING', 'ERROR']).optional(),
    link: z.string().optional(),
    externalChannels: z.array(z.enum(['SYSTEM', 'FEISHU', 'WECHAT'])).optional(),
});

const getMyNotificationsSchema = z.object({
    limit: z.number().default(20),
});

const markNotificationAsReadSchema = z.object({
    id: z.string(),
});

const getUnreadCountSchema = z.object({});

/**
 * 创建系统通知
 */
const createNotificationActionInternal = createSafeAction(createNotificationSchema, async (params, { session }) => {
    checkPermission(session, PERMISSIONS.NOTIFICATION.MANAGE);

    // Map legacy type string to NotificationType enum
    let notificationType: NotificationType = 'SYSTEM';
    if (params.type === 'WARNING' || params.type === 'ERROR') {
        notificationType = 'ALERT';
    } else if (params.type === 'INFO') {
        notificationType = 'SYSTEM';
    } else {
        notificationType = params.type as unknown as NotificationType;
    }

    try {
        await notificationService.send({
            tenantId: session.user.tenantId,
            userId: params.userId,
            title: params.title,
            content: params.content,
            type: notificationType,
            link: params.link,
            metadata: { link: params.link },
            forceChannels: params.externalChannels as any,
        });

        return { success: true };
    } catch (_error) {
        return { success: false, error: 'Failed to create notification' };
    }
});

export async function createNotification(params: z.infer<typeof createNotificationSchema>) {
    return createNotificationActionInternal(params);
}

/**
 * 获取我的通知
 */
const getMyNotificationsActionInternal = createSafeAction(getMyNotificationsSchema, async ({ limit }, { session }) => {
    const result = await db.query.notifications.findMany({
        where: and(
            eq(notifications.tenantId, session.user.tenantId),
            eq(notifications.userId, session.user.id)
        ),
        orderBy: [desc(notifications.createdAt)],
        limit
    });

    return { success: true, data: result };
});

export async function getMyNotifications(params: z.infer<typeof getMyNotificationsSchema>) {
    return getMyNotificationsActionInternal(params);
}

/**
 * 标记通知已读
 */
const markNotificationAsReadActionInternal = createSafeAction(markNotificationAsReadSchema, async ({ id }, { session }) => {
    await db.update(notifications)
        .set({
            isRead: true,
            readAt: new Date()
        })
        .where(and(
            eq(notifications.id, id),
            eq(notifications.userId, session.user.id)
        ));

    revalidatePath('/', 'layout');
    return { success: true };
});

export async function markNotificationAsRead(params: z.infer<typeof markNotificationAsReadSchema>) {
    return markNotificationAsReadActionInternal(params);
}

/**
 * 获取未读数量
 */
const getUnreadCountActionInternal = createSafeAction(getUnreadCountSchema, async (params, { session }) => {
    const result = await db.select({
        count: sql<number>`count(*)`
    })
        .from(notifications)
        .where(and(
            eq(notifications.userId, session.user.id),
            eq(notifications.isRead, false)
        ));

    return { success: true, data: Number(result[0].count) };
});

export async function getUnreadCount() {
    return getUnreadCountActionInternal({});
}
