import { pgTable, uuid, varchar, text, timestamp, decimal, boolean, index, uniqueIndex, date, integer } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { orders, paymentSchedules } from './orders';
import { purchaseOrders, suppliers } from './supply-chain';
import { customers } from './customers';
import { marketChannels } from './catalogs';
import { installTasks } from './service';
import {
    arStatementStatusEnum,
    commissionStatusEnum,
    accountCategoryEnum,
    journalEntryStatusEnum,
    journalSourceTypeEnum,
    accountingPeriodStatusEnum,
    financeAuditActionEnum,
} from './enums';

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
    accountType: varchar('account_type', { length: 20 }).notNull(), // BANK/WECHAT/ALIPAY/CASH/VIRTUAL (虚拟账户，如用户待结余额)
    accountNumber: varchar('account_number', { length: 100 }), // 账号/卡号
    bankName: varchar('bank_name', { length: 100 }), // 开户行
    branchName: varchar('branch_name', { length: 100 }), // 开户支行
    holderName: varchar('holder_name', { length: 100 }).notNull(), // 持有人
    balance: decimal('balance', { precision: 12, scale: 2 }).notNull().default('0'),
    isActive: boolean('is_active').default(true),
    isDefault: boolean('is_default').default(false),
    remark: text('remark'),
    version: integer('version').notNull().default(1),
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

    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
}, (table) => ({
    tenantIdx: index('idx_ar_statements_tenant').on(table.tenantId),
    orderIdx: index('idx_ar_statements_order').on(table.orderId),
    customerIdx: index('idx_ar_statements_customer').on(table.customerId),
    statusIdx: index('idx_ar_statements_status').on(table.status),
}));

// 收款计划节点表 (Payment Plan Nodes)
export const paymentPlanNodes = pgTable('payment_plan_nodes', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    arStatementId: uuid('ar_statement_id').references(() => arStatements.id).notNull(),

    nodeIndex: integer('node_index').notNull(), // 1, 2, 3...
    nodeName: varchar('node_name', { length: 100 }).notNull(), // 定金, 尾款...
    percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(), // 30.00
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
    dueDate: date('due_date'),

    status: varchar('status', { length: 20 }).notNull().default('PENDING'), // PENDING/PAID/OVERDUE

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_payment_plan_nodes_tenant').on(table.tenantId),
    arIdx: index('idx_payment_plan_nodes_ar').on(table.arStatementId),
}));

// 收款单 (Receipt Bills) - 新版本，支持复杂审批
export const receiptBills = pgTable('receipt_bills', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    receiptNo: varchar('receipt_no', { length: 50 }).notNull().unique(),
    type: varchar('type', { length: 20 }).notNull(), // PREPAID/NORMAL/REFUND (退款给供应商)

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

    version: integer('version').notNull().default(1),
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
    version: integer('version').notNull().default(1),
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
    type: varchar('type', { length: 20 }).default('SUPPLIER'), // SUPPLIER/LABOR/REFUND (客户退款)

    // 关联方信息
    payeeType: varchar('payee_type', { length: 20 }).notNull(), // SUPPLIER/WORKER/CUSTOMER
    payeeId: uuid('payee_id').notNull(),
    payeeName: varchar('payee_name', { length: 100 }).notNull(),

    // 关联订单 (用于客户退款场景溯源)
    orderId: uuid('order_id').references(() => orders.id),

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

    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_payment_bills_tenant').on(table.tenantId),
    payeeIdx: index('idx_payment_bills_payee').on(table.payeeId),
    orderIdx: index('idx_payment_bills_order').on(table.orderId),
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

// ==================== 逆向流程 (Refunds/Adjustments) ====================

/**
 * 贷项通知单 (Credit Notes)
 * 用于客户退款、折让等场景，减少客户应收款
 * 
 * 业务场景：
 * - 客户退货退款
 * - 销售折让
 * - 价格调整（减少）
 */
export const creditNotes = pgTable('credit_notes', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    creditNoteNo: varchar('credit_note_no', { length: 50 }).notNull().unique(),

    // 关联信息
    customerId: uuid('customer_id').references(() => customers.id).notNull(),
    customerName: varchar('customer_name', { length: 100 }).notNull(),
    orderId: uuid('order_id').references(() => orders.id), // 关联原订单（可选）
    arStatementId: uuid('ar_statement_id').references(() => arStatements.id), // 关联AR对账单

    // 类型和金额
    type: varchar('type', { length: 20 }).notNull(), // REFUND/DISCOUNT/ADJUSTMENT
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),

    // 原因和说明
    reason: varchar('reason', { length: 200 }).notNull(),
    description: text('description'),

    // 状态流转
    status: varchar('status', { length: 20 }).notNull().default('DRAFT'), // DRAFT/PENDING/APPROVED/REJECTED/APPLIED

    // 审批信息
    appliedAt: timestamp('applied_at', { withTimezone: true }), // 生效时间
    createdBy: uuid('created_by').references(() => users.id).notNull(),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),

    remark: text('remark'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_credit_notes_tenant').on(table.tenantId),
    customerIdx: index('idx_credit_notes_customer').on(table.customerId),
    statusIdx: index('idx_credit_notes_status').on(table.status),
}));

