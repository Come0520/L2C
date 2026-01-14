## 修复 Lint 警告计划

### 1. 删除未使用的类型定义（2处）
- **文件**: `src/app/(dashboard)/quotes/page.tsx`
- **操作**: 删除 `QuoteBundleDisplay` 和 `QuoteDisplay` 类型定义（第14-22行）

### 2. 修复 React Hook Form watch() 警告（3处）

#### 2.1 product-form.tsx
- **文件**: `src/features/products/components/product-form.tsx`
- **操作**: 将 `form.watch('isStockable')` 替换为 `useWatch({ control: form.control, name: 'isStockable' })`
- **影响**: 第227行和第232行

#### 2.2 track-quote-form.tsx
- **文件**: `src/features/quotes/components/track-quote-form.tsx`
- **操作**: 将多个 `watch()` 调用替换为 `useWatch()`
- **影响**: 第97-100行（roomType, trackLayer, trackLength, unitPrice）

#### 2.3 reminder-rule-form.tsx
- **文件**: `src/features/settings/components/reminder-rule-form.tsx`
- **操作**: 将 `watch('channels')` 和 `watch('recipientType')` 替换为 `useWatch()`
- **影响**: 第95-96行

### 3. 替换 `<img>` 为 Next.js `<Image />`（4处）

#### 3.1 curtain-fabric-quote-form.tsx
- **文件**: `src/features/quotes/components/curtain-fabric-quote-form.tsx`
- **操作**: 导入 `Image` 组件，替换第365行的 `<img>` 为 `<Image>`

#### 3.2 product-search-combobox.tsx
- **文件**: `src/features/quotes/components/product-search-combobox.tsx`
- **操作**: 导入 `Image` 组件，替换第272行的 `<img>` 为 `<Image>`

#### 3.3 simplified-summary-table.tsx
- **文件**: `src/features/quotes/components/simplified-summary-table.tsx`
- **操作**: 导入 `Image` 组件，替换第104行的 `<img>` 为 `<Image>`

#### 3.4 track-quote-form.tsx
- **文件**: `src/features/quotes/components/track-quote-form.tsx`
- **操作**: 导入 `Image` 组件，替换第212行的 `<img>` 为 `<Image>`

### 4. 验证
- 运行 `pnpm lint` 确认所有警告已修复