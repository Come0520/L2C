# Task 29: Dispatch + Monitoring 冲击 L4

> **任务性质**：代码改进（UI 三态 + 需求文档）
> **目标**：dispatch/monitoring 从 L3 升至 L4
> **模块路径**：`src/features/dispatch/` 和 `src/features/monitoring/`
> **评估人**：主线程 AI（不参与编程，只做验收）

---

## 🔍 当前状态

| 模块 | 等级 | 关键短板 |
|:---|:---:|:---|
| dispatch | L3 (7.0) | D5 UI=6（缺 Skeleton/ErrorBoundary）、D8 性能=6 |
| monitoring | L3 (6.8) | D5 UI=5（无 tsx 组件）、需求文档状态不明 |

---

## 📋 Dispatch 模块任务

### 任务一：补充 UI 三态（Skeleton + ErrorBoundary + Empty）

**Step 1：审计当前 UI 组件**
```powershell
Get-ChildItem src\features\dispatch -r -Include "*.tsx" | Select-String "Skeleton|ErrorBoundary|Loading|Empty" | ForEach-Object { "$($_.Filename):$($_.LineNumber)" }
```

**Step 2：为调度页面添加三态 UI**

如果有调度页面组件（如 dispatch-list、task-board 等）：
1. 添加 `Skeleton` 加载骨架屏
2. 添加 `ErrorBoundary` 错误边界
3. 添加空数据状态提示

```tsx
// 示例
import { Skeleton } from '@/shared/components/ui/skeleton';

// Loading 状态
<Skeleton className="h-12 w-full" />

// Error 边界
<ErrorBoundary fallback={<div>加载失败，请稍后重试</div>}>
  <DispatchContent />
</ErrorBoundary>
```

**Step 3：确保功能需求文档存在**
```powershell
Test-Path "docs/02-requirements/modules/调度/dispatch-requirements.md"
```
如果不存在，创建之（Phase 6 Task 24 应该已创建）。

---

## 📋 Monitoring 模块任务

### 任务一：确认/补全需求文档

```powershell
Test-Path "docs/02-requirements/modules/监控/monitoring-requirements.md"
```

如果不存在，创建功能需求文档，覆盖以下内容：
- 模块定位与核心功能
- 告警规则 CRUD
- 通知偏好管理
- 租户隔离策略

### 任务二：JSDoc 补强（如不足 50）

当前 jsdoc=51，已达标。如有新增代码则确保 JSDoc 跟上。

### 任务三：D5 评分说明

monitoring 模块是纯后端 Server Actions 模块，无前端 tsx 组件。
在需求文档中补充说明：
> 本模块为纯服务端模块，不含前端 UI 组件。D5 维度评分标记为"不适用 (N/A)"。

---

## ⚠️ 注意事项

- Dispatch 的 Skeleton 和 ErrorBoundary 必须使用项目已有的共享组件
- **不要新建 UI 组件库依赖**
- **不要修改业务逻辑**

---

## ✅ 验收清单

```powershell
# 1. Dispatch Skeleton 使用（≥2）
(Get-ChildItem src\features\dispatch -r -Include "*.tsx" | Select-String "Skeleton|skeleton").Count

# 2. Dispatch ErrorBoundary（≥1）
(Get-ChildItem src\features\dispatch -r -Include "*.tsx" | Select-String "ErrorBoundary").Count

# 3. Monitoring 需求文档
Test-Path "docs/02-requirements/modules/监控/monitoring-requirements.md"

# 4. Dispatch 需求文档
Test-Path "docs/02-requirements/modules/调度/dispatch-requirements.md"

# 5. tsc 编译
npx tsc --noEmit 2>&1 | Select-String "dispatch|monitoring"

# 6. 测试全通过
npx vitest run src/features/dispatch src/features/monitoring
```

## 交付说明
完成后宣告"Task 29 完成"，报告新增 Skeleton/ErrorBoundary 数量及文档状态。