/**
 * 借项通知单 (Debit Notes)
 * 用于供应商退款、扣款等场景，减少对供应商应付款
 * 
 * 业务场景：
 * - 供应商质量问题扣款
 * - 采购退货
 * - 价格调整（减少应付）
 */
export const debitNotes = pgTable('debit_notes', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    debitNoteNo: varchar('debit_note_no', { length: 50 }).notNull().unique(),

    // 关联信息
    supplierId: uuid('supplier_id').references(() => suppliers.id).notNull(),
    supplierName: varchar('supplier_name', { length: 100 }).notNull(),
    purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id), // 关联原采购单
    apStatementId: uuid('ap_statement_id').references(() => apSupplierStatements.id), // 关联AP对账单

    // 类型和金额
    type: varchar('type', { length: 20 }).notNull(), // RETURN/QUALITY_DEDUCTION/ADJUSTMENT
    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),

    // 原因和说明
    reason: varchar('reason', { length: 200 }).notNull(),
    description: text('description'),

    // 状态流转
    status: varchar('status', { length: 20 }).notNull().default('DRAFT'), // DRAFT/PENDING/APPROVED/REJECTED/APPLIED

    // 审批信息
    appliedAt: timestamp('applied_at', { withTimezone: true }), // 生效时间
    createdBy: uuid('created_by').references(() => users.id).notNull(),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),

    remark: text('remark'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_debit_notes_tenant').on(table.tenantId),
    supplierIdx: index('idx_debit_notes_supplier').on(table.supplierId),
    statusIdx: index('idx_debit_notes_status').on(table.status),
}));

// ==================== 对账确认 (Statement Confirmations) ====================

/**
 * 账单确认主表 (Statement Confirmations)
 * 用于月结客户/供应商的定期对账确认
 * 
 * 业务场景：
 * - 每月向月结客户发送对账单
 * - 客户确认应收金额
 * - 供应商确认应付金额
 */
export const statementConfirmations = pgTable('statement_confirmations', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    confirmationNo: varchar('confirmation_no', { length: 50 }).notNull().unique(),

    // 对账类型：客户对账 / 供应商对账
    type: varchar('type', { length: 20 }).notNull(), // CUSTOMER/SUPPLIER

    // 对账对象
    targetId: uuid('target_id').notNull(), // customerId or supplierId
    targetName: varchar('target_name', { length: 100 }).notNull(),

    // 对账周期
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    periodLabel: varchar('period_label', { length: 50 }).notNull(), // 例如 "2026年1月"

    // 汇总金额
    totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(), // 账单总额
    confirmedAmount: decimal('confirmed_amount', { precision: 12, scale: 2 }).default('0'), // 已确认金额
    disputedAmount: decimal('disputed_amount', { precision: 12, scale: 2 }).default('0'), // 争议金额

    // 状态
    status: varchar('status', { length: 20 }).notNull().default('PENDING'), // PENDING/SENT/CONFIRMED/DISPUTED/RESOLVED

    // 确认信息
    sentAt: timestamp('sent_at', { withTimezone: true }), // 发送时间
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }), // 确认时间
    confirmedBy: varchar('confirmed_by', { length: 100 }), // 对方确认人

    // 元数据
    remark: text('remark'),
    createdBy: uuid('created_by').references(() => users.id).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_statement_confirmations_tenant').on(table.tenantId),
    targetIdx: index('idx_statement_confirmations_target').on(table.targetId),
    periodIdx: index('idx_statement_confirmations_period').on(table.periodStart, table.periodEnd),
    statusIdx: index('idx_statement_confirmations_status').on(table.status),
}));

/**
 * 账单确认明细表 (Statement Confirmation Details)
 * 包含每张对账单的明细
 */
