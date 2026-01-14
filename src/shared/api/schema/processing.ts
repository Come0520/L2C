import { pgTable, uuid, varchar, text, timestamp, decimal, index } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { orders } from './orders';

export const processingOrders = pgTable('processing_orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    processingNo: varchar('processing_no', { length: 50 }).unique().notNull(),
    
    orderId: uuid('order_id').references(() => orders.id).notNull(),
    
    processorId: uuid('processor_id'), // External processor ID if needed
    processorName: varchar('processor_name', { length: 100 }),
    
    status: varchar('status', { length: 50 }).default('PENDING'),
    
    totalCost: decimal('total_cost', { precision: 10, scale: 2 }).default('0'),
    
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    
    notes: text('notes'),
    
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    procTenantIdx: index('idx_processing_orders_tenant').on(table.tenantId),
    procOrderIdx: index('idx_processing_orders_order').on(table.orderId),
}));
