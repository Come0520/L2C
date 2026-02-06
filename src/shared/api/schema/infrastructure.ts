import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

// 租户状态枚举
export const tenantStatusEnum = pgEnum('tenant_status', [
    'pending_approval',  // 待审批
    'active',            // 已激活
    'rejected',          // 已拒绝
    'suspended',         // 已暂停
]);

// 企业认证状态枚举
export const verificationStatusEnum = pgEnum('verification_status', [
    'unverified',  // 未认证
    'pending',     // 待审核
    'verified',    // 已认证
    'rejected',    // 已拒绝
]);

export const tenants = pgTable('tenants', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 50 }).unique().notNull(),
    logoUrl: text('logo_url'),

    // 租户状态
    status: tenantStatusEnum('status').default('active').notNull(),

    // 申请信息
    applicantName: varchar('applicant_name', { length: 100 }),
    applicantPhone: varchar('applicant_phone', { length: 20 }),
    applicantEmail: varchar('applicant_email', { length: 255 }),
    region: varchar('region', { length: 100 }), // 地区
    businessDescription: text('business_description'),

    // 审批信息
    reviewedBy: uuid('reviewed_by'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    rejectReason: text('reject_reason'),

    // 企业认证信息
    verificationStatus: verificationStatusEnum('verification_status').default('unverified'),
    businessLicenseUrl: text('business_license_url'),       // 营业执照图片
    legalRepName: varchar('legal_rep_name', { length: 50 }), // 法定代表人
    registeredCapital: varchar('registered_capital', { length: 50 }), // 注册资本
    businessScope: text('business_scope'),                   // 经营范围
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verifiedBy: uuid('verified_by'),
    verificationRejectReason: text('verification_reject_reason'),

    // Settings JSON structure:
    // interface TenantSettings {
    //     mfa?: {
    //         enabled: boolean;
    //         roles: string[]; // e.g. ['BOSS', 'ADMIN']
    //     };
    // }
    settings: jsonb('settings').default({}),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});


export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    name: varchar('name', { length: 100 }),
    phone: varchar('phone', { length: 20 }).unique(),
    passwordHash: text('password_hash'),
    role: varchar('role', { length: 50 }).default('USER'),
    permissions: jsonb('permissions').default([]), // For granular permissions
    wechatOpenId: varchar('wechat_openid', { length: 100 }).unique(), // For WeChat Login
    preferences: jsonb('preferences').default({}),
    dashboardConfig: jsonb('dashboard_config').default({}),
    isActive: boolean('is_active').default(true),
    avatarUrl: text('avatar_url'),
    notificationSettings: jsonb('notification_settings').default({}), // 通知偏好设置
    isPlatformAdmin: boolean('is_platform_admin').default(false), // 平台超级管理员标识
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const roles = pgTable('roles', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    name: varchar('name', { length: 50 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    description: text('description'),
    permissions: jsonb('permissions').$type<string[]>().default([]),
    isSystem: boolean('is_system').default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const sysDictionaries = pgTable('sys_dictionaries', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    category: varchar('category', { length: 50 }).notNull(),
    key: varchar('key', { length: 100 }).notNull(),
    value: text('value').notNull(),
    label: varchar('label', { length: 100 }),
    description: text('description'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
