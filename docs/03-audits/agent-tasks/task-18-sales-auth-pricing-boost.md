# Task 18: Sales + Auth + Pricing 模块测试与文档全面补强

> **任务性质**：测试编写 + 文档完善（编程任务）
> **目标**：三个模块的测试文件从 2 个扩充至 ≥ 4 个，并补齐文档
> **模块路径**：`src/features/sales/`、`src/features/auth/`、`src/features/pricing/`
> **评估人**：主线程 AI（不参与编程，只做验收）

---

## 🔍 实测发现的核心问题

| 模块 | 测试数 | any 型 | 文档 | 主要短板 |
|:---|:---:|:---:|:---:|:---|
| **sales** | 2 | 0 | `销售.md` 存在 | D3 测试覆盖偏弱 |
| **auth** | 2 | 0 | `认证.md` 存在 | D3 测试覆盖偏弱 |
| **pricing** | 2 | 1 | `定价.md` 存在 | D2 (any=1) + D3 偏弱 |

---

## 📋 Sales 模块任务

### Step 1：查看现有代码
先读取 `src/features/sales/actions/` 和 `src/features/sales/__tests__/` 了解当前状态。

### Step 2：新增 ≥ 2 个测试文件

在 `src/features/sales/__tests__/` 下新增：

#### 文件 A：`tenant-isolation.test.ts`
```typescript
describe('Sales 租户隔离', () => {
  it('销售数据查询应只返回当前租户的数据')
  it('租户 A 无法修改租户 B 的销售记录')
  it('无 session 的请求应被拒绝')
})
```

#### 文件 B：`business-logic.test.ts`（覆盖核心业务逻辑）
根据 `src/features/sales/actions/` 中已有的 actions，至少编写 5 个业务场景测试：
- 销售漏斗数据查询（含日期范围过滤）
- 销售业绩统计计算准确性
- 业绩排名查询的分页
- 空数据时返回默认结构（不报错）
- 错误状态码时的正确错误反馈

**所有测试必须 mock 数据库，不真实查询。**

---

## 📋 Auth 模块任务

### Step 1：查看现有代码
先读取 `src/features/auth/` 了解认证逻辑结构。

### Step 2：新增 ≥ 2 个测试文件

#### 文件 A：`session-validation.test.ts`（Session 校验边界）
```typescript
describe('Auth Session 校验', () => {
  it('有效 session 应正常通过')
  it('过期 session 应被拒绝并返回 401')
  it('伪造 session token 应被检测并拒绝')
  it('缺少 tenantId 的 session 应被拒绝')
})
```

#### 文件 B：`permission-check.test.ts`（权限检查边界）
```typescript
describe('Auth 权限边界', () => {
  it('普通用户无法执行 admin 级别操作')
  it('跨租户操作应被拦截')
  it('已注销账号的 session 应被拒绝')
  it('权限降级后立即生效（不依赖旧 session）')
})
```

---

## 📋 Pricing 模块任务

### Step 1：清除 any 类型（D2 修复）

```powershell
# 先定位 any 的位置
Select-String -Path "src\features\pricing\**\*.ts","src\features\pricing\**\*.tsx" -Pattern ": any\b"
```

将找到的 `any` 替换为具体类型或 `unknown` + 类型收窄。

**验收**：
```powershell
(Get-ChildItem src\features\pricing -r -Include "*.ts","*.tsx" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String ": any\b").Count
# 期望：0
```

### Step 2：新增 ≥ 2 个测试文件

#### 文件 A：`pricing-calculation.test.ts`（定价计算测试）
```typescript
describe('Pricing 定价计算准确性', () => {
  it('标准定价计算应返回正确结果')
  it('含折扣的定价计算应精确（使用 Decimal 避免浮点误差）')
  it('定价区间（min/max）约束应强制执行')
  it('负数价格或零价格应被拒绝')
  it('超大数字价格（超出系统限制）应被处理')
})
```

#### 文件 B：`pricing-rules.test.ts`（定价规则验证）
```typescript
describe('Pricing 规则验证', () => {
  it('租户级定价规则应正确覆盖默认规则')
  it('无匹配规则时应返回默认价格而非报错')
  it('历史价格记录查询应按日期正确过滤')
})
```

---

## ✅ 最终验收清单

```powershell
# 1. sales 测试文件数
(Get-ChildItem src\features\sales -r -Include "*.test.ts","*.test.tsx").Count
# 期望：≥ 4

# 2. auth 测试文件数
(Get-ChildItem src\features\auth -r -Include "*.test.ts","*.test.tsx").Count
# 期望：≥ 4

# 3. pricing 测试文件数
(Get-ChildItem src\features\pricing -r -Include "*.test.ts","*.test.tsx").Count
# 期望：≥ 4

# 4. pricing any 清零
(Get-ChildItem src\features\pricing -r -Include "*.ts","*.tsx" | Where-Object {$_.FullName -notmatch "__tests__|\.test\."} | Select-String ": any\b").Count
# 期望：0

# 5. 三模块测试全通过
npx vitest run src/features/sales src/features/auth src/features/pricing
# 期望：Exit code 0，0 个失败

# 6. tsc 编译
npx tsc --noEmit 2>&1 | Select-String "sales|auth|pricing"
# 期望：无输出
```

## 交付说明
完成后宣告"Task 18 完成"，分别报告 sales/auth/pricing 的：
1. 新增测试文件名
2. 各文件的用例数
3. pricing any 的最终数量
