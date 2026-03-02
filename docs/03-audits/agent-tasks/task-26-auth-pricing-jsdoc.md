# Task 26: Auth + Pricing 模块 JSDoc 大幅补强

> **任务性质**：文档编写（纯注释，不改业务逻辑）
> **目标**：auth JSDoc=24→≥80，pricing JSDoc=12→≥50
> **模块路径**：`src/features/auth/` 和 `src/features/pricing/`
> **评估人**：主线程 AI（不参与编程，只做验收）

---

## 🔍 当前状态

| 模块 | JSDoc 数 | 目标 | 差距 |
|:---|:---:|:---:|:---:|
| **auth** | 24 | ≥ 80 | 🔴 差 56 个 |
| **pricing** | 12 | ≥ 50 | 🔴 差 38 个 |

**背景**：这两个模块的 AuditService、logger、测试等维度已在 Phase 5 达标，但 JSDoc 覆盖率极低，是 D4 文档维度的唯一短板。对比 sales 的 jsdoc=89，差距明显。

---

## 📋 Auth 模块任务

### 前置步骤：定位缺口
```powershell
Get-ChildItem "src/features/auth" -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | ForEach-Object {
    $methods = (Select-String -Path $_.FullName -Pattern "^\s+(export\s+)?(async\s+)?function\s+|^\s+(async\s+)?\w+\s*\(" | Measure-Object).Count
    $jsdocs = (Select-String -Path $_.FullName -Pattern "^\s*/\*\*" | Measure-Object).Count
    "$($_.Name) : methods=$methods, jsdoc=$jsdocs"
}
```

### JSDoc 规范（与全项目统一）
```typescript
/**
 * 验证魔法链接 Token 并创建用户 Session
 *
 * @param token - 一次性魔法链接 Token（从邮件中获取）
 * @returns 认证成功后的用户信息和 Session 数据
 * @throws {Error} 当 Token 已过期或已被使用时抛出"Token 已失效"
 */
```

### 重点文件（按优先级）
1. **密码重置相关** — 所有函数必须有 JSDoc
2. **魔法链接相关** — 所有函数必须有 JSDoc
3. **Session 管理** — 校验、刷新、失效等函数
4. **权限检查** — checkPermission 等核心函数
5. **辅助工具函数** — maskEmail、hashPassword 等

### 要求
- **只添加 JSDoc 注释，严禁修改业务逻辑**
- 使用中文业务语言描述功能
- 安全相关方法的 JSDoc **不能暴露内部实现细节**（如不描述加密算法具体参数）
- 每个 `@param` 都要标注业务含义

---

## 📋 Pricing 模块任务

### 前置步骤
```powershell
Get-ChildItem "src/features/pricing" -r -Include "*.ts" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | ForEach-Object {
    $methods = (Select-String -Path $_.FullName -Pattern "^\s+(export\s+)?(async\s+)?function\s+|^\s+(async\s+)?\w+\s*\(" | Measure-Object).Count
    $jsdocs = (Select-String -Path $_.FullName -Pattern "^\s*/\*\*" | Measure-Object).Count
    "$($_.Name) : methods=$methods, jsdoc=$jsdocs"
}
```

### 重点文件
1. **定价规则 CRUD** — 创建/修改/删除规则的 JSDoc
2. **价格计算引擎** — 计算方法的输入/输出/算法简述
3. **定价策略** — 阶梯定价、批量折扣等策略的 JSDoc
4. **Schema 文件** — Zod 验证模型的注释

### 特别注意
- 价格计算相关方法的 JSDoc 中要标注**精度规则**（如"使用 Decimal 避免浮点误差"）
- 涉及金额的参数要标注**单位**（如 `@param amount - 金额，单位：元`）

---

## ✅ 验收清单

```powershell
# 1. auth JSDoc 数（必须 ≥ 80）
(Get-ChildItem src\features\auth -r -Include "*.ts","*.tsx" | Select-String "^\s*/\*\*").Count

# 2. pricing JSDoc 数（必须 ≥ 50）
(Get-ChildItem src\features\pricing -r -Include "*.ts","*.tsx" | Select-String "^\s*/\*\*").Count

# 3. tsc 编译（注释不应引入错误）
npx tsc --noEmit 2>&1 | Select-String "auth|pricing"
# 期望：无输出

# 4. 测试仍全通过（确保注释没有意外破坏语法）
npx vitest run src/features/auth src/features/pricing
```

## 交付说明
完成后宣告"Task 26 完成"，分别报告 auth 和 pricing 的 JSDoc 新增数量。
