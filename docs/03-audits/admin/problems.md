# admin 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/admin

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 0 |
| 🟠 P1 — 质量/性能（应当修复） | 1 |
| 🟡 P2 — 规范/UX（建议改进） | 2 |
| **合计** | **3** |

> ⚠️ 本模块**无 P0 安全问题**，整体安全质量为 P3 阶段最高水准，含多层次防御体系。

---

## 🟠 P1 — 应当修复

- [x] [D4-P1-1] `role-management/actions.ts:120-138` — `getRoles` 函数获取角色列表后，逐个角色查询用户数（N 个角色 = N 次数据库查询），产生 N+1 问题。应改为使用 `GROUP BY` 或等值子查询一次性汇总

---

## 🟡 P2 — 建议改进

- [x] [D6-P2-1] 6 个测试文件中，缺少权限白名单拒绝测试（传入非法权限字符串应返回错误）

- [x] [D5-P2-2] `role-management/actions.ts`、`tenant-settings/actions.ts` 以及 `worker-management/actions.ts` 中多处写入与状态变更操作（如创建角色、更新角色权限、删除角色、修改租户信息、更新 MFA 配置、更新师傅状态等）均未将业务状态更新与 `AuditService.log` 的记录放置在同一个数据库事务（`db.transaction`）内执行。这可能导致在高并发和异常情况下审计记录未能原子性保存。

---

## ✅ 表现良好项（无需修复）

- **D3 权限白名单**：`validatePermissionsWhitelist` 在创建/更新角色前校验权限列表，防止注入非法权限字符串
- **D3 系统角色保护**：`updateRolePermissions`、`deleteRole` 检查 `isSystem` 标志，阻止内置角色被篡改
- **D3 活跃用户保护**：`deleteRole` 删除前检查是否有活跃用户，防止产生孤立权限账号
- **D3 tenantId 隔离**：所有读写操作均含 `eq(roles.tenantId, session.user.tenantId)`
- **D3 AdminRateLimiter**：创建/更新/删除操作有速率限制，防止暴力批量操作
- **D3 PolicyEngine**：预留 ABAC 策略引擎评估点（`PolicyEngine.evaluate`），为复杂权限场景扩展
- **D7 Zod UUID 格式校验**：`roleId` 强制 UUID 格式，防止 SQL 注入
- **D8 全量审计**：创建/更新/删除均记录 oldValues/newValues 对比
