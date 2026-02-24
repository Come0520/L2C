import { ChannelAdapter, NotificationPayload } from '../types';
import { logger } from '@/shared/lib/logger';

/**
 * 飞书渠道适配器
 * 
 * 主要用于企业内部的业务预警集成，通过 Webhook 机器人将消息推送到指定的飞书群组中。
 */
export class LarkAdapter implements ChannelAdapter {
    /**
     * 发送飞书 Webhook 通知
     * 
     * 将 L2C 的标准 NotificationPayload 转换为飞书卡片/富文本格式并投递。
     * 
     * @param payload - 统一格式的通知有效载荷，应包含标题、正文及可选跳转链接
     * @returns boolean - 通讯成功并获得 200 OK 响应时返回 true，验证失败或网络异常等返回 false
     */
    async send(payload: NotificationPayload): Promise<boolean> {
        // [Development] Lark notification

        const webhookUrl = process.env.FEISHU_WEBHOOK_URL;
        if (!webhookUrl) {
            return false;
        }

        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    msg_type: 'post',
                    content: {
                        post: {
                            zh_cn: {
                                title: `[L2C] ${payload.title}`,
                                content: [
                                    [{ tag: 'text', text: payload.content }],
                                    payload.metadata?.link ? [{ tag: 'a', text: '点击查看详情', href: `${process.env.NEXTAUTH_URL}${payload.metadata.link}` }] : [],
                                ],
                            },
                        },
                    },
                }),
            });

            if (!response.ok) throw new Error(`Feishu API error: ${response.statusText}`);
            return true;
        } catch (error) {
            // [D7 可运维性] - 标准化错误日志输出，捕获失败场景
            logger.error('[LarkAdapter] Failed to send Feishu webhook', {
                error: error instanceof Error ? error.message : 'Unknown network error',
                tenantId: payload.tenantId,
                userId: payload.userId,
                title: payload.title
            });
            return false;
        }
    }
}
