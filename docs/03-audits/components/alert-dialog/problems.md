# alert-dialog 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/shared/ui/alert-dialog.tsx

---

## 📊 总览

|               级别                | 数量  |
| :-------------------------------: | :---: |
| 🔴 P0 — 安全/功能（必须立即修复） |   0   |
|    🟠 P1 — 性能/UX（应当修复）    |   0   |
|   🟡 P2 — 规范/a11y（建议改进）   |   2   |
|             **合计**              | **2** |

---

## 🟡 P2 — 建议改进

- [ ] [C6-001] `shared/ui/alert-dialog.tsx:8-12` — 按钮样式常量（`buttonBase`、`buttonDefault`、`buttonOutline`）直接在文件内部定义，而非使用项目统一的 `Button` 组件或 `buttonVariants` 工具函数。这导致按钮样式与其他页面不一致（如 `rounded-full` vs 其他地方的 `rounded-md`），且一旦设计系统修改按钮样式，此处需要单独维护。应改为复用 `Button` 组件的 `className` 或 `buttonVariants`

- [ ] [C6-002] `shared/ui/alert-dialog.tsx:1-127` — 此文件是对 Radix UI `@radix-ui/react-alert-dialog` 的封装，与项目同目录下的 `dialog.tsx` 形成重叠功能（两者均是模态对话框）。项目中已存在 `action-confirm-dialog.tsx` 作为业务层确认框，`alert-dialog` 与 `dialog` 的使用边界未明确区分，建议在组件文件头添加使用说明注释，明确 `alert-dialog` 的使用场景（不可恢复的破坏性操作，如删除账号、清空数据等）

---

## ✅ 表现良好项（无需修复）

- C1: 完整导出 Radix 各子组件，类型安全，可组合性强
- C2: 无性能问题，Radix 对话框原语已内置焦点陷阱（focus trap）和滚动锁定
- C5: Radix 原生提供完整的 a11y 支持（`role="alertdialog"`，焦点管理等）
