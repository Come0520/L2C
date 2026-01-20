import { ChannelAdapter, NotificationPayload } from '../types';
import { db } from '@/shared/api/db';
import { users } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';

/**
 * 微信通知适配器
 * 
 * 支持两种模式：
 * 1. 微信小程序订阅消息 (subscribeMessage)
 * 2. 微信服务号模板消息 (templateMessage) - [Notify-03] 新增
 * 
 * 核心功能：
 * - Access Token 管理与缓存
 * - 用户 OpenID 绑定查询
 * - 模板消息发送
 * - 错误处理与重试
 */

// Access Token 缓存
interface TokenCache {
    accessToken: string;
    expiresAt: number;
}

// 全局 Token 缓存（生产环境建议使用 Redis）
let officialAccountTokenCache: TokenCache | null = null;
let miniProgramTokenCache: TokenCache | null = null;

/**
 * 微信服务号模板消息数据结构
 */
interface WeChatTemplateData {
    [key: string]: {
        value: string;
        color?: string; // 可选的字体颜色
    };
}

/**
 * 微信 API 响应结构
 */
interface WeChatApiResponse {
    errcode: number;
    errmsg: string;
    msgid?: number;
}

export class WeChatAdapter implements ChannelAdapter {
    // 默认模板 ID（可通过 metadata 覆盖）
    private readonly DEFAULT_MINI_TEMPLATE_ID = process.env.WECHAT_MINI_TEMPLATE_ID || 'DEFAULT_MINI_TEMPLATE';
    private readonly DEFAULT_OFFICIAL_TEMPLATE_ID = process.env.WECHAT_OFFICIAL_TEMPLATE_ID || 'DEFAULT_OFFICIAL_TEMPLATE';

    // 微信 API 基础 URL
    private readonly WECHAT_API_BASE = 'https://api.weixin.qq.com';

    /**
     * 发送通知（统一入口）
     * 根据 metadata.channel 决定使用小程序还是服务号
     */
    async send(payload: NotificationPayload): Promise<boolean> {
        const { userId, metadata } = payload;
        const channel = (metadata?.wechatChannel as string) || 'OFFICIAL'; // 默认使用服务号

        console.log(`[WeChat Adapter] Sending via ${channel} to User(${userId})`);

        // 获取用户 OpenID
        const openId = await this.getRecipientOpenId(userId);
        if (!openId) {
            console.warn(`[WeChat Adapter] User(${userId}) has no wechatOpenId bound, skipping.`);
            return false;
        }

        if (channel === 'MINI') {
            return this.sendMiniProgramMessage(openId, payload);
        } else {
            return this.sendOfficialAccountMessage(openId, payload);
        }
    }

    /**
     * 发送微信服务号模板消息
     * [Notify-03] 核心实现
     * 
     * API 文档：https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Template_Message_Interface.html
     */
    async sendOfficialAccountMessage(openId: string, payload: NotificationPayload): Promise<boolean> {
        const { title, content, metadata } = payload;

        // 检查环境配置
        const appId = process.env.WECHAT_OFFICIAL_APPID;
        const appSecret = process.env.WECHAT_OFFICIAL_SECRET;

        if (!appId || !appSecret) {
            console.log('[WeChat Official] WECHAT_OFFICIAL_APPID/SECRET not configured, using mock mode.');
            return this.mockSendOfficialMessage(openId, payload);
        }

        try {
            // 1. 获取 Access Token
            const accessToken = await this.getOfficialAccountAccessToken(appId, appSecret);

            // 2. 构造模板消息
            const templateId = (metadata?.templateId as string) || this.DEFAULT_OFFICIAL_TEMPLATE_ID;
            const url = metadata?.link ? `${process.env.NEXTAUTH_URL}${metadata.link}` : undefined;

            // 构造模板数据：根据通用模板格式
            // 标准审批通知模板通常包含：first, keyword1, keyword2, keyword3, remark
            const templateData: WeChatTemplateData = {
                first: { value: title, color: '#173177' },
                keyword1: { value: content.substring(0, 100) },
                keyword2: { value: new Date().toLocaleString('zh-CN') },
                keyword3: { value: (metadata?.businessType as string) || '系统通知' },
                remark: { value: metadata?.remark as string || '点击查看详情' }
            };

            // 允许通过 metadata.templateData 自定义模板数据
            if (metadata?.templateData && typeof metadata.templateData === 'object') {
                Object.assign(templateData, metadata.templateData);
            }

            const requestBody = {
                touser: openId,
                template_id: templateId,
                url: url,
                data: templateData,
                // 如果有小程序关联，可以添加 miniprogram 字段
                ...(metadata?.miniprogram ? { miniprogram: metadata.miniprogram } : {})
            };

            // 3. 调用微信 API
            const apiUrl = `${this.WECHAT_API_BASE}/cgi-bin/message/template/send?access_token=${accessToken}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const result: WeChatApiResponse = await response.json();

            if (result.errcode === 0) {
                console.log(`[WeChat Official] Message sent successfully. msgid=${result.msgid}`);
                return true;
            } else {
                console.error(`[WeChat Official] Send failed: ${result.errcode} - ${result.errmsg}`);
                // 如果是 Token 过期，清除缓存
                if (result.errcode === 40001 || result.errcode === 42001) {
                    officialAccountTokenCache = null;
                }
                return false;
            }
        } catch (error) {
            console.error('[WeChat Official] Send error:', error);
            return false;
        }
    }

    /**
     * 发送微信小程序订阅消息
     * API 文档：https://developers.weixin.qq.com/miniprogram/dev/OpenApiDoc/mp-message-management/subscribe-message/sendMessage.html
     */
    async sendMiniProgramMessage(openId: string, payload: NotificationPayload): Promise<boolean> {
        const { title, content, metadata } = payload;

        // 检查环境配置
        const appId = process.env.WECHAT_MINI_APPID;
        const appSecret = process.env.WECHAT_MINI_SECRET;

        if (!appId || !appSecret) {
            console.log('[WeChat Mini] WECHAT_MINI_APPID/SECRET not configured, using mock mode.');
            return this.mockSendMiniMessage(openId, payload);
        }

        try {
            // 1. 获取 Access Token
            const accessToken = await this.getMiniProgramAccessToken(appId, appSecret);

            // 2. 构造订阅消息
            const templateId = (metadata?.templateId as string) || this.DEFAULT_MINI_TEMPLATE_ID;

            const requestBody = {
                touser: openId,
                template_id: templateId,
                page: (metadata?.link as string) || 'pages/index/index',
                miniprogram_state: process.env.NODE_ENV === 'production' ? 'formal' : 'developer',
                lang: 'zh_CN',
                data: {
                    thing1: { value: title.substring(0, 20) },
                    thing2: { value: content.substring(0, 20) },
                    time3: { value: new Date().toISOString().split('T')[0] },
                    character_string4: { value: (metadata?.approvalId as string)?.substring(0, 20) || 'N/A' }
                }
            };

            // 3. 调用微信 API
            const apiUrl = `${this.WECHAT_API_BASE}/cgi-bin/message/subscribe/send?access_token=${accessToken}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const result: WeChatApiResponse = await response.json();

            if (result.errcode === 0) {
                console.log(`[WeChat Mini] Subscription message sent successfully.`);
                return true;
            } else {
                console.error(`[WeChat Mini] Send failed: ${result.errcode} - ${result.errmsg}`);
                if (result.errcode === 40001 || result.errcode === 42001) {
                    miniProgramTokenCache = null;
                }
                return false;
            }
        } catch (error) {
            console.error('[WeChat Mini] Send error:', error);
            return false;
        }
    }

