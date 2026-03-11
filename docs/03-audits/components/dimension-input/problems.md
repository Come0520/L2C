# dimension-input 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/shared/ui/dimension-input.tsx

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

- [x] ✅ [C4-001] `shared/ui/dimension-input.tsx:33-37` — `area` 使用 `(w * h).toFixed(2)` 计算面积，结果是字符串类型（如 `"12.50"`），当 `width` 或 `height` 为非数字输入（如空字符串 `""`）时，`Number("")` 返回 `0`，面积会显示 `"0.00"` 而非提示用户输入有效数字。调用方无法区分「真实为零」和「输入无效」两种情况；应返回 `null` 而非 `"0.00"` 当输入无效时

## 🟡 P2 — 建议改进

- [x] ✅ [C5-001] `shared/ui/dimension-input.tsx:43-53, 57-69` — 两个 Input（宽/高）没有 `aria-label`（仅靠 `placeholder="宽"` 和 `placeholder="高"` 区分），屏幕阅读器无法正确告知宽高字段用途；应添加 `aria-label="宽度"` / `aria-label="高度"`

- [x] ✅ [C5-002] `shared/ui/dimension-input.tsx:44, 58` — Input 为 `type="number"` 但没有 `inputMode="decimal"`，在 iOS 上会弹出带有 `+`/`-` 的数字键盘而非简洁的数字键盘；`type="number"` 还会在部分浏览器中显示上下箭头（spin button），视觉干扰，建议改用 `type="text" inputMode="decimal"`

---

## ✅ 表现良好项（无需修复）

- C1: Props 接口类型声明完整，`string | number` 联合类型适应不同使用场景
- C2: `useMemo` 正确用于面积计算缓存
- C6: 组件 86 行，职责单一，结构简洁
