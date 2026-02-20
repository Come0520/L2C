import { pgTable, uuid, varchar, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';

/**
 * 系统设置表
 * 存储租户级别的所有可配置项，如线索分配、审批流超时配置等
 */
export const systemSettings = pgTable('system_settings', {
    // 记录唯一主键 ID
    id: uuid('id').primaryKey().defaultRandom(),
    // 关联的租户 ID，用于数据隔离隔离
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    // 业务分类标识，可能的枚举值：LEAD/CHANNEL/PAYMENT/MEASURE/ORDER/APPROVAL/NOTIFICATION/REPORT/SHOWROOM
    category: varchar('category', { length: 50 }).notNull(),
    // 具体配置项的键名（英文名）
    key: varchar('key', { length: 100 }).notNull(),
    // 设置项的字面值，实际使用时需要结合 valueType 进行反序列化处理
    value: text('value').notNull(),
    // 标识 value 存储的内容类型，可能的枚举值：BOOLEAN/INTEGER/DECIMAL/ENUM/JSON
    valueType: varchar('value_type', { length: 20 }).notNull(),
    // 操作界面的补充文字说明，给管理员看的中文字段名/备注
    description: text('description'),
    // 最新更新时间
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    // 修改人的用户 ID
    updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
    // 唯一约束：同一租户下配置键必须唯一
    tenantKeyUnique: uniqueIndex('idx_system_settings_tenant_key').on(table.tenantId, table.key),
    // 分类索引：便于按分类（如获取全部 LEAD 设置）快速查询配置
    categoryIdx: index('idx_system_settings_category').on(table.tenantId, table.category),
}));

/**
 * 系统设置历史表
 * 用于关键配置的追溯、审计与历史配置回滚
 */
export const systemSettingsHistory = pgTable('system_settings_history', {
    // 记录唯一主键 ID
    id: uuid('id').primaryKey().defaultRandom(),
    // 更新发生时的租户 ID
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    // 所修改的设置项外键关联 ID
    settingId: uuid('setting_id').references(() => systemSettings.id).notNull(),
    // 被修改前的配置项键名
    key: varchar('key', { length: 100 }).notNull(),
    // 变更前的旧字面值，可为空（若是首次设置）
    oldValue: text('old_value'),
    // 变更后的新字面值
    newValue: text('new_value').notNull(),
    // 执行变更操作的用户 ID，用于审计
    changedBy: uuid('changed_by').references(() => users.id).notNull(),
    // 变更发生的具体时间点
    changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    // 设置项外键索引，用于查询某一配置项的完整修改历史
    settingIdx: index('idx_system_settings_history_setting').on(table.settingId),
}));

/**
 * 默认配置项定于
 * 用于初始化租户刚建立时所需的基础配置
 */
