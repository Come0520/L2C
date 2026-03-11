# data-table-pagination 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/shared/ui/data-table-pagination.tsx

---

## 📊 总览

|               级别                | 数量  |
| :-------------------------------: | :---: |
| 🔴 P0 — 安全/功能（必须立即修复） |   0   |
|    🟠 P1 — 性能/UX（应当修复）    |   2   |
|   🟡 P2 — 规范/a11y（建议改进）   |   1   |
|             **合计**              | **3** |

---

## 🟠 P1 — 应当修复

- [ ] [C6-001] `shared/ui/data-table-pagination.tsx:20-21,25,44-45` — 所有用户可见文案均为英文（`"row(s) selected"`、`"Rows per page"`、`"Page X of Y"`），与项目全中文 UI 规范不一致，需统一汉化为「已选 X 条」、「每页显示`、`「第 X / Y 页」

- [ ] [C1-001] `shared/ui/data-table-pagination.tsx:36` — 每页行数选项固定为 `[10, 20, 30, 40, 50]`，无法通过 Props 定制；某些业务场景（如财务报表）需要 `[25, 50, 100]` 的分页选项，应将数组作为可选 Props 暴露

## 🟡 P2 — 建议改进

- [ ] [C5-001] `shared/ui/data-table-pagination.tsx:48-83` — 四个分页按钮（首页/上页/下页/末页）使用 `<span className="sr-only">` 配合英文文字，无障碍文案仍为英文（`"Go to first page"`），应改为中文 `aria-label`（如 `aria-label="首页"`）

---

## ✅ 表现良好项（无需修复）

- C1: 使用泛型 `<TData>` 正确关联 TanStack Table 类型
- C3: 无安全风险
- C6: 有防御性 `if (!table) return null` 检查
