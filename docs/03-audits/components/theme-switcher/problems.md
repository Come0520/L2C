# theme-switcher 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/widgets/layout/theme-switcher.tsx

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

- [x] ✅ [C2-001] `widgets/layout/theme-switcher.tsx:21-29` — 点击外部关闭使用 `document.addEventListener('mousedown')`，每次组件挂载都注册全局事件监听。当 `isMenuOpen` 为 false 时仍然在监听，应改为仅在菜单打开时注册（`useEffect` 依赖 `isMenuOpen`）

## 🟡 P2 — 建议改进

- [x] ✅ [C5-001] `widgets/layout/theme-switcher.tsx:34-46` — Logo 按钮仅有 `title="切换主题"` 属性，缺少 `aria-label`。title 仅在鼠标悬停时显示，屏幕阅读器可能不朗读 title
- [x] ✅ [C6-001] `widgets/layout/theme-switcher.tsx:33,48,62` — 多处中文注释出现乱码（`?`），说明文件编码在某次保存时被损坏，应修复为正确的 UTF-8 中文注释

---

## 🔖 错题本命中记录

- C5-001 图标按钮缺少 aria-label → 复现于 theme-switcher

---

## ✅ 表现良好项（无需修复）

- C1: Props 类型正确（`open` 和 `animate` 参数有默认值）
- C3: 无安全风险
- C4: AnimatePresence + motion 提供良好的动画体验
