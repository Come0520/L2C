# Task 22: Pricing 模块 AuditService 接入 + Logger 全面补强

> **任务性质**：代码改进（编程任务）
> **目标**：Pricing 模块 AuditService=0 → ≥4，logger=2 → ≥10
> **模块路径**：`src/features/pricing/`
> **评估人**：主线程 AI（不参与编程，只做验收）

---

## 🔍 实测发现的核心问题

| 指标 | 当前值 | 目标 | 状态 |
|:---|:---:|:---:|:---:|
| `AuditService` 引用（生产代码） | **0** | ≥ 4 | 🔴 |
| `logger.` 调用 | **2** | ≥ 10 | 🔴 全模块几乎无日志 |
| `any` 类型 | 0 | 0 | ✅ 已清零 |
| 测试文件数 | 4 | ≥ 4 | ✅ |
| Skeleton/loading | 4 | — | ✅ 已有 |

**核心矛盾**：定价模块涉及金额计算和价格策略，是最需要审计追踪的模块之一，却完全没有 AuditService 记录，且日志只有 2 条。

---

## 📋 必须完成的具体任务

### 前置步骤：了解模块结构

**先阅读以下文件，理解当前的 action 结构**：
```powershell
Get-ChildItem src\features\pricing -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-Object Name, Length
```

---

### 任务一：接入 AuditService 审计日志（最高优先级）

**背景**：定价规则的修改直接影响业务报价金额，必须完整记录每次价格策略变更。

**需要接入的操作（按重要性排序）**：

#### 1. 定价规则创建
```typescript
import { AuditService } from '@/shared/services/audit-service';

// 定价规则创建成功后：
await AuditService.log({
    action: 'CREATE',
    entityType: 'pricing_rule',
    entityId: newRule.id,
    tenantId: session.user.tenantId,
    userId: session.user.id,
    newValue: newRule, // 记录完整的新规则内容（含价格数值）
});
```

#### 2. 定价规则修改（最重要——直接影响金额）
```typescript
// 务必记录修改前后的对比（oldValue + newValue）：
const oldRule = await db.query.pricingRules.findFirst({ where: eq(pricingRules.id, ruleId) });

// 执行修改...

await AuditService.log({
    action: 'UPDATE',
    entityType: 'pricing_rule',
    entityId: ruleId,
    tenantId: session.user.tenantId,
    userId: session.user.id,
    oldValue: oldRule,  // 记录旧价格（关键！）
    newValue: updatedRule, // 记录新价格
});
```

#### 3. 定价规则删除
```typescript
// 删除前先查询旧值：
const deletedRule = await db.query.pricingRules.findFirst({ where: eq(pricingRules.id, ruleId) });

// 执行删除...

await AuditService.log({
    action: 'DELETE',
    entityType: 'pricing_rule',
    entityId: ruleId,
    tenantId: session.user.tenantId,
    userId: session.user.id,
    oldValue: deletedRule, // 记录被删除的规则（合规要求）
});
```

#### 4. 批量价格更新（如有）
```typescript
await AuditService.log({
    action: 'BULK_UPDATE',
    entityType: 'pricing_rules',
    entityId: 'batch',
    tenantId: session.user.tenantId,
    userId: session.user.id,
    metadata: { count: updatedCount, type: updateType },
});
```

**最低要求**：至少 4 处 AuditService 调用（覆盖 CREATE/UPDATE/DELETE 三种操作）。

---

### 任务二：大幅补充运营日志

当前 `logger` 只有 2 处，是所有模块中**最少**的（pricing 是金额核心模块，日志严重不足）。

**必须添加的日志场景**：
```typescript
// 1. 定价规则查询
logger.info('[Pricing] 获取定价规则列表', { tenantId, count: rules.length });

// 2. 价格计算请求
logger.info('[Pricing] 开始价格计算', { tenantId, productId, quantity });

// 3. 价格计算完成
logger.info('[Pricing] 价格计算完成', { result, durationMs });

// 4. 价格区间校验失败
logger.warn('[Pricing] 价格超出允许区间', { calculated, min, max, tenantId });

// 5. 折扣超限警告
logger.warn('[Pricing] 折扣比例超出系统限制', { discount, maxAllowed, userId });

// 6. 规则创建成功
logger.info('[Pricing] 定价规则创建成功', { ruleId, tenantId, userId });

// 7. 规则修改成功（关键日志）
logger.info('[Pricing] 定价规则已修改', { ruleId, tenantId, userId, changes });

// 8. 规则删除
logger.warn('[Pricing] 定价规则已删除', { ruleId, tenantId, userId });

// 9. 跨租户访问拒绝
logger.warn('[Pricing] 拒绝跨租户定价规则访问', { userId, requestedTenantId, actualTenantId });

// 10. 异常处理
logger.error('[Pricing] 价格计算发生异常', { error: err.message, tenantId });
```

**目标**：logger 调用从 2 个增加到 ≥ 10 个。

---

## ⚠️ 特别注意事项

1. **价格数值必须完整记录**：AuditService 的 `oldValue` 和 `newValue` 对于定价模块至关重要，省略任意一个都会导致合规风险
2. **不要修改测试文件**：现有 4 个测试文件保持不变
3. **AuditService 调用必须在写操作成功后**：不要在操作失败时记录成功日志

---

## ✅ 最终验收清单

```powershell
# 1. AuditService 生产引用数
(Get-ChildItem src\features\pricing -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "AuditService").Count
# 期望：≥ 4

# 2. logger 调用数
(Get-ChildItem src\features\pricing -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String "logger\.").Count
# 期望：≥ 10

# 3. 测试全通过
npx vitest run src/features/pricing
# 期望：Exit code 0，0 个失败

# 4. TypeScript 编译
npx tsc --noEmit 2>&1 | Select-String "pricing"
# 期望：无输出
```

## 交付说明
完成后宣告"Task 22 完成"，逐项报告每条验收命令的**实际数字**。特别注意：AuditService 调用中是否包含了 `oldValue`（UPDATE/DELETE 场景）。
