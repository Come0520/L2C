import { pgTable, uuid, varchar, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { customers } from './customers';
import { orders } from './orders';

export const loyaltyTransactions = pgTable('loyalty_transactions', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    customerId: uuid('customer_id').references(() => customers.id).notNull(),

    type: varchar('type', { length: 20 }).notNull(), // EARN, REDEEM, ADJUST, EXPIRE
    source: varchar('source', { length: 50 }).notNull(), // REFERRAL, ORDER, ADMIN, SYSTEM
    points: integer('points').notNull(), // Can be negative
    balanceAfter: integer('balance_after').notNull(),

    referenceType: varchar('reference_type', { length: 50 }), // ORDER, CUSTOMER (referee)
    referenceId: uuid('reference_id'),

    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
    loyaltyCustomerIdx: index('idx_loyalty_customer').on(table.customerId),
    loyaltyRefIdx: index('idx_loyalty_ref').on(table.referenceId),
}));
