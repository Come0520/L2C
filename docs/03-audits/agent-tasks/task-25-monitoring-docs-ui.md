# Task 25: Monitoring 模块功能需求文档 + 测试补强（L3 → L4）

> **任务性质**：文档 + 测试编写（不改生产业务逻辑）
> **目标**：D4 文档完整性提升，D3 测试补强（tests=3 → ≥5）
> **模块路径**：`src/features/monitoring/`
> **评估人**：主线程 AI（不参与编程，只做验收）

---

## 🔍 当前状态（Phase 5 实测）

| 指标 | 当前值 | 目标 | 状态 |
|:---|:---:|:---:|:---:|
| JSDoc 注释块数 | 49 | ≥ 49 | ✅ 已足够 |
| 功能需求文档 | **无** | 1 份 | 🔴 |
| 测试文件数 | **3** | ≥ 5 | 🟡 偏少 |
| audit | 8 | — | ✅ |
| logger | 14 | — | ✅ |
| tsx 组件 | 0 | — | 纯 server actions |
| @ts-ignore | 0 | 0 | ✅ |

---

## 📋 任务清单

### 任务一：编写功能需求文档（D4 核心提升）

在 `docs/02-requirements/modules/监控/` 目录下创建 `monitoring-requirements.md`：

```markdown
# 监控模块功能需求文档

## 1. 模块概述
- 业务定位：系统健康状态监测与预警
- 核心价值：实时监控 + 阈值告警 + 审计追踪

## 2. 功能域清单
### 2.1 告警规则管理 (CRUD)
### 2.2 系统健康检查（数据库连接、服务可用性）
### 2.3 告警通知（触发、确认、静默）
### 2.4 监控数据查询与可视化

## 3. 安全与审计
- 告警规则的 AuditService 审计记录
- 多租户隔离策略
```

> **注意**：通过阅读 `src/features/monitoring/actions/` 下的代码来填写，确保文档与代码一致。

---

### 任务二：补充测试文件（tests=3 → ≥5）

在 `src/features/monitoring/__tests__/` 下新增 **2 个**测试文件：

#### 文件 A：`alert-rules-crud.test.ts`（告警规则 CRUD 测试）
```typescript
describe('Monitoring 告警规则 CRUD', () => {
    it('应成功创建告警规则并记录审计日志')
    it('应成功更新告警规则阈值')
    it('应成功删除告警规则')
    it('查询告警规则列表应只返回当前租户的规则')
    it('创建重复名称的规则应返回错误')
})
```

#### 文件 B：`tenant-isolation.test.ts`（租户隔离安全测试）
```typescript
describe('Monitoring 租户隔离', () => {
    it('租户 A 无法查看租户 B 的告警规则')
    it('租户 A 无法修改租户 B 的告警规则')
    it('无 session 的请求应被拒绝')
})
```

**要求**：
- 必须 mock 数据库（参考现有 `monitoring-actions.test.ts` 的 mock 模式）
- 不修改现有 3 个测试文件
- AuditService 已在生产代码中接入，测试可验证其被调用

---

## ✅ 验收清单

```powershell
# 1. 功能需求文档存在
Test-Path "docs/02-requirements/modules/监控/monitoring-requirements.md"

# 2. 文档字数（≥ 1000 字符）
(Get-Content "docs/02-requirements/modules/监控/monitoring-requirements.md" | Measure-Object -Character).Characters

# 3. 测试文件数（必须 ≥ 5）
(Get-ChildItem src\features\monitoring -r -Include "*.test.ts","*.test.tsx").Count

# 4. 测试全通过
npx vitest run src/features/monitoring

# 5. tsc 编译
npx tsc --noEmit 2>&1 | Select-String "monitoring"
```

## 交付说明
完成后宣告"Task 25 完成"，报告文档行数和新增测试用例数量。
