# multi-select 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/shared/ui/multi-select.tsx

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

- [x] ✅ [C2-001] `shared/ui/multi-select.tsx:35` — 默认 `placeholder` 为英文 `'Select items...'`，与项目整体中文语言风格不一致，应改为 `'请选择...'`；同时 `CommandInput` 占位符（第 99 行）和 `CommandEmpty`（第 101 行）也是英文，形成语言割裂

- [x] ✅ [C2-002] `shared/ui/multi-select.tsx:69` — `selected.map` 中每次都通过 `options.find((o) => o.value === value)` 线性查找，时间复杂度为 O(n\*m)。当选项较多（>100）且已选项也较多时，渲染性能会明显下降。应在渲染前将 `options` 转为 `Map<string, Option>` 提升查找效率

## 🟡 P2 — 建议改进

- [x] ✅ [C2-003] `shared/ui/multi-select.tsx:102` — `CommandGroup` 使用 `max-h-64 overflow-auto` 截断超长列表，但没有虚拟滚动。当 `options` 超过 500 条时（如产品列表），所有 DOM 节点都会被渲染，建议配合 `react-virtual` 或对 options 做分页

- [x] ✅ [C5-001] `shared/ui/multi-select.tsx:73-90` — Badge 内的删除按钮（`<button>`）缺少 `aria-label`，屏幕阅读器无法告知用户该按钮的功能（如「移除销售顾问」）；应添加 `aria-label={\`移除 \${option?.label}\`}`

---

## ✅ 表现良好项（无需修复）

- C1: Props 类型清晰，Option 类型定义明确
- C3: 使用 `onMouseDown` + `e.preventDefault()` 防止删除 Badge 时触发 Popover 的关闭，交互处理细致
- C4: `CommandInput` 支持搜索过滤，应对项目较多的场景
