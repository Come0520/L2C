import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    jsonb,
    index,
} from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { customers } from './customers';

export const customerActivities = pgTable('customer_activities', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    customerId: uuid('customer_id').references(() => customers.id).notNull(),

    // Activity Details
    type: varchar('type', { length: 20 }).notNull(), // 'VISIT', 'CALL', 'WECHAT', 'OTHER'
    description: text('description').notNull(),

    // Attachments
    images: text('images').array().default([]), // URLs

    // Location (for visits)
    location: jsonb('location'), // { name: string, address: string, latitude: number, longitude: number }

    // Meta
    createdBy: uuid('created_by').references(() => users.id).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    activityTenantIdx: index('idx_cust_activities_tenant').on(table.tenantId),
    activityCustomerIdx: index('idx_cust_activities_customer').on(table.customerId),
    activityCreatorIdx: index('idx_cust_activities_creator').on(table.createdBy),
    activityDateIdx: index('idx_cust_activities_date').on(table.createdAt),
}));
