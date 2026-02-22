# SA-1: Quotes 模块全面升级（L4→L5）

> [Subagent 1 - Quotes L5] 请在每次回复开头标注此身份。

## 目标

将 `src/features/quotes/` 模块从 L4 升级到 L5 卓越级。

## 当前状态

| 维度 | 当前分 | 目标分 | 关键问题 |
|:---|:---:|:---:|:---|
| D2 代码质量 | 7 | 9+ | 9 个 `ts-expect-error`，测试代码有 `as any` |
| D3 测试覆盖 | 6 | 8+ | 29 个用例偏少，密度 1.1（27 文件） |
| D4 文档 | 5 | 8+ | JSDoc 不完整，Schema 缺少 `.describe()` |
| D7 可运维性 | 6 | 8+ | `console.warn` 残留，审计日志不足 |

## 任务清单

### 1. D2 代码质量清理

**生产代码**（`src/features/quotes/` 排除 `__tests__/`）：
- 消除所有 `@ts-expect-error` — 当前 9 处：
  - `quote-items-table.tsx`：2 处（类型与 UI Props 不匹配、结构不匹配）
  - `quote-detail.tsx`：3 处（PDF 布局类型不匹配、risk control 类型不匹配）
  - `quote-to-order-button.tsx`：1 处（接口返回 error 对象）
  - 其他文件中可能还有
- `console.warn` → 替换为 `import { logger } from '@/lib/logger'`：
  - `use-recent-products.ts`：2 处
  - `quote-items-table.tsx`：1 处（Strategy calc failed）
- `console.error` → 替换为 logger

**测试代码**（`__tests__/`）：
- `as any` → 使用具体类型或 `unknown` + 类型断言
- `console.log` → 替换为 logger 或删除

### 2. D3 测试覆盖提升

- 当前 29 个测试用例 → 目标 **≥ 60 个**
- 重点补充：
  - 每个 action 至少 3 个用例（正常/异常/边界）
  - 状态机转换测试（DRAFT→PENDING→APPROVED→REJECTED 等）
  - 计算策略单元测试（窗帘、墙纸、标品）

### 3. D7 可运维性

- 所有写操作（create/update/delete）增加审计日志
- 统一使用 `import { logger } from '@/lib/logger'`
- 错误分类：业务错误 vs 系统错误

### 4. D4 文档完善

- 所有导出函数添加 JSDoc 注释
- Schema 文件中字段添加 `.describe('字段说明')`
- 更新模块 README

## 约束

- **只修改** `src/features/quotes/` 目录下的文件
- **不修改** 共享组件（`src/shared/`）、数据库 schema（`src/db/`）或其他模块
- **不修改** ESLint/TypeScript 配置
- 每次修改后确保 `pnpm type-check` 通过

## 验收标准

```powershell
# 1. 类型检查零错误
pnpm type-check

# 2. 所有测试通过且 ≥ 60 用例
pnpm test:run src/features/quotes

# 3. 生产代码零 ts-expect-error/ts-ignore/console.* 
# （在 PowerShell 中执行）
Get-ChildItem -Path src/features/quotes -Recurse -Include *.ts,*.tsx | Where-Object { $_.FullName -notmatch '__tests__' } | Select-String -Pattern '@ts-expect-error|@ts-ignore|console\.(log|warn|error)' | Measure-Object
# 期望结果：Count = 0
```

## 返回要求

完成后请返回：
1. 修改的文件清单
2. 每个维度的改进前后对比
3. 测试覆盖率变化
4. 遇到的问题及解决方案
