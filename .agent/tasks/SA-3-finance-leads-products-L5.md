# SA-3: Finance + Leads + Products 模块升级（L3→L5）

> [Subagent 3 - Sales Core L5] 请在每次回复开头标注此身份。

## 目标

将 `src/features/finance/`、`src/features/leads/`、`src/features/products/` 从 L3 升级到 L5。

## 当前状态

### finance（财务）
- 49 文件，0 any/0 ts-ignore✅，46 测试用例
- 26 Zod，15 tenantId，11 审计日志
- **短板**：D5=5（UI 三态不完整），D8=5（分页仅 4 处）

### leads（线索）
- 49 文件，0 any，1 ts-ignore
- 55 测试用例，16 Zod，14 tenantId
- **短板**：D7=4（审计仅 2 处，Logger **0 处**）

### products（商品）
- 41 文件，0 any，**5 个 ts-ignore** ⚠️
- 76 测试用例，16 Zod，9 tenantId
- **短板**：审计日志不足

## 任务清单

### 1. D2 代码质量
- **products**：清理 5 个 `ts-ignore`，用类型守卫或接口扩展替代
- **leads**：清理 1 个 `ts-ignore`
- 检查并消除残留的 `console.log/warn`

### 2. D7 可运维性（最重要）
- **leads**：从 0 → 全覆盖 logger 使用，审计日志从 2 → 所有写操作
- **products**：补充审计日志
- **finance**：确认审计日志覆盖完整度

### 3. D5 UI/UX
- **finance**：UI 三态处理完善（加载/空/错误）
- 三个模块表单校验反馈检查

### 4. D8 性能
- **finance**：分页从 4 处扩展到所有列表查询
- **leads**：检查分页覆盖
- 三个模块 N+1 查询扫描

### 5. D4 文档
- JSDoc 覆盖所有导出函数
- Schema `.describe()` 完善

## 约束

- **只修改** `src/features/finance/`、`src/features/leads/`、`src/features/products/`
- 不修改共享组件、数据库 schema 或其他模块

## 验收标准

```powershell
pnpm type-check
pnpm test:run src/features/finance   # 全通过
pnpm test:run src/features/leads     # 全通过
pnpm test:run src/features/products  # 全通过

# 生产代码零 ts-ignore（三个模块）
Get-ChildItem -Path src/features/finance,src/features/leads,src/features/products -Recurse -Include *.ts,*.tsx | Where-Object { $_.FullName -notmatch '__tests__' } | Select-String -Pattern '@ts-expect-error|@ts-ignore' | Measure-Object
# 期望 Count = 0
```

## 返回要求

完成后请返回：修改文件清单、维度改进对比、测试覆盖变化、问题与方案。
