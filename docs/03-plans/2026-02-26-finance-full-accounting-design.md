# 财务模块完整功能扩展 — 实施方案

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 为 L2C 系统添加完整的双模式财务功能——个体户简单模式（收支流水）和专业会计模式（复式记账+三大财务报表），达到专业会计软件的功能和安全性标准。

**架构：** 在现有 `src/features/finance/` 模块下扩展，新增科目管理、凭证管理、报表引擎和费用录入四大子模块。业务单据审批通过后通过事件 Hook 自动生成会计凭证，凭证一旦记账不可删除，错误只能通过红字冲销纠正。

**技术栈：** Next.js 16、Drizzle ORM、PostgreSQL、`xlsx`（Excel导出，已有）、`@react-pdf/renderer`（PDF导出，新增）

---

## 一、双模式架构

```
系统设置 → 租户类型
  ├── 个体户模式 → 简单收支流水 + 汇总报表
  └── 企业模式   → 专业复式记账 + 三大财务报表
```

**个体户模式：** 角色不强制四权分立，可自任复核员；按大类记录收支；月/季/年汇总。

**专业会计模式：** 五大类科目树；完整借贷凭证+自动生成；四权分立；三大报表。

---

## 二、专业安全机制（全部必须实现）

| 安全原则             | 实现方式                                          |
| -------------------- | ------------------------------------------------- |
| 凭证不可删除         | 禁止 DELETE，只允许 INSERT 红字冲销凭证           |
| 账期锁定             | 状态 OPEN→CLOSED 不可逆，CLOSED 后拒绝写入        |
| 借贷强制平衡         | Service 层强制校验，借方合计 ≠ 贷方合计时拒绝保存 |
| 四权分立（企业模式） | 记账员与复核员不可为同一用户（系统强制）          |
| 完整审计日志         | 每笔写操作记录：用户ID/时间戳/操作前后数据快照    |

---

## 三、数据库新增表结构

### `chart_of_accounts`（会计科目表）

```sql
id, tenant_id, code, name,
category ENUM(ASSET/LIABILITY/EQUITY/INCOME/EXPENSE),
parent_id, level, is_active, is_system_default, created_at
```

### `journal_entries`（凭证主表）

```sql
id, tenant_id, voucher_no, period_id, entry_date, description,
status ENUM(DRAFT/PENDING_REVIEW/POSTED),
created_by, reviewed_by,
source_type ENUM(MANUAL/AUTO_RECEIPT/AUTO_PAYMENT/AUTO_ORDER/...),
source_id, is_reversal, reversed_entry_id, created_at, updated_at
```

### `journal_entry_lines`（凭证借贷明细）

```sql
id, entry_id, account_id, debit_amount NUMERIC(15,2),
credit_amount NUMERIC(15,2), description, sort_order
```

### `expense_records`（费用录入）

```sql
id, tenant_id, period_id, account_id, amount NUMERIC(15,2),
description, expense_date, import_batch_id, created_by, created_at
```

### `accounting_periods`（账期）

```sql
id, tenant_id, year, month, quarter,
status ENUM(OPEN/CLOSED), closed_by, closed_at
```

### `voucher_templates`（自动凭证规则）

```sql
id, tenant_id, source_type, debit_account_id, credit_account_id, is_active
```

### `finance_audit_logs`（财务审计日志）

```sql
id, tenant_id, user_id, action, entity_type, entity_id,
before_data JSONB, after_data JSONB, ip_address, created_at
```

---

## 四、业务单据 → 自动凭证映射

| 触发事件       | 默认借方科目  | 默认贷方科目  |
| -------------- | ------------- | ------------- |
| 收款单审批通过 | 银行存款/现金 | 应收账款      |
| 付款单审批通过 | 应付账款      | 银行存款/现金 |
| 销售订单确认   | 应收账款      | 主营业务收入  |
| 采购入库       | 库存商品      | 应付账款      |
| 内部资金转账   | 目标账户      | 来源账户      |

> 科目可在 `voucher_templates` 中按租户配置覆写

---

## 五、新增路由与页面

```
/finance/
  ├── ledger/               ← 科目管理
  ├── journal/              ← 凭证管理（列表+新建+详情）
  │   └── [id]/             ← 凭证详情页
  ├── expenses/             ← 费用录入（手工+Excel导入）
  ├── reports/
  │   ├── balance-sheet/    ← 资产负债表
  │   ├── income-statement/ ← 利润表
  │   └── cash-flow/        ← 现金流量表
  └── periods/              ← 账期管理（结账/锁账）
```

---

## 六、技术选型

| 技术点     | 方案                              | 备注                 |
| ---------- | --------------------------------- | -------------------- |
| Excel 导出 | `xlsx` + 现有 `ExcelExportButton` | 零成本复用           |
| PDF 导出   | `@react-pdf/renderer`             | 新增依赖，JSX 写模板 |
| 金额计算   | 字符串 Decimal（现有规范）        | 避免浮点精度丢失     |
| 科目树     | 递归嵌套 + `parent_id`            | Drizzle ORM 处理     |

---

## 七、开发排期（10 个 Phase，约 11 周）

| Phase | 内容                                       | 预估 |
| ----- | ------------------------------------------ | ---- |
| 1     | 数据库建表 + 迁移 + Seed 科目数据          | 3天  |
| 2     | 核心会计引擎（借贷校验/红字冲销/账期锁定） | 1周  |
| 3     | 业务单据自动生成凭证 Hook                  | 1周  |
| 4     | 科目管理页面                               | 3天  |
| 5     | 凭证管理页面                               | 1周  |
| 6     | 费用录入（手工+Excel导入）                 | 3天  |
| 7     | 三大财务报表 + 导出                        | 1周  |
| 8     | 账期管理页面                               | 2天  |
| 9     | 个体户简单模式                             | 1周  |
| 10    | 权限与角色（对接现有 RBAC）                | 2天  |

**Phase 1-3 完成后可交付核心会计引擎供专业会计人员内测。**

---

## 八、验证计划

### 自动化测试命令

```bash
# 单元测试（新增）
pnpm test src/features/finance/__tests__/journal-validation.test.ts
pnpm test src/features/finance/__tests__/auto-voucher.test.ts
pnpm test src/features/finance/__tests__/report-calculation.test.ts

# 所有财务模块测试
pnpm test src/features/finance/

# 类型检查
pnpm type-check
```

### 关键场景手工验证（5条）

1. **借贷不平衡拒绝保存** — 录入借方100/贷方90，点击保存，应见错误提示
2. **账期锁定后写保护** — 关闭2月账期，再尝试新增2月凭证，应被系统拒绝
3. **自动凭证生成** — 审批一笔收款单，进凭证列表，应自动出现对应会计分录
4. **红字冲销** — 对已记账凭证执行冲销，应生成反向凭证，原凭证仍存在
5. **报表数字一致性** — 资产负债表：资产总计 = 负债 + 权益；净利润与利润表一致
