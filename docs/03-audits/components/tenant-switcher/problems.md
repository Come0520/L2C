# tenant-switcher 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/widgets/layout/tenant-switcher.tsx

---

## 📊 总览

|               级别                | 数量  |
| :-------------------------------: | :---: |
| 🔴 P0 — 安全/功能（必须立即修复） |   1   |
|    🟠 P1 — 性能/UX（应当修复）    |   2   |
|   🟡 P2 — 规范/a11y（建议改进）   |   1   |
|             **合计**              | **4** |

---

## 🔴 P0 — 必须立即修复

- [ ] [C3-001] `widgets/layout/tenant-switcher.tsx:131-133` — `onSelect` 中直接调用 `handleSwitchTenant(tenant.id)`，选择即执行切换（导致强制登出）。应弹出确认对话框，让用户二次确认后再执行

## 🟠 P1 — 应当修复

- [ ] [C6-001] `widgets/layout/tenant-switcher.tsx:36-49` — 租户获取逻辑与 `user-menu.tsx:60-74` 完全重复：相同的 fetch API、相同的状态管理、相同的错误处理。必须抽取为 `useTenants()` 共享 hook
- [ ] [C4-001] `widgets/layout/tenant-switcher.tsx:78-81` — 切换失败时 `catch` 中只 `console.error`，没有 toast 提示用户。用户点击切换后页面无反应，不知道是否成功（对比 user-menu.tsx 的实现有 toast.error）

## 🟡 P2 — 建议改进

- [ ] [C5-001] `widgets/layout/tenant-switcher.tsx:44-46` — `console.error('Failed to fetch tenants:')` 应替换为 `logger.error()`

---

## 🔖 错题本命中记录

- C3-001 敏感操作缺少二次确认 → 复现于 tenant-switcher（租户切换）
- D8-002 遗留 console.log 未迁移至 logger → 复现于 tenant-switcher

---

## ✅ 表现良好项（无需修复）

- C1: Props 类型声明清晰（使用 Session 和 TenantOption 接口）
- C4: 平台管理员和单租户场景都有专门的 UI 分支处理
- C5: 搜索输入框和列表结构使用了 Command 组件，键盘导航友好
