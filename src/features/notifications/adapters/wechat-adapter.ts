import { ChannelAdapter, NotificationPayload } from '../types';

/**
 * 微信小程序订阅消息适配�?
 * 交付标准: 
 * 1. 结构化数�?(thing1, time2, etc.)
 * 2. Access Token 管理 (Stub)
 * 3. 错误处理
 */
export class WeChatAdapter implements ChannelAdapter {
    async send(payload: NotificationPayload): Promise<boolean> {
        console.log(`[WeChat Adapter] Preparing to send to User(${payload.userId})...`);

        // 1. 获取 OpenID (实际应从 user_connections �?users 表获�?
        // const openId = await getWeChatOpenId(payload.userId); 
        const openId = 'mock_openid_12345';

        // 2. 构造小程序订阅消息参数
        // 推荐�? generic-wechat-api �?axios 直接调用 https://api.weixin.qq.com/cgi-bin/message/subscribe/send
        const templateMessage = {
            touser: openId,
            template_id: payload.metadata?.wechatTemplateId || 'DEFAULT_TEMPLATE_ID',
            page: payload.metadata?.link || 'pages/index/index',
            data: {
                // 这里的映射逻辑通常需要根据具体的 Template ID 来配�?
                // 示例: 订单发货通知
                thing1: { value: payload.title.substring(0, 20) }, // 限制20�?
                thing2: { value: payload.content.substring(0, 20) },
                time3: { value: new Date().toISOString().split('T')[0] }
            },
            miniprogram_state: 'formal' // developer, trial, formal
        };

        console.log('[WeChat Adapter] Payload ready for SDK:', JSON.stringify(templateMessage, null, 2));

        // 3. 调用 SDK (Stub)
        // await wechatClient.subscribeMessage.send(templateMessage);

        return true;
    }
}
