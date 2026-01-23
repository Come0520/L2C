import { pgTable, uuid, varchar, text, timestamp, decimal, jsonb, integer, index, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { tenants, users } from './infrastructure';
import { customers } from './customers';
import { productTemplates, products } from './catalogs';
import { quoteStatusEnum } from './enums';
import { QuoteItemAttributes, QuoteCalculationParams } from '../types/quote-types';

export const quotes = pgTable('quotes', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    quoteNo: varchar('quote_no', { length: 50 }).unique().notNull(),
    customerId: uuid('customer_id').references(() => customers.id).notNull(),
    leadId: uuid('lead_id'), // Optional reference to lead
    measureVariantId: uuid('measure_variant_id'), // Optional reference to measure variant
    bundleId: uuid('bundle_id'), // Optional reference to parent bundle quote

    // Versioning
    rootQuoteId: uuid('root_quote_id'), // Identifies the quote family
    parentQuoteId: uuid('parent_quote_id'), // Points to the previous version
    isActive: boolean('is_active').default(true), // Only one active version per QuoteNo chain

    title: varchar('title', { length: 200 }),

    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).default('0'),
    discountRate: decimal('discount_rate', { precision: 5, scale: 4 }), // e.g. 0.9500
    discountAmount: decimal('discount_amount', { precision: 12, scale: 2 }).default('0'),
    finalAmount: decimal('final_amount', { precision: 12, scale: 2 }).default('0'),
    minProfitMargin: decimal('min_profit_margin', { precision: 5, scale: 4 }), // Snapshot of required margin at time of quote

    status: quoteStatusEnum('status').default('DRAFT'),
    version: integer('version').default(1).notNull(),

    validUntil: timestamp('valid_until', { withTimezone: true }),
    notes: text('notes'),

    // Approval Flow (Batch 1 Task 2)
    approvalRequired: boolean('approval_required').default(false),
    approverId: uuid('approver_id').references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    rejectReason: text('reject_reason'),

    lockedAt: timestamp('locked_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id).notNull(),
    updatedBy: uuid('updated_by').references(() => users.id),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
    quoteTenantIdx: index('idx_quotes_tenant').on(table.tenantId),
    quoteCustomerIdx: index('idx_quotes_customer').on(table.customerId),
    // Ensure only ONE active version per Quote Family (RootQuote)
    // Using partial index: WHERE is_active = true
    quoteActiveVersionIdx: uniqueIndex('idx_quotes_active_version')
        .on(table.rootQuoteId)
        .where(sql`is_active = true`),
}));

export const quoteRooms = pgTable('quote_rooms', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    quoteId: uuid('quote_id').references(() => quotes.id, { onDelete: 'cascade' }).notNull(),

    name: varchar('name', { length: 100 }).notNull(),
    measureRoomId: uuid('measure_room_id'), // Link to measurement room if applicable

    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
}, (table) => ({
    quoteRoomsQuoteIdx: index('idx_quote_rooms_quote').on(table.quoteId),
}));

export const quoteItems = pgTable('quote_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    quoteId: uuid('quote_id').references(() => quotes.id, { onDelete: 'cascade' }).notNull(),
    parentId: uuid('parent_id'), // For nested items (e.g. accessories under curtains)
    roomId: uuid('room_id').references(() => quoteRooms.id, { onDelete: 'cascade' }), // 房间关联

    category: varchar('category', { length: 50 }).notNull(), // CURTAIN_FABRIC, TRACK, WALLPAPER, etc.

    productId: uuid('product_id').references(() => products.id),
    productName: varchar('product_name', { length: 200 }).notNull(),
    productSku: varchar('product_sku', { length: 100 }),

    roomName: varchar('room_name', { length: 100 }), // Redundant but requested

    unit: varchar('unit', { length: 20 }), // 米, 平米, 个

    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    costPrice: decimal('cost_price', { precision: 10, scale: 2 }), // Cost snapshot for profit analysis
    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),

    // Dimensions & Calc
    width: decimal('width', { precision: 10, scale: 2 }), // cm
    height: decimal('height', { precision: 10, scale: 2 }), // cm
    foldRatio: decimal('fold_ratio', { precision: 4, scale: 2 }),
    processFee: decimal('process_fee', { precision: 10, scale: 2 }),

    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),

    attributes: jsonb('attributes').$type<QuoteItemAttributes>().default({}), // Stores dynamic attrs like material_id, etc.
    calculationParams: jsonb('calculation_params').$type<QuoteCalculationParams>(), // Snapshot of calc factors (loss, strips, etc.)
    remark: text('remark'),
    sortOrder: integer('sort_order').default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
}, (table) => ({
    quoteItemsQuoteIdx: index('idx_quote_items_quote').on(table.quoteId),
}));

