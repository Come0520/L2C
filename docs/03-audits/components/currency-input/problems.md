# currency-input 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/shared/ui/currency-input.tsx

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

- [x] ✅ [C1-001] `shared/ui/currency-input.tsx:7-9` — `CurrencyInputProps` 继承了 `NumericFormatProps` 所有属性（含 `decimalScale`、`prefix` 等），调用方可以覆盖 `decimalScale` 为 `10` 或移除 `fixedDecimalScale`，绕过组件既定的精度规范，导致传入数据库的金额精度不一致。应将核心格式属性（decimalScale、fixedDecimalScale、allowNegative、prefix）从 Props 中排除，强制使用固定设置

## 🟡 P2 — 建议改进

- [x] ✅ [C5-001] `shared/ui/currency-input.tsx:14` — 缺少 `inputMode="decimal"` 属性，在移动端不会触发带小数点的数字键盘
- [x] ✅ [C6-001] `shared/ui/currency-input.tsx:19` — `prefix="¥ "` 中货币符号硬编码为人民币，若未来需要支持多币种（美元、欧元）则无法复用，建议 `prefix` 由 Props 传入并在外部约定

---

## ✅ 表现良好项（无需修复）

- C2: 使用 `NumericFormat` 库处理金额格式，避免了 JavaScript 浮点精度问题 ✅
- C3: `allowNegative={false}` 防止负数输入，适合金额场景
- C4: `fixedDecimalScale` 固定两位小数，界面展示一致