    /**
     * 获取微信服务号 Access Token
     * 带缓存机制，避免频繁请求
     */
    private async getOfficialAccountAccessToken(appId: string, appSecret: string): Promise<string> {
        // 检查缓存
        if (officialAccountTokenCache && officialAccountTokenCache.expiresAt > Date.now()) {
            return officialAccountTokenCache.accessToken;
        }

        // 请求新 Token
        const url = `${this.WECHAT_API_BASE}/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.access_token) {
            officialAccountTokenCache = {
                accessToken: data.access_token,
                expiresAt: Date.now() + (data.expires_in - 300) * 1000 // 提前 5 分钟过期
            };
            return data.access_token;
        }

        throw new Error(`Failed to get access token: ${data.errcode} - ${data.errmsg}`);
    }

    /**
     * 获取微信小程序 Access Token
     */
    private async getMiniProgramAccessToken(appId: string, appSecret: string): Promise<string> {
        if (miniProgramTokenCache && miniProgramTokenCache.expiresAt > Date.now()) {
            return miniProgramTokenCache.accessToken;
        }

        const url = `${this.WECHAT_API_BASE}/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${appSecret}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.access_token) {
            miniProgramTokenCache = {
                accessToken: data.access_token,
                expiresAt: Date.now() + (data.expires_in - 300) * 1000
            };
            return data.access_token;
        }

        throw new Error(`Failed to get mini program access token: ${data.errcode} - ${data.errmsg}`);
    }

    /**
     * 从数据库获取用户的微信 OpenID
     */
    private async getRecipientOpenId(userId: string): Promise<string | null> {
        try {
            const user = await db.query.users.findFirst({
                where: eq(users.id, userId),
                columns: { wechatOpenId: true }
            });
            return user?.wechatOpenId || null;
        } catch (error) {
            console.error('[WeChat Adapter] Failed to query user OpenID:', error);
            return null;
        }
    }

    /**
     * Mock 发送服务号消息（用于开发/测试环境）
     */
    private mockSendOfficialMessage(openId: string, payload: NotificationPayload): boolean {
        const { title, content, metadata } = payload;
        console.log('[WeChat Official Mock] Template message:', JSON.stringify({
            touser: openId,
            template_id: this.DEFAULT_OFFICIAL_TEMPLATE_ID,
            data: {
                first: { value: title },
                keyword1: { value: content.substring(0, 100) },
                keyword2: { value: new Date().toLocaleString('zh-CN') },
                keyword3: { value: (metadata?.businessType as string) || '系统通知' },
                remark: { value: '点击查看详情' }
            }
        }, null, 2));
        return true;
    }

    /**
     * Mock 发送小程序消息（用于开发/测试环境）
     */
    private mockSendMiniMessage(openId: string, payload: NotificationPayload): boolean {
        const { title, content, metadata } = payload;
        console.log('[WeChat Mini Mock] Subscription message:', JSON.stringify({
            touser: openId,
            template_id: this.DEFAULT_MINI_TEMPLATE_ID,
            page: metadata?.link || 'pages/index/index',
            data: {
                thing1: { value: title.substring(0, 20) },
                thing2: { value: content.substring(0, 20) },
                time3: { value: new Date().toISOString().split('T')[0] }
            }
        }, null, 2));
        return true;
    }
}

export const wechatAdapter = new WeChatAdapter();
