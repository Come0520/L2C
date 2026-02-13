import { db } from '@/shared/api/db';
import { notifications, notificationPreferences, notificationTypeEnum } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { NotificationPayload } from './types';
import { SmsAdapter } from './adapters/sms-adapter';
import { LarkAdapter } from './adapters/lark-adapter';
import { WeChatAdapter } from './adapters/wechat-adapter';

// 单例适配器 (Singleton Adapters)
const smsAdapter = new SmsAdapter();
const larkAdapter = new LarkAdapter();
const wechatAdapter = new WeChatAdapter();

export const notificationService = {
    async send(payload: NotificationPayload & { forceChannels?: string[] }) {
        const { tenantId, userId, type, title, content, metadata, forceChannels } = payload;

        // 1. 确定通知渠道
        // 如果指定了 forceChannels，则使用；否则查询用户偏好
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
            // 默认：如果没有偏好设置，则启用站内通知 (IN_APP)
            activeChannels = pref?.channels || ['IN_APP'];
        }

        console.log(`[NotificationService] Dispatching [${type}] to User(${userId}) via [${activeChannels.join(', ')}]`);

        // 2. 分发到各渠道 - 使用 Set 优化多次查找 O(1)
        const channelSet = new Set(activeChannels);
        const promises: Promise<unknown>[] = [];

        // 站内通知 (IN_APP)
        if (channelSet.has('IN_APP')) {
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

        // 外部渠道适配器
        if (channelSet.has('SMS')) promises.push(smsAdapter.send(payload));
        if (channelSet.has('FEISHU') || channelSet.has('LARK')) promises.push(larkAdapter.send(payload));

        // [Notify-03] 微信服务号模板消息
        if (channelSet.has('WECHAT')) {
            promises.push(wechatAdapter.send({ ...payload, metadata: { ...metadata, wechatChannel: 'OFFICIAL' } }));
        }

        // 微信小程序订阅消息
        if (channelSet.has('WECHAT_MINI')) {
            promises.push(wechatAdapter.send({ ...payload, metadata: { ...metadata, wechatChannel: 'MINI' } }));
        }

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
