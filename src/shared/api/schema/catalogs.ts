import { pgTable, uuid, varchar, text, timestamp, decimal, jsonb, boolean, index } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { productCategoryEnum } from './enums';
import { suppliers } from './supply-chain';

export const products = pgTable('products', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    sku: varchar('sku', { length: 50 }).unique().notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    category: productCategoryEnum('category').notNull(),

    unitPrice: decimal('unit_price', { precision: 12, scale: 2 }).default('0'), // Legacy or generic sales price
    unit: varchar('unit', { length: 20 }).default('件'),

    // Cost Dimension (Internal)
    purchasePrice: decimal('purchase_price', { precision: 12, scale: 2 }).default('0'),
    logisticsCost: decimal('logistics_cost', { precision: 12, scale: 2 }).default('0'),
    processingCost: decimal('processing_cost', { precision: 12, scale: 2 }).default('0'),
    lossRate: decimal('loss_rate', { precision: 5, scale: 4 }).default('0.0500'),

    // Selling Dimension
    retailPrice: decimal('retail_price', { precision: 12, scale: 2 }).default('0'),
    channelPriceMode: varchar('channel_price_mode', { length: 20 }).default('FIXED'), // FIXED, DISCOUNT
    channelPrice: decimal('channel_price', { precision: 12, scale: 2 }).default('0'),
    channelDiscountRate: decimal('channel_discount_rate', { precision: 5, scale: 4 }).default('1.0000'),
    floorPrice: decimal('floor_price', { precision: 12, scale: 2 }).default('0'),

    isToBEnabled: boolean('is_tob_enabled').default(true),
    isToCEnabled: boolean('is_toc_enabled').default(true),

    defaultSupplierId: uuid('default_supplier_id').references(() => suppliers.id),
    isStockable: boolean('is_stockable').default(false),

    description: text('description'),
    specs: jsonb('specs').default({}),

    isActive: boolean('is_active').default(true),

    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    prodTenantIdx: index('idx_products_tenant').on(table.tenantId),
    prodSkuIdx: index('idx_products_sku').on(table.sku),
    prodSupplierIdx: index('idx_products_supplier').on(table.defaultSupplierId),
}));

export const productAttributeTemplates = pgTable('product_attribute_templates', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    category: productCategoryEnum('category').notNull(),
    templateSchema: jsonb('template_schema').default({}), // 定义字段名、类型、是否必填等

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    attrTemplateTenantIdx: index('idx_product_attr_templates_tenant').on(table.tenantId),
    attrTemplateCategoryIdx: index('idx_product_attr_templates_category').on(table.category),
}));

export const productTemplates = pgTable('product_templates', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    category: productCategoryEnum('category').notNull(),
    description: text('description'),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).default('0').notNull(),
    defaultWidth: decimal('default_width', { precision: 10, scale: 2 }),
    defaultFoldRatio: decimal('default_fold_ratio', { precision: 4, scale: 2 }),
    tags: jsonb('tags').default([]), // text[] in SQL, but jsonb is often used for tags in this codebase
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const marketChannels = pgTable('market_channels', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    parentId: uuid('parent_id'), // Self reference for hierarchy
    name: varchar('name', { length: 100 }).notNull(),
    level: decimal('level').default('1'), // 1, 2, 3
    isActive: boolean('is_active').default(true),
    sortOrder: decimal('sort_order').default('0'),
    autoAssignSalesId: uuid('auto_assign_sales_id').references(() => users.id),

    // Distribution Strategy & Config
    distributionRuleId: uuid('distribution_rule_id'), // Reference to a Strategy Config Table (Future)
    allowDuplicateLeads: boolean('allow_duplicate_leads').default(false),
    urlParamsConfig: jsonb('url_params_config'), // Whitelist config

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    channelTenantIdx: index('idx_market_channels_tenant').on(table.tenantId),
    channelParentIdx: index('idx_market_channels_parent').on(table.parentId),
}));

