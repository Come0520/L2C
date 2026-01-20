import { pgTable, uuid, varchar, text, timestamp, decimal, boolean, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { orders, paymentSchedules } from './orders';
import { purchaseOrders, suppliers } from './supply-chain';
import { customers } from './customers';
import { marketChannels } from './catalogs';
import { installTasks } from './service';
import { arStatementStatusEnum, commissionStatusEnum } from './enums';

// ==================== 基础配置表 (Base Configs) ====================

// 财务配置表
export const financeConfigs = pgTable('finance_configs', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    configKey: varchar('config_key', { length: 100 }).notNull(),
    configValue: text('config_value').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_finance_configs_tenant').on(table.tenantId),
    keyIdx: index('idx_finance_configs_key').on(table.configKey),
}));

// 财务账户表 (Financial Accounts)
export const financeAccounts = pgTable('finance_accounts', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    accountNo: varchar('account_no', { length: 50 }).notNull(), // 账户编号
    accountName: varchar('account_name', { length: 100 }).notNull(),
    accountType: varchar('account_type', { length: 20 }).notNull(), // BANK/WECHAT/ALIPAY/CASH
    accountNumber: varchar('account_number', { length: 100 }), // 账号/卡号
    bankName: varchar('bank_name', { length: 100 }), // 开户行
    branchName: varchar('branch_name', { length: 100 }), // 开户支行
    holderName: varchar('holder_name', { length: 100 }).notNull(), // 持有人
    balance: decimal('balance', { precision: 12, scale: 2 }).notNull().default('0'),
    isActive: boolean('is_active').default(true),
    isDefault: boolean('is_default').default(false),
    remark: text('remark'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_finance_accounts_tenant').on(table.tenantId),
    accountNoTenantIdx: uniqueIndex('idx_finance_accounts_no_tenant').on(table.accountNo, table.tenantId),
}));

// 账户流水表 (Account Transactions)
export const accountTransactions = pgTable('account_transactions', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    transactionNo: varchar('transaction_no', { length: 50 }).notNull().unique(),
    accountId: uuid('account_id').references(() => financeAccounts.id).notNull(),
    transactionType: varchar('transaction_type', { length: 20 }).notNull(), // INCOME/EXPENSE
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    balanceBefore: decimal('balance_before', { precision: 12, scale: 2 }).notNull(),
    balanceAfter: decimal('balance_after', { precision: 12, scale: 2 }).notNull(),
    relatedType: varchar('related_type', { length: 50 }).notNull(), // PAYMENT_ORDER/PAYMENT_BILL/LABOR_PAYMENT
    relatedId: uuid('related_id').notNull(),
    remark: text('remark'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_account_transactions_tenant').on(table.tenantId),
    accountIdx: index('idx_account_transactions_account').on(table.accountId),
    relatedIdx: index('idx_account_transactions_related').on(table.relatedId),
}));

// 资金调拨表 (Internal Transfers)
export const internalTransfers = pgTable('internal_transfers', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    transferNo: varchar('transfer_no', { length: 50 }).notNull().unique(),

    fromAccountId: uuid('from_account_id').references(() => financeAccounts.id).notNull(),
    toAccountId: uuid('to_account_id').references(() => financeAccounts.id).notNull(),

    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),

    // 关联的双边流水记录
    fromTransactionId: uuid('from_transaction_id').references(() => accountTransactions.id),
    toTransactionId: uuid('to_transaction_id').references(() => accountTransactions.id),

    status: varchar('status', { length: 20 }).notNull().default('PENDING'), // PENDING/COMPLETED/CANCELLED

    remark: text('remark'),
    createdBy: uuid('created_by').references(() => users.id).notNull(),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_internal_transfers_tenant').on(table.tenantId),
    fromIdx: index('idx_internal_transfers_from').on(table.fromAccountId),
    toIdx: index('idx_internal_transfers_to').on(table.toAccountId),
    statusIdx: index('idx_internal_transfers_status').on(table.status),
}));

