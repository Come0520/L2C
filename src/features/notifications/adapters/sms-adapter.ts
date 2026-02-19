import { ChannelAdapter, NotificationPayload } from '../types';

export class SmsAdapter implements ChannelAdapter {
    async send(_payload: NotificationPayload): Promise<boolean> {
        // [Development] SMS mock - TODO: Integrate Aliyun SMS SDK
        return true;
    }
}
