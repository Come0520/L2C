'use server';

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { notificationService } from '@/features/notifications/service';
import { NotificationType } from '@/shared/api/schema';
import { checkPermission } from '@/shared/lib/auth';
import { PERMISSIONS } from '@/shared/config/permissions';
import { logger } from '@/shared/lib/logger';

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
/**
 * 通知创建参数定义
 */
export type CreateNotificationParams = {
    /** 接收通知的用户 ID */
    userId: string;
    /** 通知标题 */
    title: string;
    /** 通知正文内容 */
    content: string;
    /** 告警级别：INFO (普通信息), WARNING (警告), ERROR (严重错误) */
    type?: 'INFO' | 'WARNING' | 'ERROR';
    /** 点击通知后跳转的业务链接（可选） */
    link?: string;
    /** 强制分发的外部渠道清单（如：SYSTEM, FEISHU, WECHAT） */
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

/**
 * 内部安全的通知创建 Action
 * 包含权限检查与类型映射逻辑（INFO -> SYSTEM, WARNING/ERROR -> ALERT）
 */
const createNotificationActionInternal = createSafeAction(createNotificationSchema, async (params, { session }) => {
    checkPermission(session, PERMISSIONS.NOTIFICATION.MANAGE);

    // 将旧版定义的类型字符串映射至系统标准的 NotificationType 枚举值
    // 映射逻辑：WARNING 或 ERROR 映射为 ALERT (告警)，其它默认为 SYSTEM (系统通知)
    let notificationType: NotificationType = 'SYSTEM';
    if (params.type === 'WARNING' || params.type === 'ERROR') {
        notificationType = 'ALERT';
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

        logger.info(`通知已发送: user=${params.userId}, type=${params.type || 'DEFAULT'} -> ${notificationType}`);
        return { success: true };
    } catch (error) {
        logger.error('创建通知失败:', {
            userId: params.userId,
            type: params.type,
            error: error instanceof Error ? error.message : String(error)
        });
        return { success: false, error: 'Failed to create notification' };
    }
});

/**
 * 创建单条通知
 * 
 * @param params - 创建通知所需的参数，包含接收人、标题、内容及级别
 * @returns 返回操作结果对象，含 success 状态
 */
export async function createNotification(params: z.infer<typeof createNotificationSchema>) {
    return createNotificationActionInternal(params);
}
