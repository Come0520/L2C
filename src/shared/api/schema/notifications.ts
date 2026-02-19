import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, index, integer, unique } from 'drizzle-orm/pg-core';
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
    // P1 优化: 常用查询复合索引
    notifCompositeIdx: index('idx_notifications_tenant_user_read').on(table.tenantId, table.userId, table.isRead),
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
    // P1 修复: 唯一约束防止重复配置，增加 tenantId 以确保多租户隔离鲁棒性
    prefUnique: unique('unq_notif_prefs_user_type').on(table.tenantId, table.userId, table.notificationType),
}));

// ==================== 通知模板配置表 ====================
export const notificationTemplates = pgTable('notification_templates', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id), // null = 系统模板

    code: varchar('code', { length: 50 }).notNull(), // 模板代码，如 ORDER_CREATED
    name: varchar('name', { length: 100 }).notNull(), // 模板名称
    description: text('description'),

    // 模板类型
    notificationType: varchar('notification_type', { length: 50 }).notNull(), // SYSTEM, ORDER, TASK, FINANCE...
    channels: jsonb('channels').$type<string[]>().default(['IN_APP']), // 支持的渠道

    // 模板内容
    titleTemplate: varchar('title_template', { length: 200 }).notNull(), // 标题模板，支持 {{变量}}
    contentTemplate: text('content_template').notNull(), // 内容模板
    smsTemplate: varchar('sms_template', { length: 500 }), // 短信模板
    wechatTemplateId: varchar('wechat_template_id', { length: 100 }), // 微信模板ID

    // 变量映射
    paramMapping: jsonb('param_mapping').$type<{
        key: string;
        label: string;
        source: string;
        defaultValue?: string;
    }[]>(),

    // 配置
    isActive: boolean('is_active').default(true),
    priority: varchar('priority', { length: 20 }).default('NORMAL'), // LOW, NORMAL, HIGH, URGENT

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    templateCodeIdx: index('idx_notif_template_code').on(table.code),
    templateTenantIdx: index('idx_notif_template_tenant').on(table.tenantId),
}));

// ==================== 通知异步队列表 ====================
export const notificationQueue = pgTable('notification_queue', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

    // 关联模板
    templateId: uuid('template_id').references(() => notificationTemplates.id),
    templateCode: varchar('template_code', { length: 50 }),

    // 接收者
    userId: uuid('user_id').references(() => users.id),
    targetPhone: varchar('target_phone', { length: 20 }),
    targetEmail: varchar('target_email', { length: 100 }),

    // 渠道
    channel: varchar('channel', { length: 20 }).notNull(), // IN_APP, SMS, EMAIL, WECHAT

    // 内容（渲染后）
    title: varchar('title', { length: 200 }).notNull(),
    content: text('content').notNull(),

    // 队列状态
    status: varchar('status', { length: 20 }).default('PENDING'), // PENDING, PROCESSING, SENT, FAILED
    priority: varchar('priority', { length: 20 }).default('NORMAL'),

    // 重试
    retryCount: integer('retry_count').default(0),
    maxRetries: integer('max_retries').default(3),
    lastError: text('last_error'),

    // 时间
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }), // 延迟发送
    processedAt: timestamp('processed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    queueStatusIdx: index('idx_notif_queue_status').on(table.status),
    queueScheduledIdx: index('idx_notif_queue_scheduled').on(table.scheduledAt),
    queueUserIdx: index('idx_notif_queue_user').on(table.userId),
}));

// ==================== 系统公告表 ====================
export const systemAnnouncements = pgTable('system_announcements', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id), // null = 全平台公告

    title: varchar('title', { length: 200 }).notNull(),
    content: text('content').notNull(),
    type: varchar('type', { length: 50 }).default('INFO'), // INFO, WARNING, URGENT, MAINTENANCE

    // 显示范围
    targetRoles: jsonb('target_roles').$type<string[]>(), // null = 所有角色

    // 时间范围
    startAt: timestamp('start_at', { withTimezone: true }).notNull(),
    endAt: timestamp('end_at', { withTimezone: true }),

    // 是否置顶
    isPinned: boolean('is_pinned').default(false),

    // 创建信息
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    announceTenantIdx: index('idx_announce_tenant').on(table.tenantId),
    announceTimeIdx: index('idx_announce_time').on(table.startAt, table.endAt),
}));

