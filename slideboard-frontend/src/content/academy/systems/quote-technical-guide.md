# 报价单模块技术文档

## 📋 模块概述

报价单模块是一个完全独立的业务模块，实现了从线索到销售单的业务转化环节。该模块支持多版本管理，允许销售人员为同一客户创建不同版本的报价方案，客户确认后可单向转化为销售单。

### 核心特性

- ✅ **数据独立**：与销售单模块完全解耦，拥有独立的数据表和业务逻辑
- ✅ **多版本管理**：支持 V1、V2、V3 等多个报价版本，每个版本独立演进
- ✅ **状态流转**：完整的生命周期管理（草稿 → 已发布 → 已确认 → 赢单/输单）
- ✅ **单向转化**：已确认的报价单可转化为销售单，数据深拷贝确保相互独立
- ✅ **权限控制**：基于 RLS 的行级安全，销售人员只能访问自己的报价单

---

## 🎯 业务流程

### 1. 完整业务链路

```
线索 (Lead) 
    ↓
创建报价单 (Quote)
    ↓
生成多个版本 (V1, V2, V3...)
    ↓
客户确认某个版本
    ↓
版本状态更新为 "accepted"
    ↓
销售人员点击"转为销售单"
    ↓
生成销售单 (Sales Order)
    ↓
报价单状态更新为 "won"
```

### 2. 报价单状态流转

```
draft (草稿) 
    ↓
active (进行中)
    ↓
won 赢单 / lost 输单 / expired 过期
```

### 3. 报价版本状态流转

```
draft (草稿)
    ↓
presented (已发布给客户)
    ↓
accepted 已接受 / rejected 已拒绝
```

---

## 🗄️ 数据库架构

### 表结构设计

#### 1. quotes (报价单主表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| quote_no | varchar | 报价单号（唯一） |
| lead_id | uuid | 关联线索ID |
| customer_id | uuid | 关联客户ID |
| project_name | varchar | 项目名称 |
| project_address | text | 项目地址 |
| salesperson_id | uuid | 销售人员ID |
| current_version_id | uuid | 当前生效版本ID |
| status | varchar | 报价单状态 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

#### 2. quote_versions (报价单版本表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| quote_id | uuid | 关联报价单ID |
| version_number | int | 版本号（1, 2, 3...） |
| version_suffix | varchar | 版本标识（V1, V2...） |
| total_amount | numeric | 总金额 |
| status | varchar | 版本状态 |
| valid_until | date | 有效期至 |
| remarks | text | 备注说明 |
| created_at | timestamptz | 创建时间 |
| updated_at | timestamptz | 更新时间 |

#### 3. quote_items (报价单明细表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| quote_version_id | uuid | 关联版本ID |
| category | varchar | 商品类别 |
| space | varchar | 空间位置 |
| product_name | varchar | 产品名称 |
| product_id | uuid | 关联产品ID（可选） |
| quantity | numeric | 数量 |
| unit_price | numeric | 单价 |
| total_price | numeric | 总价 |
| description | text | 描述 |
| image_url | text | 图片URL |
| attributes | jsonb | 扩展属性 |
| created_at | timestamptz | 创建时间 |

### 关键索引

```sql
-- 报价单查询优化
CREATE INDEX idx_quotes_salesperson ON quotes(salesperson_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);

-- 版本查询优化
CREATE INDEX idx_quote_versions_quote_id ON quote_versions(quote_id);
CREATE INDEX idx_quote_items_version_id ON quote_items(quote_version_id);
```

---

## 🔐 权限控制机制

### Row Level Security (RLS) 策略

#### 1. 销售人员权限

```sql
-- 销售人员只能查看自己的报价单
CREATE POLICY "quotes_salesperson_select" ON quotes
FOR SELECT USING (salesperson_id = auth.uid());

-- 销售人员只能创建归属于自己的报价单
CREATE POLICY "quotes_salesperson_insert" ON quotes
FOR INSERT WITH CHECK (salesperson_id = auth.uid());

-- 销售人员只能更新自己的报价单
CREATE POLICY "quotes_salesperson_update" ON quotes
FOR UPDATE USING (salesperson_id = auth.uid());
```

#### 2. 管理员权限

```sql
-- 管理员可以访问所有报价单
CREATE POLICY "quotes_admin_all" ON quotes
FOR ALL USING (is_admin());
```

#### 3. 版本和明细继承权限

```sql
-- 版本继承报价单权限
CREATE POLICY "quote_versions_inherit" ON quote_versions
USING (
  EXISTS (
    SELECT 1 FROM quotes 
    WHERE quotes.id = quote_versions.quote_id
    AND quotes.salesperson_id = auth.uid()
  )
);

-- 明细继承版本权限
CREATE POLICY "quote_items_inherit" ON quote_items
USING (
  EXISTS (
    SELECT 1 FROM quote_versions qv
    JOIN quotes q ON q.id = qv.quote_id
    WHERE qv.id = quote_items.quote_version_id
    AND q.salesperson_id = auth.uid()
  )
);
```

