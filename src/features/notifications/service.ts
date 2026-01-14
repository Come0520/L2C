import { db } from '@/shared/api/db';
import { notifications, notificationPreferences, notificationTypeEnum } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { NotificationPayload } from './types';
import { SmsAdapter } from './adapters/sms-adapter';
import { LarkAdapter } from './adapters/lark-adapter';
import { WeChatAdapter } from './adapters/wechat-adapter';

// Singleton Adapters
const smsAdapter = new SmsAdapter();
const larkAdapter = new LarkAdapter();
const wechatAdapter = new WeChatAdapter();

export const notificationService = {
    async send(payload: NotificationPayload & { forceChannels?: string[] }) {
        const { tenantId, userId, type, title, content, metadata, forceChannels } = payload;

        // 1. Determine Channels
        // If forceChannels provided, use them. Otherwise, check User Preferences.
        let activeChannels: string[] = [];

        if (forceChannels && forceChannels.length > 0) {
            activeChannels = forceChannels;
        } else {
            const pref = await db.query.notificationPreferences.findFirst({
                where: and(
                    eq(notificationPreferences.userId, userId),
                    eq(notificationPreferences.notificationType, type as typeof notificationTypeEnum.enumValues[number])
                ),
            });
            // Default: IN_APP is enabled if no preference found.
            activeChannels = pref?.channels || ['IN_APP'];
        }

        console.log(`[NotificationService] Dispatching [${type}] to User(${userId}) via [${activeChannels.join(', ')}]`);

        // 2. Dispatch to Channels
        const promises: Promise<unknown>[] = [];

        // IN_APP Interaction
        if (activeChannels.includes('IN_APP')) {
            promises.push(
                db.insert(notifications).values({
                    tenantId,
                    userId,
                    type: type as typeof notificationTypeEnum.enumValues[number],
                    channel: 'IN_APP',
                    title,
                    content,
                    metadata: metadata,
                })
            );
        }

        // External Adapters
        if (activeChannels.includes('SMS')) promises.push(smsAdapter.send(payload));
        if (activeChannels.includes('FEISHU') || activeChannels.includes('LARK')) promises.push(larkAdapter.send(payload));
        if (activeChannels.includes('WECHAT')) promises.push(wechatAdapter.send(payload));

        await Promise.allSettled(promises);

        return true;
    },

    async markAsRead(notificationId: string) {
        await db.update(notifications)
            .set({ isRead: true })
            .where(eq(notifications.id, notificationId));
    },

    async markAllAsRead(userId: string) {
        await db.update(notifications)
            .set({ isRead: true })
            .where(
                and(
                    eq(notifications.userId, userId),
                    eq(notifications.isRead, false)
                )
            );
    }
};
