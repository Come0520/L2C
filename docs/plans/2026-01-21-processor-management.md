# 加工厂管理功能实施计划 (Processor Management Implementation Plan)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** 实现供应链模块中的加工厂管理功能，支持加工厂基础信息、加工费配置（按工艺定价）、资质与合同管理。

**Architecture:**
- **Database:** 复用 `suppliers` 表，添加 `supplierType` (已完成), `processingPrices`, `contractUrl`, `contractExpiryDate` 等字段。
- **Backend:** 使用 Next.js Server Actions 处理数据 CRUD。
- **Frontend:**
    - 列表页：`/supply-chain/processors`，复用或新建 `ProcessorTable`。
    - 详情/编辑：使用 `Drawer` 或 `Dialog` 组件，内嵌 `Tabs` 分组管理信息。
    - 表单管理：使用 `react-hook-form` + `zod` 进行表单验证。

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Shadcn UI, Drizzle ORM, Zod, React Hook Form.

---

### Task 1: 数据库 Schema 更新

**Files:**
- Modify: `src/shared/api/schema/supply-chain.ts`
- Run: `pnpm db:push`

**Step 1: 修改 schema 定义**

在 `suppliers` 表中添加以下字段：

```typescript
// c:\Users\bigey\Documents\Antigravity\L2C\src\shared\api\schema\supply-chain.ts

// ... existing imports

export const suppliers = pgTable('suppliers', {
    // ... existing fields
    supplierType: supplierTypeEnum('supplier_type').default('SUPPLIER'), // 已存在的字段
    
    // [NEW] 加工厂专属字段
    processingPrices: jsonb('processing_prices'), // 加工费价格表, 结构: { items: [{ name: string, unit: string, price: number }] }
    contractUrl: text('contract_url'), // 合同文件 URL
    contractExpiryDate: timestamp('contract_expiry_date', { withTimezone: true }), // 合同到期日期
    businessLicenseUrl: text('business_license_url'), // 营业执照 URL
    bankAccount: varchar('bank_account', { length: 100 }), // 银行账号
    bankName: varchar('bank_name', { length: 100 }), // 开户银行
    
    // ... existing fields
});
```

**Step 2: 执行数据库迁移**

Run: `pnpm db:push`

---

### Task 2: Server Actions 更新

**Files:**
- Modify: `src/features/supply-chain/actions/supplier-actions.ts` (如果不存在则创建)
- Define: `SupplierSchema` with new fields

**Step 1: 更新 Zod Schema**

在 `supplier-actions.ts` 或相关 schema 文件中，更新 `createSupplierSchema` 和 `updateSupplierSchema` 以包含新字段验证。

```typescript
// z.object 扩展
processingPrices: z.object({
    items: z.array(z.object({
        name: z.string().min(1, "工艺名称不能为空"),
        unit: z.string().default("元/米"),
        price: z.coerce.number().min(0, "价格不能为负数")
    }))
}).optional(),
contractUrl: z.string().optional(),
contractExpiryDate: z.date().optional(),
businessLicenseUrl: z.string().optional(),
bankAccount: z.string().optional(),
bankName: z.string().optional(),
```

**Step 2: 确保 CRUD Action 支持新字段**

检查 `createSupplier` 和 `updateSupplier` server actions，确保它们能够正确接收并保存这些新字段。由于 Drizzle 的类型推导，只要 schema 更新了，TS 类型通常会自动更新，但需确认逻辑中没有手动过滤字段。

---

### Task 3: 加工厂列表页 UI

**Files:**
- Modify: `src/app/(dashboard)/supply-chain/processors/page.tsx`
- Create: `src/features/supply-chain/components/processor-table.tsx`

**Step 1: 创建 ProcessorTable 组件**

创建一个专门用于展示加工厂的表格组件，列包含：
- 名称
- 联系人/电话
- 合同状态 (计算逻辑：过期/即将过期/正常)
- 操作 (编辑、删除)

**Step 2: 集成到页面**

在 `/supply-chain/processors/page.tsx` 中使用 `getSuppliers({ type: 'PROCESSOR' })` 获取数据，并渲染 `ProcessorTable`。

---

### Task 4: 加工厂编辑抽屉 - 基础架构 & Tab 1

**Files:**
- Create: `src/features/supply-chain/components/processor-drawer.tsx`
- Create: `src/features/supply-chain/components/processor-form-basic.tsx`

**Step 1: 创建 Drawer 框架**

使用 Shadcn `Sheet` 组件，包含标题 "新建/编辑加工厂" 和 `Tabs` (基础信息, 加工费配置, 资质与合同)。

**Step 2: 实现基础信息表单**

实现 `ProcessorFormBasic` 组件，包含名称、编号、联系人、电话、地址、结算方式等通用字段。

---

### Task 5: 加工厂编辑抽屉 - Tab 2 (加工费配置)

**Files:**
- Create: `src/features/supply-chain/components/processor-form-prices.tsx`

**Step 1: 实现加工费配置表单**

使用 `useFieldArray` (react-hook-form) 实现动态表格：
- 列：工艺名称 (Input), 单位 (Input), 单价 (Input Number), 操作 (Delete Button)
- 底部 "添加工艺" 按钮

---

### Task 6: 加工厂编辑抽屉 - Tab 3 (资质与合同)

**Files:**
- Create: `src/features/supply-chain/components/processor-form-files.tsx`

**Step 1: 实现资质表单**

包含：
- 营业执照上传 (使用现有的 `ImageUpload` 组件)
- 合同上传 (使用 `FileUpload` 或 `ImageUpload`)
- 合同到期日 (`DatePicker`)
- 银行账户信息字段

---

### Task 7: 集成与验证

**Files:**
- Modify: `src/features/supply-chain/components/processor-drawer.tsx` (整合所有 Tab)

**Step 1: 整合表单提交**

确保主 Drawer 组件能够收集所有 Tab 的数据，并调用 `createSupplier` 或 `updateSupplier` action。

**Step 2: 手动验证**

1. 进入加工厂列表页。
2. 点击新建，填写基础信息。
3. 切换到加工费Tab，添加几条工艺价格。
4. 切换到资质Tab，填写合同日期。
5. 提交保存。
6. 验证列表页是否显示，且合同状态正确。
7. 再次编辑，确认数据回显正确。