export type QuoteItem = typeof quoteItems.$inferSelect;
export type NewQuoteItem = typeof quoteItems.$inferInsert;


export const quotePlans = pgTable('quote_plans', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    code: varchar('code', { length: 50 }).notNull(), // Using varchar instead of enum as per seed code
    name: varchar('name', { length: 100 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    quotePlanCodeTenantIdx: uniqueIndex('idx_quote_plans_code_tenant').on(table.code, table.tenantId),
}));

export const quotePlanItems = pgTable('quote_plan_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id').references(() => quotePlans.id).notNull(),
    templateId: uuid('template_id').references(() => productTemplates.id).notNull(), // 模板关联
    overridePrice: decimal('override_price', { precision: 10, scale: 2 }),
    role: varchar('role', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==================== 报价模板系统 ====================

/**
 * 报价模板主表
 * 用于保存可复用的报价配置，支持小区团购等场景
 */
export const quoteTemplates = pgTable('quote_templates', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

    name: varchar('name', { length: 200 }).notNull(),           // 模板名称，如 "万科120平三室两厅套餐"
    description: text('description'),                            // 适用场景说明
    category: varchar('category', { length: 50 }),              // 分类：CURTAIN/WALLPAPER/MIXED
    tags: jsonb('tags').$type<string[]>().default([]),          // 标签：小区名、户型等

    // 来源追溯
    sourceQuoteId: uuid('source_quote_id'),                     // 来源报价（可选）

    isPublic: boolean('is_public').default(false),              // 是否公开（团队共享）
    isActive: boolean('is_active').default(true),

    createdBy: uuid('created_by').references(() => users.id).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    templateTenantIdx: index('idx_quote_templates_tenant').on(table.tenantId),
    templateCategoryIdx: index('idx_quote_templates_category').on(table.category),
}));

/**
 * 模板空间表
 * 保存模板中的空间配置
 */
export const quoteTemplateRooms = pgTable('quote_template_rooms', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    templateId: uuid('template_id').references(() => quoteTemplates.id, { onDelete: 'cascade' }).notNull(),

    name: varchar('name', { length: 100 }).notNull(),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    templateRoomsTemplateIdx: index('idx_quote_template_rooms_template').on(table.templateId),
}));

/**
 * 模板商品项表
 * 保存模板中的商品配置，包括预设尺寸和工艺参数
 */
export const quoteTemplateItems = pgTable('quote_template_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    templateId: uuid('template_id').references(() => quoteTemplates.id, { onDelete: 'cascade' }).notNull(),
    roomId: uuid('room_id').references(() => quoteTemplateRooms.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id'),                                // 附件挂载父项

    category: varchar('category', { length: 50 }).notNull(),
    productId: uuid('product_id').references(() => products.id),
    productName: varchar('product_name', { length: 200 }).notNull(),

    // 预设配置（尺寸可能留空或设为默认值，创建报价时可调整）
    defaultWidth: decimal('default_width', { precision: 10, scale: 2 }),
    defaultHeight: decimal('default_height', { precision: 10, scale: 2 }),
    defaultFoldRatio: decimal('default_fold_ratio', { precision: 4, scale: 2 }),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }),

    attributes: jsonb('attributes').$type<QuoteItemAttributes>().default({}),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    templateItemsTemplateIdx: index('idx_quote_template_items_template').on(table.templateId),
    templateItemsRoomIdx: index('idx_quote_template_items_room').on(table.roomId),
}));

// 类型导出
export type QuoteTemplate = typeof quoteTemplates.$inferSelect;
export type NewQuoteTemplate = typeof quoteTemplates.$inferInsert;
export type QuoteTemplateRoom = typeof quoteTemplateRooms.$inferSelect;
export type QuoteTemplateItem = typeof quoteTemplateItems.$inferSelect;
