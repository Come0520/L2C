# SA-6: Dashboard + Showroom 模块升级（L2→L5）

> [Subagent 6 - Frontend Display L5] 请在每次回复开头标注此身份。

## 目标

将 `src/features/dashboard/` 和 `src/features/showroom/` 从 L2 升级到 L5。

## 当前状态

### dashboard（仪表盘）— L2 ⚠️降级
- 28 文件，17 UI 组件，2 any
- **35 个 TODO/FIXME**📛（全项目最高）
- D6=3：Zod **仅 2 处**，tenantId **仅 2 处** ❌ 安全严重不足
- 15 测试用例

### showroom（展厅）— L2 ⚠️双降级
- 12 文件，**0 UI 组件**（纯后端）
- **0 测试用例**❌
- D5=2，D6=4
- 6 Zod，2 tenantId，3 审计

## 任务清单

### 1. D6 安全加固（**紧急**）
- **dashboard**：
  - 所有 action/query 补充 Zod 校验（当前仅 2 处）
  - 所有数据查询补充 tenantId 过滤（当前仅 2 处）
  - 补充 auth guard
- **showroom**：扩展 Zod 和 tenantId 覆盖

### 2. D1 功能完整性
- **dashboard**：清理 **35 个 TODO/FIXME**
  - 评估每个 TODO：可删除 vs 需实现
  - 实现必要功能，删除过期 TODO

### 3. D3 测试覆盖
- **showroom**：从 **0 → 15+** 测试用例
- **dashboard**：从 15 → 30+ 测试用例
- 包含安全测试（未授权访问应被拒绝）

### 4. D5 UI/UX
- **showroom**：建立 UI 组件（当前为 0）
  - 至少包含：列表页、详情页、表单组件
- **dashboard**：完善三态处理和响应式布局

### 5. D2 代码质量
- **dashboard**：清理 2 个 `any`
- 消除所有 `console.log/warn`

### 6. D7 可运维性
- 审计日志覆盖所有写操作
- 统一使用 logger

## 约束

- **只修改** `src/features/dashboard/` 和 `src/features/showroom/`
- 不修改共享组件或其他模块

## 验收标准

```powershell
pnpm type-check
pnpm test:run src/features/dashboard  # ≥ 30 用例
pnpm test:run src/features/showroom   # ≥ 15 用例

# dashboard 安全检查：Zod 和 tenantId 覆盖
Get-ChildItem -Path src/features/dashboard -Recurse -Include *.ts,*.tsx | Where-Object { $_.FullName -notmatch '__tests__' } | Select-String -Pattern 'tenantId' | Measure-Object
# 期望 Count ≥ 10

# TODO 清理检查
Get-ChildItem -Path src/features/dashboard -Recurse -Include *.ts,*.tsx | Select-String -Pattern 'TODO|FIXME' | Measure-Object
# 期望 Count ≤ 5
```

## 返回要求

完成后请返回：修改文件清单、维度改进对比、安全加固详情（新增的 Zod/tenantId 数量）、TODO 清理统计、问题与方案。
