# L2C 系统诊断错误整改计划

## 📋 问题分类概览

### 1️⃣ Seed 文件类型错误 (4个文件)
- **seed-measurements.ts**: `Partial<MeasureTaskInput>` 类型断言不当，`leadId` 不能为 `undefined`
- **seed-products.ts**: `headerProcessType` 使用了不存在的值 `"NONE"`，应为 `"WRAPPED" | "ATTACHED"`
- **seed-test-measurements.ts**: `Record<string, unknown>` 类型断言不当
- **seed-universal.ts**: `sku` 字段传入了数字而非字符串

### 2️⃣ 类型导入缺失 (4个文件)
- **leads/page.tsx**: `intentionLevelEnum` 未正确导入
- **quotes/[id]/page.tsx**: `QuoteItemWithRelations` 和 `AttachmentItem` 类型缺失
- **quotes/page.tsx**: `QuoteBundleDisplay` 和 `QuoteDisplay` 类型缺失
- **workbench/page-server.tsx**: 文件不存在但诊断报错（需确认）

### 3️⃣ 枚举值不匹配 (1个文件)
- **settings/approvals/page.tsx**: `ApprovalTimeoutAction` 包含 `'ESCALATE'`，但数据库枚举只有 `'REMIND' | 'AUTO_APPROVE' | 'AUTO_REJECT'`

### 4️⃣ 测试文件类型错误 (2个文件)
- **after-sales/__tests__/actions.test.ts**: 
  - 导入了不存在的 `Customer`、`LiabilityNotice` 类型（应为 `customers`、`liabilityNotices`）
  - Mock 数据类型不匹配（缺少 `orderId` 字段）
  - `status` 字段类型不匹配
- **approval/__tests__/approval-flow.test.ts**: 导入了不存在的 `Db` 类型（应为 `db`）

---

## 🔧 整改步骤

### 阶段一：修复 Seed 文件 (高优先级)
1. **seed-measurements.ts**: 移除 `as Partial<MeasureTaskInput>`，确保所有必需字段都有值
2. **seed-products.ts**: 将 `headerProcessType: 'NONE'` 改为 `headerProcessType: 'WRAPPED'`
3. **seed-test-measurements.ts**: 移除 `as Record<string, unknown>`，使用正确的类型
4. **seed-universal.ts**: 确保 `sku` 字段为字符串类型

### 阶段二：修复类型导入 (高优先级)
5. **leads/page.tsx**: 从 `@/shared/api/schema` 导入 `intentionLevelEnum`
6. **quotes/[id]/page.tsx**: 从 `@/features/quotes/components/create-wizard/types.ts` 导入 `AttachmentItem`，定义或导入 `QuoteItemWithRelations`
7. **quotes/page.tsx**: 定义或导入 `QuoteBundleDisplay` 和 `QuoteDisplay` 类型
8. **workbench**: 确认 `page-server.tsx` 是否需要创建或删除

### 阶段三：修复枚举值不匹配 (中优先级)
9. **settings/approvals/page.tsx**: 
   - 将 `ApprovalTimeoutAction` 类型改为 `'REMIND' | 'AUTO_APPROVE' | 'AUTO_REJECT'`
   - 移除 `'ESCALATE'` 选项

### 阶段四：修复测试文件 (中优先级)
10. **after-sales/__tests__/actions.test.ts**:
    - 修改导入：`import { customers, liabilityNotices } from '@/shared/api/schema'`
    - 为 Mock Ticket 添加 `orderId` 字段
    - 修正 `status` 字段类型为枚举值
11. **approval/__tests__/approval-flow.test.ts**: 修改导入为 `import { db } from '@/shared/api/db'`

---

## ✅ 验证步骤
- 运行 `pnpm typecheck` 确保所有类型错误已修复
- 运行相关测试确保功能正常
- 检查 seed 脚本是否能正常执行