export const statementConfirmationDetails = pgTable('statement_confirmation_details', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    confirmationId: uuid('confirmation_id').references(() => statementConfirmations.id).notNull(),

    // 关联的原始单据
    documentType: varchar('document_type', { length: 30 }).notNull(), // AR_STATEMENT/AP_SUPPLIER_STATEMENT/AP_LABOR_STATEMENT
    documentId: uuid('document_id').notNull(),
    documentNo: varchar('document_no', { length: 50 }).notNull(),
    documentDate: date('document_date').notNull(),

    // 金额
    documentAmount: decimal('document_amount', { precision: 12, scale: 2 }).notNull(),

    // 确认状态
    status: varchar('status', { length: 20 }).notNull().default('PENDING'), // PENDING/CONFIRMED/DISPUTED
    disputeReason: text('dispute_reason'), // 争议原因

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    confirmationIdx: index('idx_statement_confirmation_details_confirmation').on(table.confirmationId),
    documentIdx: index('idx_statement_confirmation_details_doc').on(table.documentId),
}));

// ==================== 会计模块 (Accounting) ====================

// 会计科目表 (Chart of Accounts)
export const chartOfAccounts = pgTable('chart_of_accounts', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    code: varchar('code', { length: 20 }).notNull(),           // 科目编码（如 1001, 2001）
    name: varchar('name', { length: 100 }).notNull(),           // 科目名称
    category: accountCategoryEnum('category').notNull(),        // 五大类
    parentId: uuid('parent_id'),                                // 父科目 ID（自引用）
    level: integer('level').notNull().default(1),               // 层级（1=一级科目）
    isActive: boolean('is_active').notNull().default(true),     // 是否启用
    isSystemDefault: boolean('is_system_default').notNull().default(false), // 是否系统内置
    description: text('description'),                           // 科目说明
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_chart_of_accounts_tenant').on(table.tenantId),
    codeTenantIdx: uniqueIndex('idx_chart_of_accounts_code_tenant').on(table.code, table.tenantId),
    categoryIdx: index('idx_chart_of_accounts_category').on(table.category),
    parentIdx: index('idx_chart_of_accounts_parent').on(table.parentId),
}));

// 账期管理表 (Accounting Periods)
export const accountingPeriods = pgTable('accounting_periods', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    year: integer('year').notNull(),                            // 年份
    month: integer('month').notNull(),                          // 月份 (1-12)
    quarter: integer('quarter').notNull(),                      // 季度 (1-4)
    status: accountingPeriodStatusEnum('status').notNull().default('OPEN'),
    closedBy: uuid('closed_by').references(() => users.id),     // 关账操作人
    closedAt: timestamp('closed_at', { withTimezone: true }),   // 关账时间
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_accounting_periods_tenant').on(table.tenantId),
    yearMonthTenantIdx: uniqueIndex('idx_accounting_periods_ym_tenant').on(table.year, table.month, table.tenantId),
    statusIdx: index('idx_accounting_periods_status').on(table.status),
}));

// 凭证主表 (Journal Entries)
export const journalEntries = pgTable('journal_entries', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    voucherNo: varchar('voucher_no', { length: 50 }).notNull(), // 凭证编号（如 PZ-2026-02-001）
    periodId: uuid('period_id').references(() => accountingPeriods.id).notNull(), // 所属账期
    entryDate: date('entry_date').notNull(),                    // 凭证日期
    description: text('description'),                           // 摘要
    status: journalEntryStatusEnum('status').notNull().default('DRAFT'),
    sourceType: journalSourceTypeEnum('source_type').notNull().default('MANUAL'), // 来源类型
    sourceId: uuid('source_id'),                                // 来源单据 ID（如收款单 ID）
    currency: varchar('currency', { length: 3 }).notNull().default('CNY'), // [优化预留] 多币种架构支持：外币交易币种
    exchangeRate: decimal('exchange_rate', { precision: 15, scale: 6 }).notNull().default('1.000000'), // [优化预留] 多币种架构支持：记账本位币汇率
    isReversal: boolean('is_reversal').notNull().default(false), // 是否为红字冲销凭证
    reversedEntryId: uuid('reversed_entry_id'),                 // 被冲销的原凭证 ID
    totalDebit: decimal('total_debit', { precision: 15, scale: 2 }).notNull().default('0'), // 借方合计
    totalCredit: decimal('total_credit', { precision: 15, scale: 2 }).notNull().default('0'), // 贷方合计
    createdBy: uuid('created_by').references(() => users.id).notNull(), // 制单人
    reviewedBy: uuid('reviewed_by').references(() => users.id),  // 复核人
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }), // 复核时间
    postedAt: timestamp('posted_at', { withTimezone: true }),     // 记账时间
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
}, (table) => ({
    tenantIdx: index('idx_journal_entries_tenant').on(table.tenantId),
    voucherNoTenantIdx: uniqueIndex('idx_journal_entries_voucher_tenant').on(table.voucherNo, table.tenantId),
    periodIdx: index('idx_journal_entries_period').on(table.periodId),
    statusIdx: index('idx_journal_entries_status').on(table.status),
    sourceIdx: index('idx_journal_entries_source').on(table.sourceType, table.sourceId),
    dateIdx: index('idx_journal_entries_date').on(table.entryDate),
}));

