import { notificationChannelEnum, notifications } from '@/shared/api/schema';
import { InferSelectModel } from 'drizzle-orm';

/**
 * 通知渠道枚举类型
 * IN_APP: 站内信
 * SMS: 短信
 * EMAIL: 电子邮件
 * LARK: 飞书 Webhook
 * WECHAT: 微信服务号/小程序
 */
export type NotificationChannel = (typeof notificationChannelEnum.enumValues)[number];

export type Notification = InferSelectModel<typeof notifications>;

/**
 * 统一的通知发送有效载荷接口
 * 用于在业务模块与具体渠道 Adapter 之间传递的标准化数据结构
 */
export interface NotificationPayload {
    tenantId: string;
    userId: string;
    /** 通知标题，支持模板变量渲染后的最终文本 */
    title: string;
    /** 通知正文，支持模板变量渲染后的最终文本 */
    content: string;
    /** 业务分类类型，影响展示图标和重要程度 */
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SYSTEM' | 'ORDER_STATUS' | 'APPROVAL' | 'MENTION' | 'ALERT';
    /** 跳转链接，点击后的目标页面 */
    link?: string;
    /** 元数据对象，例如存储给特定 Channel 的扩展信息 (如 wechatOpenId、templateId) */
    metadata?: Record<string, unknown>;
}

/**
 * 通知渠道适配器接口规范
 * 所有的第三方通知发送逻辑都必须实现该接口以保证可插拔性。
 */
export interface ChannelAdapter {
    /**
     * 向目标用户触发实际推送
     * @param payload 标准通知数据
     * @returns 承诺返回一个 boolean 值：true 指成功送达第三方API网关，false 视为失败
     */
    send(payload: NotificationPayload): Promise<boolean>;
}
