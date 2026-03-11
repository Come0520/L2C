# loader 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/shared/ui/loader.tsx

---

## 📊 总览

|               级别                | 数量  |
| :-------------------------------: | :---: |
| 🔴 P0 — 安全/功能（必须立即修复） |   0   |
|    🟠 P1 — 性能/UX（应当修复）    |   1   |
|   🟡 P2 — 规范/a11y（建议改进）   |   2   |
|             **合计**              | **3** |

---

## 🟠 P1 — 应当修复

- [ ] [C6-001] `shared/ui/loader.tsx:127` — `LoaderFour` 的默认文字为英文 `"Loading..."`，与项目全中文 UI 规范不一致；且此加载动画（glitch 闪烁效果）具有强烈的视觉刺激，对光敏性癫痫用户有潜在风险（频率 ~20Hz）。应：1. 将默认值改为 `'加载中...'`；2. 添加 `prefers-reduced-motion` 媒体查询，在用户启用「减少动态效果」时停止闪烁

## 🟡 P2 — 建议改进

- [ ] [C5-001] `shared/ui/loader.tsx:5-49, 51-95, 97-125` — `LoaderOne`、`LoaderTwo`、`LoaderThree` 均为纯动画 div，没有 `role="status"` 或 `aria-label="加载中"`，屏幕阅读器无法识别这些为加载指示器；应在各加载组件的外层 `<div>` 或 `<svg>` 添加 `role="status" aria-label="加载中"`

- [ ] [C6-002] `shared/ui/loader.tsx:1-217` — 文件包含 5 个互相独立的加载组件（`LoaderOne` 至 `LoaderFive`），职责边界不清晰，调用方需要了解所有变体才能选择。建议拆分为独立文件（`loader-one.tsx` 等），或统一为带 `variant` Prop 的单一 `<Loader variant="pulse|wave|bolt" />` 组件

---

## ✅ 表现良好项（无需修复）

- C2: 使用 framer-motion 实现流畅动画，技术选型一致
- C3: 无安全风险，纯展示组件