// ==================== 应收管理 (AR) ====================

// AR对账单 (AR Statements)
export const arStatements = pgTable('ar_statements', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    statementNo: varchar('statement_no', { length: 50 }).notNull().unique(),
    orderId: uuid('order_id').references(() => orders.id).notNull(),
    customerId: uuid('customer_id').references(() => customers.id).notNull(),
    customerName: varchar('customer_name', { length: 100 }).notNull(),
    settlementType: varchar('settlement_type', { length: 20 }).notNull(), // PREPAID/CREDIT/CASH

    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
    receivedAmount: decimal('received_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    pendingAmount: decimal('pending_amount', { precision: 12, scale: 2 }).notNull(),

    status: arStatementStatusEnum('status').notNull(), // AR对账单状态

    invoiceNo: varchar('invoice_no', { length: 100 }),
    invoicedAt: timestamp('invoiced_at', { withTimezone: true }),

    taxRate: decimal('tax_rate', { precision: 5, scale: 4 }),
    taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }),
    isTaxInclusive: boolean('is_tax_inclusive').default(false),

    completedAt: timestamp('completed_at', { withTimezone: true }),
    salesId: uuid('sales_id').references(() => users.id).notNull(),
    channelId: uuid('channel_id').references(() => marketChannels.id), // 注意：这里关联的是 marketChannels

    commissionRate: decimal('commission_rate', { precision: 5, scale: 4 }),
    commissionAmount: decimal('commission_amount', { precision: 12, scale: 2 }),
    commissionStatus: commissionStatusEnum('commission_status'), // 佣金状态

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
}, (table) => ({
    tenantIdx: index('idx_ar_statements_tenant').on(table.tenantId),
    orderIdx: index('idx_ar_statements_order').on(table.orderId),
    customerIdx: index('idx_ar_statements_customer').on(table.customerId),
    statusIdx: index('idx_ar_statements_status').on(table.status),
}));

// 收款单 (Receipt Bills) - 新版本，支持复杂审批
export const receiptBills = pgTable('receipt_bills', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    receiptNo: varchar('receipt_no', { length: 50 }).notNull().unique(),
    type: varchar('type', { length: 20 }).notNull(), // PREPAID/NORMAL

    customerId: uuid('customer_id').references(() => customers.id),
    customerName: varchar('customer_name', { length: 100 }).notNull(),
    customerPhone: varchar('customer_phone', { length: 20 }).notNull(),

    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
    usedAmount: decimal('used_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    remainingAmount: decimal('remaining_amount', { precision: 12, scale: 2 }).notNull(),

    status: varchar('status', { length: 20 }).notNull(), // DRAFT/PENDING_APPROVAL/APPROVED/REJECTED/VERIFIED/PARTIAL_USED/FULLY_USED

    paymentMethod: varchar('payment_method', { length: 20 }).notNull(),
    accountId: uuid('account_id').references(() => financeAccounts.id),
    proofUrl: text('proof_url').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
    remark: text('remark'),

    createdBy: uuid('created_by').references(() => users.id).notNull(),
    verifiedBy: uuid('verified_by').references(() => users.id),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_receipt_bills_tenant').on(table.tenantId),
    customerIdx: index('idx_receipt_bills_customer').on(table.customerId),
    statusIdx: index('idx_receipt_bills_status').on(table.status),
}));

// 收款单-订单关联明细 (Receipt Bill Items)
export const receiptBillItems = pgTable('receipt_bill_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    receiptBillId: uuid('receipt_bill_id').references(() => receiptBills.id, { onDelete: 'cascade' }).notNull(),
    orderId: uuid('order_id').references(() => orders.id).notNull(),
    statementId: uuid('statement_id').references(() => arStatements.id),
    scheduleId: uuid('schedule_id').references(() => paymentSchedules.id),
    orderNo: varchar('order_no', { length: 50 }).notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    receiptBillIdx: index('idx_receipt_bill_items_receipt').on(table.receiptBillId),
    orderIdx: index('idx_receipt_bill_items_order').on(table.orderId),
}));

