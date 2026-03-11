# user-menu 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/widgets/layout/user-menu.tsx

---

## 📊 总览

|               级别                | 数量  |
| :-------------------------------: | :---: |
| 🔴 P0 — 安全/功能（必须立即修复） |   1   |
|    🟠 P1 — 性能/UX（应当修复）    |   2   |
|   🟡 P2 — 规范/a11y（建议改进）   |   3   |
|             **合计**              | **6** |

---

## 🔴 P0 — 必须立即修复

- [ ] [C3-001] `widgets/layout/user-menu.tsx:176` — `onClick={() => handleSwitchTenant(tenant.id)}`：租户切换操作（会导致强制退出登录）缺少二次确认。用户在下拉菜单中误触即触发切换 + 登出，无法撤销

## 🟠 P1 — 应当修复

- [ ] [C6-001] `widgets/layout/user-menu.tsx:60-74` — 租户列表获取逻辑与 `tenant-switcher.tsx:36-49` 完全重复（相同的 API 调用 `/api/auth/switch-tenant`），应抽取为共享的 `useTenants()` hook
- [ ] [C6-002] `widgets/layout/user-menu.tsx:77-104` — `handleSwitchTenant` 函数与 `tenant-switcher.tsx:54-82` 逻辑完全重复，同样应抽取为共享 hook

## 🟡 P2 — 建议改进

- [ ] [C1-001] `widgets/layout/user-menu.tsx:99` — `catch (error: any)` 使用了 `any` 类型断言，应改为 `unknown` 并通过类型守卫获取消息
- [ ] [C5-001] `widgets/layout/user-menu.tsx:130-144` — 头像触发按钮缺少 `aria-label`，屏幕阅读器只能读出「按钮」
- [ ] [C6-003] `widgets/layout/user-menu.tsx:189` — 角色显示硬编码 `tenant.role === 'ADMIN' ? '拥有者' : '员工'`，没有覆盖 BOSS、DISPATCHER 等角色，应使用角色映射表

---

## 🔖 错题本命中记录

- C1-001 Props 接口含 `any` → 复现于 user-menu（catch error: any）
- C3-001 敏感操作缺少二次确认 → 复现于 user-menu（租户切换）

---

## ✅ 表现良好项（无需修复）

- C4: mounted 检查防止 hydration 不匹配，非 mounted 时渲染 fallback
- C3: signOut 使用 next-auth 官方 API，安全性有保障
