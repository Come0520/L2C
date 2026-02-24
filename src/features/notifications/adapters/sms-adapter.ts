import { ChannelAdapter, NotificationPayload } from '../types';
import { logger } from '@/shared/lib/logger';

/**
 * 短信渠道适配器
 * 
 * 负责与阿里云等短信服务提供商的 SDK 进行交互，将标准通知 Payload 转化为短信发送请求。
 */
export class SmsAdapter implements ChannelAdapter {
    /**
     * 发送短信通知
     * 
     * @param payload - 统一格式的通知有效载荷，涉及接收人 userId、模板变量内容等
     * @returns boolean - 返回 true 表示短信发送请求被服务端正常接收，false 表示发生异常
     */
    async send(payload: NotificationPayload): Promise<boolean> {
        try {
            // [Development] SMS mock — 预留阿里云短信 SDK 集成点
            // const result = await mockAliyunSmsSend(payload.userId, payload.content);
            // if (!result.success) throw new Error(result.errorMsg);

            return true;
        } catch (error) {
            // [D7 可运维性] - 标准化错误日志输出，携带 Payload 信息方便排查
            logger.error('[SmsAdapter] Failed to send SMS notification', {
                error: error instanceof Error ? error.message : 'Unknown error',
                tenantId: payload.tenantId,
                userId: payload.userId,
                type: payload.type,
            });
            return false;
        }
    }
}
