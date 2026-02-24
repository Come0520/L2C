import { pgTable, text, timestamp, integer, uuid, boolean, pgEnum, index, uniqueIndex, decimal } from 'drizzle-orm/pg-core';
import { products } from './catalogs';
import { tenants, users } from './infrastructure';

// Enums
export const inventoryLogTypeEnum = pgEnum('inventory_log_type', ['IN', 'OUT', 'ADJUST', 'TRANSFER']);

// 仓库表 (Warehouses)
export const warehouses = pgTable('warehouses', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    name: text('name').notNull(),
    address: text('address'),
    managerId: uuid('manager_id').references(() => users.id), // 仓库管理员
    isDefault: boolean('is_default').default(false), // 是否默认仓库
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    warehouseTenantIdx: index('idx_warehouses_tenant').on(table.tenantId),
}));

// 库存表 (Inventory - Stock Levels)
export const inventory = pgTable('inventory', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    warehouseId: uuid('warehouse_id').references(() => warehouses.id).notNull(),
    productId: uuid('product_id').references(() => products.id).notNull(),
    quantity: integer('quantity').notNull().default(0),
    minStock: integer('min_stock').default(0), // 安全库存
    location: text('location'), // 具体货位
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    inventoryTenantIdx: index('idx_inventory_tenant').on(table.tenantId),
    inventoryWarehouseIdx: index('idx_inventory_warehouse').on(table.warehouseId),
    inventoryProductIdx: index('idx_inventory_product').on(table.productId),
    // 仓库+商品 唯一约束，用于支持原子性 UPSERT
    inventoryWarehouseProductUq: uniqueIndex('uq_inventory_warehouse_product').on(table.warehouseId, table.productId),
}));

// 库存流水表 (Inventory Logs - Transaction History)
export const inventoryLogs = pgTable('inventory_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    warehouseId: uuid('warehouse_id').references(() => warehouses.id).notNull(),
    productId: uuid('product_id').references(() => products.id).notNull(),
    type: inventoryLogTypeEnum('type').notNull(),
    quantity: integer('quantity').notNull(), // 正数入库，负数出库
    // SC-16 修复：补充 balanceBefore 字段，确保库存流水可完整还原事件序列（财务流水完整性原则）
    balanceBefore: integer('balance_before').notNull().default(0), // 变动前库存量
    balanceAfter: integer('balance_after').notNull(),              // 变动后库存量
    reason: text('reason'),
    referenceType: text('reference_type'), // PO, ORDER, RETURN, ADJUST
    referenceId: uuid('reference_id'), // 关联单据 ID
    operatorId: uuid('operator_id').references(() => users.id),
    costPrice: decimal('cost_price', { precision: 12, scale: 2 }), // 固化成本价 (Solidified cost price)
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    inventoryLogsTenantIdx: index('idx_inventory_logs_tenant').on(table.tenantId),
    inventoryLogsWarehouseIdx: index('idx_inventory_logs_warehouse').on(table.warehouseId),
    inventoryLogsCreatedIdx: index('idx_inventory_logs_created').on(table.createdAt),
}));
