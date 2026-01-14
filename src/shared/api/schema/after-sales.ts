import { pgTable, uuid, varchar, text, timestamp, decimal, index, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { orders } from './orders';
import { afterSalesStatusEnum, liablePartyTypeEnum, liabilityStatusEnum, liabilityReasonCategoryEnum } from './enums';
import { customers } from './customers';
import { purchaseOrders } from './supply-chain';
import { installTasks } from './service';

export const afterSalesTickets = pgTable('after_sales_tickets', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    ticketNo: varchar('ticket_no', { length: 50 }).unique().notNull(),
    orderId: uuid('order_id').references(() => orders.id).notNull(),
    customerId: uuid('customer_id').references(() => customers.id).notNull(),
    installTaskId: uuid('install_task_id').references(() => installTasks.id), // Added: Link to Install Task
    type: varchar('type', { length: 50 }).notNull(), // RETURN, REPAIR, COMPLAINT, etc.
    status: afterSalesStatusEnum('status').default('PENDING').notNull(),
    priority: varchar('priority', { length: 20 }).default('MEDIUM'),
    description: text('description'),
    photos: text('photos').array(), // OSS URL array
    resolution: text('resolution'),

    // Costs
    estimatedCost: decimal('estimated_cost', { precision: 12, scale: 2 }),
    totalActualCost: decimal('total_actual_cost', { precision: 12, scale: 2 }).default('0.00'), // 实际总成本
    actualDeduction: decimal('actual_deduction', { precision: 12, scale: 2 }).default('0.00'), // 最终扣款金额
    internalLoss: decimal('internal_loss', { precision: 12, scale: 2 }).default('0.00'), // 公司内部损失

    isWarranty: boolean('is_warranty').default(true),
    satisfaction: integer('satisfaction'), // 1-5
    channelSatisfaction: integer('channel_satisfaction'), // 1-5

    assignedTo: uuid('assigned_to').references(() => users.id),
    createdBy: uuid('created_by').references(() => users.id),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }),

    // SLA Deadlines
    slaResponseDeadline: timestamp('sla_response_deadline', { withTimezone: true }),
    slaVisitDeadline: timestamp('sla_visit_deadline', { withTimezone: true }),
    slaClosureDeadline: timestamp('sla_closure_deadline', { withTimezone: true }),

}, (table) => ({
    tenantIdx: index('idx_as_tenant').on(table.tenantId),
    orderIdx: index('idx_as_order').on(table.orderId),
    customerIdx: index('idx_as_customer').on(table.customerId),
    ticketNoIdx: index('idx_as_ticket_no').on(table.ticketNo),
}));

export const liabilityNotices = pgTable('liability_notices', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    noticeNo: varchar('notice_no', { length: 50 }).unique().notNull(), // LN2026xxxx
    afterSalesId: uuid('after_sales_id').references(() => afterSalesTickets.id, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),

    liablePartyType: liablePartyTypeEnum('liable_party_type').notNull(),
    liablePartyId: uuid('liable_party_id'), // Supplier ID, User ID (Worker), etc.
    liablePartyCredit: jsonb('liable_party_credit'), // Added: Credit Snapshot

    reason: text('reason').notNull(),
    liabilityReasonCategory: liabilityReasonCategoryEnum('liability_reason_category'), // Added: Structured Reason Category

    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(), // 定责金额

    // Cost Breakdown
    costItems: jsonb('cost_items'),

    // Traceability
    sourcePurchaseOrderId: uuid('source_purchase_order_id').references(() => purchaseOrders.id), // Added: Source PO
    sourceInstallTaskId: uuid('source_install_task_id').references(() => installTasks.id), // Added: Source Install Task

    status: liabilityStatusEnum('status').default('DRAFT').notNull(),
    evidencePhotos: text('evidence_photos').array(),

    // Confirmation
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    confirmedBy: uuid('confirmed_by').references(() => users.id),

    // Dispute
    disputeReason: text('dispute_reason'),
    disputeEvidence: text('dispute_evidence').array(),

    // Arbitration
    arbitrationResult: text('arbitration_result'),
    arbitratedBy: uuid('arbitrated_by').references(() => users.id),
    arbitratedAt: timestamp('arbitrated_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_ln_tenant').on(table.tenantId),
    afterSalesIdx: index('idx_ln_after_sales').on(table.afterSalesId),
    noticeNoIdx: index('idx_ln_notice_no').on(table.noticeNo),
}));

