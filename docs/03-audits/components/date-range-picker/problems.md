# date-range-picker 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/shared/ui/date-range-picker.tsx

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

- [x] ✅ [C1-001] `shared/ui/date-range-picker.tsx:14-17` — 组件无任何日期范围约束（无 `maxDate`、无最大跨度限制）。Finance 模块审计时（错题本 D4-002 衍生）发现查询时间范围超过 365 天会导致报表超时，此组件作为日期范围选择器在整个系统中被复用，应支持 `fromDate`/`toDate` 和 `maxSpanDays` Props，以便各业务场景能够施加日期约束

## 🟡 P2 — 建议改进

- [x] ✅ [C5-001] `shared/ui/date-range-picker.tsx:24-45` — 触发按钮（`<Button id="date">`）使用了固定 `id="date"`，若同一页面出现多个日期范围选择器（如 "创建时间" 和 "完成时间"），多个 id 相同的元素会违反 HTML 规范并导致 a11y 问题；`id` 应由调用方通过 Props 注入

- [x] ✅ [C4-001] `shared/ui/date-range-picker.tsx:54` — 日历只显示 2 个月（`numberOfMonths={2}`），在移动端 375px 视口下两个月历会导致水平溢出，应在 ≤640px 屏幕时降为 `numberOfMonths={1}`

---

## ✅ 表现良好项（无需修复）

- C2: 组件无内部状态，完全受控（由外部管理 `date` 和 `setDate`），职责清晰
- C3: 无安全风险
- C6: 代码简洁（62行），是此批次最精简的组件之一
