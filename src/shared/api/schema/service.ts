import { pgTable, uuid, varchar, text, timestamp, decimal, index, integer, boolean, jsonb, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';

import { orders } from './orders';
import { customers } from './customers';
import { leads } from './leads';
import { approvals } from './approval';
import { afterSalesTickets } from './after-sales';
import {
    measureTaskStatusEnum,
    measureSheetStatusEnum,
    windowTypeEnum,
    installTypeEnum,
    wallMaterialEnum,
    feeCheckStatusEnum,
    measureTypeEnum,
    installTaskSourceTypeEnum,
    installTaskCategoryEnum,
    installTaskStatusEnum,
    installItemIssueCategoryEnum,
    installPhotoTypeEnum
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
    type: measureTypeEnum('type').default('BLIND'),

    assignedWorkerId: uuid('assigned_worker_id').references(() => users.id),

    versionDisplay: varchar('version_display', { length: 20 }),
    parentId: uuid('parent_id').references((): AnyPgColumn => measureTasks.id), // 版本自引用

    round: integer('round').default(1).notNull(),
    remark: text('remark'),
    rejectCount: integer('reject_count').default(0).notNull(),
    rejectReason: text('reject_reason'),

    isFeeExempt: boolean('is_fee_exempt').default(false),
    feeCheckStatus: feeCheckStatusEnum('fee_check_status').default('NONE'),
    feeApprovalId: uuid('fee_approval_id').references(() => approvals.id), // 审批关联

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
    measureTenantIdx: index('idx_measure_tasks_tenant').on(table.tenantId),
    measureLeadIdx: index('idx_measure_tasks_lead').on(table.leadId),
    measureStatusIdx: index('idx_measure_tasks_status').on(table.status),
}));

export const measureSheets = pgTable('measure_sheets', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    taskId: uuid('task_id').references(() => measureTasks.id, { onDelete: 'cascade' }).notNull(),

    status: measureSheetStatusEnum('status').default('DRAFT'),
    round: integer('round').notNull(),
    variant: varchar('variant', { length: 50 }).notNull(),

    sitePhotos: jsonb('site_photos'),
    sketchMap: text('sketch_map'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
});

export const measureItems = pgTable('measure_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    sheetId: uuid('sheet_id').references(() => measureSheets.id, { onDelete: 'cascade' }).notNull(),

    roomName: varchar('room_name', { length: 100 }).notNull(),
    windowType: windowTypeEnum('window_type').notNull(),

    width: decimal('width', { precision: 12, scale: 2 }).notNull(),
    height: decimal('height', { precision: 12, scale: 2 }).notNull(),

    installType: installTypeEnum('install_type'),
    bracketDist: decimal('bracket_dist', { precision: 12, scale: 2 }),
    wallMaterial: wallMaterialEnum('wall_material'),

    hasBox: boolean('has_box').default(false),
    boxDepth: decimal('box_depth', { precision: 12, scale: 2 }),
    isElectric: boolean('is_electric').default(false),

    remark: text('remark'),
    segmentData: jsonb('segment_data'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
}, (table) => ({
    measureItemsSheetIdx: index('idx_measure_items_sheet').on(table.sheetId),
}));

