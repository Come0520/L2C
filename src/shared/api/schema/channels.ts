import { pgTable, uuid, varchar, text, timestamp, decimal, jsonb, boolean, index, integer } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { channelTypeEnum, channelLevelEnum, commissionTypeEnum, cooperationModeEnum, channelSettlementTypeEnum } from './enums';

export const channels = pgTable('channels', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

    // Core Info
    channelType: channelTypeEnum('channel_type').notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(), // Unique per tenant potentially, but keeping global unique for simplicity or enforce logic app side? req says "QD2026xxxx".
    level: channelLevelEnum('level').notNull().default('C'),

    // Primary Contact (Redundant but for quick access as per req)
    contactName: varchar('contact_name', { length: 100 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),

    // Financial Config
    commissionRate: decimal('commission_rate', { precision: 5, scale: 2 }).notNull(), // e.g. 10.00 for 10%
    commissionType: commissionTypeEnum('commission_type'), // FIXED / TIERED
    tieredRates: jsonb('tiered_rates'), // [{"min": 0, "rate": 10}, ...]

    cooperationMode: cooperationModeEnum('cooperation_mode').notNull(), // BASE_PRICE / COMMISSION
    priceDiscountRate: decimal('price_discount_rate', { precision: 5, scale: 4 }), // e.g. 0.9500 for 95%

    settlementType: channelSettlementTypeEnum('settlement_type').notNull(), // PREPAY / MONTHLY
    bankInfo: jsonb('bank_info'),

    // Attachments
    contractFiles: jsonb('contract_files'), // OSS Keys

    // Stats (Denormalized)
    totalLeads: integer('total_leads').default(0),
    totalDealAmount: decimal('total_deal_amount', { precision: 15, scale: 2 }).default('0'),

    status: varchar('status', { length: 20 }).default('ACTIVE'), // ACTIVE, SUSPENDED, TERMINATED

    assignedManagerId: uuid('assigned_manager_id').references(() => users.id),

    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
}, (table) => ({
    channelTenantIdx: index('idx_channels_tenant').on(table.tenantId),
    channelCodeIdx: index('idx_channels_code').on(table.code),
    channelPhoneIdx: index('idx_channels_phone').on(table.phone),
}));

export const channelContacts = pgTable('channel_contacts', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    channelId: uuid('channel_id').references(() => channels.id).notNull(),

    name: varchar('name', { length: 100 }).notNull(),
    position: varchar('position', { length: 50 }),
    phone: varchar('phone', { length: 20 }).notNull(),
    isMain: boolean('is_main').default(false),

    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
}, (table) => ({
    contactChannelIdx: index('idx_channel_contacts_channel').on(table.channelId),
    contactPhoneIdx: index('idx_channel_contacts_phone').on(table.phone),
}));

export const channelCommissions = pgTable('channel_commissions', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    channelId: uuid('channel_id').references(() => channels.id).notNull(),

    leadId: uuid('lead_id'), // Optional, link to lead
    orderId: uuid('order_id'), // Link to order (when implemented)

    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    status: varchar('status', { length: 20 }).default('PENDING'), // PENDING, SETTLED, VOID

    formula: jsonb('formula'), // Record calculation logic
    remark: text('remark'),

    settledAt: timestamp('settled_at', { withTimezone: true }),
    settledBy: uuid('settled_by').references(() => users.id),

    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
}, (table) => ({
    commissionTenantIdx: index('idx_commissions_tenant').on(table.tenantId),
    commissionChannelIdx: index('idx_commissions_channel').on(table.channelId),
    commissionStatusIdx: index('idx_commissions_status').on(table.status),
}));
