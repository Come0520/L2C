import { pgTable, uuid, varchar, text, timestamp, index, decimal, jsonb } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { customers } from './customers';
import { marketChannels } from './catalogs';
import { channels, channelContacts } from './channels';
import { leadStatusEnum, intentionLevelEnum, leadActivityTypeEnum, decorationProgressEnum } from './enums';

export const leads = pgTable('leads', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    leadNo: varchar('lead_no', { length: 50 }).unique().notNull(),

    // Customer Info
    customerName: varchar('customer_name', { length: 50 }).notNull(),
    customerPhone: varchar('customer_phone', { length: 20 }).notNull(),
    customerWechat: varchar('customer_wechat', { length: 50 }),
    address: text('address'),
    community: varchar('community', { length: 100 }),
    houseType: varchar('house_type', { length: 50 }),

    // Business Info
    status: leadStatusEnum('status').default('PENDING_ASSIGNMENT'),
    intentionLevel: intentionLevelEnum('intention_level'),

    // Channel Source
    channelId: uuid('channel_id').references(() => channels.id), // Direct channel link
    channelContactId: uuid('channel_contact_id').references(() => channelContacts.id), // Specific person
    sourceChannelId: uuid('source_channel_id').references(() => marketChannels.id), // e.g. Category (Legacy/Category)
    sourceSubId: uuid('source_sub_id').references(() => marketChannels.id), // Specific channel
    distributionRuleId: uuid('distribution_rule_id'), // The rule used to assign this lead
    sourceDetail: varchar('source_detail', { length: 100 }), // Extra info
    urlParams: jsonb('url_params'), // Full capture of URL query parameters
    referrerName: varchar('referrer_name', { length: 100 }), // For referral
    referrerCustomerId: uuid('referrer_customer_id').references(() => customers.id), // Referral from existing customer

    estimatedAmount: decimal('estimated_amount', { precision: 12, scale: 2 }),
    tags: text('tags').array(), // PostgreSQL array
    notes: text('notes'),
    lostReason: text('lost_reason'),

    // Webhook / 外部系统集成
    externalId: varchar('external_id', { length: 100 }), // 外部系统线索ID，用于幂等性校验

    // Assignment & Timeline
    assignedSalesId: uuid('assigned_sales_id').references(() => users.id),
    assignedAt: timestamp('assigned_at', { withTimezone: true }),

    lastActivityAt: timestamp('last_activity_at', { withTimezone: true }),
    nextFollowupAt: timestamp('next_followup_at', { withTimezone: true }),
    nextFollowupRecommendation: timestamp('next_followup_recommendation', { withTimezone: true }), // [NEW] System recommended time

    decorationProgress: decorationProgressEnum('decoration_progress'), // [NEW] Decoration stage

    quotedAt: timestamp('quoted_at', { withTimezone: true }),
    visitedStoreAt: timestamp('visited_store_at', { withTimezone: true }),
    wonAt: timestamp('won_at', { withTimezone: true }),

    customerId: uuid('customer_id').references(() => customers.id), // Linked customer when WON

    createdBy: uuid('created_by').references(() => users.id).notNull(),
    updatedBy: uuid('updated_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
    leadTenantIdx: index('idx_leads_tenant').on(table.tenantId),
    leadPhoneIdx: index('idx_leads_phone').on(table.customerPhone),
    leadTenantDateIdx: index('idx_leads_tenant_date').on(table.tenantId, table.createdAt),
    leadStatusIdx: index('idx_leads_status').on(table.status),
    leadSalesIdx: index('idx_leads_sales').on(table.assignedSalesId),
}));

export const leadActivities = pgTable('lead_activities', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    leadId: uuid('lead_id').references(() => leads.id).notNull(),

    quoteId: uuid('quote_id'), // Reference to quotes table (loose coupling to avoid circular deps)
    purchaseIntention: intentionLevelEnum('purchase_intention'),
    customerLevel: varchar('customer_level', { length: 20 }),

    activityType: leadActivityTypeEnum('activity_type').notNull(),
    content: text('content').notNull(),
    location: varchar('location', { length: 200 }),

    nextFollowupDate: timestamp('next_followup_date', { withTimezone: true }),

    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    leadActivityLeadIdx: index('idx_lead_activities_lead').on(table.leadId),
}));

export const leadStatusHistory = pgTable('lead_status_history', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    leadId: uuid('lead_id').references(() => leads.id).notNull(),

    oldStatus: varchar('old_status', { length: 50 }),
    newStatus: varchar('new_status', { length: 50 }).notNull(),

    changedBy: uuid('changed_by').references(() => users.id),
    changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow(),

    reason: text('reason'),
}, (table) => ({
    leadHistoryTenantIdx: index('idx_lead_history_tenant').on(table.tenantId),
    leadHistoryLeadIdx: index('idx_lead_history_lead').on(table.leadId),
}));

