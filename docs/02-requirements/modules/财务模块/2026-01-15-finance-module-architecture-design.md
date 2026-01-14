# 财务模块架构设计文档

## 1. 模块概述

| 属性 | 说明 |
|:---|:---|
| **模块名称** | 财务模块 (Finance Module) |
| **核心价值** | 提供应收应付对账、资金管理、财务报表等核心财务功能 |
| **目标用户** | 财务人员、管理员、店长 |
| **关联模块** | 订单模块、采购模块、客户模块、渠道模块 |
| **设计日期** | 2026-01-15 |

## 2. 核心架构决策

### 2.1 对账单生成策略

**决策：自动创建**

**说明：**
- 订单创建时，系统自动生成应收对账单（AR）
- 采购单创建时，系统自动生成应付对账单（AP）
- 通过事件触发机制，确保对账单不遗漏

**优势：**
- 不依赖人工操作，避免遗漏
- 提高效率，减少财务人员工作量
- 确保资金流与业务流同步

**实现方式：**
```typescript
// 订单创建事件触发
onOrderCreated(async (order) => {
  await createARStatement({
    orderId: order.id,
    customerId: order.customerId,
    totalAmount: order.totalAmount,
    status: 'PENDING'
  });
});

// 采购单创建事件触发
onPurchaseOrderCreated(async (po) => {
  await createAPStatement({
    purchaseOrderId: po.id,
    supplierId: po.supplierId,
    totalAmount: po.totalAmount,
    status: 'PENDING'
  });
});
```

### 2.2 对账单拆分/合并策略

**决策：多对多（灵活模式）**

**说明：**
- 一个订单可以拆分成多张对账单
- 多个订单可以合并成一张对账单
- 支持复杂的财务场景（如分期付款、合并开票）

**优势：**
- 灵活性高，支持客户特殊要求
- 财务人员可以根据实际业务需要调整
- 适应复杂的财务场景