/**
 * 收款单 (Payment Orders)
 * @deprecated 请使用 receiptBills 替代。此表为遗留表，计划在 v2.0 版本移除。
 * @see receiptBills
 */
export const paymentOrders = pgTable('payment_orders', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    paymentNo: varchar('payment_no', { length: 50 }).notNull().unique(),
    type: varchar('type', { length: 20 }).notNull(), // PREPAID/NORMAL

    customerId: uuid('customer_id').references(() => customers.id), // 预收款可以为空? 需求说关联已有客户
    customerName: varchar('customer_name', { length: 100 }).notNull(),
    customerPhone: varchar('customer_phone', { length: 20 }).notNull(),

    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
    usedAmount: decimal('used_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    remainingAmount: decimal('remaining_amount', { precision: 12, scale: 2 }).notNull(),

    status: varchar('status', { length: 20 }).notNull(), // DRAFT/PENDING/VERIFIED/REJECTED/PARTIAL_USED/FULLY_USED

    paymentMethod: varchar('payment_method', { length: 20 }).notNull(),
    accountId: uuid('account_id').references(() => financeAccounts.id),
    proofUrl: text('proof_url').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
    remark: text('remark'),

    createdBy: uuid('created_by').references(() => users.id).notNull(),
    verifiedBy: uuid('verified_by').references(() => users.id),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_payment_orders_tenant').on(table.tenantId),
    customerIdx: index('idx_payment_orders_customer').on(table.customerId),
    statusIdx: index('idx_payment_orders_status').on(table.status),
}));

// 收款单-订单关联明细 (Payment Order Items)
export const paymentOrderItems = pgTable('payment_order_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    paymentOrderId: uuid('payment_order_id').references(() => paymentOrders.id).notNull(),
    orderId: uuid('order_id').references(() => orders.id).notNull(),
    statementId: uuid('statement_id').references(() => arStatements.id), // Link to AR Statement
    scheduleId: uuid('schedule_id').references(() => paymentSchedules.id), // Link to specific schedule node (Deposit etc)
    orderNo: varchar('order_no', { length: 50 }).notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    paymentOrderIdx: index('idx_payment_order_items_payment').on(table.paymentOrderId),
    orderIdx: index('idx_payment_order_items_order').on(table.orderId),
}));

// 佣金记录表 (Commission Records)
export const commissionRecords = pgTable('commission_records', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    commissionNo: varchar('commission_no', { length: 50 }).notNull().unique(),
    arStatementId: uuid('ar_statement_id').references(() => arStatements.id).notNull(),

    orderId: uuid('order_id').references(() => orders.id).notNull(),

    channelId: uuid('channel_id').references(() => marketChannels.id).notNull(),
    channelName: varchar('channel_name', { length: 100 }).notNull(),
    cooperationMode: varchar('cooperation_mode', { length: 20 }).notNull(), // BASE_PRICE/REBATE

    orderAmount: decimal('order_amount', { precision: 12, scale: 2 }).notNull(),
    commissionRate: decimal('commission_rate', { precision: 5, scale: 4 }).notNull(),
    commissionAmount: decimal('commission_amount', { precision: 12, scale: 2 }).notNull(),

    status: varchar('status', { length: 20 }).notNull(), // PENDING/CALCULATED/PENDING_PAYMENT/PAID
    calculatedAt: timestamp('calculated_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),

    remark: text('remark'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_commission_records_tenant').on(table.tenantId),
    channelIdx: index('idx_commission_records_channel').on(table.channelId),
    arIdx: index('idx_commission_records_ar').on(table.arStatementId),
}));

// ==================== 应付管理 (AP) ====================

