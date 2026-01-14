import { pgTable, uuid, varchar, text, timestamp, decimal, index, integer, date, boolean } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { customers } from './customers';
import { quotes, quoteItems } from './quotes';
import { products } from './catalogs';
import {
    settlementTypeEnum,
    orderStatusEnum,
    productCategoryEnum,
    paymentMethodEnum,
    paymentScheduleStatusEnum
} from './enums';

export const orders = pgTable('orders', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    orderNo: varchar('order_no', { length: 50 }).unique().notNull(),

    quoteId: uuid('quote_id').references(() => quotes.id).notNull(),
    quoteVersionId: uuid('quote_version_id').notNull(), // Should reference quote_versions if exists, or just UUID

    leadId: uuid('lead_id'), // Optional link to lead

    customerId: uuid('customer_id').references(() => customers.id).notNull(),
    customerName: varchar('customer_name', { length: 100 }), // Denormalized for quick access
    customerPhone: varchar('customer_phone', { length: 20 }), // Denormalized for quick access
    deliveryAddress: text('delivery_address'),

    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).default('0'),
    paidAmount: decimal('paid_amount', { precision: 12, scale: 2 }).default('0'),
    balanceAmount: decimal('balance_amount', { precision: 12, scale: 2 }).default('0'),

    settlementType: settlementTypeEnum('settlement_type').notNull(),

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

    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
    orderTenantIdx: index('idx_orders_tenant').on(table.tenantId),
    orderCustomerIdx: index('idx_orders_customer').on(table.customerId),
    orderQuoteIdx: index('idx_orders_quote').on(table.quoteId),
    orderNoIdx: index('idx_orders_order_no').on(table.orderNo),
}));

export const orderItems = pgTable('order_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    orderId: uuid('order_id').references(() => orders.id).notNull(),

    quoteItemId: uuid('quote_item_id').references(() => quoteItems.id).notNull(),

    roomName: varchar('room_name', { length: 100 }).notNull(),

    productId: uuid('product_id').references(() => products.id).notNull(),
    productName: varchar('product_name', { length: 200 }).notNull(),
    category: productCategoryEnum('category').notNull(),

    quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
    width: decimal('width', { precision: 10, scale: 2 }),
    height: decimal('height', { precision: 10, scale: 2 }),

    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
    subtotal: decimal('subtotal', { precision: 12, scale: 2 }).notNull(),

    // Split logic
    poId: uuid('po_id'), // Will reference purchase_orders later
    supplierId: uuid('supplier_id'), // Will reference suppliers

    status: varchar('status', { length: 50 }).default('PENDING'), // Item level status

    remark: text('remark'),
    sortOrder: integer('sort_order').default(0),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    orderItemsOrderIdx: index('idx_order_items_order').on(table.orderId),
}));

export const paymentSchedules = pgTable('payment_schedules', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    orderId: uuid('order_id').references(() => orders.id).notNull(),
    statementId: uuid('statement_id'), // Link to AR Statement (avoid circular ref)

    name: varchar('name', { length: 100 }).notNull(), // Deposit, Balance, etc.
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),

    expectedDate: date('expected_date'),
    actualDate: date('actual_date'),

    status: paymentScheduleStatusEnum('status').default('PENDING'),
    proofImg: text('proof_img'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    paymentSchedulesOrderIdx: index('idx_payment_schedules_order').on(table.orderId),
}));