export const DEFAULT_SYSTEM_SETTINGS = [
    // === 线索设置 (LEAD) ===
    { category: 'LEAD', key: 'ENABLE_LEAD_AUTO_RECYCLE', value: 'true', valueType: 'BOOLEAN', description: '启用线索自动回收' },
    { category: 'LEAD', key: 'LEAD_AUTO_RECYCLE_TIMEOUT', value: '24', valueType: 'INTEGER', description: '超时未联系时间（小时）' },
    { category: 'LEAD', key: 'LEAD_AUTO_RECYCLE_DAYS', value: '30', valueType: 'INTEGER', description: '超时未成交天数' },
    { category: 'LEAD', key: 'LEAD_DAILY_CLAIM_LIMIT', value: '10', valueType: 'INTEGER', description: '每日认领上限' },
    { category: 'LEAD', key: 'LEAD_AUTO_ASSIGN_RULE', value: 'ROUND_ROBIN', valueType: 'ENUM', description: '自动分配策略' },
    { category: 'LEAD', key: 'LEAD_DUPLICATE_STRATEGY', value: 'AUTO_LINK', valueType: 'ENUM', description: '重复线索处理策略' },
    { category: 'LEAD', key: 'ENABLE_SECOND_KEY_DUPLICATE_CHECK', value: 'true', valueType: 'BOOLEAN', description: '启用地址查重' },
    { category: 'LEAD', key: 'LEAD_FOLLOW_UP_INTERVALS', value: '{"WATER_ELECTRIC":30,"MUD_WOOD":20,"PAINTING":10,"INSTALLATION":7}', valueType: 'JSON', description: '跟进间隔配置' },

    // === 渠道设置 (CHANNEL) ===
    { category: 'CHANNEL', key: 'CHANNEL_PROTECTION_PERIOD', value: '30', valueType: 'INTEGER', description: '渠道保护期（天）' },
    { category: 'CHANNEL', key: 'CHANNEL_LEVEL_RULES', value: '[{"level":"S","name":"战略伙伴","minAmount":500000},{"level":"A","name":"核心伙伴","minAmount":200000},{"level":"B","name":"普通伙伴","minAmount":50000},{"level":"C","name":"考察期","minAmount":0}]', valueType: 'JSON', description: '渠道等级评定规则（仅参考）' },

    // === 收款设置 (PAYMENT) ===
    { category: 'PAYMENT', key: 'ENABLE_PAYMENT_APPROVAL', value: 'true', valueType: 'BOOLEAN', description: '启用收款审批' },
    { category: 'PAYMENT', key: 'PAYMENT_APPROVER_ROLE', value: 'STORE_MANAGER', valueType: 'ENUM', description: '收款审批人角色' },
    { category: 'PAYMENT', key: 'EARNEST_MONEY_MAX_RATIO', value: '0.5', valueType: 'DECIMAL', description: '定金最大比例' },
    { category: 'PAYMENT', key: 'ENABLE_FREE_MEASURE_APPROVAL', value: 'true', valueType: 'BOOLEAN', description: '启用免费测量审批' },
    { category: 'PAYMENT', key: 'FREE_MEASURE_APPROVAL_TIMEOUT', value: '24', valueType: 'INTEGER', description: '免费测量审批超时（小时）' },

    // === 测量设置 (MEASURE) ===
    { category: 'MEASURE', key: 'ENABLE_MEASURE_FEE_CHECK', value: 'true', valueType: 'BOOLEAN', description: '启用测量费用检查' },
    { category: 'MEASURE', key: 'MEASURE_LATE_THRESHOLD', value: '30', valueType: 'INTEGER', description: '迟到判定阈值（分钟）' },

    // === 订单设置 (ORDER) ===
    { category: 'ORDER', key: 'ENABLE_ORDER_CANCEL_APPROVAL', value: 'true', valueType: 'BOOLEAN', description: '启用撤单审批' },
    { category: 'ORDER', key: 'ORDER_CANCEL_APPROVER_ROLE', value: 'STORE_MANAGER', valueType: 'ENUM', description: '撤单审批人角色' },

    // === 审批流设置 (APPROVAL) ===
    { category: 'APPROVAL', key: 'APPROVAL_TIMEOUT_REMINDER', value: '2', valueType: 'INTEGER', description: '审批超时提醒（小时）' },
    { category: 'APPROVAL', key: 'APPROVAL_TIMEOUT_DAYS', value: '3', valueType: 'INTEGER', description: '审批任务超时天数' },
    { category: 'APPROVAL', key: 'ENABLE_APPROVAL_AUTO_ESCALATE', value: 'true', valueType: 'BOOLEAN', description: '启用审批超时自动升级' },
    { category: 'APPROVAL', key: 'APPROVAL_AUTO_ESCALATE_TIMEOUT', value: '24', valueType: 'INTEGER', description: '自动升级超时（小时）' },
    { category: 'APPROVAL', key: 'QUOTE_DISCOUNT_THRESHOLD', value: '0.8', valueType: 'DECIMAL', description: '报价折扣风险阈值' },
    { category: 'APPROVAL', key: 'QUOTE_LOW_MARGIN_THRESHOLD', value: '0.15', valueType: 'DECIMAL', description: '报价低毛利率阈值' },

    // === 通知设置 (NOTIFICATION) ===
    { category: 'NOTIFICATION', key: 'ENABLE_SYSTEM_NOTIFICATION', value: 'true', valueType: 'BOOLEAN', description: '启用系统内通知' },
    { category: 'NOTIFICATION', key: 'ENABLE_SMS_NOTIFICATION', value: 'false', valueType: 'BOOLEAN', description: '启用短信通知' },
    { category: 'NOTIFICATION', key: 'ENABLE_WECHAT_NOTIFICATION', value: 'true', valueType: 'BOOLEAN', description: '启用微信通知' },
    { category: 'NOTIFICATION', key: 'NOTIFICATION_CHANNELS', value: '["IN_APP"]', valueType: 'JSON', description: '默认通知渠道列表' },
    { category: 'NOTIFICATION', key: 'NOTIFICATION_RETRY_COUNT', value: '3', valueType: 'INTEGER', description: '通知发送重试次数' },

    // === 数据报表设置 (REPORT) ===
    { category: 'REPORT', key: 'DASHBOARD_UPDATE_FREQUENCY', value: 'DAILY', valueType: 'ENUM', description: '仪表盘更新频率' },
    { category: 'REPORT', key: 'ENABLE_MANUAL_REFRESH', value: 'true', valueType: 'BOOLEAN', description: '支持手动刷新' },
    // === 云展厅设置 (SHOWROOM) ===
    { category: 'SHOWROOM', key: 'ENABLE_SHOWROOM_WRITE_FOR_ALL', value: 'true', valueType: 'BOOLEAN', description: '允许所有员工修改展厅素材（关闭后仅管理员可修改）' },
] as const;

// 导出配置类型
export type SystemSettingCategory = 'LEAD' | 'CHANNEL' | 'PAYMENT' | 'MEASURE' | 'ORDER' | 'APPROVAL' | 'NOTIFICATION' | 'REPORT' | 'SHOWROOM';
export type SystemSettingValueType = 'BOOLEAN' | 'INTEGER' | 'DECIMAL' | 'ENUM' | 'JSON';
