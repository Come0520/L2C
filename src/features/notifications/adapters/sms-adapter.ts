import { ChannelAdapter, NotificationPayload } from '../types';

export class SmsAdapter implements ChannelAdapter {
    async send(_payload: NotificationPayload): Promise<boolean> {
        // [Development] SMS mock — 预留阿里云短信 SDK 集成点
        return true;
    }
}
