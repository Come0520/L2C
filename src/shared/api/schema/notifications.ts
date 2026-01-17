import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';

export const notifications = pgTable('notifications', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    userId: uuid('user_id').references(() => users.id).notNull(),

    title: varchar('title', { length: 200 }).notNull(),
    content: text('content'),
    type: varchar('type', { length: 50 }).default('SYSTEM'), // SYSTEM, APPROVAL, TASK, etc.
    channel: varchar('channel', { length: 20 }).default('IN_APP'), // IN_APP, EMAIL, WECHAT

    isRead: boolean('is_read').default(false),
    readAt: timestamp('read_at', { withTimezone: true }),

    linkUrl: text('link_url'),
    metadata: jsonb('metadata'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    notifUserIdx: index('idx_notifications_user').on(table.userId),
    notifTenantIdx: index('idx_notifications_tenant').on(table.tenantId),
    notifCreatedIdx: index('idx_notifications_created').on(table.createdAt),
}));

export const notificationPreferences = pgTable('notification_preferences', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    userId: uuid('user_id').references(() => users.id).notNull(),

    notificationType: varchar('notification_type', { length: 50 }).notNull(), // SYSTEM, ORDER_STATUS, etc.
    channels: jsonb('channels').$type<string[]>().default([]), // ['IN_APP', 'EMAIL']

    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    prefUserIdx: index('idx_notif_prefs_user').on(table.userId),
}));
