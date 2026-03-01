# [Agent Task 1] Finance 模块类型安全整改

> 任务类型：代码质量整改
> 优先级：P0（最高）
> 预计工时：4 天
> 验收人：主线程（Antigravity）

---

## 背景

L2C 项目 `finance` 模块在最新成熟度评估中因 **代码质量(D2)** 得分仅 5/10 而被评为 L3，主要问题：

- **48 处 `any` 类型**（全项目最多），在金融金额计算场景下是严重类型安全隐患
- **1 处 `@ts-ignore`**（全项目唯一，破坏了项目的零 ignore 文化）
- **1 处 TODO**

完成本任务后，D2 预期从 5 提升至 8，模块整体从 L3 升至 L4。

---

## 工作范围

**只修改** `src/features/finance/` 目录下的非测试文件。

| 允许修改 | 禁止修改 |
|:---|:---|
| `src/features/finance/**/*.ts` (非测试) | `src/features/finance/**/__tests__/**` |
| `src/features/finance/**/*.tsx` (非测试) | 其他任何 features 目录 |
| | `shared/` 目录 |
| | `drizzle/` 迁移文件 |

---

## 执行步骤

### Step 1：定位所有 any 类型

运行以下命令找出所有问题位置：

```bash
# 找出所有非测试文件中的 any 类型
grep -rn ": any\b\|as any\b\|= any\b\|<any>" src/features/finance \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir="__tests__"
```

### Step 2：分类处理策略

对每一处 `any`，按优先级选择替换策略：

**策略 A（最优）— Drizzle Schema 推导类型**
```typescript
// ❌ 之前
const account: any = await db.query.accounts.findFirst(...)

// ✅ 之后 —— 从 schema 获取推导类型
import { accounts } from '@/shared/api/db'
type Account = typeof accounts.$inferSelect
const account: Account | undefined = await db.query.accounts.findFirst(...)
```

**策略 B — Zod Schema 推导类型**
```typescript
// ❌ 之前
function processPayment(data: any) { ... }

// ✅ 之后
import { z } from 'zod'
import { paymentSchema } from './schemas'
function processPayment(data: z.infer<typeof paymentSchema>) { ... }
```

**策略 C — 明确 interface/type 定义**
```typescript
// ❌ 之前
const summary: any = { total: 0, items: [] }

// ✅ 之后
interface FinanceSummary {
  total: number
  items: PaymentItem[]
}
const summary: FinanceSummary = { total: 0, items: [] }
```

**策略 D — unknown + 类型守卫（用于外部输入）**
```typescript
// ❌ 之前
function handleWebhook(payload: any) { ... }

// ✅ 之后
function handleWebhook(payload: unknown) {
  if (!isValidPayload(payload)) throw new Error('Invalid payload')
  // payload 此后被 narrow 为正确类型
}
```

**策略 E（最后手段）— 保留并注释**
```typescript
// 如果以上策略均无法适用（例如第三方库 callback）：
// 类型受限于第三方库 [库名] 的 callback 参数，暂无法避免
const handler: any = thirdPartyLib.onEvent(...)
```

### Step 3：消除 @ts-ignore

1. 找到唯一的 `@ts-ignore`
2. 阅读下一行代码，理解被压制的类型错误
3. 修复底层类型问题（不要用 `@ts-expect-error` 替换，要真正修复）

### Step 4：处理 TODO

1. 找到 1 处 TODO 注释
2. 如果对应功能已实现 → 删除 TODO 注释
3. 如果功能未实现 → 评估是否属于本次范围，实现或标记为已知缺口

### Step 5：验证

```bash
# 类型检查（必须零错误）
cd c:\Users\bigey\Documents\Antigravity\L2C
npx tsc --noEmit

# 运行 finance 模块测试（必须全部通过）
npx vitest run src/features/finance

# 验证 any 数量减少（目标：≤ 5 处）
grep -rn ": any\b\|as any\b" src/features/finance \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir="__tests__" | wc -l
```

---

## 验收标准（主线程检查）

| 检查项 | 目标 |
|:---|:---|
| `any` 类型数量 | ≤ 5 处（从 48 减少） |
| `@ts-ignore` 数量 | **0**（从 1 降至 0） |
| `TODO` 数量 | 0 |
| `npx tsc --noEmit` | **零错误** |
| `npx vitest run src/features/finance` | **全部通过** |

---

## 返回报告格式

完成后请以 `[Agent 1 - Finance]` 开头汇报：

```
[Agent 1 - Finance]

## 修改文件列表
- src/features/finance/xxx.ts — 修复了 N 处 any
- ...

## 数量变化
- any 类型：48 → X 处（剩余 X 处为策略 E 保留，原因：...）
- @ts-ignore：1 → 0
- TODO：1 → 0

## 验证结果
- tsc --noEmit：✅ 零错误 / ❌ 有 N 个错误（列出错误）
- vitest run finance：✅ X/X 通过 / ❌ 有失败

## 需要主线程注意的问题
（如有）
```
