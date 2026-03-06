import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { products } from './catalogs';
import { customers } from './customers';

// 枚举定义
export const showroomItemTypeEnum = pgEnum('showroom_item_type', [
  'PRODUCT',
  'CASE',
  'KNOWLEDGE',
  'TRAINING',
]);

export const showroomItemStatusEnum = pgEnum('showroom_item_status', [
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
]);

// 展厅内容表
export const showroomItems = pgTable(
  'showroom_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id)
      .notNull(),
    type: showroomItemTypeEnum('type').notNull(),
    productId: uuid('product_id').references(() => products.id), // 可选，仅 type=PRODUCT 时有值
    title: varchar('title', { length: 200 }).notNull(),
    content: text('content'), // 富文本详情
    images: jsonb('images').default([]), // 图片列表
    tags: jsonb('tags').default([]), // 标签列表
    score: integer('score').default(0), // 系统评分 0-100
    status: showroomItemStatusEnum('status').default('DRAFT').notNull(),

    views: integer('views').default(0), // 浏览次数（热度）
    shares: integer('shares').default(0), // 分享次数

    createdBy: uuid('created_by').references(() => users.id),
    updatedBy: uuid('updated_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    showroomTenantIdx: index('idx_showroom_items_tenant').on(table.tenantId),
    showroomProductIdx: index('idx_showroom_items_product').on(table.productId),
    showroomTypeIdx: index('idx_showroom_items_type').on(table.type),
  })
);

// 分享记录表
export const showroomShares = pgTable(
  'showroom_shares',
  {
    id: uuid('id').primaryKey().defaultRandom(), // 分享码
    tenantId: uuid('tenant_id')
      .references(() => tenants.id)
      .notNull(),
    salesId: uuid('sales_id')
      .references(() => users.id)
      .notNull(),
    customerId: uuid('customer_id').references(() => customers.id), // 可选关联客户

    // 分享内容快照 (Array of items with override prices)
    // Structure: [{ itemId: uuid, overridePrice: number, ... }]
    itemsSnapshot: jsonb('items_snapshot').default([]).notNull(),

    allowCustomerShare: integer('allow_customer_share').default(0).notNull(), // 1=Allowed, 0=Not Allowed
    lockedToUserId: varchar('locked_to_user_id', { length: 255 }), // 首次打开者的系统 userId，用于身份锁定

    isActive: integer('is_active').default(1), // 1=Active, 0=Inactive
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    passwordHash: varchar('password_hash', { length: 255 }), // 可选，访问密码 Hash
    maxViews: integer('max_views'), // 可选，最大访问次数限制 (阅后即焚)

    views: integer('views').default(0),
    lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),

    // 审计字段 (H4 统一追加)
    createdBy: uuid('created_by'),
    updatedBy: uuid('updated_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    shareTenantIdx: index('idx_showroom_shares_tenant').on(table.tenantId),
    shareSalesIdx: index('idx_showroom_shares_sales').on(table.salesId),
    shareCustomerIdx: index('idx_showroom_shares_customer').on(table.customerId),
  })
);

import { relations } from 'drizzle-orm';

export const showroomItemsRelations = relations(showroomItems, ({ one }) => ({
  product: one(products, {
    fields: [showroomItems.productId],
    references: [products.id],
  }),
  creator: one(users, {
    fields: [showroomItems.createdBy],
    references: [users.id],
  }),
}));

export const showroomSharesRelations = relations(showroomShares, ({ one }) => ({
  sales: one(users, {
    fields: [showroomShares.salesId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [showroomShares.customerId],
    references: [customers.id],
  }),
}));

// 展厅浏览明细表（客户停留时间上报）
export const showroomViewLogs = pgTable(
  'showroom_view_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id)
      .notNull(),
    shareId: uuid('share_id')
      .references(() => showroomShares.id)
      .notNull(),
    itemId: uuid('item_id')
      .references(() => showroomItems.id)
      .notNull(),
    visitorUserId: uuid('visitor_user_id').references(() => users.id), // 访客系统 ID
    durationSeconds: integer('duration_seconds').default(0).notNull(), // 停留秒数
    viewedAt: timestamp('viewed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    viewLogShareIdx: index('idx_showroom_view_logs_share').on(table.shareId),
    viewLogItemIdx: index('idx_showroom_view_logs_item').on(table.itemId),
    viewLogVisitorIdx: index('idx_showroom_view_logs_visitor').on(table.visitorUserId),
    viewLogTenantIdx: index('idx_showroom_view_logs_tenant').on(table.tenantId),
  })
);

export const showroomViewLogsRelations = relations(showroomViewLogs, ({ one }) => ({
  share: one(showroomShares, {
    fields: [showroomViewLogs.shareId],
    references: [showroomShares.id],
  }),
  item: one(showroomItems, {
    fields: [showroomViewLogs.itemId],
    references: [showroomItems.id],
  }),
  visitor: one(users, {
    fields: [showroomViewLogs.visitorUserId],
    references: [users.id],
  }),
}));
