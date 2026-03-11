# action-confirm-dialog 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/shared/ui/action-confirm-dialog.tsx

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

- [x] ✅ [C1-001] `shared/ui/action-confirm-dialog.tsx:20` — `trigger: React.ReactNode` Props 缺少对应的 import（文件头没有 `import React` 或 `import type { ReactNode }`），在 TypeScript 严格模式下会报错；且 Props 接口缺少 `onError` 回调，调用方无法感知 action 失败
- [x] ✅ [C4-001] `shared/ui/action-confirm-dialog.tsx:41` — 成功提示硬编码为 `toast.success('操作成功')`，不允许调用方自定义成功消息。应新增 `successMessage?: string` Props，默认为 `'操作成功'`，以适应不同业务场景（如 "删除成功"、"审批通过"）

## 🟡 P2 — 建议改进

- [x] ✅ [C6-001] `shared/ui/action-confirm-dialog.tsx:65` — 按钮文字 `'提交?..'` 包含乱码（应为 `'提交中...'`），文件编码在某次保存时被损坏，需修复
- [x] ✅ [C5-001] `shared/ui/action-confirm-dialog.tsx:53` — `DialogContent` 没有设置 `aria-describedby` 与 `DialogDescription` 关联；关闭按钮没有 `aria-label="取消"`

---

## ✅ 表现良好项（无需修复）

- C3: 使用 `useTransition` 配合 `disabled={isPending}` 有效防止双重提交 ✅
- C3: 错误处理正确使用 `instanceof Error` 类型守卫
- C2: 使用 `useTransition` 而非 `useState(loading)` 符合 React 19 最佳实践
