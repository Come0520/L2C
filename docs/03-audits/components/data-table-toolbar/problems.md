# data-table-toolbar 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/shared/ui/data-table-toolbar.tsx

---

## 📊 总览

|               级别                | 数量  |
| :-------------------------------: | :---: |
| 🔴 P0 — 安全/功能（必须立即修复） |   0   |
|    🟠 P1 — 性能/UX（应当修复）    |   1   |
|   🟡 P2 — 规范/a11y（建议改进）   |   1   |
|             **合计**              | **2** |

---

## 🟠 P1 — 应当修复

- [ ] [C4-001] `shared/ui/data-table-toolbar.tsx:63-73` — 当 `children` 为 `null` 或者 `undefined` 时，会渲染一个默认的"筛选"按钮占位符，但该按钮没有绑定任何 `onClick` 处理器，点击无任何响应。这个"占位按钮"会误导用户以为筛选功能存在但无法使用（视觉可见但功能缺失）；应将该占位按钮彻底移除，或仅在明确有 `onFilter` 回调 Prop 时才渲染

## 🟡 P2 — 建议改进

- [ ] [C5-001] `shared/ui/data-table-toolbar.tsx:82-91` — 刷新按钮（`RotateCcw` 图标）没有 `aria-label`，屏幕阅读器无法告知用户该按钮的用途；应添加 `aria-label="刷新"`

---

## ✅ 表现良好项（无需修复）

- C1: Props 类型完整，注释清晰，插槽设计合理（`children` + `actions` 两个插槽）
- C2: 搜索框加载状态（Loader2）和静态图标（Search）切换，UX 细节良好 ✅
- C6: 使用 `lucide-react/dist/esm/icons/*` 单独引入，减少打包体积 ✅