---

## 💻 技术实现

### 后端 Server Actions

#### 1. 创建报价单

```typescript
export const createQuote = async (data: CreateQuoteDTO) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // 1. 创建报价单主记录
  const quote = await supabase.from('quotes').insert({
    quote_no: generateQuoteNo(),
    salesperson_id: user.id,
    ...data
  }).select().single();
  
  // 2. 创建初始版本 V1
  const version = await createVersionInternal(supabase, {
    quote_id: quote.id,
    items: data.items,
    version_suffix: 'V1'
  }, 1);
  
  // 3. 更新当前版本指针
  await supabase.from('quotes')
    .update({ current_version_id: version.id })
    .eq('id', quote.id);
    
  return { quoteId: quote.id };
};
```

#### 2. 创建新版本

```typescript
export const createVersion = async (dto: CreateQuoteVersionDTO) => {
  // 获取当前最大版本号
  const maxVersion = await getMaxVersionNumber(dto.quote_id);
  const nextVersionNumber = (maxVersion || 0) + 1;
  
  // 创建新版本及其明细
  const version = await createVersionInternal(
    supabase, 
    dto, 
    nextVersionNumber
  );
  
  // 设置为当前版本
  await updateCurrentVersion(dto.quote_id, version.id);
  
  return version;
};
```

#### 3. 转化为销售单

```typescript
export const convertToOrder = async (quoteId: string) => {
  // 1. 前置校验
  const quote = await getQuote(quoteId);
  const currentVersion = getCurrentVersion(quote);
  
  if (currentVersion.status !== 'accepted') {
    throw new Error('Only accepted quotes can be converted');
  }
  
  // 2. 深拷贝数据到销售单
  const salesOrder = await supabase.from('sales_orders').insert({
    sales_no: `SO-${Date.now()}`,
    lead_id: quote.lead_id,
    customer_id: quote.customer_id,
    source_quote_id: quoteId,  // 溯源字段
    status: 'draft'
  }).select().single();
  
  // 3. 复制明细
  const items = currentVersion.items.map(item => ({
    sales_order_id: salesOrder.id,
    category: item.category,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price
  }));
  
  await supabase.from('sales_order_items').insert(items);
  
  // 4. 更新报价单状态
  await supabase.from('quotes')
    .update({ status: 'won' })
    .eq('id', quoteId);
    
  return { salesOrderId: salesOrder.id };
};
```

---

## 🎨 前端界面

### 1. 报价单列表页 (`/quotes`)

**功能：**
- 展示当前用户的所有报价单
- 显示报价单号、项目名称、当前版本、状态
- 支持点击跳转到详情页

**技术架构：**
- Server Component：直接调用 `getQuotes()` 获取数据
- Client Component：`QuoteListTable` 负责表格渲染和交互

### 2. 报价单创建页 (`/quotes/create`)

**功能：**
- 填写项目基本信息
- 动态添加/删除报价明细
- 自动计算总价
- 表单验证（Zod Schema）

**关键组件：**
- `QuoteEditor`：表单和明细编辑
- React Hook Form：表单状态管理
- `useFieldArray`：动态明细列表

### 3. 报价单详情页 (`/quotes/[id]`)

**功能：**
- 查看报价单基本信息
- 多版本切换（V1/V2/V3...）
- 查看版本明细
- "转为销售单"按钮（仅 accepted 状态显示）

**关键组件：**
- `QuoteDetailView`：主展示组件
- `QuoteVersionSelector`：版本切换器
- `ConvertToOrderButton`：转化按钮

---

## 👤 用户操作指南

### 场景 1：创建报价单

1. **进入创建页**：点击"新建报价单"按钮
2. **填写基本信息**：项目名称、项目地址
3. **添加明细**：
   - 点击"添加项目"
   - 填写产品名称、空间、数量、单价
   - 系统自动计算总价
4. **保存**：点击"保存报价单"

### 场景 2：创建新版本

1. **打开报价单详情页**
2. **点击"创建新版本"**
3. **基于当前版本修改**：调整明细、价格等
4. **保存新版本**：系统自动生成 V2、V3...

### 场景 3：转化为销售单

**前提条件：**
- 报价单某个版本状态为 `accepted`
- 报价单未转化过（status !== 'won'）

**操作步骤：**
1. **打开报价单详情页**
2. **确认当前版本**：切换到已确认的版本
3. **点击"转为销售单"按钮**
4. **确认操作**：弹出确认框，点击确定
5. **查看结果**：系统显示生成的销售单号

---

## 🔄 与销售单的关系

### 数据隔离策略

```
报价单生态系统              销售单生态系统
┌─────────────────┐         ┌──────────────────┐
│ quotes          │         │ sales_orders     │
│ quote_versions  │  深拷贝  │ sales_order_items│
│ quote_items     │  ────>  │                  │
└─────────────────┘         └──────────────────┘
        ↑                            │
        └────── source_quote_id ─────┘
                  (溯源关联)
```

