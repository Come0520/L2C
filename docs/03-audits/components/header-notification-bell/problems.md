# header-notification-bell 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/widgets/layout/header-notification-bell.tsx

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

- [x] ✅ [C4-001] `widgets/layout/header-notification-bell.tsx:47-49` — 未读通知角标仅显示 2px 小红点，无法告知用户具体数量。当 unreadCount 较大时（如 `> 99`），应显示数字或 `99+` 以提供更有效的信息

## 🟡 P2 — 建议改进

- [x] ✅ [C5-001] `widgets/layout/header-notification-bell.tsx:39-51` — 通知铃铛按钮缺少 `aria-label="通知"`，屏幕阅读器无法识别；当有未读时，应补充 `aria-label="N条未读通知"`
- [x] ✅ [C5-002] `widgets/layout/header-notification-bell.tsx:22` — `console.error('Failed to fetch unread notification count:')` 应替换为 `logger.error()`，遵循项目统一日志规范（错题本 D8-002）

---

## 🔖 错题本命中记录

- C5-001 图标按钮缺少 aria-label → 复现于 header-notification-bell
- D8-002 遗留 console.log 未迁移至 logger → 复现于 header-notification-bell

---

## ✅ 表现良好项（无需修复）

- C2: useEffect 正确处理了 cleanup（mounted flag + clearInterval）
- C3: 无安全风险（只读操作，无用户输入）
- C6: 组件 54 行，职责单一，结构清晰
