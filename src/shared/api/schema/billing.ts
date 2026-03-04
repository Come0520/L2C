/**
 * 订阅计费相关 Schema
 * 包含：订阅记录、支付记录、用量快照
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { tenants, tenantPlanTypeEnum } from './infrastructure';
import { subscriptionStatusEnum, paymentProviderEnum, billingPaymentStatusEnum } from './enums';

// ==================== 订阅表 ====================

/**
 * 订阅记录表
 * 记录租户的每次订阅信息（含历史记录）
 */
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id)
      .notNull(),

    // 套餐信息
    planType: tenantPlanTypeEnum('plan_type').notNull(),
    status: subscriptionStatusEnum('status').notNull(),

    // 当前周期
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),

    // 支付渠道
    paymentProvider: paymentProviderEnum('payment_provider_channel'),
    /** 第三方协议号（微信代扣 contract_id / 支付宝签约号） */
    externalSubscriptionId: varchar('external_subscription_id', { length: 255 }),

    // 金额（分为单位，避免浮点精度问题）
    /** 订阅金额，单位：分。9900 = ¥99.00 */
    amountCents: integer('amount_cents').notNull(),
    currency: varchar('currency', { length: 3 }).default('CNY'),

    // 续费控制
    autoRenew: boolean('auto_renew').default(true),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelReason: text('cancel_reason'),

    // 审计
    // 审计字段 (H4 统一追加)
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    tenantIdx: index('idx_subscriptions_tenant').on(table.tenantId),
    statusIdx: index('idx_subscriptions_status').on(table.status),
  })
);

// ==================== 支付记录表 ====================

/**
 * 支付记录表
 * 每笔实际支付（或退款）的流水账
 */
export const billingPaymentRecords = pgTable(
  'billing_payment_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id)
      .notNull(),
    subscriptionId: uuid('subscription_id').references(() => subscriptions.id),

    // 支付渠道
    paymentProvider: paymentProviderEnum('payment_provider_channel').notNull(),
    /** 微信 transaction_id / 支付宝 trade_no */
    externalPaymentId: varchar('external_payment_id', { length: 255 }),

    // 金额
    amountCents: integer('amount_cents').notNull(),
    currency: varchar('currency', { length: 3 }).default('CNY'),

    // 状态
    status: billingPaymentStatusEnum('status').notNull(),

    // 业务描述
    /** 例如: "专业版月费 2026-03" */
    description: text('description'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    refundedAt: timestamp('refunded_at', { withTimezone: true }),

    /** 支付回调原始数据（JSON 全文保存，用于对账与争议处理） */
    rawWebhookPayload: jsonb('raw_webhook_payload'),

    // 审计字段 (H4 统一追加)
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantIdx: index('idx_billing_payments_tenant').on(table.tenantId),
    subscriptionIdx: index('idx_billing_payments_subscription').on(table.subscriptionId),
    statusIdx: index('idx_billing_payments_status').on(table.status),
  })
);

// ==================== 用量快照表 ====================

/**
 * 用量指标快照表
 * 定时任务每日写入一条快照，用于仪表盘展示和限额判断
 */
export const usageMetrics = pgTable(
  'usage_metrics',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id)
      .notNull(),

    /** 快照日期 */
    snapshotDate: timestamp('snapshot_date', { withTimezone: true }).notNull(),

    // 各维度用量
    /** 当前用户数 */
    userCount: integer('user_count').default(0),
    /** 当前客户总数 */
    customerCount: integer('customer_count').default(0),
    /** 本月报价单数 */
    quoteCountMonth: integer('quote_count_month').default(0),
    /** 本月订单数 */
    orderCountMonth: integer('order_count_month').default(0),
    /** 云展厅产品数 */
    showroomProductCount: integer('showroom_product_count').default(0),
    /** 已用存储空间（字节） */
    storageUsedBytes: bigint('storage_used_bytes', { mode: 'number' }).default(0),

    // 审计字段 (H4 统一追加)
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    tenantDateIdx: index('idx_usage_metrics_tenant_date').on(table.tenantId, table.snapshotDate),
  })
);