**数据模型：**
```sql
-- 对账单表
CREATE TABLE finance_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_no VARCHAR(50) NOT NULL UNIQUE,
  statement_type VARCHAR(10) NOT NULL, -- AR/AP
  customer_id UUID, -- AR时必填
  supplier_id UUID, -- AP时必填
  total_amount DECIMAL(12, 2) NOT NULL,
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 对账单与订单/采购单的关联表（多对多）
CREATE TABLE finance_statement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id UUID NOT NULL REFERENCES finance_statements(id),
  order_id UUID REFERENCES orders(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 差额处理策略

**决策：混合模式（设置门槛值）**

**说明：**
- 小额差额（< 门槛值）自动抹零
- 大额差额（≥ 门槛值）需要手动调整
- 门槛值可配置（如 1 元）

**优势：**
- 平衡灵活性和效率
- 小额自动处理，提高效率
- 大额人工审核，保证安全性

**配置示例：**
```json
{
  "allow_difference": true,
  "max_difference_amount": 1,
  "difference_handling": "AUTO_ADJUST"
}
```

**实现逻辑：**
```typescript
export async function processDifference(
  expectedAmount: number,
  actualAmount: number,
  config: {
    allowDifference: boolean;
    maxDifferenceAmount: number;
    differenceHandling: 'AUTO_ADJUST' | 'MANUAL_RECORD' | 'FORBIDDEN';
  }
): Promise<{ adjustedAmount: number; difference: number; needManualReview: boolean }> {
  const difference = actualAmount - expectedAmount;
  const absDifference = Math.abs(difference);

  if (!config.allowDifference) {
    if (absDifference > 0.01) {
      throw new Error('不允许存在差额');
    }
    return { adjustedAmount: expectedAmount, difference: 0, needManualReview: false };
  }

  if (absDifference <= config.maxDifferenceAmount) {
    if (config.differenceHandling === 'AUTO_ADJUST') {
      return { adjustedAmount: actualAmount, difference, needManualReview: false };
    } else if (config.differenceHandling === 'MANUAL_RECORD') {
      return { adjustedAmount: expectedAmount, difference, needManualReview: false };
    }
  }

  return { adjustedAmount: expectedAmount, difference, needManualReview: true };
}
```

### 2.4 订单关闭策略

**决策：交付完成 + 收款完成才关闭**

**说明：**
- 订单状态为"已交付"（COMPLETED）
- 应收对账单全部收款完成
- 应付对账单全部付款完成
- 满足以上三个条件，订单自动关闭

**优势：**
- 确保业务完成和资金结清
- 避免后续有售后问题
- 财务闭环完整

**实现逻辑：**
```typescript
export async function checkOrderClosure(orderId: string) {
  const order = await getOrder(orderId);
  
  if (order.status !== 'COMPLETED') {
    return { canClose: false, reason: '订单未交付完成' };
  }

  const arStatements = await getARStatementsByOrderId(orderId);
  const allARCompleted = arStatements.every(s => s.status === 'COMPLETED');
  
  if (!allARCompleted) {
    return { canClose: false, reason: '应收未结清' };
  }

  const apStatements = await getAPStatementsByOrderId(orderId);
  const allAPCompleted = apStatements.every(s => s.status === 'COMPLETED');
  
  if (!allAPCompleted) {
    return { canClose: false, reason: '应付未结清' };
  }

  await closeOrder(orderId);
  return { canClose: true, reason: '订单已关闭' };
}
```

### 2.5 收款/付款审批策略

**决策：分级审批**

**说明：**
- 小额（< 1 万元）：不需要审批
- 中额（1-10 万元）：需要主管审批
- 大额（> 10 万元）：需要总监审批
- 阈值可配置

**优势：**
- 平衡效率和风控
- 小额快速处理，大额严格审核
- 灵活可配置

**配置示例：**
```json
{
  "approval_levels": [
    {
      "min_amount": 0,
      "max_amount": 10000,
      "require_approval": false
    },
    {
      "min_amount": 10000,
      "max_amount": 100000,
      "require_approval": true,
      "approver_role": "SUPERVISOR"
    },
    {
      "min_amount": 100000,
      "max_amount": null,
      "require_approval": true,
      "approver_role": "DIRECTOR"
    }
  ]
}
```

### 2.6 收款核销策略

**决策：智能推荐 + 手动确认**

**说明：**
- 系统根据订单号、金额等信息，智能推荐匹配的订单
- 财务人员确认后核销
- 支持手动修改推荐结果

**优势：**
- 平衡效率和准确性
- 系统推荐，人工确认
- 灵活可调整

**实现逻辑：**
```typescript
export async function recommendPaymentMatch(
  payment: {
    amount: number;
    reference?: string;
    customerId?: string;
    supplierId?: string;
  }
): Promise<Array<{ orderId?: string; purchaseOrderId?: string; confidence: number }>> {
  const matches = [];

  if (payment.reference) {
    const order = await getOrderByNo(payment.reference);
    if (order) {
      matches.push({ orderId: order.id, confidence: 0.9 });
    }
  }

  const pendingStatements = await getPendingStatements({
    customerId: payment.customerId,
    supplierId: payment.supplierId
  });

  for (const statement of pendingStatements) {
    const diff = Math.abs(statement.totalAmount - statement.paidAmount - payment.amount);
    const confidence = diff < 1 ? 0.8 : diff < 10 ? 0.6 : 0.4;
    matches.push({ orderId: statement.orderId, confidence });
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}
```

## 3. 数据库设计

### 3.1 核心表结构

```sql
-- 财务对账单表
CREATE TABLE finance_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_no VARCHAR(50) NOT NULL UNIQUE,
  statement_type VARCHAR(10) NOT NULL CHECK (statement_type IN ('AR', 'AP')),
  customer_id UUID REFERENCES customers(id),
  supplier_id UUID REFERENCES suppliers(id),
  total_amount DECIMAL(12, 2) NOT NULL,
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIAL', 'COMPLETED', 'CANCELLED')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- 对账单明细表（多对多关联）
CREATE TABLE finance_statement_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id UUID NOT NULL REFERENCES finance_statements(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  purchase_order_id UUID REFERENCES purchase_orders(id),
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 收款/付款记录表
CREATE TABLE finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_no VARCHAR(50) NOT NULL UNIQUE,
  transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('RECEIPT', 'PAYMENT')),
  statement_id UUID NOT NULL REFERENCES finance_statements(id),
  amount DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH', 'BANK_TRANSFER', 'WECHAT', 'ALIPAY', 'OTHER')),
  transaction_date TIMESTAMPTZ NOT NULL,
  reference VARCHAR(100),
  voucher_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'VERIFIED')),
  approval_status VARCHAR(20) DEFAULT 'NOT_REQUIRED' CHECK (approval_status IN ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- 差额记录表
CREATE TABLE finance_differences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES finance_transactions(id),
  difference_type VARCHAR(20) NOT NULL CHECK (difference_type IN ('ROUNDING', 'ADJUSTMENT', 'ERROR')),
  difference_amount DECIMAL(10, 2) NOT NULL,
  account_code VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- 财务配置表
CREATE TABLE finance_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  config_key VARCHAR(100) NOT NULL,
  config_value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, config_key)
);

