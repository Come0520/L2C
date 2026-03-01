# Task 18 返工：Pricing 模块缺少第 4 个测试文件

> **Task 18 整体验收结果**：sales ✅、auth ✅、**pricing ❌（测试文件 3，差 1 个）**
> **本次返工范围**：仅补充 pricing 的第 4 个测试文件，其余已通过无需改动

---

## ❌ 精确缺口

**现有 3 个测试文件**：
- `actions.test.ts`（原有）
- `pricing-hints.test.ts`（Task 18 新增）
- `pricing-validation.test.ts`（Task 18 新增）

**缺少**：`pricing-rules.test.ts`（定价规则验证）

---

## 📋 需新增的文件：`pricing-rules.test.ts`

**文件路径**：`src/features/pricing/__tests__/pricing-rules.test.ts`

**文件内容要求**：
1. 覆盖以下至少 3 个用例（可更多）：
   - `'租户级定价规则应正确覆盖默认规则'`
   - `'无匹配规则时应返回默认价格而非报错'`
   - `'历史价格记录查询应按日期正确过滤'`

2. **必须 mock 数据库**（参考同目录其他测试文件的 mock 写法）

3. **所有用例必须通过**，不能有 `skip/todo` 占位

4. 遵循项目统一的测试格式：
   ```typescript
   import { describe, it, expect, vi, beforeEach } from 'vitest';
   
   vi.mock('@/lib/db', () => ({ /* mock实现 */ }));
   vi.mock('@/shared/lib/auth', () => ({
       auth: vi.fn(),
   }));
   
   describe('Pricing 规则验证', () => {
       beforeEach(() => {
           vi.clearAllMocks();
       });
       
       it('租户级定价规则应正确覆盖默认规则', async () => {
           // 测试实现
       });
       
       it('无匹配规则时应返回默认价格而非报错', async () => {
           // 测试实现
       });
       
       it('历史价格记录查询应按日期正确过滤', async () => {
           // 测试实现
       });
   });
   ```

---

## ✅ 验收命令（主线程执行）

```powershell
# 1. pricing 测试文件数（必须 ≥ 4）
(Get-ChildItem src\features\pricing -r -Include "*.test.ts","*.test.tsx").Count
# 期望：4

# 2. 测试全通过
npx vitest run src/features/pricing
# 期望：Exit code 0，0 个失败

# 3. tsc 编译
npx tsc --noEmit 2>&1 | Select-String "pricing"
# 期望：无输出
```

## 交付说明
完成后宣告"Task 18 返工完成"，报告 `pricing-rules.test.ts` 的用例数量。
