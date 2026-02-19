import { ChannelAdapter, NotificationPayload } from '../types';

export class LarkAdapter implements ChannelAdapter {
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
        } catch (_error) {
            return false;
        }
    }
}
