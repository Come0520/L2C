'use server';

/**
 * 用户通知偏好设置
 * 
 * 功能：
 * 1. 通知渠道偏好（微信/短信/App/邮件）
 * 2. 免打扰时段设置
 * 3. 通知类型开关
 */

import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/shared/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

// 通知渠道类型
const NOTIFICATION_CHANNELS = ['IN_APP', 'WECHAT', 'SMS', 'EMAIL'] as const;

// 通知类型
const NOTIFICATION_TYPES = [
    'ORDER_STATUS',    // 订单状态变更
    'APPROVAL',        // 审批通知
    'ALERT',           // 系统警报
    'DISPATCH',        // 派单通知
    'REMINDER',        // 提醒通知
    'PROMOTION',       // 营销通知
] as const;

// 用户偏好类型定义
interface NotificationPreferences {
    /** 启用的通知渠道 */
    channels: (typeof NOTIFICATION_CHANNELS[number])[];
    /** 按通知类型启用/禁用 */
    types: Record<typeof NOTIFICATION_TYPES[number], boolean>;
    /** 免打扰设置 */
    doNotDisturb: {
        enabled: boolean;
        startTime: string; // HH:mm 格式
        endTime: string;
    };
    /** 更新时间 */
    updatedAt: string;
}

// 更新偏好设置 Schema
const updatePreferencesSchema = z.object({
    channels: z.array(z.enum(NOTIFICATION_CHANNELS)).optional(),
    types: z.record(z.enum(NOTIFICATION_TYPES), z.boolean()).optional(),
    doNotDisturb: z.object({
        enabled: z.boolean(),
        startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    }).optional(),
});

/**
 * 获取当前用户的通知偏好设置
 */
export async function getNotificationPreferencesFromDB() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: '未授权' };
    }

    const user = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: {
            id: true,
            notificationSettings: true,
        }
    });

    if (!user) {
        return { success: false, error: '用户不存在' };
    }

    // 解析或返回默认偏好
    const defaultPreferences: NotificationPreferences = {
        channels: ['IN_APP', 'WECHAT'],
        types: {
            ORDER_STATUS: true,
            APPROVAL: true,
            ALERT: true,
            DISPATCH: true,
            REMINDER: true,
            PROMOTION: false,
        },
        doNotDisturb: {
            enabled: false,
            startTime: '22:00',
            endTime: '08:00',
        },
        updatedAt: new Date().toISOString(),
    };

    let preferences = defaultPreferences;
    try {
        if (user.notificationSettings) {
            preferences = {
                ...defaultPreferences,
                ...(user.notificationSettings as Partial<NotificationPreferences>),
            };
        }
    } catch {
        // 解析失败使用默认值
    }

    return { success: true, data: preferences };
}

/**
 * 更新用户通知偏好设置
 */
export async function updateNotificationPreferences(
    input: z.infer<typeof updatePreferencesSchema>
) {
    try {
        const data = updatePreferencesSchema.parse(input);
        const session = await auth();

        if (!session?.user?.id || !session?.user?.tenantId) {
            return { success: false, error: '未授权' };
        }

        // 获取当前偏好
        const { data: currentPrefs } = await getNotificationPreferencesFromDB();
        if (!currentPrefs) {
            return { success: false, error: '获取当前偏好失败' };
        }

        // 合并更新
        const newPreferences: NotificationPreferences = {
            ...currentPrefs,
            channels: data.channels ?? currentPrefs.channels,
            types: data.types
                ? { ...currentPrefs.types, ...data.types }
                : currentPrefs.types,
            doNotDisturb: data.doNotDisturb
                ? { ...currentPrefs.doNotDisturb, ...data.doNotDisturb }
                : currentPrefs.doNotDisturb,
            updatedAt: new Date().toISOString(),
        };

        // 更新数据库
        await db.update(users)
            .set({
                notificationSettings: newPreferences,
            })
            .where(eq(users.id, session.user.id));

        revalidatePath('/settings');
        revalidatePath('/settings/notifications');

        return { success: true, data: newPreferences };
    } catch (error) {
        console.error('更新通知偏好失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '更新失败',
        };
    }
}

/**
 * 切换单个通知类型的开关
 */
export async function toggleNotificationType(
    type: typeof NOTIFICATION_TYPES[number],
    enabled: boolean
) {
    return updateNotificationPreferences({
        types: { [type]: enabled } as Record<typeof NOTIFICATION_TYPES[number], boolean>,
    });
}

/**
 * 设置免打扰时段
 */
export async function setDoNotDisturb(settings: {
    enabled: boolean;
    startTime?: string;
    endTime?: string;
}) {
    return updateNotificationPreferences({
        doNotDisturb: settings,
    });
}

/**
 * 检查当前是否在免打扰时段
 */
export function isInDoNotDisturbPeriod(preferences: NotificationPreferences): boolean {
    if (!preferences.doNotDisturb.enabled) {
        return false;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = preferences.doNotDisturb.startTime.split(':').map(Number);
    const [endHour, endMin] = preferences.doNotDisturb.endTime.split(':').map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // 处理跨午夜的情况
    if (startMinutes > endMinutes) {
        // 例如 22:00 - 08:00
        return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    } else {
        // 例如 13:00 - 14:00
        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
}

// 导出常量和类型
export {
    NOTIFICATION_CHANNELS,
    NOTIFICATION_TYPES,
    type NotificationPreferences
};
