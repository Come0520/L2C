import { pgTable, uuid, varchar, text, timestamp, decimal, jsonb, integer, index, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { tenants, users } from './infrastructure';
import { customers } from './customers';
import { productTemplates } from './catalogs';

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

    status: varchar('status', { length: 50 }).default('DRAFT'),
    version: integer('version').default(1).notNull(),

    validUntil: timestamp('valid_until', { withTimezone: true }),
    notes: text('notes'),

    // Approval Flow (Batch 1 Task 2)
    approvalRequired: boolean('approval_required').default(false),
    approverId: uuid('approver_id').references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    rejectReason: text('reject_reason'),

    lockedAt: timestamp('locked_at', { withTimezone: true }),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
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
});

export const quoteItems = pgTable('quote_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    quoteId: uuid('quote_id').references(() => quotes.id, { onDelete: 'cascade' }).notNull(),
    parentId: uuid('parent_id'), // For nested items (e.g. accessories under curtains)
    roomId: uuid('room_id').references(() => quoteRooms.id, { onDelete: 'cascade' }), // 房间关联

    category: varchar('category', { length: 50 }).notNull(), // CURTAIN_FABRIC, TRACK, WALLPAPER, etc.

    productId: uuid('product_id'),
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

    attributes: jsonb('attributes').default({}), // Stores dynamic attrs like material_id, etc.
    calculationParams: jsonb('calculation_params'), // Snapshot of calc factors (loss, strips, etc.)
    remark: text('remark'),
    sortOrder: integer('sort_order').default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

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
});

export const quotePlanItems = pgTable('quote_plan_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id').references(() => quotePlans.id).notNull(),
    templateId: uuid('template_id').references(() => productTemplates.id).notNull(), // 模板关联
    overridePrice: decimal('override_price', { precision: 10, scale: 2 }),
    role: varchar('role', { length: 50 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