-- 财务科目表
CREATE TABLE finance_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code VARCHAR(50) NOT NULL UNIQUE,
  account_name VARCHAR(100) NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('INCOME', 'EXPENSE', 'ASSET', 'LIABILITY')),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 审批记录表
CREATE TABLE finance_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES finance_transactions(id),
  approver_id UUID NOT NULL REFERENCES users(id),
  approval_status VARCHAR(20) NOT NULL CHECK (approval_status IN ('APPROVED', 'REJECTED')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_finance_statements_type ON finance_statements(statement_type);
CREATE INDEX idx_finance_statements_customer ON finance_statements(customer_id);
CREATE INDEX idx_finance_statements_supplier ON finance_statements(supplier_id);
CREATE INDEX idx_finance_statements_status ON finance_statements(status);
CREATE INDEX idx_finance_transactions_statement ON finance_transactions(statement_id);
CREATE INDEX idx_finance_transactions_type ON finance_transactions(transaction_type);
CREATE INDEX idx_finance_transactions_status ON finance_transactions(status);
CREATE INDEX idx_finance_transactions_date ON finance_transactions(transaction_date);
```

### 3.2 Drizzle Schema

```typescript
import { pgTable, uuid, varchar, decimal, timestamp, text, boolean, index } from 'drizzle-orm/pg-core';

export const financeStatements = pgTable('finance_statements', {
  id: uuid('id').defaultRandom().primaryKey(),
  statementNo: varchar('statement_no', { length: 50 }).notNull().unique(),
  statementType: varchar('statement_type', { length: 10 }).notNull(),
  customerId: uuid('customer_id').references('customers.id'),
  supplierId: uuid('supplier_id').references('suppliers.id'),
  totalAmount: decimal('total_amount', { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal('paid_amount', { precision: 12, scale: 2 }).notNull().default('0'),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  createdBy: uuid('created_by').references('users.id'),
}, (table) => ({
  typeIdx: index('idx_finance_statements_type').on(table.statementType),
  customerIdx: index('idx_finance_statements_customer').on(table.customerId),
  supplierIdx: index('idx_finance_statements_supplier').on(table.supplierId),
  statusIdx: index('idx_finance_statements_status').on(table.status),
}));

export const financeStatementItems = pgTable('finance_statement_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  statementId: uuid('statement_id').notNull().references('finance_statements.id', { onDelete: 'cascade' }),
  orderId: uuid('order_id').references('orders.id'),
  purchaseOrderId: uuid('purchase_order_id').references('purchase_orders.id'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const financeTransactions = pgTable('finance_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  transactionNo: varchar('transaction_no', { length: 50 }).notNull().unique(),
  transactionType: varchar('transaction_type', { length: 10 }).notNull(),
  statementId: uuid('statement_id').notNull().references('finance_statements.id'),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 20 }).notNull(),
  transactionDate: timestamp('transaction_date').notNull(),
  reference: varchar('reference', { length: 100 }),
  voucherUrl: text('voucher_url'),
  status: varchar('status', { length: 20 }).notNull().default('PENDING'),
  approvalStatus: varchar('approval_status', { length: 20 }).default('NOT_REQUIRED'),
  approvedBy: uuid('approved_by').references('users.id'),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: uuid('created_by').references('users.id'),
}, (table) => ({
  statementIdx: index('idx_finance_transactions_statement').on(table.statementId),
  typeIdx: index('idx_finance_transactions_type').on(table.transactionType),
  statusIdx: index('idx_finance_transactions_status').on(table.status),
  dateIdx: index('idx_finance_transactions_date').on(table.transactionDate),
}));

export const financeDifferences = pgTable('finance_differences', {
  id: uuid('id').defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id').references('finance_transactions.id'),
  differenceType: varchar('difference_type', { length: 20 }).notNull(),
  differenceAmount: decimal('difference_amount', { precision: 10, scale: 2 }).notNull(),
  accountCode: varchar('account_code', { length: 50 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: uuid('created_by').references('users.id'),
});

export const financeConfigs = pgTable('finance_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').notNull(),
  configKey: varchar('config_key', { length: 100 }).notNull(),
  configValue: text('config_value').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  uniqueIdx: index('idx_finance_configs_unique').on(table.tenantId, table.configKey),
}));

export const financeAccounts = pgTable('finance_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountCode: varchar('account_code', { length: 50 }).notNull().unique(),
  accountName: varchar('account_name', { length: 100 }).notNull(),
  accountType: varchar('account_type', { length: 20 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const financeApprovals = pgTable('finance_approvals', {
  id: uuid('id').defaultRandom().primaryKey(),
  transactionId: uuid('transaction_id').notNull().references('finance_transactions.id'),
  approverId: uuid('approver_id').notNull().references('users.id'),
  approvalStatus: varchar('approval_status', { length: 20 }).notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

## 4. 业务逻辑设计

### 4.1 对账单生成

```typescript
export async function createARStatement(params: {
  orderId: string;
  customerId: string;
  totalAmount: number;
  dueDate?: Date;
}) {
  const statementNo = await generateStatementNo('AR');
  
  const statement = await db.insert(financeStatements).values({
    statementNo,
    statementType: 'AR',
    customerId: params.customerId,
    totalAmount: params.totalAmount,
    dueDate: params.dueDate,
    status: 'PENDING',
  }).returning();

  await db.insert(financeStatementItems).values({
    statementId: statement[0].id,
    orderId: params.orderId,
    amount: params.totalAmount,
  });

  return statement[0];
}

export async function createAPStatement(params: {
  purchaseOrderId: string;
  supplierId: string;
  totalAmount: number;
  dueDate?: Date;
}) {
  const statementNo = await generateStatementNo('AP');
  
  const statement = await db.insert(financeStatements).values({
    statementNo,
    statementType: 'AP',
    supplierId: params.supplierId,
    totalAmount: params.totalAmount,
    dueDate: params.dueDate,
    status: 'PENDING',
  }).returning();

  await db.insert(financeStatementItems).values({
    statementId: statement[0].id,
    purchaseOrderId: params.purchaseOrderId,
    amount: params.totalAmount,
  });

  return statement[0];
}
```

### 4.2 收款/付款处理

```typescript
export async function createTransaction(params: {
  statementId: string;
  amount: number;
  paymentMethod: string;
  transactionDate: Date;
  reference?: string;
  voucherUrl?: string;
  createdBy: string;
}) {
  const statement = await db.select().from(financeStatements)
    .where(eq(financeStatements.id, params.statementId))
    .limit(1);

  if (!statement[0]) {
    throw new Error('对账单不存在');
  }

  const config = await getFinanceConfig();
  const approvalLevel = getApprovalLevel(params.amount, config.approvalLevels);

  const transactionNo = await generateTransactionNo(statement[0].statementType);

  const transaction = await db.insert(financeTransactions).values({
    transactionNo,
    transactionType: statement[0].statementType === 'AR' ? 'RECEIPT' : 'PAYMENT',
    statementId: params.statementId,
    amount: params.amount,
    paymentMethod: params.paymentMethod,
    transactionDate: params.transactionDate,
    reference: params.reference,
    voucherUrl: params.voucherUrl,
    status: approvalLevel.requireApproval ? 'PENDING' : 'APPROVED',
    approvalStatus: approvalLevel.requireApproval ? 'PENDING' : 'NOT_REQUIRED',
    createdBy: params.createdBy,
  }).returning();

  if (!approvalLevel.requireApproval) {
    await processTransaction(transaction[0].id);
  }

  return transaction[0];
}

async function processTransaction(transactionId: string) {
  const transaction = await db.select().from(financeTransactions)
    .where(eq(financeTransactions.id, transactionId))
    .limit(1);

  const statement = await db.select().from(financeStatements)
    .where(eq(financeStatements.id, transaction[0].statementId))
    .limit(1);

  const config = await getFinanceConfig();
  const result = await processDifference(
    parseFloat(statement[0].totalAmount.toString()) - parseFloat(statement[0].paidAmount.toString()),
    parseFloat(transaction[0].amount.toString()),
    config
  );

  if (result.difference !== 0) {
    await db.insert(financeDifferences).values({
      transactionId,
      differenceType: 'ADJUSTMENT',
      differenceAmount: result.difference,
      accountCode: result.difference > 0 ? 'DIFFERENCE_INCOME' : 'DIFFERENCE_EXPENSE',
      description: '收款/付款差额',
    });
  }

  const newPaidAmount = parseFloat(statement[0].paidAmount.toString()) + result.adjustedAmount;
  const newStatus = newPaidAmount >= parseFloat(statement[0].totalAmount.toString()) ? 'COMPLETED' : 'PARTIAL';

  await db.update(financeStatements)
    .set({
      paidAmount: newPaidAmount,
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(financeStatements.id, statement[0].id));

  await db.update(financeTransactions)
    .set({ status: 'VERIFIED' })
    .where(eq(financeTransactions.id, transactionId));

  if (newStatus === 'COMPLETED') {
    await checkOrderClosure(statement[0].orderId);
  }
}
```

### 4.3 审批流程

```typescript
export async function approveTransaction(params: {
  transactionId: string;
  approverId: string;
  status: 'APPROVED' | 'REJECTED';
  comment?: string;
}) {
  await db.insert(financeApprovals).values({
    transactionId: params.transactionId,
    approverId: params.approverId,
    approvalStatus: params.status,
    comment: params.comment,
  });

  if (params.status === 'APPROVED') {
    await db.update(financeTransactions)
      .set({
        approvalStatus: 'APPROVED',
        approvedBy: params.approverId,
        approvedAt: new Date(),
      })
      .where(eq(financeTransactions.id, params.transactionId));

    await processTransaction(params.transactionId);
  } else {
    await db.update(financeTransactions)
      .set({
        approvalStatus: 'REJECTED',
        status: 'REJECTED',
      })
      .where(eq(financeTransactions.id, params.transactionId));
  }
}

function getApprovalLevel(amount: number, approvalLevels: any[]) {
  for (const level of approvalLevels) {
    if (amount >= level.min_amount && (level.max_amount === null || amount < level.max_amount)) {
      return level;
    }
  }
  return { requireApproval: false };
}
```

### 4.4 智能核销推荐

```typescript
export async function recommendPaymentMatch(params: {
  amount: number;
  reference?: string;
  customerId?: string;
  supplierId?: string;
}) {
  const matches = [];

  if (params.reference) {
    const order = await db.select().from(orders)
      .where(eq(orders.orderNo, params.reference))
      .limit(1);

    if (order[0]) {
      const statements = await db.select().from(financeStatements)
        .where(and(
          eq(financeStatements.orderId, order[0].id),
          eq(financeStatements.statementType, 'AR'),
          ne(financeStatements.status, 'COMPLETED')
        ));

      for (const statement of statements) {
        const remainingAmount = parseFloat(statement.totalAmount.toString()) - parseFloat(statement.paidAmount.toString());
        const diff = Math.abs(remainingAmount - params.amount);
        const confidence = diff < 1 ? 0.9 : diff < 10 ? 0.7 : 0.5;
        matches.push({
          statementId: statement.id,
          orderId: order[0].id,
          confidence,
          remainingAmount,
        });
      }
    }
  }

  const pendingStatements = await db.select().from(financeStatements)
    .where(and(
      or(
        params.customerId ? eq(financeStatements.customerId, params.customerId) : undefined,
        params.supplierId ? eq(financeStatements.supplierId, params.supplierId) : undefined,
      ),
      ne(financeStatements.status, 'COMPLETED')
    ));

  for (const statement of pendingStatements) {
    const remainingAmount = parseFloat(statement.totalAmount.toString()) - parseFloat(statement.paidAmount.toString());
    const diff = Math.abs(remainingAmount - params.amount);
    const confidence = diff < 1 ? 0.8 : diff < 10 ? 0.6 : 0.4;
    matches.push({
      statementId: statement.id,
      orderId: statement.orderId,
      confidence,
      remainingAmount,
    });
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}
```

## 5. API 设计

### 5.1 对账单相关 API

```typescript
// 获取对账单列表
GET /api/finance/statements
Query Parameters:
  - type: 'AR' | 'AP'
  - customerId?: string
  - supplierId?: string
  - status?: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED'
  - page: number
  - pageSize: number

// 获取对账单详情
GET /api/finance/statements/:id

// 创建对账单（手动创建）
POST /api/finance/statements
Body: {
  statementType: 'AR' | 'AP';
  customerId?: string;
  supplierId?: string;
  items: Array<{
    orderId?: string;
    purchaseOrderId?: string;
    amount: number;
    description?: string;
  }>;
  dueDate?: string;
}

// 更新对账单
PUT /api/finance/statements/:id
Body: {
  dueDate?: string;
  status?: 'CANCELLED';
}

// 删除对账单
DELETE /api/finance/statements/:id
```

### 5.2 收款/付款相关 API

```typescript
// 获取交易记录列表
GET /api/finance/transactions
Query Parameters:
  - type: 'RECEIPT' | 'PAYMENT'
  - statementId?: string
  - status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'VERIFIED'
  - startDate?: string
  - endDate?: string
  - page: number
  - pageSize: number

// 获取交易记录详情
GET /api/finance/transactions/:id

// 创建交易记录
POST /api/finance/transactions
Body: {
  statementId: string;
  amount: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'WECHAT' | 'ALIPAY' | 'OTHER';
  transactionDate: string;
  reference?: string;
  voucherUrl?: string;
}

// 智能核销推荐
POST /api/finance/transactions/recommend
Body: {
  amount: number;
  reference?: string;
  customerId?: string;
  supplierId?: string;
}

// 审批交易记录
POST /api/finance/transactions/:id/approve
Body: {
  status: 'APPROVED' | 'REJECTED';
  comment?: string;
}
```

### 5.3 财务配置相关 API

```typescript
// 获取财务配置
GET /api/finance/configs

// 更新财务配置
PUT /api/finance/configs
Body: {
  allowDifference: boolean;
  maxDifferenceAmount: number;
  differenceHandling: 'AUTO_ADJUST' | 'MANUAL_RECORD' | 'FORBIDDEN';
  allowRounding: boolean;
  roundingMode: 'ROUND_DOWN' | 'ROUND_HALF_UP' | 'ROUND_UP';
  roundingUnit: 'YUAN' | 'JIAO' | 'FEN';
  approvalLevels: Array<{
    minAmount: number;
    maxAmount: number | null;
    requireApproval: boolean;
    approverRole?: string;
  }>;
}
```

### 5.4 报表相关 API

```typescript
// 获取应收账龄分析
GET /api/finance/reports/ar-aging
Query Parameters:
  - customerId?: string
  - startDate?: string
  - endDate?: string

// 获取应付账龄分析
GET /api/finance/reports/ap-aging
Query Parameters:
  - supplierId?: string
  - startDate?: string
  - endDate?: string

// 获取现金流分析
GET /api/finance/reports/cash-flow
Query Parameters:
  - startDate?: string
  - endDate?: string

// 获取利润分析
GET /api/finance/reports/profit
Query Parameters:
  - startDate?: string
  - endDate?: string
```

## 6. UI 设计

### 6.1 财务工作台

```
┌─────────────────────────────────────────────────────────────┐
│ 财务中心                                    [用户头像]       │
├─────────────────────────────────────────────────────────────┤
│ 今日概览                                                     │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │
│ │ 待收款       │ │ 待付款       │ │ 逾期预警     │         │
│ │ ¥125,000     │ │ ¥68,000      │ │ ¥32,000      │         │
│ │ 15单         │ │ 8单          │ │ 3单          │         │
│ └──────────────┘ └──────────────┘ └──────────────┘         │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 应收对账 (AR)                                          │  │
│ │ [待开票] [待回款] [逾期催收] [已完成]                  │  │
│ │                                                        │  │
│ │ 对账单号    客户    金额    已收    状态    到期日    操作│
│ │ AR202601001 张三   10,000  5,000   PARTIAL  2026-01-20 [详情]│
│ │ AR202601002 李四   15,000  0       PENDING  2026-01-25 [详情]│
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 应付对账 (AP)                                          │  │
│ │ [待开票] [待付款] [已完成]                             │  │
│ │                                                        │  │
│ │ 对账单号    供应商  金额    已付    状态    到期日    操作│
│ │ AP202601001 供应商A 20,000  10,000  PARTIAL  2026-01-15 [详情]│
│ │ AP202601002 供应商B 30,000  0       PENDING  2026-01-30 [详情]│
│ └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 收款/付款录入页面

```
┌─────────────────────────────────────────────────────────────┐
│ 收款录入                                      [取消] [保存]   │
├─────────────────────────────────────────────────────────────┤
│ 对账单选择                                                   │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 对账单号: [AR202601001 ▼]                              │  │
│ │ 客户: 张三                                              │  │
│ │ 应收金额: ¥10,000                                       │  │
│ │ 已收金额: ¥5,000                                        │  │
│ │ 剩余金额: ¥5,000                                        │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ 收款信息                                                     │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 收款金额: [5,000] 元                                    │  │
│ │ 收款方式: [银行转账 ▼]                                  │  │
│ │ 收款日期: [2026-01-15]                                  │  │
│ │ 备注说明: [____________________]                        │  │
│ │ 凭证上传: [选择文件]                                     │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ 智能推荐                                                     │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 系统推荐匹配:                                          │  │
│ │ ✓ 订单 #12345 - 置信度 90%                             │  │
│ │   剩余金额: ¥5,000                                     │  │
│ │   [确认] [修改]                                        │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ 审批状态                                                     │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 金额: ¥5,000 < ¥10,000，无需审批                       │  │
│ └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 审批页面

```
┌─────────────────────────────────────────────────────────────┐
│ 待审批事项                                    [全部已审批]   │
├─────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 收款记录 #REC202601001                                 │  │
│ │ 金额: ¥15,000                                          │  │
│ │ 收款方式: 银行转账                                      │  │
│ │ 申请人: 财务小王                                        │  │
│ │ 申请时间: 2026-01-15 10:00                             │  │
│ │ 凭证: [查看]                                           │  │
│ │                                                        │  │
│ │ [批准] [拒绝]                                          │  │
│ │ 备注: [____________________]                           │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 付款记录 #PAY202601001                                 │  │
│ │ 金额: ¥25,000                                          │  │
│ │ 付款方式: 银行转账                                      │  │
│ │ 申请人: 财务小李                                        │  │
│ │ 申请时间: 2026-01-15 11:00                             │  │
│ │ 凭证: [查看]                                           │  │
│ │                                                        │  │
│ │ [批准] [拒绝]                                          │  │
│ │ 备注: [____________________]                           │  │
│ └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 账龄分析页面

```
┌─────────────────────────────────────────────────────────────┐
│ 应收账龄分析                                  [导出] [打印]   │
├─────────────────────────────────────────────────────────────┤
│ 账龄分布                                                     │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 0-30天:   ¥85,000 (68%)  ████████████████████████ 🟢  │  │
│ │ 31-60天:  ¥28,000 (22%)  ████████████ 🟡              │  │
│ │ 61-90天:  ¥10,000 (8%)   █████ 🟠                     │  │
│ │ 90天+:    ¥2,000 (2%)    █ 🔴                         │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                              │
│ 预警：超过 60 天的占比达 10%，需加强催收                     │
│                                                              │
│ 明细列表                                                     │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 对账单号    客户    金额    账龄    状态    操作        │  │
│ │ AR202601001 张三   10,000  15天    PENDING  [催收]     │  │
│ │ AR202601002 李四   15,000  45天    PENDING  [催收]     │  │
│ │ AR202601003 王五   20,000  75天    PENDING  [催收]     │  │
│ └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 7. 技术实施建议

### 7.1 事件驱动架构

```typescript
// 订单创建事件
export const onOrderCreated = createEvent<Order>();

// 订单状态变更事件
export const onOrderStatusChanged = createEvent<{ orderId: string; oldStatus: string; newStatus: string }>();

// 采购单创建事件
export const onPurchaseOrderCreated = createEvent<PurchaseOrder>();

// 采购单状态变更事件
export const onPurchaseOrderStatusChanged = createEvent<{ purchaseOrderId: string; oldStatus: string; newStatus: string }>();

// 订阅事件
onOrderCreated.subscribe(async (order) => {
  await createARStatement({
    orderId: order.id,
    customerId: order.customerId,
    totalAmount: order.totalAmount,
  });
});

onOrderStatusChanged.subscribe(async ({ orderId, oldStatus, newStatus }) => {
  if (newStatus === 'COMPLETED') {
    await checkOrderClosure(orderId);
  }
});

onPurchaseOrderCreated.subscribe(async (po) => {
  await createAPStatement({
    purchaseOrderId: po.id,
    supplierId: po.supplierId,
    totalAmount: po.totalAmount,
  });
});
```

### 7.2 定时任务

```typescript
// 每天凌晨检查逾期对账单
export const checkOverdueStatements = cronJob('0 0 * * *', async () => {
  const overdueStatements = await db.select().from(financeStatements)
    .where(and(
      lt(financeStatements.dueDate, new Date()),
      ne(financeStatements.status, 'COMPLETED')
    ));

  for (const statement of overdueStatements) {
    await sendOverdueReminder(statement);
  }
});

// 每周生成账龄分析报告
export const generateAgingReport = cronJob('0 0 * * 1', async () => {
  const report = await generateARAgingReport();
  await sendReportToManager(report);
});
```

### 7.3 权限控制

```typescript
// 财务权限定义
export const financePermissions = {
  // 对账单管理
  'finance:statement:view': '查看对账单',
  'finance:statement:create': '创建对账单',
  'finance:statement:update': '更新对账单',
  'finance:statement:delete': '删除对账单',
  
  // 交易记录管理
  'finance:transaction:view': '查看交易记录',
  'finance:transaction:create': '创建交易记录',
  'finance:transaction:approve': '审批交易记录',
  
  // 财务配置
  'finance:config:view': '查看财务配置',
  'finance:config:update': '更新财务配置',
  
  // 报表
  'finance:report:view': '查看财务报表',
  'finance:report:export': '导出财务报表',
};

// 角色权限映射
export const rolePermissions = {
  FINANCE_STAFF: [
    'finance:statement:view',
    'finance:statement:create',
    'finance:transaction:view',
    'finance:transaction:create',
    'finance:report:view',
  ],
  FINANCE_SUPERVISOR: [
    'finance:statement:view',
    'finance:statement:create',
    'finance:statement:update',
    'finance:transaction:view',
    'finance:transaction:create',
    'finance:transaction:approve',
    'finance:report:view',
    'finance:report:export',
  ],
  FINANCE_DIRECTOR: [
    'finance:statement:view',
    'finance:statement:update',
    'finance:statement:delete',
    'finance:transaction:view',
    'finance:transaction:approve',
    'finance:config:view',
    'finance:config:update',
    'finance:report:view',
    'finance:report:export',
  ],
  ADMIN: [
    'finance:statement:view',
    'finance:statement:create',
    'finance:statement:update',
    'finance:statement:delete',
    'finance:transaction:view',
    'finance:transaction:create',
    'finance:transaction:approve',
    'finance:config:view',
    'finance:config:update',
    'finance:report:view',
    'finance:report:export',
  ],
};
```

## 8. 总结

本架构设计文档详细描述了财务模块的核心架构决策、数据库设计、业务逻辑设计、API 设计和 UI 设计。主要特点包括：

1. **自动对账单生成**：通过事件驱动机制，确保对账单不遗漏
2. **多对多对账单**：支持复杂的财务场景，提高灵活性
3. **混合差额处理**：小额自动处理，大额人工审核，平衡效率和安全性
4. **分级审批**：小额快速处理，大额严格审核，灵活可配置
5. **智能核销推荐**：系统推荐，人工确认，提高效率和准确性
6. **完整财务闭环**：订单关闭需要同时满足业务完成和资金结清

该架构设计能够满足门窗行业的财务需求，具有良好的扩展性和可维护性。