// 供应商对账单 (AP Supplier Statements)
export const apSupplierStatements = pgTable('ap_supplier_statements', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    statementNo: varchar('statement_no', { length: 50 }).notNull().unique(),

    purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id).notNull(),
    supplierId: uuid('supplier_id').references(() => suppliers.id).notNull(),
    supplierName: varchar('supplier_name', { length: 100 }).notNull(),

    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
    paidAmount: decimal('paid_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    pendingAmount: decimal('pending_amount', { precision: 12, scale: 2 }).notNull(),

    status: varchar('status', { length: 20 }).notNull(), // PENDING/RECONCILED/INVOICED/PARTIAL/PAID/COMPLETED

    invoiceNo: varchar('invoice_no', { length: 100 }),
    invoicedAt: timestamp('invoiced_at', { withTimezone: true }),
    invoiceAmount: decimal('invoice_amount', { precision: 12, scale: 2 }),

    taxRate: decimal('tax_rate', { precision: 5, scale: 4 }),
    taxAmount: decimal('tax_amount', { precision: 12, scale: 2 }),
    isTaxInclusive: boolean('is_tax_inclusive').default(false),

    completedAt: timestamp('completed_at', { withTimezone: true }),
    purchaserId: uuid('purchaser_id').references(() => users.id).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_ap_supplier_statements_tenant').on(table.tenantId),
    poIdx: index('idx_ap_supplier_statements_po').on(table.purchaseOrderId),
    supplierIdx: index('idx_ap_supplier_statements_supplier').on(table.supplierId),
}));

// 付款单 (Payment Bills)
export const paymentBills = pgTable('payment_bills', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    paymentNo: varchar('payment_no', { length: 50 }).notNull().unique(),
    type: varchar('type', { length: 20 }).default('SUPPLIER'), // SUPPLIER/LABOR

    // 关联方信息
    payeeType: varchar('payee_type', { length: 20 }).notNull(), // SUPPLIER/WORKER/CUSTOMER
    payeeId: uuid('payee_id').notNull(),
    payeeName: varchar('payee_name', { length: 100 }).notNull(),

    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(), // DRAFT/PENDING/VERIFIED/REJECTED/PAID

    paymentMethod: varchar('payment_method', { length: 20 }).notNull(),
    accountId: uuid('account_id').references(() => financeAccounts.id),
    proofUrl: text('proof_url').notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),

    recordedBy: uuid('recorded_by').references(() => users.id).notNull(),
    remark: text('remark'),

    isVerified: boolean('is_verified').default(false),
    verifiedBy: uuid('verified_by').references(() => users.id),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_payment_bills_tenant').on(table.tenantId),
    payeeIdx: index('idx_payment_bills_payee').on(table.payeeId),
}));

// 付款单-对账单关联 (Payment Bill Items) - 支持一笔付款对应多个对账单
export const paymentBillItems = pgTable('payment_bill_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    paymentBillId: uuid('payment_bill_id').references(() => paymentBills.id).notNull(),

    statementType: varchar('statement_type', { length: 50 }).notNull(), // AP_SUPPLIER/AP_LABOR
    statementId: uuid('statement_id').notNull(),
    statementNo: varchar('statement_no', { length: 50 }).notNull(),

    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    billIdx: index('idx_payment_bill_items_bill').on(table.paymentBillId),
    statementIdx: index('idx_payment_bill_items_statement').on(table.statementId),
}));

// 劳务结算单 (AP Labor Statements)
export const apLaborStatements = pgTable('ap_labor_statements', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    statementNo: varchar('statement_no', { length: 50 }).notNull().unique(),

    workerId: uuid('worker_id').references(() => users.id).notNull(),
    workerName: varchar('worker_name', { length: 100 }).notNull(),
    settlementPeriod: varchar('settlement_period', { length: 20 }).notNull(), // 2026-01

    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
    paidAmount: decimal('paid_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    pendingAmount: decimal('pending_amount', { precision: 12, scale: 2 }).notNull(),

    status: varchar('status', { length: 20 }).notNull(), // PENDING/CALCULATED/VERIFIED/PARTIAL/PAID/COMPLETED

    completedAt: timestamp('completed_at', { withTimezone: true }),
    verifiedBy: uuid('verified_by').references(() => users.id),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_ap_labor_statements_tenant').on(table.tenantId),
    workerIdx: index('idx_ap_labor_statements_worker').on(table.workerId),
}));

