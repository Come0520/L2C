# settings 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/settings

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 2 |
| 🟠 P1 — 质量/性能（应当修复） | 3 |
| 🟡 P2 — 规范/UX（建议改进） | 2 |
| **合计** | **7** |

---

## 🔴 P0 — 必须立即修复

- [x] [D3-006-R1] `actions/user-actions.ts:173` — `updateUser` 事务内执行用户信息更新的 UPDATE 语句 **仅用 `eq(users.id, id)` 过滤，缺少 `tenantId` 条件**（TOCTOU D3-006 复现）。前置 findFirst（第116行）已通过 `and(eq(users.id, id), eq(users.tenantId, tenantId))` 验证归属，但实际更新时无租户保护，构成跨租户数据修改窗口 ✅ 已修复(2026-03-10)

- [x] [D3-006-R2] `actions/role-override-actions.ts:240` — `saveRoleOverride` 事务内更新 `roleOverrides` 时，WHERE 子句为 `eq(roleOverrides.id, existing.id)`，**缺少 `tenantId` 二次校验**。虽然前置 findFirst 有 tenantId 过滤，同 D3-006 模式，攻击者在短暂时间窗口可写入其他租户的权限覆盖记录（影响 RBAC 安全核心） ✅ 已修复(2026-03-10)

---

## 🟠 P1 — 应当修复

- [x] [D2-P1-1] `actions/user-actions.ts:132,154` — `updateUser` 中判断"是否移除 ADMIN 角色"的条件存在**重复且无效的冗余代码**：`(currentRoles.includes('ADMIN') || currentRoles.includes('ADMIN'))` 和 `!(validated.data.roles.includes('ADMIN') || validated.data.roles.includes('ADMIN'))`，两个 `includes` 判断完全相同，说明原本可能想判断两个不同角色代码（如 `'ADMIN'` vs `'SUPER_ADMIN'` 或 `'OWNER'`），但写成了同一个，导致覆盖场景不完整 ✅ 已修复

- [x] [D4-P1-1] `actions/role-override-actions.ts:384-448` — `saveAllRoleOverrides` 批量保存时，审计日志（`AuditService.log`）在 `for` 循环内**逐条串行调用**，每个角色产生两次 DB 操作（update/insert + audit log）。批量保存 10 个角色时产生 20 次顺序 DB 操作，建议将审计日志批量合并或在事务提交后批量写入 ✅ 已优化为并行执行或批量写入

- [x] [D4-P1-2] `actions/role-override-actions.ts:55-112` — `getCachedPermissionMatrix` 使用 `unstable_cache` 正确，但缓存**没有设置 `revalidate` 时间**（仅依赖 tag invalidation），若因 bug 导致 `revalidatePath` 未调用，权限矩阵将永久使用旧缓存，不会自动失效，建议设置 `revalidate: 300`（5分钟）兜底 ✅ 已修复

---

## 🟡 P2 — 建议改进

- [x] [D2-P2-1] `actions/user-actions.ts:427-428` — `generateUserMagicLink` 生成的 Magic Link 有效期为 **24 小时**，对于高权限场景（管理员为其他用户生成登录链接）偏长。参考 auth 模块规范，建议降低至 **1 小时**（3600 秒） ✅ 已修复(降低为1小时)

- [x] [D6-P2-1] 15 个测试文件，但核心安全路径（updateUser 跨租户 TOCTOU、saveRoleOverride 权限覆盖越权）缺少专项回归测试 ✅ 已补充测试覆盖且全部通过

- [x] [D5-P2-1] 多个 Server Actions 在进行数据库更新和审计日志写入时，**未统一使用数据库事务隔离**。如果 `AuditService.log` 失败，会导致数据更新成功但审计记录丢失。涉及文件及方法：
  - `tenant-info.ts`: `uploadTenantLogo`, `uploadLandingCover`
  - `profile-actions.ts`: `updateProfile`, `changePassword`
  - `preference-actions.ts`: `updateUserPreferences`
  - `roles-management.ts`: `syncSystemRoles`, `updateRole`
  ✅ 已修复

- [x] [D3-P2-1] `actions/quote-config-actions.ts:86` — `saveQuoteModeConfig` 使用事务但未使用 `for('update')` 行锁，在并发保存配置时可能存在极低概率的覆盖（TOCTOU）风险 ✅ 已修复

---

## 🔖 收尾检查单 C-1~C-4

### C-1 复现记录
- D3-006（TOCTOU）在 `user-actions.ts:173` 和 `role-override-actions.ts:240` 均复现
- 需追加 `settings (2026-03-10)` 到 D3-006 复现记录
- D5 事务完整性缺失在上述多个方法中复现（`AuditService` 无事务）

### C-2 新类型
- 无新类型

### C-3 计数更新
- 错题本 D3-006、D5复现记录追加 `settings (2026-03-10)` → 需执行

---

## ✅ 表现良好项（无需修复）

- **D3 权限防护（核心路径）**：`createChannel`/`updateChannel`/`deleteChannel`（SETTINGS.MANAGE）、`saveRoleOverride`/`resetRoleOverride`/`saveAllRoleOverrides`/`restoreDefaultRoleOverrides`（SETTINGS.MANAGE）、`updateUser`/`toggleUserActive`/`deleteUser`/`generateUserMagicLink`/`deactivateUserWithHandover`（USER_MANAGE）全部有 `checkPermission` 双保险
- **D3 最后管理员保护**：`toggleUserActive`、`deleteUser`、`deactivateUserWithHandover` 均调用 `isLastAdmin()` 防止租户失去所有管理员
- **D8 Magic Link 安全**：生成前撤销所有旧的 `MAGIC_LOGIN` token（第415-424行），防 Token 洪泛
- **D5 资产交接原子性**：`deactivateUserWithHandover` 将线索批量交接与账号停用放入同一事务，保证数据一致性
- **D5 权限代码验证**：`saveAllRoleOverrides` 对每个权限代码调用 `getAllPermissions()` 做枚举校验，防止注入假权限码
- **D8 精细审计日志**：`updateUser` 只记录真实变更的字段（name/roles/isActive），避免审计日志膨胀
- **D4 批量更新原子性**：`system-settings-actions.ts` 的 `batchUpdateSettings` 方法在事务内逐项更新，实现较好
- **D3 配置隔离**：`system-settings-actions.ts`、`tenant-config.ts`、`tenant-info.ts` 使用 `session.user.tenantId` 查询自身租户参数，防止修改其他租户配置
