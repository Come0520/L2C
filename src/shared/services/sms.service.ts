
import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
import * as $OpenApi from '@alicloud/openapi-client';
import * as $Util from '@alicloud/tea-util';
import { env } from '@/shared/config/env';

/**
 * 阿里云短信服务封装
 */
export class SmsService {
    private static client: Dysmsapi20170525 | null = null;

    /**
     * 初始化客户端
     */
    private static createClient(): Dysmsapi20170525 {
        if (this.client) return this.client;

        if (!env.SMS_ACCESS_KEY_ID || !env.SMS_ACCESS_KEY_SECRET) {
            throw new Error('Missing SMS configuration (AccessKey)');
        }

        const config = new $OpenApi.Config({
            accessKeyId: env.SMS_ACCESS_KEY_ID,
            accessKeySecret: env.SMS_ACCESS_KEY_SECRET,
        });

        // 访问的域名
        config.endpoint = `dysmsapi.aliyuncs.com`;

        this.client = new Dysmsapi20170525(config);
        return this.client;
    }

    /**
     * 发送短信验证码
     * @param phone 接收手机号
     * @param code 验证码
     * @returns { success: boolean, message?: string }
     */
    static async sendVerificationCode(phone: string, code: string): Promise<{ success: boolean; message?: string }> {
        // 开发环境/测试环境可能未配置，模拟发送
        if (!env.SMS_ACCESS_KEY_ID || !env.SMS_ACCESS_KEY_SECRET) {
            console.log(`[MOCK SMS] To: ${phone}, Code: ${code}`);
            return { success: true, message: 'Mock sent' };
        }

        const client = this.createClient();
        const sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest({
            phoneNumbers: phone,
            signName: env.SMS_SIGN_NAME,
            templateCode: env.SMS_TEMPLATE_CODE,
            templateParam: JSON.stringify({ code }), // 假设模板变量名为 code
        });

        const runtime = new $Util.RuntimeOptions({});

        try {
            const resp = await client.sendSmsWithOptions(sendSmsRequest, runtime);

            if (resp.body?.code !== 'OK') {
                console.error('Aliyun SMS Error:', resp.body);
                return { success: false, message: resp.body?.message || 'Unknown error' };
            }

            console.log(`[SMS] Sent to ${phone}: ${code}`);
            return { success: true };
        } catch (error: unknown) {
            console.error('SMS Service Error:', error);
            // 简单的错误消息提取
            const message = error instanceof Error ? error.message : 'Send failed';
            return { success: false, message };
        }
    }
}
