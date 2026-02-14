import { pgTable, uuid, varchar, text, timestamp, decimal, index, integer, date, boolean, jsonb } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { customers } from './customers';
import { quotes, quoteItems } from './quotes';
import { products } from './catalogs';
import { leads } from './leads';
import { purchaseOrders, suppliers } from './supply-chain';
import { channels, channelContacts } from './channels';
import {
    orderStatusEnum,
    productCategoryEnum,
    paymentMethodEnum,
    paymentScheduleStatusEnum,
    orderSettlementTypeEnum,
    changeRequestTypeEnum,
    changeRequestStatusEnum,
    orderItemStatusEnum,
    cooperationModeEnum
} from './enums';

export const orders = pgTable('orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    orderNo: varchar('order_no', { length: 50 }).unique().notNull(),

    quoteId: uuid('quote_id').references(() => quotes.id).notNull(),
    quoteVersionId: uuid('quote_version_id').references(() => quotes.id).notNull(), // 报价版本关联

    leadId: uuid('lead_id').references(() => leads.id), // 线索关联

    // 渠道信息（冗余存储，用于佣金计算）
    channelId: uuid('channel_id').references(() => channels.id),
    channelContactId: uuid('channel_contact_id').references(() => channelContacts.id),
    channelCooperationMode: cooperationModeEnum('channel_cooperation_mode'), // BASE_PRICE / COMMISSION

    customerId: uuid('customer_id').references(() => customers.id).notNull(),
    customerName: varchar('customer_name', { length: 100 }), // Denormalized for quick access
    customerPhone: varchar('customer_phone', { length: 20 }), // Denormalized for quick access
    deliveryAddress: text('delivery_address'),

    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).default('0'),
    paidAmount: decimal('paid_amount', { precision: 12, scale: 2 }).default('0'),
    balanceAmount: decimal('balance_amount', { precision: 12, scale: 2 }).default('0'),

    settlementType: orderSettlementTypeEnum('settlement_type').notNull(),

    // Proofs
    confirmationImg: text('confirmation_img'), // For credit customers
    paymentProofImg: text('payment_proof_img'), // For cash customers

    // Immediate Payment Info (for Cash customers)
    paymentAmount: decimal('payment_amount', { precision: 12, scale: 2 }),
    paymentMethod: paymentMethodEnum('payment_method'),
    paymentTime: timestamp('payment_time', { withTimezone: true }),

    // Prepaid
    prepaidPaymentId: uuid('prepaid_payment_id'),

    status: orderStatusEnum('status').default('DRAFT'),

    // Locking
    isLocked: boolean('is_locked').default(false),
    lockedAt: timestamp('locked_at', { withTimezone: true }),

    salesId: uuid('sales_id').references(() => users.id),

    remark: text('remark'),
    snapshotData: jsonb('snapshot_data'), // Generic snapshot/state
    quoteSnapshot: jsonb('quote_snapshot'), // Deep clone of original quote
    logistics: jsonb('logistics'), // Stores tracking info (carrier, trackingNo, traces)

    createdBy: uuid('created_by').references(() => users.id).notNull(),
    updatedBy: uuid('updated_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),

    // Pause functionality
    pausedAt: timestamp('paused_at', { withTimezone: true }),
    pauseReason: text('pause_reason'),
    pauseCumulativeDays: integer('pause_cumulative_days').default(0),

    deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
    orderTenantIdx: index('idx_orders_tenant').on(table.tenantId),
    orderCustomerIdx: index('idx_orders_customer').on(table.customerId),
    orderTenantStatusIdx: index('idx_orders_tenant_status').on(table.tenantId, table.status),
    orderQuoteIdx: index('idx_orders_quote').on(table.quoteId),
    orderNoIdx: index('idx_orders_order_no').on(table.orderNo),
    orderStatusIdx: index('idx_orders_status').on(table.status),
    orderSalesIdx: index('idx_orders_sales').on(table.salesId),
    orderChannelIdx: index('idx_orders_channel').on(table.channelId),
}));

export const orderItems = pgTable('order_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),

    quoteItemId: uuid('quote_item_id').references(() => quoteItems.id).notNull(),

    roomName: varchar('room_name', { length: 100 }).notNull(),

    productId: uuid('product_id').references(() => products.id),
    productName: varchar('product_name', { length: 200 }).notNull(),
    category: productCategoryEnum('category').notNull(),

    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
    width: decimal('width', { precision: 10, scale: 2 }),
    height: decimal('height', { precision: 10, scale: 2 }),

    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),

    // 拆单关联 (Split logic)
    poId: uuid('po_id').references(() => purchaseOrders.id), // 采购单关联
    supplierId: uuid('supplier_id').references(() => suppliers.id), // 供应商关联

    status: orderItemStatusEnum('status').default('PENDING'), // 订单项状态

    remark: text('remark'),
    sortOrder: integer('sort_order').default(0),

    // Snapshot fields
    attributes: jsonb('attributes').default({}),
    calculationParams: jsonb('calculation_params'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    orderItemsOrderIdx: index('idx_order_items_order').on(table.orderId),
}));

export const paymentSchedules = pgTable('payment_schedules', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
    statementId: uuid('statement_id'), // Link to AR Statement (avoid circular ref)

    name: varchar('name', { length: 100 }).notNull(), // Deposit, Balance, etc.
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(), // Scheduled Amount

    // Actual Payment
    actualAmount: decimal('actual_amount', { precision: 12, scale: 2 }),
    paymentMethod: paymentMethodEnum('payment_method'),

    expectedDate: date('expected_date'),
    actualDate: date('actual_date'),

    status: paymentScheduleStatusEnum('status').default('PENDING'),
    proofImg: text('proof_img'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    paymentSchedulesOrderIdx: index('idx_payment_schedules_order').on(table.orderId),
}));

export const orderChanges = pgTable('order_changes', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    orderId: uuid('order_id').references(() => orders.id).notNull(),

    type: changeRequestTypeEnum('type').notNull(),
    reason: text('reason').notNull(),
    status: changeRequestStatusEnum('status').default('PENDING'),

    diffAmount: decimal('diff_amount', { precision: 12, scale: 2 }).default('0'),

    originalData: jsonb('original_data'), // Snapshot of items before change
    newData: jsonb('new_data'), // Proposed new items

    requestedBy: uuid('requested_by').references(() => users.id),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    orderChangesOrderIdx: index('idx_order_changes_order').on(table.orderId),
    orderChangesStatusIdx: index('idx_order_changes_status').on(table.status),
}));
