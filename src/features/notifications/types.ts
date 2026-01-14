import { notificationChannelEnum, notifications } from '@/shared/api/schema';
import { InferSelectModel } from 'drizzle-orm';


export type NotificationChannel = (typeof notificationChannelEnum.enumValues)[number];

export type Notification = InferSelectModel<typeof notifications>;

export interface NotificationPayload {
    tenantId: string;
    userId: string;
    title: string;
    content: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'SYSTEM' | 'ORDER_STATUS' | 'APPROVAL' | 'MENTION' | 'ALERT';
    link?: string;
    metadata?: Record<string, unknown>;
}

export interface ChannelAdapter {
    send(payload: NotificationPayload): Promise<boolean>;
}