// 劳务费用明细 (AP Labor Fee Details)
// 支持正常安装费用和售后扣款记录
export const apLaborFeeDetails = pgTable('ap_labor_fee_details', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    statementId: uuid('statement_id').references(() => apLaborStatements.id).notNull(),

    // 安装任务关联 (可选 - 扣款记录可能不关联特定安装单)
    installTaskId: uuid('install_task_id').references(() => installTasks.id),
    installTaskNo: varchar('install_task_no', { length: 50 }),

    // 售后定责单关联 (用于扣款记录)
    liabilityNoticeId: uuid('liability_notice_id'),
    liabilityNoticeNo: varchar('liability_notice_no', { length: 50 }),

    feeType: varchar('fee_type', { length: 20 }).notNull(), // BASE/ADDITIONAL/DEDUCTION
    description: varchar('description', { length: 200 }).notNull(),
    calculation: varchar('calculation', { length: 200 }).notNull(),
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(), // 扣款为负数

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    statementIdx: index('idx_ap_labor_fee_details_statement').on(table.statementId),
    taskIdx: index('idx_ap_labor_fee_details_task').on(table.installTaskId),
    liabilityIdx: index('idx_ap_labor_fee_details_liability').on(table.liabilityNoticeId),
}));

// ==================== 对账管理 (Reconciliation) ====================

// 对账单 (Reconciliations)
export const reconciliations = pgTable('reconciliations', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    reconciliationNo: varchar('reconciliation_no', { length: 50 }).notNull().unique(),

    reconciliationType: varchar('reconciliation_type', { length: 20 }).notNull(), // CUSTOMER/SUPPLIER/CHANNEL/INTERNAL
    targetType: varchar('target_type', { length: 20 }).notNull(),
    targetId: uuid('target_id').notNull(),
    targetName: varchar('target_name', { length: 100 }).notNull(),

    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
    matchedAmount: decimal('matched_amount', { precision: 12, scale: 2 }).notNull().default('0'),
    unmatchedAmount: decimal('unmatched_amount', { precision: 12, scale: 2 }).notNull().default('0'),

    status: varchar('status', { length: 20 }).notNull(), // PENDING/RECONCILING/MATCHED/UNMATCHED/CONFIRMED/COMPLETED

    reconciledAt: timestamp('reconciled_at', { withTimezone: true }),
    confirmedBy: uuid('confirmed_by').references(() => users.id),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    remark: text('remark'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_reconciliations_tenant').on(table.tenantId),
    targetIdx: index('idx_reconciliations_target').on(table.targetId),
    statusIdx: index('idx_reconciliations_status').on(table.status),
}));

// 对账明细 (Reconciliation Details)
export const reconciliationDetails = pgTable('reconciliation_details', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    reconciliationId: uuid('reconciliation_id').references(() => reconciliations.id).notNull(),

    documentType: varchar('document_type', { length: 50 }).notNull(), // AR_STATEMENT/PAYMENT_ORDER...
    documentId: uuid('document_id').notNull(),
    documentNo: varchar('document_no', { length: 50 }).notNull(),
    documentAmount: decimal('document_amount', { precision: 12, scale: 2 }).notNull(),

    reconciliationAmount: decimal('reconciliation_amount', { precision: 12, scale: 2 }).notNull(),
    difference: decimal('difference', { precision: 12, scale: 2 }).notNull(),

    status: varchar('status', { length: 20 }).notNull(), // PENDING/MATCHED/UNMATCHED
    remark: text('remark'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    reconIdx: index('idx_reconciliation_details_recon').on(table.reconciliationId),
    docIdx: index('idx_reconciliation_details_doc').on(table.documentId),
}));

