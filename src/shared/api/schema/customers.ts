import {
    pgTable,
    uuid,
    varchar,
    text,
    boolean,
    timestamp,
    jsonb,
    index,
    integer,
    decimal,
} from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { customerLevelEnum } from './enums'; // Using existing enum

export const customers = pgTable('customers', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    customerNo: varchar('customer_no', { length: 50 }).unique().notNull(),
    name: varchar('name', { length: 50 }).notNull(),
    type: varchar('type', { length: 20 }).default('INDIVIDUAL'),
    phone: varchar('phone', { length: 20 }).notNull(),
    phoneSecondary: varchar('phone_secondary', { length: 20 }),
    wechat: varchar('wechat', { length: 50 }),

    gender: varchar('gender', { length: 10 }), // MALE, FEMALE
    birthday: timestamp('birthday'),

    level: customerLevelEnum('level').default('D'),

    // Referral
    referrerCustomerId: uuid('referrer_customer_id'), // Self-reference added in relations
    sourceLeadId: uuid('source_lead_id'),

    // Loyalty
    loyaltyPoints: integer('loyalty_points').default(0),
    referralCode: varchar('referral_code', { length: 20 }).unique(),

    // Stats for caching
    totalOrders: integer('total_orders').default(0),
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).default('0'),
    avgOrderAmount: decimal('avg_order_amount', { precision: 12, scale: 2 }).default('0'),

    firstOrderAt: timestamp('first_order_at', { withTimezone: true }),
    lastOrderAt: timestamp('last_order_at', { withTimezone: true }),

    preferences: jsonb('preferences').default({}), // style, color, budget, etc.
    notes: text('notes'),
    tags: text('tags').array().default([]),


    isMerged: boolean('is_merged').default(false),
    mergedFrom: uuid('merged_from').array(),

    assignedSalesId: uuid('assigned_sales_id').references(() => users.id),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
    custTenantIdx: index('idx_customers_tenant').on(table.tenantId),
    custPhoneIdx: index('idx_customers_phone').on(table.phone),
    custReferrerIdx: index('idx_customers_referrer').on(table.referrerCustomerId),
}));
