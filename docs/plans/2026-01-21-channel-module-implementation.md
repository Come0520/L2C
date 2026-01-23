# 渠道模块完整实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现完整的渠道管理模块，包含多层级渠道结构、可配置类型、灵活返点、佣金结算。

**Architecture:** 采用树形数据结构管理渠道层级，通过 `parent_id` 自引用实现。渠道类型独立配置表支持租户自定义。佣金结算通过 `channel_commissions` + `channel_settlements` 两级表实现。

**Tech Stack:** Next.js 16, Drizzle ORM, PostgreSQL, React Hook Form, shadcn/ui

---

## Phase 1: 数据库 Schema

### Task 1: 创建渠道类型表

**Files:**
- Modify: `src/shared/api/schema/channels.ts`
- Run: `pnpm db:push`

**Step 1: 添加 channel_categories 表定义**

```typescript
export const channelCategories = pgTable('channel_categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    name: varchar('name', { length: 50 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    description: text('description'),
    isActive: boolean('is_active').default(true),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

**Step 2: 推送 Schema**
```bash
pnpm db:push
```

**Step 3: Commit**
```bash
git add src/shared/api/schema/channels.ts
git commit -m "feat(channels): 添加渠道类型表 channel_categories"
```

---

### Task 2: 创建渠道主表（多层级）

**Files:**
- Modify: `src/shared/api/schema/channels.ts`

**Step 1: 添加 channels 表定义**

```typescript
export const channelGradeEnum = pgEnum('channel_grade', ['S', 'A', 'B', 'C']);
export const commissionTypeEnum = pgEnum('commission_type', ['FIXED', 'TIERED']);
export const settlementTargetEnum = pgEnum('settlement_target', ['COMPANY', 'INDIVIDUAL']);
export const settlementCycleEnum = pgEnum('settlement_cycle', ['MONTHLY', 'PER_ORDER']);
export const channelStatusEnum = pgEnum('channel_status', ['ACTIVE', 'PAUSED', 'TERMINATED']);

export const channels = pgTable('channels', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    parentId: uuid('parent_id').references(() => channels.id),
    level: integer('level').default(1).notNull(),
    categoryId: uuid('category_id').references(() => channelCategories.id),
    name: varchar('name', { length: 100 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    contactName: varchar('contact_name', { length: 50 }),
    phone: varchar('phone', { length: 20 }),
    grade: channelGradeEnum('grade').default('C'),
    suggestedGrade: channelGradeEnum('suggested_grade'),
    commissionRate: decimal('commission_rate', { precision: 5, scale: 4 }),
    commissionType: commissionTypeEnum('commission_type').default('FIXED'),
    tieredRates: jsonb('tiered_rates'),
    settlementTarget: settlementTargetEnum('settlement_target').default('COMPANY'),
    settlementCycle: settlementCycleEnum('settlement_cycle').default('MONTHLY'),
    bankInfo: jsonb('bank_info'),
    status: channelStatusEnum('status').default('ACTIVE'),
    totalLeads: integer('total_leads').default(0),
    totalDealAmount: decimal('total_deal_amount', { precision: 15, scale: 2 }).default('0'),
    assignedManagerId: uuid('assigned_manager_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

**Step 2: 推送 Schema 并 Commit**
```bash
pnpm db:push
git add src/shared/api/schema/channels.ts
git commit -m "feat(channels): 添加多层级渠道主表"
```

---

### Task 3: 创建佣金相关表

**Files:**
- Modify: `src/shared/api/schema/channels.ts`

**Step 1: 添加 channel_commissions 和 channel_settlements 表**

```typescript
export const commissionStatusEnum = pgEnum('commission_status', ['PENDING', 'SETTLED', 'PAID', 'VOID']);
export const settlementStatusEnum = pgEnum('settlement_status', ['DRAFT', 'PENDING', 'APPROVED', 'PAID']);

export const channelCommissions = pgTable('channel_commissions', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    channelId: uuid('channel_id').references(() => channels.id).notNull(),
    referrerId: uuid('referrer_id').references(() => channels.id),
    orderId: uuid('order_id').notNull(),
    orderAmount: decimal('order_amount', { precision: 15, scale: 2 }).notNull(),
    commissionRate: decimal('commission_rate', { precision: 5, scale: 4 }).notNull(),
    commissionAmount: decimal('commission_amount', { precision: 15, scale: 2 }).notNull(),
    status: commissionStatusEnum('status').default('PENDING'),
    settlementId: uuid('settlement_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const channelSettlements = pgTable('channel_settlements', {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
    settlementNo: varchar('settlement_no', { length: 50 }).notNull(),
    channelId: uuid('channel_id').references(() => channels.id).notNull(),
    periodStart: date('period_start'),
    periodEnd: date('period_end'),
    totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
    adjustmentAmount: decimal('adjustment_amount', { precision: 15, scale: 2 }).default('0'),
    finalAmount: decimal('final_amount', { precision: 15, scale: 2 }).notNull(),
    status: settlementStatusEnum('status').default('DRAFT'),
    paymentRequestId: uuid('payment_request_id'),
    createdBy: uuid('created_by').references(() => users.id),
    approvedBy: uuid('approved_by').references(() => users.id),
    approvedAt: timestamp('approved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
```

**Step 2: 推送并 Commit**
```bash
pnpm db:push
git add src/shared/api/schema/channels.ts
git commit -m "feat(channels): 添加佣金记录表和结算单表"
```

---

## Phase 2: Server Actions

### Task 4: 渠道类型 CRUD

**Files:**
- Create: `src/features/channels/actions/categories.ts`

实现 `getChannelCategories`, `createChannelCategory`, `updateChannelCategory`, `deleteChannelCategory`

---

### Task 5: 渠道档案 CRUD

**Files:**
- Create: `src/features/channels/actions/channels.ts`

实现 `getChannels` (树形), `getChannelById`, `createChannel`, `updateChannel`, `deleteChannel`

---

### Task 6: 佣金结算 Actions

**Files:**
- Create: `src/features/channels/actions/commissions.ts`
- Create: `src/features/channels/actions/settlements.ts`

实现佣金记录生成、结算单创建、审批流程

---

## Phase 3: UI 组件

### Task 7: 渠道类型管理页面

**Files:**
- Modify: `src/app/(dashboard)/settings/channels/page.tsx`
- Create: `src/features/channels/components/category-form.tsx`

---

### Task 8: 渠道列表页（树形）

**Files:**
- Create: `src/app/(dashboard)/channels/page.tsx`
- Create: `src/features/channels/components/channel-tree.tsx`

---

### Task 9: 渠道表单弹窗

**Files:**
- Create: `src/features/channels/components/channel-form-dialog.tsx`

---

### Task 10: 渠道详情页

**Files:**
- Create: `src/app/(dashboard)/channels/[id]/page.tsx`
- Create: `src/features/channels/components/channel-detail.tsx`

---

## Phase 4: 系统集成

### Task 11: 线索关联渠道

**Files:**
- Modify: `src/shared/api/schema/leads.ts` — 添加 channel_id, referrer_id
- Modify: `src/features/leads/components/lead-form.tsx` — 添加渠道选择

---

### Task 12: 订单触发佣金

**Files:**
- Modify: `src/features/orders/actions.ts` — 订单完成时生成佣金记录

---

## 验证清单

- [ ] 渠道类型可增删改查
- [ ] 渠道档案支持三级层级
- [ ] 返点配置（固定/阶梯）正常
- [ ] 线索可关联渠道
- [ ] 订单完成自动生成佣金记录
- [ ] 结算单生成和审批流程
