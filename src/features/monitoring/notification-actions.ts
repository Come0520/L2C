'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { notificationService } from '@/features/notifications/service';
import { NotificationType } from '@/shared/api/schema';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';

// 导入核心 Actions
import {
    getNotificationsAction,
    markAsReadAction,
    getUnreadCountAction
} from '@/features/notifications/actions';

// 重新导出核心 Actions 以保持兼容性
export const getMyNotifications = getNotificationsAction;
export const markNotificationAsRead = markAsReadAction;
export const getUnreadCount = getUnreadCountAction;

// 保留 createNotification 因為它包含特定的类型映射逻辑
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

const createNotificationActionInternal = createSafeAction(createNotificationSchema, async (params, { session }) => {
    checkPermission(session, PERMISSIONS.NOTIFICATION.MANAGE);

    // Map legacy type string to NotificationType enum
    let notificationType: NotificationType = 'SYSTEM';
    if (params.type === 'WARNING' || params.type === 'ERROR') {
        notificationType = 'ALERT';
    } else {
        // Zod 已限定 type 只能是 INFO/WARNING/ERROR，所以此处默认为 SYSTEM (INFO)
        notificationType = 'SYSTEM';
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
            forceChannels: params.externalChannels as string[] | undefined,
        });

        return { success: true };
    } catch (_error) {
        return { success: false, error: 'Failed to create notification' };
    }
});

export async function createNotification(params: z.infer<typeof createNotificationSchema>) {
    return createNotificationActionInternal(params);
}
