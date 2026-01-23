import { pgTable, uuid, varchar, text, timestamp, decimal, index, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { orders, orderItems } from './orders';
import { poTypeEnum, packageTypeEnum, packageOverflowModeEnum, fabricInventoryLogTypeEnum, purchaseOrderStatusEnum, paymentStatusEnum, supplierTypeEnum } from './enums';
import { afterSalesTickets } from './after-sales';

export const suppliers = pgTable('suppliers', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    supplierNo: varchar('supplier_no', { length: 50 }).unique().notNull(),
    name: varchar('name', { length: 200 }).notNull(),
    // 供应商类型：供应商/加工厂/两者兼备
    supplierType: supplierTypeEnum('supplier_type').default('SUPPLIER'),
    contactPerson: varchar('contact_person', { length: 100 }),
    phone: varchar('phone', { length: 50 }),
    paymentPeriod: varchar('payment_period', { length: 50 }).default('CASH'), // 月结/现结
    isActive: boolean('is_active').default(true),
    address: text('address'),
    remark: text('remark'),

    // [NEW] 加工厂专属字段
    processingPrices: jsonb('processing_prices'), // 加工费价格表, 结构: { items: [{ name: string, unit: string, price: number }] }
    contractUrl: text('contract_url'), // 合同文件 URL
    contractExpiryDate: timestamp('contract_expiry_date', { withTimezone: true }), // 合同到期日期
    businessLicenseUrl: text('business_license_url'), // 营业执照 URL
    bankAccount: varchar('bank_account', { length: 100 }), // 银行账号
    bankName: varchar('bank_name', { length: 100 }), // 开户银行

    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    supplierTenantIdx: index('idx_suppliers_tenant').on(table.tenantId),
    supplierTypeIdx: index('idx_suppliers_type').on(table.supplierType),
}));

export const purchaseOrders = pgTable('purchase_orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    poNo: varchar('po_no', { length: 50 }).unique().notNull(),

    orderId: uuid('order_id').references(() => orders.id),
    afterSalesId: uuid('after_sales_id').references(() => afterSalesTickets.id),

    supplierId: uuid('supplier_id').references(() => suppliers.id).notNull(),
    supplierName: varchar('supplier_name', { length: 100 }).notNull(),
    type: poTypeEnum('type').default('FINISHED'),

    splitRuleId: uuid('split_rule_id'),

    status: purchaseOrderStatusEnum('status').default('DRAFT'),

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

    paymentStatus: paymentStatusEnum('payment_status').default('PENDING'),

    expectedDate: timestamp('expected_date', { withTimezone: true }),
    remark: text('remark'),

    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    poTenantIdx: index('idx_po_tenant').on(table.tenantId),
    poOrderIdx: index('idx_po_order').on(table.orderId),
    poAfterSalesIdx: index('idx_po_after_sales').on(table.afterSalesId),
    poSupplierIdx: index('idx_po_supplier').on(table.supplierId),
    poStatusIdx: index('idx_po_status').on(table.status),
}));

export const purchaseOrderItems = pgTable('purchase_order_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    poId: uuid('po_id').references(() => purchaseOrders.id, { onDelete: 'cascade' }).notNull(),

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
    conditions: jsonb('conditions').notNull().default([]), // 路由条件 JSON
    targetType: varchar('target_type', { length: 50 }).notNull(), // PURCHASE_ORDER, SERVICE_TASK
    targetSupplierId: uuid('target_supplier_id').references(() => suppliers.id), // 目标供应商
    isActive: boolean('is_active').default(true), // 是否启用
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

// =============================================
// 套餐模块 (Product Packages)
// =============================================

// 商品套餐表 (Product Packages)
export const productPackages = pgTable('product_packages', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    packageNo: varchar('package_no', { length: 50 }).unique().notNull(),
    packageName: varchar('package_name', { length: 200 }).notNull(),
    packageType: packageTypeEnum('package_type').notNull(),
    packagePrice: decimal('package_price', { precision: 12, scale: 2 }).notNull(),
    originalPrice: decimal('original_price', { precision: 12, scale: 2 }),
    description: text('description'),
    rules: jsonb('rules').default({}),  // 套餐规则 JSONB
    overflowMode: packageOverflowModeEnum('overflow_mode').default('DISCOUNT'),
    overflowPrice: decimal('overflow_price', { precision: 12, scale: 2 }),
    overflowDiscountRate: decimal('overflow_discount_rate', { precision: 5, scale: 4 }),
    isActive: boolean('is_active').default(true),
    startDate: timestamp('start_date', { withTimezone: true }),
    endDate: timestamp('end_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    pkgTenantIdx: index('idx_packages_tenant').on(table.tenantId),
    pkgNoIdx: index('idx_packages_no').on(table.packageNo),
}));

