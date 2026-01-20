import { pgTable, uuid, varchar, text, timestamp, decimal, index } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { orders, orderItems } from './orders';
import { purchaseOrders, suppliers } from './supply-chain';
import { workOrderStatusEnum } from './enums';

export const workOrders = pgTable('work_orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    woNo: varchar('wo_no', { length: 50 }).unique().notNull(),

    orderId: uuid('order_id').references(() => orders.id).notNull(),
    poId: uuid('po_id').references(() => purchaseOrders.id).notNull(), // Link to Fabric PO
    supplierId: uuid('supplier_id').references(() => suppliers.id).notNull(), // Processing Factory

    status: workOrderStatusEnum('status').default('PENDING'),

    startAt: timestamp('start_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    remark: text('remark'),

    createdBy: uuid('created_by').references(() => users.id).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
    woTenantIdx: index('idx_work_orders_tenant').on(table.tenantId),
    woOrderIdx: index('idx_work_orders_order').on(table.orderId),
    woPoIdx: index('idx_work_orders_po').on(table.poId),
}));

export const workOrderItems = pgTable('work_order_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    woId: uuid('wo_id').references(() => workOrders.id).notNull(),
    orderItemId: uuid('order_item_id').references(() => orderItems.id).notNull(), // Finished Product

    status: varchar('status', { length: 20 }).default('PENDING'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    woItemWoIdx: index('idx_work_order_items_wo').on(table.woId),
}));
