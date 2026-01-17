import { pgTable, uuid, varchar, text, timestamp, decimal, index, integer, boolean } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { orders, orderItems } from './orders';
import { poTypeEnum } from './enums';
import { afterSalesTickets } from './after-sales';

export const suppliers = pgTable('suppliers', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    supplierNo: varchar('supplier_no', { length: 50 }).notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    contactPerson: varchar('contact_person', { length: 100 }),
    phone: varchar('phone', { length: 50 }),
    paymentPeriod: varchar('payment_period', { length: 50 }).default('CASH'), // 月结/现结
    isActive: boolean('is_active').default(true),
    address: text('address'),
    remark: text('remark'),

    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    supplierTenantIdx: index('idx_suppliers_tenant').on(table.tenantId),
}));

export const purchaseOrders = pgTable('purchase_orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    poNo: varchar('po_no', { length: 50 }).unique().notNull(),

    orderId: uuid('order_id').references(() => orders.id),
    afterSalesId: uuid('after_sales_id').references(() => afterSalesTickets.id),

    supplierId: uuid('supplier_id').references(() => suppliers.id),
    supplierName: varchar('supplier_name', { length: 100 }).notNull(),
    type: poTypeEnum('type').default('FINISHED'),

    splitRuleId: uuid('split_rule_id'),

    status: varchar('status', { length: 50 }).default('DRAFT'),

    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).default('0'),

    externalPoNo: varchar('external_po_no', { length: 100 }),
    supplierQuoteImg: text('supplier_quote_img'),
    sentMethod: varchar('sent_method', { length: 20 }),
    sentAt: timestamp('sent_at', { withTimezone: true }),

    producedAt: timestamp('produced_at', { withTimezone: true }),

    logisticsCompany: varchar('logistics_company', { length: 50 }),
    logisticsNo: varchar('logistics_no', { length: 100 }),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),

    paymentStatus: varchar('payment_status', { length: 20 }).default('PENDING'),

    expectedDate: timestamp('expected_date', { withTimezone: true }),
    remark: text('remark'),

    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    poTenantIdx: index('idx_po_tenant').on(table.tenantId),
    poOrderIdx: index('idx_po_order').on(table.orderId),
    poAfterSalesIdx: index('idx_po_after_sales').on(table.afterSalesId),
}));

export const purchaseOrderItems = pgTable('purchase_order_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    poId: uuid('po_id').references(() => purchaseOrders.id).notNull(),

    orderItemId: uuid('order_item_id').references(() => orderItems.id), // Optional for direct PO creation
    productId: uuid('product_id'),
    productSku: varchar('product_sku', { length: 100 }),
    category: varchar('category', { length: 50 }),

    productName: varchar('product_name', { length: 200 }).notNull(),
    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).default('0'),

    width: decimal('width', { precision: 10, scale: 2 }),
    height: decimal('height', { precision: 10, scale: 2 }),
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }),

    quoteItemId: uuid('quote_item_id'),

    remark: text('remark'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    poiTenantIdx: index('idx_poi_tenant').on(table.tenantId),
    poiPoIdx: index('idx_poi_po').on(table.poId),
    poiOrderItemIdx: index('idx_poi_order_item').on(table.orderItemId),
}));

export const splitRouteRules = pgTable('split_route_rules', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    priority: integer('priority').default(0),
    name: varchar('name', { length: 100 }).notNull(),
    conditions: text('conditions').notNull(), // JSON string for flexibility
    targetType: varchar('target_type', { length: 50 }).notNull(), // PURCHASE_ORDER, SERVICE_TASK
    targetSupplierId: uuid('target_supplier_id'), // Optional, if routing to specific supplier
    isActive: integer('is_active').default(1),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Product Supplier Associations (N:N)
export const productSuppliers = pgTable('product_suppliers', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    productId: uuid('product_id').notNull(), // Link to products (defined in catalogs.ts)
    supplierId: uuid('supplier_id').references(() => suppliers.id).notNull(),

    isDefault: boolean('is_default').default(false),
    purchasePrice: decimal('purchase_price', { precision: 12, scale: 2 }),
    logisticsCost: decimal('logistics_cost', { precision: 12, scale: 2 }),
    processingCost: decimal('processing_cost', { precision: 12, scale: 2 }),
    leadTimeDays: integer('lead_time_days').default(7),
    minOrderQuantity: decimal('min_order_quantity', { precision: 10, scale: 2 }),

    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    psTenantIdx: index('idx_product_suppliers_tenant').on(table.tenantId),
    psProductIdx: index('idx_product_suppliers_product').on(table.productId),
    psSupplierIdx: index('idx_product_suppliers_supplier').on(table.supplierId),
}));

// Channel Specific Prices (Contracts/Agreements)
export const channelSpecificPrices = pgTable('channel_specific_prices', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    productId: uuid('product_id').notNull(),
    channelId: uuid('channel_id').notNull(), // Link to channels (defined in channels.ts)

    specialPrice: decimal('special_price', { precision: 12, scale: 2 }).notNull(),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    cspTenantIdx: index('idx_csp_tenant').on(table.tenantId),
    cspProductIdx: index('idx_csp_product').on(table.productId),
    cspChannelIdx: index('idx_csp_channel').on(table.channelId),
}));

// Product Bundles (BOM/Bundles)
export const productBundles = pgTable('product_bundles', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    bundleSku: varchar('bundle_sku', { length: 50 }).unique().notNull(),
    name: varchar('bundle_name', { length: 200 }).notNull(),
    category: varchar('category', { length: 50 }), // Same as product category enum

    retailPrice: decimal('retail_price', { precision: 12, scale: 2 }).default('0'),
    channelPrice: decimal('channel_price', { precision: 12, scale: 2 }).default('0'),

    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    bundleTenantIdx: index('idx_bundles_tenant').on(table.tenantId),
    bundleSkuIdx: index('idx_bundles_sku').on(table.bundleSku),
}));

// Product Bundle Items (BOM Items)
export const productBundleItems = pgTable('product_bundle_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    bundleId: uuid('bundle_id').references(() => productBundles.id).notNull(),
    productId: uuid('product_id').notNull(),

    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
    unit: varchar('unit', { length: 20 }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    pbiBundleIdx: index('idx_bundle_items_bundle').on(table.bundleId),
}));

export const productionTasks = pgTable('production_tasks', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    taskNo: varchar('task_no', { length: 50 }).unique().notNull(),

    orderId: uuid('order_id').references(() => orders.id).notNull(),
    orderItemId: uuid('order_item_id'), // Optional link to specific item

    workshop: varchar('workshop', { length: 50 }).notNull(), // CUTTING, SEWING, ASSEMBLY, PACKING
    status: varchar('status', { length: 50 }).default('PENDING'),

    assignedWorkerId: uuid('assigned_worker_id').references(() => users.id),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    ptTenantIdx: index('idx_production_tasks_tenant').on(table.tenantId),
    ptOrderIdx: index('idx_production_tasks_order').on(table.orderId),
}));
