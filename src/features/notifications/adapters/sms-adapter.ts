import { ChannelAdapter, NotificationPayload } from '../types';

export class SmsAdapter implements ChannelAdapter {
    async send(payload: NotificationPayload): Promise<boolean> {
        console.log(`[SMS Mock] Sending to User(${payload.userId}): ${payload.content}`);
        // TODO: Integrate Aliyun SMS SDK
        return true;
    }
}
