# animated-list 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/shared/ui/animated-list.tsx

---

## 📊 总览

|               级别                | 数量  |
| :-------------------------------: | :---: |
| 🔴 P0 — 安全/功能（必须立即修复） |   0   |
|    🟠 P1 — 性能/UX（应当修复）    |   2   |
|   🟡 P2 — 规范/a11y（建议改进）   |   2   |
|             **合计**              | **4** |

---

## 🟠 P1 — 应当修复

- [ ] [C2-001] `shared/ui/animated-list.tsx:127-151` — 键盘导航的 `keydown` 事件监听器挂载在 `window` 全局对象上（第 150 行），在列表未激活/未聚焦时仍然拦截所有 `ArrowDown`/`ArrowUp`/`Tab`/`Enter` 键事件，会与页面上其他 Modal、表单、Select 等组件的键盘交互产生冲突。应改为仅在列表容器 `ref` 获得焦点后注册监听（`listRef.current.addEventListener`），或使用 `onKeyDown` 直接挂载到容器 div

- [ ] [C2-002] `shared/ui/animated-list.tsx:195-212` — 列表项使用 `index` 作为 `key`（`key={index}`），当 `items` 数组元素发生增删重排时，React 会错误地复用 DOM 节点导致动画闪烁和渲染 Bug。应由调用方提供稳定的唯一 ID，或将 Props 从 `items: ReactNode[]` 改为 `items: { id: string; content: ReactNode }[]`

## 🟡 P2 — 建议改进

- [ ] [C5-001] `shared/ui/animated-list.tsx:183` — 列表容器缺少 `role="listbox"` 或 `role="list"` 以及 `aria-label`，屏幕阅读器无法告知用户这是一个可选择的列表；已选中项缺少 `aria-selected="true"` 标记

- [ ] [C2-003] `shared/ui/animated-list.tsx:196-199` — 每个 `AnimatedItem` 的 `delay` 为 `0.02 * index`（秒），当列表有 100 项时，最后一项的出场延迟为 2 秒，用户需要等待很长时间才能看到完整列表。应设置最大延迟上限（如 `Math.min(0.02 * index, 0.5)`）

---

## ✅ 表现良好项（无需修复）

- C1: Props 接口清晰，功能开关（`showGradients`、`enableArrowNavigation`、`displayScrollbar`）设计合理
- C3: 无安全风险
- C4: 滚动渐变蒙版（topGradient / bottomGradient）设计细腻，列表边界感知良好 ✅
