import { pgTable, uuid, varchar, text, timestamp, decimal, index, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { orders } from './orders';
import { afterSalesStatusEnum, liablePartyTypeEnum, liabilityStatusEnum, liabilityReasonCategoryEnum } from './enums';
import { customers } from './customers';
import { purchaseOrders } from './supply-chain';
import { installTasks } from './service';

/**
 * 售后工单表
 * 记录售后申请及其生命周期状态
 */
export const afterSalesTickets = pgTable('after_sales_tickets', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    ticketNo: varchar('ticket_no', { length: 50 }).unique().notNull(), // 工单号 (AS+日期+序号)
    orderId: uuid('order_id').references(() => orders.id).notNull(), // 关联销售订单
    customerId: uuid('customer_id').references(() => customers.id).notNull(), // 关联客户
    installTaskId: uuid('install_task_id').references(() => installTasks.id), // 关联安装任务 (可选)
    type: varchar('type', { length: 50 }).notNull(), // 类型: RETURN(退货), REPAIR(维修), COMPLAINT(投诉)
    status: afterSalesStatusEnum('status').default('PENDING').notNull(), // 当前状态
    priority: varchar('priority', { length: 20 }).default('MEDIUM'), // 优先级
    description: text('description'), // 问题描述
    photos: text('photos').array(), // OSS 图片数组
    resolution: text('resolution'), // 处理结果/方案描述

    // 成本核算
    estimatedCost: decimal('estimated_cost', { precision: 12, scale: 2 }), // 预估成本
    totalActualCost: decimal('total_actual_cost', { precision: 12, scale: 2 }).default('0.00'), // 实际总成本 (包含运费、补件费等)
    actualDeduction: decimal('actual_deduction', { precision: 12, scale: 2 }).default('0.00'), // 最终扣款总额 (定责后)
    internalLoss: decimal('internal_loss', { precision: 12, scale: 2 }).default('0.00'), // 公司内部净损失

    isWarranty: boolean('is_warranty').default(true), // 是否保修内
    satisfaction: integer('satisfaction'), // 客户满意度 (1-5)
    channelSatisfaction: integer('channel_satisfaction'), // 渠道满意度 (1-5)

    assignedTo: uuid('assigned_to').references(() => users.id), // 当前处理人
    createdBy: uuid('created_by').references(() => users.id),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    closedAt: timestamp('closed_at', { withTimezone: true }), // 关闭时间

    // SLA 监控时限
    slaResponseDeadline: timestamp('sla_response_deadline', { withTimezone: true }), // 响应截止
    slaVisitDeadline: timestamp('sla_visit_deadline', { withTimezone: true }), // 上门截止
    slaClosureDeadline: timestamp('sla_closure_deadline', { withTimezone: true }), // 闭环截止

}, (table) => ({
    tenantIdx: index('idx_as_tenant').on(table.tenantId),
    orderIdx: index('idx_as_order').on(table.orderId),
    customerIdx: index('idx_as_customer').on(table.customerId),
    ticketNoIdx: index('idx_as_ticket_no').on(table.ticketNo),
    statusIdx: index('idx_as_status').on(table.status),
    assignedToIdx: index('idx_as_assigned_to').on(table.assignedTo),
    tenantTypeStatusIdx: index('idx_as_tenant_type_status').on(table.tenantId, table.type, table.status),
}));

/**
 * 定责通知单表
 * 记录售后责任划分及罚款详情
 */
