# Task 30: Quotes 性能 + 测试冲刺（L5 巩固）

> **任务性质**：性能优化 + 测试增强
> **目标**：巩固 Quotes L5 地位，性能和测试质量再上一个台阶
> **模块路径**：`src/features/quotes/`
> **评估人**：主线程 AI（不参与编程，只做验收）
> **来源**：旧 Task 13（性能冲刺）+ Task 14（测试质量冲刺）合并

---

## 📋 任务一：性能冲刺

### Step 1：添加 `unstable_cache` 缓存（≥2 处新增）

找到高频读取查询（如报价单列表、报价详情），包裹 `unstable_cache`：

```typescript
import { unstable_cache } from 'next/cache';

const getCachedQuoteDetail = unstable_cache(
  async (quoteId: string, tenantId: string) => {
    return db.query.quotes.findFirst({...});
  },
  ['quote-detail'],
  { revalidate: 60, tags: ['quotes'] }
);
```

### Step 2：排查 N+1 查询

```powershell
# 找出可能的 N+1 模式（循环内的查询）
Get-ChildItem src\features\quotes -r -Include "*.ts" | Select-String "for.*await.*db\.|\.map.*await.*db\." | ForEach-Object { "$($_.Filename):$($_.LineNumber) $($_.Line.Trim())" }
```

如发现 N+1，改为批量查询或 `with` 关联查询。

### Step 3：添加 `React.memo`（确保 ≥3 处）

当前 memo 数量可能已满足。检查并在以下场景添加：
- 大型表格行组件
- 频繁重渲染的计算密集型组件
- 接收引用类型 props 的纯展示组件

```tsx
const QuoteItemRow = React.memo(function QuoteItemRow(props: QuoteItemRowProps) {
  // ...
});
```

---

## 📋 任务二：测试质量冲刺

### Step 1：新增 ≥3 个边界场景测试

推荐场景：
1. **空报价单** — 创建不含任何行项的报价单
2. **超大行数** — 创建含 100+ 行项的报价单，验证分页/虚拟化
3. **并发编辑冲突** — 模拟两个用户同时编辑同一报价单
4. **金额精度** — 验证大金额/小数精度的计算正确性
5. **状态流转边界** — 测试非法状态转换（如已审批→草稿）

### Step 2：清理测试中的 `any`（≤3 处）

```powershell
Get-ChildItem src\features\quotes\__tests__ -r -Include "*.test.ts" | Select-String "\bany\b" | ForEach-Object { "$($_.Filename):$($_.LineNumber) $($_.Line.Trim())" }
```

将测试文件中的 `any` 替换为具体类型或 `unknown`。

### Step 3：补充 traceId 链路日志

在核心 Server Actions 中确保 traceId 贯穿：
```typescript
const traceId = crypto.randomUUID();
logger.info('[Quotes] 开始创建报价单', { traceId, tenantId });
// ... 业务逻辑 ...
logger.info('[Quotes] 报价单创建成功', { traceId, quoteId: result.id });
```

---

## ⚠️ 注意事项

- `unstable_cache` 的 key 必须包含 tenantId，防止跨租户数据泄露
- **不要删除现有测试**
- `React.memo` 只用在确实有性能收益的地方，不要滥用
- traceId 应为 UUID v4 格式

---

## ✅ 验收清单

```powershell
# 1. unstable_cache 使用数（≥2 处新增）
(Get-ChildItem src\features\quotes -r -Include "*.ts","*.tsx" | Select-String "unstable_cache").Count

# 2. React.memo 使用数（≥3）
(Get-ChildItem src\features\quotes -r -Include "*.tsx" | Select-String "React\.memo").Count

# 3. 测试文件 any 数（≤3）
(Get-ChildItem src\features\quotes -r -Include "*.test.ts","*.test.tsx" | Select-String "\bany\b").Count

# 4. traceId 使用（≥2 处）
(Get-ChildItem src\features\quotes -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__"} | Select-String "traceId").Count

# 5. tsc 编译
npx tsc --noEmit 2>&1 | Select-String "quotes"

# 6. 测试全通过
npx vitest run src/features/quotes
```

## 交付说明
完成后宣告"Task 30 完成"，报告新增缓存数、memo 数、新测试场景名称。