export const installTasks = pgTable('install_tasks', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    taskNo: varchar('task_no', { length: 50 }).unique().notNull(),
    sourceType: installTaskSourceTypeEnum('source_type').default('ORDER').notNull(),
    orderId: uuid('order_id').references(() => orders.id).notNull(),
    afterSalesId: uuid('after_sales_id').references((): AnyPgColumn => afterSalesTickets.id), // 售后关联（延迟引用解决循环依赖）
    customerId: uuid('customer_id').references(() => customers.id).notNull(),
    customerName: varchar('customer_name', { length: 100 }),
    customerPhone: varchar('customer_phone', { length: 20 }),
    address: text('address'),
    category: installTaskCategoryEnum('category').default('CURTAIN').notNull(),
    status: installTaskStatusEnum('status').default('PENDING_DISPATCH').notNull(),

    salesId: uuid('sales_id').references(() => users.id),
    dispatcherId: uuid('dispatcher_id').references(() => users.id),
    installerId: uuid('installer_id').references(() => users.id),
    installerName: varchar('installer_name', { length: 100 }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }),


    scheduledDate: timestamp('scheduled_date', { withTimezone: true }),
    scheduledTimeSlot: varchar('scheduled_time_slot', { length: 50 }),

    actualStartAt: timestamp('actual_start_at', { withTimezone: true }),
    actualEndAt: timestamp('actual_end_at', { withTimezone: true }),

    logisticsReadyStatus: boolean('logistics_ready_status').default(false).notNull(),

    checkInAt: timestamp('check_in_at', { withTimezone: true }),
    checkInLocation: jsonb('check_in_location'),
    checkOutAt: timestamp('check_out_at', { withTimezone: true }),
    checkOutLocation: jsonb('check_out_location'),

    customerSignatureUrl: text('customer_signature_url'),
    signedAt: timestamp('signed_at', { withTimezone: true }),

    laborFee: decimal('labor_fee', { precision: 12, scale: 2 }),
    actualLaborFee: decimal('actual_labor_fee', { precision: 12, scale: 2 }),
    adjustmentReason: text('adjustment_reason'),
    feeBreakdown: jsonb('fee_breakdown'),


    checklistStatus: jsonb('checklist_status'),
    fieldDiscovery: jsonb('field_discovery'),

    rating: integer('rating'),
    ratingComment: text('rating_comment'),


    remark: text('remark'),
    notes: text('notes'),

    rejectCount: integer('reject_count').default(0).notNull(),
    rejectReason: text('reject_reason'),

    confirmedBy: uuid('confirmed_by').references(() => users.id),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
    completedAt: timestamp('completed_at', { withTimezone: true }),
}, (table) => ({
    installTenantIdx: index('idx_install_tenant').on(table.tenantId),
    installOrderIdx: index('idx_install_order').on(table.orderId),
    installStatusIdx: index('idx_install_status').on(table.status),
    installInstallerIdx: index('idx_install_installer').on(table.installerId),
    installScheduledDateIdx: index('idx_install_scheduled_date').on(table.scheduledDate),
}));

export const installItems = pgTable('install_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    installTaskId: uuid('install_task_id').references(() => installTasks.id, { onDelete: 'cascade' }).notNull(),
    orderItemId: uuid('order_item_id'),

    productName: varchar('product_name', { length: 200 }).notNull(),
    roomName: varchar('room_name', { length: 100 }),

    quantity: decimal('quantity', { precision: 12, scale: 2 }).notNull(),
    actualInstalledQuantity: decimal('actual_installed_quantity', { precision: 12, scale: 2 }),

    issueCategory: installItemIssueCategoryEnum('issue_category').default('NONE'),
    isInstalled: boolean('is_installed').default(false).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
}, (table) => ({
    installItemsTaskIdx: index('idx_install_items_task').on(table.installTaskId),
}));

export const installPhotos = pgTable('install_photos', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    installTaskId: uuid('install_task_id').references(() => installTasks.id, { onDelete: 'cascade' }).notNull(),

    photoType: installPhotoTypeEnum('photo_type').notNull(),
    photoUrl: text('photo_url').notNull(),
    roomName: varchar('room_name', { length: 100 }),
    remark: text('remark'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const measureTaskSplits = pgTable('measure_task_splits', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

    originalTaskId: uuid('original_task_id').references(() => measureTasks.id).notNull(),
    newTaskId: uuid('new_task_id').references(() => measureTasks.id).notNull(),

    reason: text('reason'),

    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    splitTenantIdx: index('idx_measure_task_splits_tenant').on(table.tenantId),
    splitOriginalTaskIdx: index('idx_measure_task_splits_original').on(table.originalTaskId),
}));


