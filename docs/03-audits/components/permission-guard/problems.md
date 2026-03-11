# permission-guard 组件审计问题报告

> 审计时间：2026-03-11
> 审计人：Agent
> 组件路径：src/shared/ui/permission-guard.tsx

---

## 📊 总览

|               级别                | 数量  |
| :-------------------------------: | :---: |
| 🔴 P0 — 安全/功能（必须立即修复） |   1   |
|    🟠 P1 — 性能/UX（应当修复）    |   1   |
|   🟡 P2 — 规范/a11y（建议改进）   |   1   |
|             **合计**              | **3** |

---

## 🔴 P0 — 必须立即修复

- [ ] [C3-001] `shared/ui/permission-guard.tsx:122-125` — `checkPermissions` 函数对 `ADMIN` 角色立即返回 `true`，但对 `BOSS` 和 `SUPER_ADMIN` 角色没有同样的提前短路逻辑。这两个角色的权限集包含 `**` 通配符（见 `roles.ts`），仅靠第 136 行的 `allPermissions.has('**')` 兜底。若 `BOSS/SUPER_ADMIN` 的 `roleDef.permissions` 中的 `**` 被意外移除或拼写错误，这两个角色将失去所有权限，而 `ADMIN` 角色不受影响，形成权限不一致

## 🟠 P1 — 应当修复

- [ ] [C2-001] `shared/ui/permission-guard.tsx:77` — `const userRoles = session.user.roles || [session.user.role || 'SALES']` 的默认 fallback 为 `'SALES'`。若 `session.user.roles` 为空数组（`[]`）时，`[]` 为 truthy，则直接使用空数组导致所有权限检查失败；若 `role` 也为空，则会错误地赋予 SALES 角色权限。应明确校验 `roles` 的长度

## 🟡 P2 — 建议改进

- [ ] [C6-001] `shared/ui/permission-guard.tsx:141-142` — `'*'` 通配符逻辑仅匹配 `.view` 权限，注释说明"仅匹配 .view 类权限"，但实际检查使用的是 `perm.includes('.view')`，这会错误地匹配 `perm.own.view_detail`、`preview` 等包含 `view` 字样的非查看权限。建议改为 `perm.endsWith('.view') || perm.endsWith('.read')`

---

## 🔖 错题本命中记录

- 无新增类型，以上均为此组件特有逻辑漏洞

---

## ✅ 表现良好项（无需修复）

- C1: Props 类型声明完整，JSDoc 注释详细，示例代码清晰
- C4: fallback 机制完整，有 null 默认值
- C6: 同时提供了 `PermissionGuard` 组件和 `usePermission` Hook，使用灵活
