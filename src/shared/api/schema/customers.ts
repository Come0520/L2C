import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    jsonb,
    index,
    integer,
    decimal,
} from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { customerLevelEnum, customerLifecycleStageEnum, customerPipelineStatusEnum } from './enums'; // Using existing enum


export const customers = pgTable('customers', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    customerNo: varchar('customer_no', { length: 50 }).unique().notNull(),
    name: varchar('name', { length: 50 }).notNull(),
    type: varchar('type', { length: 20 }).default('INDIVIDUAL'),
    phone: varchar('phone', { length: 20 }).notNull(),
    phoneSecondary: varchar('phone_secondary', { length: 20 }),
    wechat: varchar('wechat', { length: 50 }),
    wechatOpenId: varchar('wechat_openid', { length: 100 }).unique(), // 微信小程序登录绑定

    gender: varchar('gender', { length: 10 }), // MALE, FEMALE
    birthday: timestamp('birthday'),

    level: customerLevelEnum('level').default('D'),
    lifecycleStage: customerLifecycleStageEnum('lifecycle_stage').default('LEAD').notNull(),
    pipelineStatus: customerPipelineStatusEnum('pipeline_status').default('UNASSIGNED').notNull(),


    // Referral
    referrerCustomerId: uuid('referrer_customer_id'), // 自引用，通过 Relations 定义关联
    sourceLeadId: uuid('source_lead_id'), // 线索关联，外键通过 Relations 定义避免循环依赖

    // Loyalty
    loyaltyPoints: integer('loyalty_points').default(0),
    referralCode: varchar('referral_code', { length: 20 }).unique(),

    // Stats for caching
    totalOrders: integer('total_orders').default(0),
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).default('0'),
    avgOrderAmount: decimal('avg_order_amount', { precision: 12, scale: 2 }).default('0'),

    firstOrderAt: timestamp('first_order_at', { withTimezone: true }),
    lastOrderAt: timestamp('last_order_at', { withTimezone: true }),

    preferences: jsonb('preferences').default({}), // style, color, budget, etc.
    notes: text('notes'),
    tags: text('tags').array().default([]),


    isMerged: boolean('is_merged').default(false),
    mergedFrom: uuid('merged_from').array(),

    assignedSalesId: uuid('assigned_sales_id').references(() => users.id),
    createdBy: uuid('created_by').references(() => users.id).notNull(),
    updatedBy: uuid('updated_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
    custTenantIdx: index('idx_customers_tenant').on(table.tenantId),
    custPhoneIdx: index('idx_customers_phone').on(table.phone),
    custReferrerIdx: index('idx_customers_referrer').on(table.referrerCustomerId),
}));

// 手机号查看日志表 (Phone View Logs)
// 记录敏感信息的查看行为，用于安全审计
export const phoneViewLogs = pgTable('phone_view_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    customerId: uuid('customer_id').references(() => customers.id).notNull(),
    viewerId: uuid('viewer_id').references(() => users.id).notNull(),
    viewerRole: varchar('viewer_role', { length: 50 }).notNull(),
    ipAddress: varchar('ip_address', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    phoneLogTenantIdx: index('idx_phone_view_logs_tenant').on(table.tenantId),
    phoneLogCustomerIdx: index('idx_phone_view_logs_customer').on(table.customerId),
    phoneLogViewerIdx: index('idx_phone_view_logs_viewer').on(table.viewerId),
}));

// 客户合并日志表 (Customer Merge Logs)
// 记录客户档案合并操作的详细信息，用于审计和追溯
export const customerMergeLogs = pgTable('customer_merge_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    primaryCustomerId: uuid('primary_customer_id').references(() => customers.id).notNull(),
    mergedCustomerIds: uuid('merged_customer_ids').array().notNull(),
    operatorId: uuid('operator_id').references(() => users.id).notNull(),
    fieldConflicts: jsonb('field_conflicts'), // 记录冲突字段的决策过程
    affectedTables: text('affected_tables').array(), // 受影响的关联表 (orders, quotes, leads...)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    mergeLogTenantIdx: index('idx_merge_logs_tenant').on(table.tenantId),
    mergeLogPrimaryIdx: index('idx_merge_logs_primary').on(table.primaryCustomerId),
}));

