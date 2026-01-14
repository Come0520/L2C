import { pgTable, uuid, varchar, text, timestamp, decimal, index, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { orders } from './orders';
import { customers } from './customers';
import { leads } from './leads';
import {
    measureTaskStatusEnum,
    measureSheetStatusEnum,
    windowTypeEnum,
    installTypeEnum,
    wallMaterialEnum,
    feeCheckStatusEnum
} from './enums';

export const measureTasks = pgTable('measure_tasks', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    measureNo: varchar('measure_no', { length: 50 }).unique().notNull(),

    leadId: uuid('lead_id').references(() => leads.id).notNull(),
    customerId: uuid('customer_id').references(() => customers.id).notNull(),

    status: measureTaskStatusEnum('status').default('PENDING'),

    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    checkInAt: timestamp('check_in_at', { withTimezone: true }),
    checkInLocation: jsonb('check_in_location'),

    assignedWorkerId: uuid('assigned_worker_id').references(() => users.id),

    round: integer('round').default(1).notNull(),
    remark: text('remark'),
    rejectCount: integer('reject_count').default(0).notNull(),
    rejectReason: text('reject_reason'),

    // Fee Gatekeeping
    isFeeExempt: boolean('is_fee_exempt').default(false),
    feeCheckStatus: feeCheckStatusEnum('fee_check_status').default('NONE'),
    feeApprovalId: uuid('fee_approval_id'), // Reference to Approval Process

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
    completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
    measureTenantIdx: index('idx_measure_tasks_tenant').on(table.tenantId),
    measureLeadIdx: index('idx_measure_tasks_lead').on(table.leadId),
    measureStatusIdx: index('idx_measure_tasks_status').on(table.status),
}));

export const measureSheets = pgTable('measure_sheets', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    taskId: uuid('task_id').references(() => measureTasks.id).notNull(),

    status: measureSheetStatusEnum('status').default('DRAFT'),
    round: integer('round').notNull(),
    variant: varchar('variant', { length: 50 }).notNull(), // A, B, C...

    sitePhotos: jsonb('site_photos'),
    sketchMap: text('sketch_map'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
});

export const measureItems = pgTable('measure_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    sheetId: uuid('sheet_id').references(() => measureSheets.id).notNull(),

    roomName: varchar('room_name', { length: 100 }).notNull(),
    windowType: windowTypeEnum('window_type').notNull(),

    width: decimal('width', { precision: 12, scale: 2 }).notNull(),
    height: decimal('height', { precision: 12, scale: 2 }).notNull(),

    installType: installTypeEnum('install_type'),
    bracketDist: decimal('bracket_dist', { precision: 12, scale: 2 }), // 支架离地
    wallMaterial: wallMaterialEnum('wall_material'),

    hasBox: boolean('has_box').default(false),
    boxDepth: decimal('box_depth', { precision: 12, scale: 2 }),
    isElectric: boolean('is_electric').default(false),

    remark: text('remark'),
    segmentData: jsonb('segment_data'), // For L-shape/U-shape segments
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const installTasks = pgTable('install_tasks', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    taskNo: varchar('task_no', { length: 50 }).unique().notNull(),

    orderId: uuid('order_id').references(() => orders.id).notNull(),
    customerId: uuid('customer_id').references(() => customers.id).notNull(),

    status: varchar('status', { length: 50 }).default('PENDING'),

    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    installerId: uuid('installer_id').references(() => users.id),

    address: text('address'),
    notes: text('notes'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
}, (table) => ({
    installTenantIdx: index('idx_install_tenant').on(table.tenantId),
    installOrderIdx: index('idx_install_order').on(table.orderId),
}));

