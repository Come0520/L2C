# bank-account-input 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/shared/ui/bank-account-input.tsx

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

- [x] ✅ [C4-001] `shared/ui/bank-account-input.tsx:14-24` — 格式掩码 `#### #### #### #### ###`（19位带空格）最多支持 15 位实际数字，但中国银行卡号范围是 16-19 位，当前格式无法输入 16、17 位卡号。应改为 `#### #### #### #######`（最多 19 位）或由调用方通过 Props 传入 `format`

## 🟡 P2 — 建议改进

- [x] ✅ [C5-001] `shared/ui/bank-account-input.tsx:14` — 缺少 `inputMode="numeric"` 属性，在移动端不会唤起数字键盘；`type` 为默认 `text`，建议显式传入 `inputMode="numeric"`

---

## ✅ 表现良好项（无需修复）

- C1: 使用 `forwardRef` 正确暴露 ref
- C2: 代码极简，职责单一
- C3: 用 `PatternFormat` 限制输入格式，防止非数字字符
