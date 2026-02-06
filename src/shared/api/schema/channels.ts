import { pgTable, uuid, varchar, text, timestamp, decimal, jsonb, boolean, index, integer } from 'drizzle-orm/pg-core';
import { tenants, users } from './infrastructure';
import { channelTypeEnum, channelLevelEnum, commissionTypeEnum, cooperationModeEnum, channelSettlementTypeEnum, channelCategoryEnum, channelStatusEnum, commissionTriggerModeEnum } from './enums';

// 渠道类型表 (Channel Categories)
// 支持租户自定义渠道分类，如：装修公司、设计师、跨界合作等
export const channelCategories = pgTable('channel_categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    name: varchar('name', { length: 50 }).notNull(),           // 类型名称
    code: varchar('code', { length: 50 }).notNull(),           // 类型代码
    description: text('description'),                           // 描述
    isActive: boolean('is_active').default(true),              // 是否启用
    sortOrder: integer('sort_order').default(0),               // 排序
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
}, (table) => ({
    categoryTenantIdx: index('idx_channel_categories_tenant').on(table.tenantId),
    categoryCodeIdx: index('idx_channel_categories_code').on(table.tenantId, table.code),
}));

export const channels = pgTable('channels', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

    // 多层级支持 (Multi-level Hierarchy)
    parentId: uuid('parent_id'),  // 自引用，指向父级渠道（无法直接 references，需要关系定义）
    hierarchyLevel: integer('hierarchy_level').default(1).notNull(),  // 层级深度：1=一级，2=二级，3=三级
    categoryId: uuid('category_id').references(() => channelCategories.id),  // 关联渠道类型表

    // Core Info
    category: channelCategoryEnum('category').notNull().default('OFFLINE'),
    channelType: channelTypeEnum('channel_type').notNull(),
    customChannelType: varchar('custom_channel_type', { length: 50 }), // 自定义渠道类型名称 (当 channelType=OTHER 时使用)
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
    creditLimit: decimal('credit_limit', { precision: 15, scale: 2 }).default('0'), // 月结渠道授信额度
    commissionTriggerMode: commissionTriggerModeEnum('commission_trigger_mode').default('PAYMENT_COMPLETED'), // 佣金触发时机
    bankInfo: jsonb('bank_info'),

    // Attachments
    contractFiles: jsonb('contract_files'), // OSS Keys

    // Stats (Denormalized)
    totalLeads: integer('total_leads').default(0),
    totalDealAmount: decimal('total_deal_amount', { precision: 15, scale: 2 }).default('0'),

    status: channelStatusEnum('status').default('ACTIVE'), // 渠道状态

    assignedManagerId: uuid('assigned_manager_id').references(() => users.id),

    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().$onUpdateFn(() => new Date()),
}, (table) => ({
    channelTenantIdx: index('idx_channels_tenant').on(table.tenantId),
    channelCodeIdx: index('idx_channels_code').on(table.code),
    channelPhoneIdx: index('idx_channels_phone').on(table.phone),
    channelParentIdx: index('idx_channels_parent').on(table.parentId),  // 层级查询优化
}));

export const channelContacts = pgTable('channel_contacts', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    channelId: uuid('channel_id').references(() => channels.id, { onDelete: 'cascade' }).notNull(),

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

// 渠道佣金记录表 (Channel Commissions)
// 记录每一笔订单产生的渠道佣金
export const channelCommissions = pgTable('channel_commissions', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    channelId: uuid('channel_id').references(() => channels.id).notNull(),

    leadId: uuid('lead_id'), // 可选，关联线索
    orderId: uuid('order_id'), // 关联订单

    // 佣金计算字段
    commissionType: cooperationModeEnum('commission_type'), // BASE_PRICE(底价供货) / COMMISSION(返佣)
    orderAmount: decimal('order_amount', { precision: 15, scale: 2 }), // 订单实付金额
    commissionRate: decimal('commission_rate', { precision: 5, scale: 4 }), // 返点比例 (如 0.1000 表示 10%)
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(), // 佣金金额

    // 状态: PENDING(待结算) / SETTLED(已结算) / PAID(已支付) / VOID(已作废)
    status: varchar('status', { length: 20 }).default('PENDING'),

    // 结算关联
    settlementId: uuid('settlement_id'), // 关联结算单ID

    formula: jsonb('formula'), // 记录计算逻辑
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
    commissionOrderIdx: index('idx_commissions_order').on(table.orderId),
}));

// 渠道结算单表 (Channel Settlements)
// 按周期汇总佣金，对接财务模块付款
export const channelSettlements = pgTable('channel_settlements', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    settlementNo: varchar('settlement_no', { length: 50 }).notNull().unique(), // STL2026010001
    channelId: uuid('channel_id').references(() => channels.id).notNull(),

    // 结算周期
    periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
    periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),

    // 金额
    totalCommission: decimal('total_commission', { precision: 15, scale: 2 }).notNull(), // 佣金总额
    adjustmentAmount: decimal('adjustment_amount', { precision: 15, scale: 2 }).default('0'), // 调整金额 (负数为扣减)
    finalAmount: decimal('final_amount', { precision: 15, scale: 2 }).notNull(), // 最终结算金额

    // 状态: DRAFT(草稿) / PENDING(待审批) / APPROVED(已审批) / PAID(已支付)
    status: varchar('status', { length: 20 }).default('DRAFT'),

    // 财务关联
    paymentBillId: uuid('payment_bill_id'), // 关联财务付款单

    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
}, (table) => ({
    settlementTenantIdx: index('idx_settlements_tenant').on(table.tenantId),
    settlementChannelIdx: index('idx_settlements_channel').on(table.channelId),
    settlementStatusIdx: index('idx_settlements_status').on(table.status),
}));

// 佣金调整记录表 (Commission Adjustments)
// 记录退款导致的佣金调整
export const commissionAdjustments = pgTable('commission_adjustments', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    channelId: uuid('channel_id').references(() => channels.id).notNull(),
    originalCommissionId: uuid('original_commission_id').references(() => channelCommissions.id).notNull(),

    // 调整类型: FULL_REFUND(全额退款) / PARTIAL_REFUND(部分退款)
    adjustmentType: varchar('adjustment_type', { length: 20 }).notNull(),
    adjustmentAmount: decimal('adjustment_amount', { precision: 15, scale: 2 }).notNull(), // 负数表示扣减
    reason: text('reason').notNull(),
    orderId: uuid('order_id'),
    refundAmount: decimal('refund_amount', { precision: 15, scale: 2 }),

    createdBy: uuid('created_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
    adjustmentTenantIdx: index('idx_adjustments_tenant').on(table.tenantId),
    adjustmentChannelIdx: index('idx_adjustments_channel').on(table.channelId),
}));
