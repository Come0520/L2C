import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  unique,
  integer,
  bigint,
} from 'drizzle-orm/pg-core';
import { userRoleEnum } from './enums';

/** 套餐类型枚举（租户级别）— 定义在此处以避免与 billing.ts 的循环依赖 */
export const tenantPlanTypeEnum = pgEnum('tenant_plan_type', [
  'base', // 基础版 (Base)
  'pro', // 专业版 ¥99/月
  'enterprise', // 企业版（按需报价）
]);

// 租户状态枚举
export const tenantStatusEnum = pgEnum('tenant_status', [
  'pending_approval', // 待审批
  'active', // 已激活
  'rejected', // 已拒绝
  'suspended', // 已暂停
]);

// 企业认证状态枚举
export const verificationStatusEnum = pgEnum('verification_status', [
  'unverified', // 未认证
  'pending', // 待审核
  'verified', // 已认证
  'rejected', // 已拒绝
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

  // ==================== 落地页展示信息 ====================
  /** 品牌标语，如「专业窗帘定制专家」，用于小程序租户落地页 */
  slogan: varchar('slogan', { length: 200 }),
  /** 门店详细地址（区别于 region 的省市级别） */
  detailAddress: text('detail_address'),
  /** 客服微信号，用于小程序「微信联系销售」功能 */
  contactWechat: varchar('contact_wechat', { length: 100 }),
  /** 落地页封面图/背景图 URL */
  landingCoverUrl: text('landing_cover_url'),

  // 审批信息
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  rejectReason: text('reject_reason'),

  // 企业认证信息
  verificationStatus: verificationStatusEnum('verification_status').default('unverified'),
  businessLicenseUrl: text('business_license_url'), // 营业执照图片
  legalRepName: varchar('legal_rep_name', { length: 50 }), // 法定代表人
  registeredCapital: varchar('registered_capital', { length: 50 }), // 注册资本
  businessScope: text('business_scope'), // 经营范围
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedBy: uuid('verified_by'),
  verificationRejectReason: text('verification_reject_reason'),

  // Settings JSON structure:
  // interface TenantSettings {
  //     mfa?: {
  //         enabled: boolean;
  //         roles: string[]; // e.g. ['ADMIN', 'ADMIN']
  //     };
  // }
  settings: jsonb('settings').default({}),

  /**
   * 初始化引导状态
   * - pending: 待填写（BOSS 首次登录时拦截展示问卷）
   * - completed: 已完成问卷并应用了推荐配置
   * - skipped: 用户主动跳过
   */
  onboardingStatus: varchar('onboarding_status', { length: 20 }).default('pending'),

  isActive: boolean('is_active').default(true),
  // 审计字段 (H4 统一追加)
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdateFn(() => new Date()),

  // ==================== 计费与套餐 ====================
  /**
   * 动态套餐配置 (Add-ons 扩展)
   */
  /** 自定义席位上限，可覆盖套餐默认值 */
  maxUsers: integer('max_users'),
  /** 已购增值模块定义数组，如 ['BRANDING', 'ADVANCED_APPROVAL'] */
  purchasedModules: jsonb('purchased_modules').$type<string[]>().default([]),
  /** 自定义存储空间配额（单位：Byte），可覆盖套餐默认值 */
  storageQuota: bigint('storage_quota', { mode: 'number' }),
  /** 实效试用期/临时提权截止时间，过期后恢复原基础权限 */
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),

  /**
   * 套餐类型
   * - 'base': 基础版 (Base)
   * - 'pro': 专业版 ¥99/月
   * - 'enterprise': 企业版（按需报价）
   */
  planType: tenantPlanTypeEnum('plan_type').default('base').notNull(),

  /**
   * 套餐到期时间
   * null = 永久生效（免费版 / 祖父条款用户）
   */
  planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }),

  /**
   * 祖父条款标记
   * true = 在定价体系正式上线前注册的老用户，永久保留当前权益，不受免费版限额约束
   */
  isGrandfathered: boolean('is_grandfathered').default(false),
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id)
      .notNull(),
    email: varchar('email', { length: 255 }), // 可空，通过迁移脚本添加条件唯一索引 (tenantId, email)
    name: varchar('name', { length: 100 }),
    phone: varchar('phone', { length: 20 }).notNull(), // 必填，通过迁移脚本添加复合唯一索引 (tenantId, phone)
    passwordHash: text('password_hash'),
    /** @deprecated 过渡期保留，权威数据源已迁移到 tenantMembers.role */
    role: userRoleEnum('role').default('SALES'),
    /** @deprecated 过渡期保留，权威数据源已迁移到 tenantMembers.roles */
    roles: jsonb('roles').$type<string[]>().default([]),
    permissions: jsonb('permissions').default([]), // For granular permissions
    wechatOpenId: varchar('wechat_openid', { length: 100 }), // 微信登录，租户内唯一（见下方表级约束）
    preferences: jsonb('preferences').default({}),
    dashboardConfig: jsonb('dashboard_config').default({}),
    isActive: boolean('is_active').default(true),
    avatarUrl: text('avatar_url'),
    notificationSettings: jsonb('notification_settings').default({}), // 通知偏好设置
    isPlatformAdmin: boolean('is_platform_admin').default(false), // 平台超级管理员标识
    /** 上次活跃的租户 ID（登录时自动进入，类似 Slack "上次打开的 Workspace"） */
    lastActiveTenantId: uuid('last_active_tenant_id'),
    // 审计字段 (H4 统一追加)
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    /** M2 修复：微信 OpenID 在租户内唯一（同一微信用户可同时是不同租户的成员） */
    usersTenantWechatUnq: unique('uq_users_tenant_wechat').on(table.tenantId, table.wechatOpenId),
  })
);

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  name: varchar('name', { length: 50 }).notNull(),
  code: varchar('code', { length: 50 }).notNull(),
  description: text('description'),
  permissions: jsonb('permissions').$type<string[]>().default([]),
  isSystem: boolean('is_system').default(false),
  // 审计字段 (H4 统一追加)
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

export const sysDictionaries = pgTable('sys_dictionaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  key: varchar('key', { length: 100 }).notNull(),
  value: text('value').notNull(),
  label: varchar('label', { length: 100 }),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  // 审计字段 (H4 统一追加)
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
