# Task 27: Quotes 模块可访问性 WCAG AA + 国际化预备（L5 → L5+）

> **任务性质**：代码改进（编程任务，涉及 UI 属性和 i18n 基础设施）
> **目标**：D5 UI/UX 从 8 提升至 9+，新增可访问性和国际化基础
> **模块路径**：`src/features/quotes/`
> **评估人**：主线程 AI（不参与编程，只做验收）
> **优先级**：P3（依赖 Task 23-26 完成后执行）

---

## 🔍 当前状态

| 指标 | 当前值 | 目标 | 状态 |
|:---|:---:|:---:|:---:|
| WCAG AA 可访问性 | 未系统评估 | 主要组件达 AA | 🟡 |
| aria-label 使用 | 未统计 | 关键交互元素覆盖 | 🟡 |
| 键盘导航 | 部分支持 | 完整 Tab 导航 | 🟡 |
| i18n 基础 | 无 | 提取常量字符串 | 🔴 |

---

## 📋 任务清单

### 任务一：可访问性 WCAG AA 基础审计与修复

**Step 1：审计当前可访问性状态**
```powershell
# 统计 aria 属性使用情况
(Get-ChildItem src\features\quotes -r -Include "*.tsx" | Select-String "aria-").Count

# 统计 role 属性
(Get-ChildItem src\features\quotes -r -Include "*.tsx" | Select-String 'role="').Count
```

**Step 2：为关键交互元素添加 aria 属性**

重点组件（按用户交互频率排序）：
1. **报价单表格** — 添加 `aria-label`、`role="grid"`
2. **操作按钮** — 确保所有按钮都有描述性文本或 `aria-label`
3. **表单输入** — 添加 `aria-required`、`aria-invalid`
4. **模态框/对话框** — 添加 `aria-modal`、`aria-describedby`
5. **可折叠面板** — 添加 `aria-expanded`
6. **加载状态** — 添加 `aria-busy`、`aria-live="polite"`

```tsx
// 示例：给操作按钮添加 aria-label
<Button
    onClick={handleDelete}
    aria-label={`删除报价项 ${itemName}`}
    className="..."
>
    <Trash2 className="h-4 w-4" />
</Button>

// 示例：表单验证错误提示
<Input
    aria-invalid={!!errors.price}
    aria-describedby={errors.price ? 'price-error' : undefined}
    aria-required="true"
/>
```

**Step 3：确保键盘导航流畅**
- Tab 键可以在所有交互元素间正确移动
- Enter/Space 可以触发按钮操作
- Escape 可以关闭模态框
- 焦点陷阱在模态框内正确工作

---

### 任务二：国际化（i18n）基础设施预备

**注意：本任务只做"提取"和"准备"，不实际翻译**

**Step 1：在 `src/features/quotes/` 下创建 `i18n/` 目录**

```
src/features/quotes/i18n/
├── zh-CN.ts    # 中文（当前语言）
└── index.ts    # 导出入口
```

**Step 2：提取高频 UI 字符串**

```typescript
// src/features/quotes/i18n/zh-CN.ts
export const quoteI18n = {
    title: '报价单',
    create: '新建报价单',
    edit: '编辑报价单',
    delete: '删除',
    confirm: '确认',
    cancel: '取消',
    status: {
        draft: '草稿',
        submitted: '已提交',
        approved: '已审批',
        expired: '已过期',
    },
    messages: {
        createSuccess: '报价单创建成功',
        deleteConfirm: '确定要删除此报价单吗？',
        saveSuccess: '保存成功',
    },
    // ... 更多字符串
} as const;
```

**Step 3：在 1-2 个组件中示范使用**（不要全量替换）

选择 1 个简单组件，用 i18n 常量替换硬编码字符串：
```tsx
import { quoteI18n as t } from '../i18n';

// 替换前：
<h1>报价单</h1>

// 替换后：
<h1>{t.title}</h1>
```

---

## ⚠️ 禁止事项

- **不要全量替换所有字符串**（只在 1-2 个组件中示范）
- **不要引入 i18n 框架依赖**（如 react-intl、next-intl）
- **不要修改业务逻辑**
- **不要删除任何现有测试**

---

## ✅ 验收清单

```powershell
# 1. aria 属性数量（≥ 20 个新增）
(Get-ChildItem src\features\quotes -r -Include "*.tsx" | Select-String "aria-").Count

# 2. i18n 文件存在
Test-Path "src/features/quotes/i18n/zh-CN.ts"
Test-Path "src/features/quotes/i18n/index.ts"

# 3. i18n 常量数量（≥ 15 个字符串）
(Select-String -Path "src\features\quotes\i18n\zh-CN.ts" -Pattern ":\s*'").Count

# 4. tsc 编译
npx tsc --noEmit 2>&1 | Select-String "quotes"

# 5. 测试全通过
npx vitest run src/features/quotes
```

## 交付说明
完成后宣告"Task 27 完成"，报告新增 aria 属性数量和 i18n 提取的字符串数量。
