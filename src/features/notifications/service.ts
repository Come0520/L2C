/**
 * 通知服务 (NotificationService)
 * 
 * 职责说明：
 * - 本文件 (service.ts) 提供**直接发送**通知的核心逻辑，被所有业务模块直接调用
 * - notification-service.ts 提供**模板化 + 队列化**的高层封装，用于批量/异步通知场景
 * 
 * 两者协同工作：
 * - 业务方调用 `notificationService.send()` 进行即时通知
 * - 系统级批量通知使用 `sendNotificationByTemplate()` + `processNotificationQueue()`
 */
import { db } from '@/shared/api/db';
import { notifications, notificationPreferences, notificationTypeEnum } from '@/shared/api/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/shared/lib/logger';
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
                    eq(notificationPreferences.tenantId, tenantId),
                    eq(notificationPreferences.userId, userId),
                    eq(notificationPreferences.notificationType, type as typeof notificationTypeEnum.enumValues[number])
                ),
            });
            // 默认：如果没有偏好设置，则启用站内通知 (IN_APP)
            activeChannels = pref?.channels || ['IN_APP'];
        }


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
                    linkUrl: payload.link,
                    metadata: metadata,
                }).execute()
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

        const results = await Promise.allSettled(promises);

        // 检查是否有任何一个渠道发送成功
        // 注意：Adapter 返回的是 boolean，DB insert 返回的是对象（fulfilled 即认为成功）
        const anySuccess = results.some(r => {
            if (r.status === 'fulfilled') {
                return r.value !== false; // 只要不是明确返回 false，就认为是成功（适用于 DB insert 和成功返回 true 的 adapter）
            }
            return false;
        });

        if (!anySuccess && promises.length > 0) {
            logger.error('[NotificationService] All channels failed:', { results });
            return false;
        }

        return true;
    },

    async markAsRead(notificationId: string, userId: string, tenantId: string) {
        await db.update(notifications)
            .set({
                isRead: true,
                readAt: new Date()
            })
            .where(and(
                eq(notifications.id, notificationId),
                eq(notifications.userId, userId),
                eq(notifications.tenantId, tenantId)
            ));
    },

    async markAllAsRead(userId: string, tenantId: string) {
        await db.update(notifications)
            .set({
                isRead: true,
                readAt: new Date()
            })
            .where(
                and(
                    eq(notifications.userId, userId),
                    eq(notifications.tenantId, tenantId),
                    eq(notifications.isRead, false)
                )
            );
    }
};