export const liabilityNotices = pgTable('liability_notices', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    noticeNo: varchar('notice_no', { length: 50 }).unique().notNull(), // LN+日期+序号
    afterSalesId: uuid('after_sales_id').references(() => afterSalesTickets.id, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),

    liablePartyType: liablePartyTypeEnum('liable_party_type').notNull(), // 责任方类型: FACTORY, INSTALLER, 等
    liablePartyId: uuid('liable_party_id'), // 具体责任人 ID (供应商或师傅)
    liablePartyCredit: jsonb('liable_party_credit'), // 责任方信用快照

    reason: text('reason').notNull(), // 定责原因
    liabilityReasonCategory: liabilityReasonCategoryEnum('liability_reason_category'), // 定责原因分类 (结构化)

    amount: decimal('amount', { precision: 12, scale: 2 }).notNull(), // 扣款/处罚金额

    // 成本明细 (JSON 存储多种费用构成)
    costItems: jsonb('cost_items'),

    // 追溯关联 (可选)
    sourcePurchaseOrderId: uuid('source_purchase_order_id').references(() => purchaseOrders.id), // 关联采购单
    sourceInstallTaskId: uuid('source_install_task_id').references(() => installTasks.id), // 关联安装单

    status: liabilityStatusEnum('status').default('DRAFT').notNull(), // DRAFT -> PENDING_CONFIRM -> CONFIRMED/DISPUTED -> ARBITRATED
    evidencePhotos: text('evidence_photos').array(), // 证据图片

    // 确认环节
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    confirmedBy: uuid('confirmed_by').references(() => users.id),

    // 争议处理
    disputeReason: text('dispute_reason'), // 争议理由
    disputeEvidence: text('dispute_evidence').array(), // 争议证据图片

    // 仲裁环节
    arbitrationResult: text('arbitration_result'), // 仲裁结果
    arbitratedBy: uuid('arbitrated_by').references(() => users.id),
    arbitratedAt: timestamp('arbitrated_at', { withTimezone: true }),

    // 财务环节
    financeStatus: varchar('finance_status', { length: 20 }).default('PENDING'), // 财务同步: PENDING/SYNCED/FAILED
    financeStatementId: uuid('finance_statement_id'), // 关联生成的对账单 ID
    financeSyncedAt: timestamp('finance_synced_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    tenantIdx: index('idx_ln_tenant').on(table.tenantId),
    afterSalesIdx: index('idx_ln_after_sales').on(table.afterSalesId),
    noticeNoIdx: index('idx_ln_notice_no').on(table.noticeNo),
    tenantPartyStatusIdx: index('idx_ln_tenant_party_status').on(table.tenantId, table.liablePartyType, table.liablePartyId, table.status),
    tenantStatusConfirmedIdx: index('idx_ln_tenant_status_confirmed').on(table.tenantId, table.status, table.confirmedAt),
}));

/**
 * 欠款账本表 (Debt Ledger)
 * 记录售后定责后，扣款金额大于责任方当期待结算金额而产生的历史按批次欠款。
 */
export const debtLedgers = pgTable('debt_ledgers', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    debtNo: varchar('debt_no', { length: 50 }).unique().notNull(), // 欠款单号 DT2026...

    // 责任主体
    liablePartyType: liablePartyTypeEnum('liable_party_type').notNull(),
    liablePartyId: uuid('liable_party_id').notNull(), // 供应商或师傅ID

    // 朔源关联
    originalAfterSalesId: uuid('original_after_sales_id').references(() => afterSalesTickets.id).notNull(), // 引发的原售后工单
    originalLiabilityNoticeId: uuid('original_liability_notice_id').references(() => liabilityNotices.id).notNull(), // 引发的原定责单

    // 金融属性
    originalDeductionAmount: decimal('original_deduction_amount', { precision: 12, scale: 2 }).notNull(), // 定责单初始总金额
    actualDeductedAmount: decimal('actual_deducted_amount', { precision: 12, scale: 2 }).default('0.00').notNull(), // 已还款/已随账期抵扣金额
    remainingDebt: decimal('remaining_debt', { precision: 12, scale: 2 }).notNull(), // 剩余欠款金额 (应等于 originalDeductionAmount - actualDeductedAmount)

    // 状态
    debtStatus: varchar('debt_status', { length: 20 }).default('ACTIVE').notNull(), // ACTIVE, PARTIALLY_SETTLED, FULLY_SETTLED

    // 时间
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    settledAt: timestamp('settled_at', { withTimezone: true }), // 完全结清的时间点
}, (table) => ({
    tenantPartyIdx: index('idx_dl_tenant_party').on(table.tenantId, table.liablePartyType, table.liablePartyId),
    statusIdx: index('idx_dl_status').on(table.debtStatus),
}));
