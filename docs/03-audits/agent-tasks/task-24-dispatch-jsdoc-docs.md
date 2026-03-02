# Task 24: Dispatch 模块 JSDoc 补强 + 功能需求文档（L3 → L4）

> **任务性质**：文档编写（非编程任务，不改业务逻辑）
> **目标**：D4 文档维度从 7 提升至 8+，jsdoc=28 → ≥50，新增功能需求文档
> **模块路径**：`src/features/dispatch/`
> **评估人**：主线程 AI（不参与编程，只做验收）

---

## 🔍 当前状态（Phase 5 实测）

| 指标 | 当前值 | 目标 | 状态 |
|:---|:---:|:---:|:---:|
| JSDoc 注释块数 | **28** | ≥ 50 | 🟡 需翻倍 |
| 功能需求文档 | **无** | 1 份完整文档 | 🔴 D4 最大短板 |
| tests | 5 | — | ✅ |
| audit | 7 | — | ✅ |
| logger | 25 | — | ✅ |

---

## 📋 任务清单

### 任务一：补充 JSDoc 注释（最大工作量）

**第一步：定位所有缺少 JSDoc 的公共方法**
```powershell
# 列出所有 ts 文件及其方法数和 JSDoc 数
Get-ChildItem "src/features/dispatch" -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | ForEach-Object {
    $methods = (Select-String -Path $_.FullName -Pattern "^\s+(export\s+)?(async\s+)?function\s+|^\s+(async\s+)?\w+\s*\(" | Measure-Object).Count
    $jsdocs = (Select-String -Path $_.FullName -Pattern "^\s*/\*\*" | Measure-Object).Count
    "$($_.Name) : methods=$methods, jsdoc=$jsdocs"
}
```

**JSDoc 规范**：
```typescript
/**
 * 创建调度任务并分配给指定安装人员
 *
 * @param data - 调度任务创建参数，包含日期、地址、安装人员等
 * @param tenantId - 租户 ID（多租户隔离）
 * @returns 创建后的调度任务对象，包含完整的分配信息
 * @throws {Error} 当安装人员不存在或已被禁用时抛出
 */
```

**优先级**：
1. `dispatch-actions.ts`（主 action 文件）— 所有公共 action 必须有 JSDoc
2. `matching.ts`（匹配逻辑）— 所有匹配算法方法必须有 JSDoc
3. 其他辅助文件

**要求**：
- 每个公共方法（export 的函数）必须有 JSDoc
- 使用中文业务语言描述，不是简单翻译函数名
- 必须包含 `@param`、`@returns`，有 `throw` 的要加 `@throws`
- **严禁修改任何业务逻辑代码，只添加注释**

---

### 任务二：编写功能需求文档

在 `docs/02-requirements/modules/调度/` 目录下创建 `dispatch-requirements.md`：

```markdown
# 调度模块功能需求文档

## 1. 模块概述
- 业务定位：连接订单/工单与安装人员的调度中心
- 核心价值：自动匹配最优安装人员，优化调度效率

## 2. 功能域清单
### 2.1 任务创建
- 从订单/工单生成调度任务
- 支持手动创建和批量创建

### 2.2 人员匹配
- 基于距离、技能、排期的智能匹配
- 匹配算法说明

### 2.3 任务分配
- 自动分配 vs 手动分配
- 分配冲突处理

### 2.4 状态流转
- 未分配 → 已分配 → 进行中 → 已完成
- 取消/改派流程

### 2.5 安全与权限
- 多租户隔离（tenantId 硬过滤）
- 操作审计日志

## 3. 数据模型
- 关联 schema 字段说明

## 4. API 接口清单
- 列出所有 server action 及其参数/返回值
```

> **注意**：通过阅读 `src/features/dispatch/actions/` 下的实际代码来填写内容，确保文档与代码一致。

---

## ✅ 验收清单

```powershell
# 1. JSDoc 注释块数（必须 ≥ 50）
(Get-ChildItem src\features\dispatch -r -Include "*.ts","*.tsx" | Select-String "^\s*/\*\*").Count

# 2. 功能需求文档存在
Test-Path "docs/02-requirements/modules/调度/dispatch-requirements.md"
# 期望：True

# 3. 文档字数（须有实质内容，≥ 300 字）
(Get-Content "docs/02-requirements/modules/调度/dispatch-requirements.md" | Measure-Object -Character).Characters
# 期望：≥ 1000

# 4. tsc 编译（注释不应引入错误）
npx tsc --noEmit 2>&1 | Select-String "dispatch"
# 期望：无输出

# 5. 测试仍全通过
npx vitest run src/features/dispatch
```

## 交付说明
完成后宣告"Task 24 完成"，报告 JSDoc 新增数量和功能文档行数。