// 凭证明细表 - 借贷分录 (Journal Entry Lines)
export const journalEntryLines = pgTable('journal_entry_lines', {
    id: uuid('id').defaultRandom().primaryKey(),
    entryId: uuid('entry_id').references(() => journalEntries.id).notNull(), // 所属凭证
    accountId: uuid('account_id').references(() => chartOfAccounts.id).notNull(), // 会计科目
    debitAmount: decimal('debit_amount', { precision: 15, scale: 2 }).notNull().default('0'),  // 借方金额
    creditAmount: decimal('credit_amount', { precision: 15, scale: 2 }).notNull().default('0'), // 贷方金额
    description: text('description'),                           // 行摘要
    sortOrder: integer('sort_order').notNull().default(0),      // 排序序号
}, (table) => ({
    entryIdx: index('idx_journal_entry_lines_entry').on(table.entryId),
    accountIdx: index('idx_journal_entry_lines_account').on(table.accountId),
}));

// 费用录入表 (Expense Records)
export const expenseRecords = pgTable('expense_records', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    periodId: uuid('period_id').references(() => accountingPeriods.id),   // 所属账期
    accountId: uuid('account_id').references(() => chartOfAccounts.id).notNull(), // 费用科目
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),    // 金额
    description: text('description').notNull(),                          // 费用说明
    expenseDate: date('expense_date').notNull(),                         // 费用发生日期
    importBatchId: varchar('import_batch_id', { length: 50 }),           // Excel 导入批次号
    journalEntryId: uuid('journal_entry_id'),                            // 关联的凭证 ID
    createdBy: uuid('created_by').references(() => users.id).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_expense_records_tenant').on(table.tenantId),
    periodIdx: index('idx_expense_records_period').on(table.periodId),
    accountIdx: index('idx_expense_records_account').on(table.accountId),
    dateIdx: index('idx_expense_records_date').on(table.expenseDate),
}));

// 自动凭证规则配置表 (Voucher Templates)
export const voucherTemplates = pgTable('voucher_templates', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    sourceType: journalSourceTypeEnum('source_type').notNull(),          // 业务来源类型
    name: varchar('name', { length: 100 }).notNull(),                   // 规则名称
    debitAccountId: uuid('debit_account_id').references(() => chartOfAccounts.id).notNull(), // 借方科目
    creditAccountId: uuid('credit_account_id').references(() => chartOfAccounts.id).notNull(), // 贷方科目
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
}, (table) => ({
    tenantIdx: index('idx_voucher_templates_tenant').on(table.tenantId),
    sourceTypeTenantIdx: uniqueIndex('idx_voucher_templates_source_tenant').on(table.sourceType, table.tenantId),
}));

// 财务审计日志表 (Finance Audit Logs)
export const financeAuditLogs = pgTable('finance_audit_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    userId: uuid('user_id').references(() => users.id).notNull(),       // 操作人
    action: financeAuditActionEnum('action').notNull(),                  // 操作类型
    entityType: varchar('entity_type', { length: 50 }).notNull(),       // 实体类型（如 journal_entry, period）
    entityId: uuid('entity_id').notNull(),                               // 实体 ID
    beforeData: text('before_data'),                                     // 操作前数据（JSON 字符串）
    afterData: text('after_data'),                                       // 操作后数据（JSON 字符串）
    ipAddress: varchar('ip_address', { length: 45 }),                    // 操作 IP
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_finance_audit_logs_tenant').on(table.tenantId),
    entityIdx: index('idx_finance_audit_logs_entity').on(table.entityType, table.entityId),
    userIdx: index('idx_finance_audit_logs_user').on(table.userId),
    dateIdx: index('idx_finance_audit_logs_date').on(table.createdAt),
}));