### 关键设计原则

1. **数据独立**：报价单和销售单各自拥有独立的明细表
2. **深拷贝转化**：转化时完全复制数据，不共享行记录
3. **单向溯源**：销售单通过 `source_quote_id` 可追溯来源
4. **互不影响**：报价单修改不影响已生成的销售单

### 为什么不共享数据？

❌ **错误做法**：销售单直接引用 `quote_items`
- 修改报价单会影响已下单的销售单
- 销售单无法独立调整价格和数量
- 数据耦合导致业务逻辑复杂

✅ **正确做法**：深拷贝到 `sales_order_items`
- 报价单和销售单独立演进
- 销售单可以独立修改（如客户要求调整）
- 数据隔离，逻辑清晰

---

## 📝 类型定义

### TypeScript 接口

```typescript
// 报价单主记录
export interface Quote {
  id: string;
  quoteNo: string;
  leadId?: string;
  customerId?: string;
  projectName?: string;
  projectAddress?: string;
  salespersonId?: string;
  currentVersionId?: string;
  status: QuoteStatus;
  currentVersion?: QuoteVersion;
  versions?: QuoteVersion[];
  createdAt: string;
  updatedAt: string;
}

// 报价版本
export interface QuoteVersion {
  id: string;
  quoteId: string;
  versionNumber: number;
  versionSuffix?: string;
  totalAmount: number;
  status: QuoteVersionStatus;
  validUntil?: string;
  remarks?: string;
  items?: QuoteItem[];
  createdAt: string;
  updatedAt: string;
}

// 报价明细
export interface QuoteItem {
  id: string;
  quoteVersionId: string;
  category: string;
  space: string;
  productName: string;
  productId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
  imageUrl?: string;
  attributes?: Record<string, any>;
  createdAt: string;
}
```

---

## 🚀 部署与迁移

### 数据库迁移

```bash
# 应用迁移文件
supabase db push

# 或者手动执行
psql -h <host> -U postgres -d <database> \
  -f supabase/migrations/20251212000003_create_quotes_schema.sql
  
psql -h <host> -U postgres -d <database> \
  -f supabase/migrations/20251212000004_quotes_rls_and_triggers.sql
```

### 验证部署

```sql
-- 检查表是否创建成功
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'quote%';

-- 检查 RLS 是否启用
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'quote%';

-- 检查触发器
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name LIKE '%quote%';
```

---

## 🎯 后续增强计划

### Phase 4: 客户交互功能

- [ ] **PDF 导出**
  - 后端生成 PDF（基于报价单数据）
  - 支持下载和在线预览
  - PDF 包含报价明细、签字区域

- [ ] **客户电子签名**
  - 客户在 PDF 上签名
  - 签名后状态自动更新为 `accepted`
  - 保存签名后的 PDF

### 可选功能

- 报价单模板管理
- 批量导入明细
- 报价单对比功能
- 报价历史分析

---

## 🔍 常见问题

### Q1: 报价单转化后还能修改吗？

**A:** 报价单转化后状态变为 `won`，通常不再修改。如需调整，可以：
1. 创建新版本（但不影响已生成的销售单）
2. 直接在销售单中修改

### Q2: 如何处理客户多次修改需求？

**A:** 通过多版本管理：
1. 客户提出修改 → 创建新版本（V2）
2. 再次修改 → 创建 V3
3. 客户确认 V3 → 更新 V3 状态为 `accepted`
4. 转化 V3 为销售单

### Q3: 删除报价单会影响已生成的销售单吗？

**A:** 不会。`source_quote_id` 使用 `ON DELETE SET NULL`，删除报价单后销售单的溯源字段变为 NULL，但销售单数据完整保留。

### Q4: 如何查询某个报价单生成了哪些销售单？

```sql
SELECT * FROM sales_orders 
WHERE source_quote_id = 'quote-id';
```

---

## 📚 相关文档

- [数据库 Schema 设计](file:///Users/laichangcheng/Documents/文稿%20-%20来长城的MacBook%20Air/trae/L2C/supabase/migrations/20251212000003_create_quotes_schema.sql)
- [RLS 策略配置](file:///Users/laichangcheng/Documents/文稿%20-%20来长城的MacBook%20Air/trae/L2C/supabase/migrations/20251212000004_quotes_rls_and_triggers.sql)
- [后端服务实现](file:///Users/laichangcheng/Documents/文稿%20-%20来长城的MacBook%20Air/trae/L2C/slideboard-frontend/src/features/quotes/services/quote.service.ts)
- [类型定义](file:///Users/laichangcheng/Documents/文稿%20-%20来长城的MacBook%20Air/trae/L2C/slideboard-frontend/src/shared/types/quote.ts)

---

**文档版本**: v1.0  
**最后更新**: 2025-12-12  
**维护者**: 开发团队
