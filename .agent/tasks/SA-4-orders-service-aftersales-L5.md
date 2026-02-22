# SA-4: Orders + Service + After-Sales 模块升级（L2+/L3→L5）

> [Subagent 4 - Order Delivery L5] 请在每次回复开头标注此身份。

## 目标

将 `src/features/orders/`、`src/features/service/`、`src/features/after-sales/` 升级到 L5。

## 当前状态

### orders（订单）— L3
- 50 文件，0 any/0 ts-ignore✅，29 测试用例（密度 1.6）
- 15 Zod，12 tenantId，7 审计日志
- **短板**：测试用例数偏少，Logger 不足

### service（服务单）— L2+（**最需改进**）
- 97 文件（大体量），**5 any + 6 ts-ignore** ⚠️，22 测试用例（密度 1.0）
- 31 Zod，19 tenantId，9 审计日志
- **关键缺陷**：**无需求文档**❌，代码质量需大幅提升

### after-sales（售后）— L2+
- 38 文件，2 any，0 ts-ignore，46 测试用例
- 13 Zod，7 tenantId
- **短板**：审计日志仅 2 处，Logger **0 处**

## 任务清单

### 1. D2 代码质量（重点：service）
- **service**：清理 5 个 `any` + 6 个 `ts-ignore`，用具体类型替代
- **after-sales**：清理 2 个 `any`
- 三个模块消除残留 `console.log/warn/error` → logger

### 2. D3 测试覆盖
- **orders**：从 29 → 50+ 用例
- **service**：从 22 → 40+ 用例
- 重点：状态机转换、权限检查、边界条件

### 3. D7 可运维性
- **after-sales**：Logger 从 0 → 全覆盖，审计从 2 → 所有写操作
- **orders**：补充 Logger
- **service**：确认审计日志覆盖

### 4. D4 文档
- **service**：**新建需求文档** `docs/02-requirements/modules/服务单.md`
- 三个模块 JSDoc 覆盖

### 5. D5 UI/UX
- 三态处理完善
- 表单校验和 Toast 反馈

## 约束

- **只修改** `src/features/orders/`、`src/features/service/`、`src/features/after-sales/`
- 可以在 `docs/02-requirements/modules/` 创建 service 的需求文档
- 不修改共享组件或其他模块

## 验收标准

```powershell
pnpm type-check
pnpm test:run src/features/orders       # ≥ 50 用例
pnpm test:run src/features/service       # ≥ 40 用例
pnpm test:run src/features/after-sales   # 全通过

# service 生产代码零 any/ts-ignore
Get-ChildItem -Path src/features/service -Recurse -Include *.ts,*.tsx | Where-Object { $_.FullName -notmatch '__tests__' } | Select-String -Pattern 'as any|@ts-expect-error|@ts-ignore' | Measure-Object
# 期望 Count = 0
```

## 返回要求

完成后请返回：修改文件清单、维度改进对比、测试覆盖变化、问题与方案。