// 套餐商品关联表 (Package Products)
export const packageProducts = pgTable('package_products', {
    id: uuid('id').primaryKey().defaultRandom(),
    packageId: uuid('package_id').references(() => productPackages.id).notNull(),
    productId: uuid('product_id').notNull(),
    isRequired: boolean('is_required').default(false),
    minQuantity: decimal('min_quantity', { precision: 10, scale: 2 }),
    maxQuantity: decimal('max_quantity', { precision: 10, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    ppPackageIdx: index('idx_package_products_package').on(table.packageId),
    ppProductIdx: index('idx_package_products_product').on(table.productId),
}));

// =============================================
// 面料库存模块 (Fabric Inventory)
// =============================================

// 面料库存表 (Fabric Inventory)
export const fabricInventory = pgTable('fabric_inventory', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    fabricProductId: uuid('fabric_product_id').notNull(),
    fabricSku: varchar('fabric_sku', { length: 100 }).notNull(),
    fabricName: varchar('fabric_name', { length: 200 }).notNull(),
    fabricColor: varchar('fabric_color', { length: 50 }),
    fabricWidth: decimal('fabric_width', { precision: 10, scale: 2 }),
    fabricRollLength: decimal('fabric_roll_length', { precision: 10, scale: 2 }),
    batchNo: varchar('batch_no', { length: 50 }),
    purchaseOrderId: uuid('purchase_order_id'),
    supplierId: uuid('supplier_id'),
    availableQuantity: decimal('available_quantity', { precision: 12, scale: 2 }).notNull(),
    reservedQuantity: decimal('reserved_quantity', { precision: 12, scale: 2 }).default('0'),
    totalQuantity: decimal('total_quantity', { precision: 12, scale: 2 }).notNull(),
    purchaseDate: timestamp('purchase_date', { withTimezone: true }),
    expiryDate: timestamp('expiry_date', { withTimezone: true }),
    warehouseLocation: varchar('warehouse_location', { length: 100 }),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    fiTenantIdx: index('idx_fabric_inventory_tenant').on(table.tenantId),
    fiProductIdx: index('idx_fabric_inventory_product').on(table.fabricProductId),
}));

// 面料库存流水表 (Fabric Inventory Logs)
export const fabricInventoryLogs = pgTable('fabric_inventory_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    fabricInventoryId: uuid('fabric_inventory_id').references(() => fabricInventory.id).notNull(),
    logType: fabricInventoryLogTypeEnum('log_type').notNull(),
    quantity: decimal('quantity', { precision: 12, scale: 2 }).notNull(),
    beforeQuantity: decimal('before_quantity', { precision: 12, scale: 2 }).notNull(),
    afterQuantity: decimal('after_quantity', { precision: 12, scale: 2 }).notNull(),
    referenceId: uuid('reference_id'),
    referenceType: varchar('reference_type', { length: 50 }),
    remark: text('remark'),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    filInventoryIdx: index('idx_fabric_logs_inventory').on(table.fabricInventoryId),
}));

// =============================================
// 渠道等级折扣模块 (Channel Level Discounts)
// =============================================

/**
 * 渠道等级折扣覆盖表
 * 
 * 用于按品类或商品覆盖全局的渠道等级折扣配置
 * 全局默认折扣存储在 tenants.settings JSONB 中
 */
export const channelDiscountOverrides = pgTable('channel_discount_overrides', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

    // 覆盖范围：CATEGORY=品类覆盖, PRODUCT=商品覆盖
    scope: varchar('scope', { length: 20 }).notNull(),
    // 目标ID：品类代码（如 CURTAIN_FABRIC）或商品UUID
    targetId: varchar('target_id', { length: 100 }).notNull(),
    // 目标名称（冗余存储，方便查询显示）
    targetName: varchar('target_name', { length: 200 }),

    // S/A/B/C 四级折扣率（百分比，如 95 表示 95%）
    sLevelDiscount: decimal('s_level_discount', { precision: 5, scale: 2 }),
    aLevelDiscount: decimal('a_level_discount', { precision: 5, scale: 2 }),
    bLevelDiscount: decimal('b_level_discount', { precision: 5, scale: 2 }),
    cLevelDiscount: decimal('c_level_discount', { precision: 5, scale: 2 }),

    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    cdoTenantIdx: index('idx_channel_discount_overrides_tenant').on(table.tenantId),
    cdoScopeTargetIdx: index('idx_channel_discount_overrides_scope_target').on(table.scope, table.targetId),
}));

