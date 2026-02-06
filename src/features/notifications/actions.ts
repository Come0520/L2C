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

    try {
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
    } catch (error) {
        console.error('getNotificationsPure safe fallback:', error);
        return {
            data: [],
            meta: {
                total: 0,
                page,
                limit,
            }
        };
    }
}

const getNotificationsActionInternal = createSafeAction(getNotificationsSchema, async (params, { session }) => {
    const result = await getNotificationsPure(session.user, params);
    return {
        success: true,
        ...result
    };
});

export async function getNotifications(params: z.infer<typeof getNotificationsSchema>) {
    return getNotificationsActionInternal(params);
}

const getUnreadCountActionInternal = createSafeAction(z.object({}), async (params, { session }) => {
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

export async function getUnreadCount() {
    return getUnreadCountActionInternal({});
}

const markAsReadActionInternal = createSafeAction(markAsReadSchema, async (params, { session }) => {
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

export async function markAsRead(params: z.infer<typeof markAsReadSchema>) {
    return markAsReadActionInternal(params);
}

const markAllAsReadActionInternal = createSafeAction(z.object({}), async (params, { session }) => {
    const userId = session.user.id;

    await db.update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(and(
            eq(notifications.userId, userId),
            eq(notifications.isRead, false)
        ));

    return { success: true };
});

export async function markAllAsRead() {
    return markAllAsReadActionInternal({});
}

import { slaChecker } from './sla-checker';

const runSLACheckActionInternal = createSafeAction(z.object({}), async (params, { session }) => {
    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'MANAGER') {
        throw new Error('Unauthorized: Only Admin or Manager can run SLA checks.');
    }

    const results = await slaChecker.runAllChecks();
    return { success: true, data: results };
});

export async function runSLACheck() {
    return runSLACheckActionInternal({});
}

// ============================================
// [Notify-04] 通知偏好设置 Actions
// ============================================

import { notificationPreferences } from '@/shared/api/schema';

/**
 * 通知类型定义
 */
const NOTIFICATION_TYPES = [
    'SYSTEM',      // 系统通知
    'ORDER_STATUS',// 订单状态
    'APPROVAL',    // 审批通知
    'ALERT',       // 预警通知
    'MENTION',     // @提及
    'INFO',        // 信息通知
    'SUCCESS',     // 成功通知
    'WARNING',     // 警告通知
    'ERROR'        // 错误通知
] as const;

/**
 * 通知渠道定义
 */
const NOTIFICATION_CHANNELS = [
    'IN_APP',      // 站内通知
    'SMS',         // 短信
    'WECHAT',      // 微信服务号
    'WECHAT_MINI', // 微信小程序
    'LARK',        // 飞书
    'EMAIL'        // 邮件
] as const;

/**
 * 获取用户的通知偏好设置
 */
const getNotificationPreferencesActionInternal = createSafeAction(
    z.object({}),
    async (params, { session }) => {
        const userId = session.user.id;

        const prefs = await db.query.notificationPreferences.findMany({
            where: eq(notificationPreferences.userId, userId)
        });

        // 构建完整的偏好映射（包含未设置的类型，默认使用 IN_APP）
        const prefsMap: Record<string, string[]> = {};
        for (const type of NOTIFICATION_TYPES) {
            const existing = prefs.find(p => p.notificationType === type);
            prefsMap[type] = existing?.channels || ['IN_APP'];
        }

        return {
            success: true,
            data: {
                preferences: prefsMap,
                notificationTypes: NOTIFICATION_TYPES,
                channels: NOTIFICATION_CHANNELS
            }
        };
    }
);

export async function getNotificationPreferences() {
    return getNotificationPreferencesActionInternal({});
}

/**
 * 更新用户的通知偏好设置
 */
const updatePreferenceSchema = z.object({
    notificationType: z.enum(NOTIFICATION_TYPES),
    channels: z.array(z.enum(NOTIFICATION_CHANNELS))
});

const updateNotificationPreferenceActionInternal = createSafeAction(
    updatePreferenceSchema,
    async (data, { session }) => {
        const userId = session.user.id;
        const tenantId = session.user.tenantId;

        // 确保 IN_APP 始终开启（站内通知不可关闭）
        const channels = data.channels.includes('IN_APP')
            ? data.channels
            : ['IN_APP', ...data.channels];

        // 查找是否已有该类型的偏好设置
        const existing = await db.query.notificationPreferences.findFirst({
            where: and(
                eq(notificationPreferences.userId, userId),
                eq(notificationPreferences.notificationType, data.notificationType)
            )
        });

        if (existing) {
            // 更新现有记录
            await db.update(notificationPreferences)
                .set({
                    channels: channels,
                    updatedAt: new Date()
                })
                .where(eq(notificationPreferences.id, existing.id));
        } else {
            // 创建新记录
            await db.insert(notificationPreferences).values({
                tenantId: tenantId,
                userId: userId,
                notificationType: data.notificationType,
                channels: channels
            });
        }

        return { success: true };
    }
);

export async function updateNotificationPreference(data: z.infer<typeof updatePreferenceSchema>) {
    return updateNotificationPreferenceActionInternal(data);
}

/**
 * 批量更新用户的通知偏好设置
 */
const batchUpdatePreferencesSchema = z.object({
    preferences: z.record(
        z.enum(NOTIFICATION_TYPES),
        z.array(z.enum(NOTIFICATION_CHANNELS))
    )
});

const batchUpdateNotificationPreferencesActionInternal = createSafeAction(
    batchUpdatePreferencesSchema,
    async (data, { session }) => {
        const userId = session.user.id;
        const tenantId = session.user.tenantId;

        // 批量更新所有偏好
        for (const [notificationType, channels] of Object.entries(data.preferences)) {
            // 确保 IN_APP 始终开启
            const finalChannels = channels.includes('IN_APP')
                ? channels
                : ['IN_APP', ...channels];

            const existing = await db.query.notificationPreferences.findFirst({
                where: and(
                    eq(notificationPreferences.userId, userId),
                    eq(notificationPreferences.notificationType, notificationType)
                )
            });

            if (existing) {
                await db.update(notificationPreferences)
                    .set({
                        channels: finalChannels,
                        updatedAt: new Date()
                    })
                    .where(eq(notificationPreferences.id, existing.id));
            } else {
                await db.insert(notificationPreferences).values({
                    tenantId: tenantId,
                    userId: userId,
                    notificationType: notificationType,
                    channels: finalChannels
                });
            }
        }

        return { success: true };
    }
);

export async function batchUpdateNotificationPreferences(data: z.infer<typeof batchUpdatePreferencesSchema>) {
    return batchUpdateNotificationPreferencesActionInternal(data);
}

// 别名导出，兼容旧的消费方命名
export { getNotifications as getNotificationsAction };
export { markAsRead as markAsReadAction };
export { markAllAsRead as markAllAsReadAction };
export { getNotificationPreferences as getNotificationPreferencesAction };
export { updateNotificationPreference as updateNotificationPreferenceAction };
