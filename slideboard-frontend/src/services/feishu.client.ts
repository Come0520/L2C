import { env } from '@/config/env';
import { logger } from '@/utils/logger';

/**
 * 飞书消息发送服务
 * 用于发送飞书通知消息
 */
export const feishuService = {
    /**
     * 发送飞书文本消息
     * @param webhookUrl 飞书机器人Webhook URL
     * @param text 消息内容
     */
    async sendTextMessage(webhookUrl: string, text: string) {
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    msg_type: 'text',
                    content: {
                        text,
                    },
                }),
            });

            const result = await response.json();

            if (result.code !== 0) {
                throw new Error(result.msg || '飞书消息发送失败');
            }

            return result;
        } catch (error) {
            logger.error('发送飞书文本消息失败', { error });
            throw error;
        }
    },

    /**
     * 发送飞书交互式卡片消息
     * @param webhookUrl 飞书机器人Webhook URL
     * @param card 卡片内容
     */
    async sendCardMessage(webhookUrl: string, card: any) {
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    msg_type: 'interactive',
                    card,
                }),
            });

            const result = await response.json();

            if (result.code !== 0) {
                throw new Error(result.msg || '飞书卡片消息发送失败');
            }

            return result;
        } catch (error) {
            logger.error('发送飞书卡片消息失败', { error });
            throw error;
        }
    },

    /**
     * 发送催单通知
     * @param webhookUrl 飞书机器人Webhook URL
     * @param orderId 订单ID
     * @param customerName 客户名称
     * @param address 项目地址
     * @param waitingTime 等待时间
     */
    async sendUrgeOrderNotification(
        webhookUrl: string,
        orderId: string,
        customerName: string,
        address: string,
        waitingTime: string
    ) {
        try {
            const card = {
                elements: [
                    {
                        tag: 'div',
                        text: {
                            content: `**催单提醒**`,
                            tag: 'lark_md',
                        },
                    },
                    {
                        tag: 'div',
                        text: {
                            content: `订单 ${orderId} 需要尽快处理，客户 ${customerName} 的测量任务等待中`,
                            tag: 'lark_md',
                        },
                    },
                    {
                        tag: 'div',
                        fields: [
                            {
                                is_short: true,
                                text: {
                                    content: `**订单ID**\n${orderId}`,
                                    tag: 'lark_md',
                                },
                            },
                            {
                                is_short: true,
                                text: {
                                    content: `**客户名称**\n${customerName}`,
                                    tag: 'lark_md',
                                },
                            },
                            {
                                is_short: true,
                                text: {
                                    content: `**项目地址**\n${address}`,
                                    tag: 'lark_md',
                                },
                            },
                            {
                                is_short: true,
                                text: {
                                    content: `**等待时间**\n${waitingTime}`,
                                    tag: 'lark_md',
                                },
                            },
                        ],
                    },
                    {
                        tag: 'hr',
                    },
                    {
                        tag: 'note',
                        elements: [
                            {
                                tag: 'plain_text',
                                content: `生成时间: ${new Date().toLocaleString('zh-CN')}`,
                            },
                        ],
                    },
                ],
                header: {
                    template: 'red',
                    title: {
                        content: '催单提醒',
                        tag: 'plain_text',
                    },
                },
            };

            return await this.sendCardMessage(webhookUrl, card);
        } catch (error) {
            logger.error('发送催单通知失败', { error });
            throw error;
        }
    },

    /**
     * 发送批量催单通知
     * @param webhookUrl 飞书机器人Webhook URL
     * @param orderIds 订单ID列表
     * @param customerNames 客户名称列表
     */
    async sendBatchUrgeNotification(
        webhookUrl: string,
        orderIds: string[],
        customerNames: string[]
    ) {
        try {
            const card = {
                elements: [
                    {
                        tag: 'div',
                        text: {
                            content: `**批量催单提醒**`,
                            tag: 'lark_md',
                        },
                    },
                    {
                        tag: 'div',
                        text: {
                            content: `您有 ${orderIds.length} 个订单需要尽快处理`,
                            tag: 'lark_md',
                        },
                    },
                    {
                        tag: 'div',
                        text: {
                            content: orderIds.map((id, index) => {
                                return `• 订单 ${id} - 客户 ${customerNames[index]}`;
                            }).join('\n'),
                            tag: 'lark_md',
                        },
                    },
                    {
                        tag: 'hr',
                    },
                    {
                        tag: 'note',
                        elements: [
                            {
                                tag: 'plain_text',
                                content: `生成时间: ${new Date().toLocaleString('zh-CN')}`,
                            },
                        ],
                    },
                ],
                header: {
                    template: 'orange',
                    title: {
                        content: '批量催单提醒',
                        tag: 'plain_text',
                    },
                },
            };

            return await this.sendCardMessage(webhookUrl, card);
        } catch (error) {
            logger.error('发送批量催单通知失败', { error });
            throw error;
        }
    },
};
