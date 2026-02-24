'use server';

import { db } from '@/shared/api/db';
import { notificationPreferences, auditLogs } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { logger } from '@/shared/lib/logger';

// Schema 定义
/** 更新偏好操作的校验 Schema */
const updatePreferenceSchema = z.object({
    /** 通知类型分类（如：系统通知、订单状态、审批提醒等） */
    notificationType: z.enum(['SYSTEM', 'ORDER_STATUS', 'APPROVAL', 'ALERT', 'MENTION']),
    /** 启用的通知渠道列表（如：IN_APP, EMAIL, FEISHU 等），至少需选择一个 */
    channels: z.array(z.string().min(1)).min(1, '至少选择一个通知渠道'),
});

const getPreferencesSchema = z.object({});

/**
 * 获取当前登录用户的所有通知偏好设置
 * 
 * @returns 返回包含通知偏好数组的操作结果
 */
const getNotificationPreferencesInternal = createSafeAction(getPreferencesSchema, async (_data, { session }) => {
    const prefs = await db.query.notificationPreferences.findMany({
        where: and(
            eq(notificationPreferences.userId, session.user.id),
            eq(notificationPreferences.tenantId, session.user.tenantId),
        ),
    });
    return { success: true, data: prefs };
});

export async function getNotificationPreferences() {
    return getNotificationPreferencesInternal({});
}

/**
 * 更新用户特定的通知类型偏好
 * 包含审计日志记录，且用户仅能操作自身的偏好设置
 * 
 * @param data - 包含通知类型及其对应的渠道列表
 * @returns 操作成功状态
 */
const updateNotificationPreferenceActionInternal = createSafeAction(updatePreferenceSchema, async (data, { session }) => {
    // 用户始终有权管理自己的偏好设置

    const existing = await db.query.notificationPreferences.findFirst({
        where: and(
            eq(notificationPreferences.userId, session.user.id),
            eq(notificationPreferences.notificationType, data.notificationType),
        ),
    });

    if (existing) {
        await db.update(notificationPreferences)
            .set({
                channels: data.channels,
                updatedAt: new Date(),
            })
            .where(eq(notificationPreferences.id, existing.id));
    } else {
        await db.insert(notificationPreferences).values({
            tenantId: session.user.tenantId!,
            userId: session.user.id,
            notificationType: data.notificationType,
            channels: data.channels,
        });
    }

    // 写入审计日志，记录通知偏好的变更行为
    await db.insert(auditLogs).values({
        tenantId: session.user.tenantId,
        action: 'UPDATE_NOTIFICATION_PREFERENCE',
        tableName: 'notification_preferences',
        recordId: existing?.id ?? 'new',
        userId: session.user.id,
        newValues: data as Record<string, unknown>,
        createdAt: new Date(),
    });

    logger.info(`通知偏好已更新: user=${session.user.id}, type=${data.notificationType}`);
    return { success: true };
});

export async function updateNotificationPreference(data: z.infer<typeof updatePreferenceSchema>) {
    return updateNotificationPreferenceActionInternal(data);
}
