# header 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/widgets/layout/header.tsx

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

- [x] ✅ [C2-001] `widgets/layout/header.tsx:25-65` — `getPageTitle()` 函数在组件每次渲染时重新创建，包含 18 条 if-else 链判断。应提取为模块级纯函数或使用 `useMemo` 缓存，避免每次渲染触发完整的路由匹配

## 🟡 P2 — 建议改进

- [x] ✅ [C5-001] `widgets/layout/header.tsx:79-86` — 搜索图标按钮（Search）缺少 `aria-label`，屏幕阅读器无法识别按钮功能
- [x] ✅ [C6-001] `widgets/layout/header.tsx:83` — `window.dispatchEvent(new CustomEvent('open-global-search'))` 使用自定义事件通信，属于隐式耦合，建议改用 Context 或 Zustand 状态管理

---

## 🔖 错题本命中记录

- C5-001 图标按钮缺少 aria-label → 复现于 header（搜索按钮）

---

## ✅ 表现良好项（无需修复）

- C1: Props 类型声明清晰（`HeaderProps` 使用 `Session` 类型）
- C3: 无安全风险（无 dangerouslySetInnerHTML，无用户输入处理）
- C4: MobileMenuButton 有 aria-label="打开菜单"，有 md:hidden 响应式适配
- C6: 组件 126 行，职责单一，结构清晰
