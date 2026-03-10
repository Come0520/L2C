# platform 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/platform

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 0 |
| 🟠 P1 — 质量/性能（应当修复） | 2 |
| 🟡 P2 — 规范/UX（建议改进） | 2 |
| **合计** | **4** |

> ⚠️ 本模块**无 P0 安全问题**，`requirePlatformAdmin` 鉴权机制正确（先验 Session，再查库核验 `isPlatformAdmin`）。

---

## 🟠 P1 — 应当修复

- [x] [D4-P1-1] `actions/admin-actions.ts:295-312` — `approveTenant` 激活租户时，对 `tenantUsers` 数组使用串行 `for` 循环逐个 `UPDATE users`（N 个用户 = N 次数据库往返），当租户有大量用户（如企业版 200+ 成员）时性能极差。应改为 Drizzle 批量 `UPDATE ... WHERE tenantId = tenantId`（一次性更新所有用户）

- [x] [D3-P1-2] `actions/admin-actions.ts:763-768` — `generateMagicLink` 查找目标用户时未过滤 BOSS 角色（`eq(users.role, 'BOSS')`），仅按 `createdAt desc` 排序取第一个，可能选中**非 BOSS 角色的普通用户**（如注册时创建的 SALES/WORKER），导致生成的 Magic Link 指向错误账号

---

## 🟡 P2 — 建议改进

- [x] [D2-P2-1] `actions/admin-actions.ts:119-124` — `getPendingTenants` 搜索字段（`tenants.name LIKE %search%`）直接拼入原始 SQL 片段，虽然 Drizzle 通过参数化查询保护，但使用了 `sql`` 原始模板语法，存在被误用的潜力。建议改用 Drizzle 推荐的 `ilike()` 函数更安全地表达模糊匹配

- [x] [D5-P2-2] `actions/admin-actions.ts:793-814` — `generateMagicLink` 接口中，向 `verificationCodes` 插入 token 记录的操作与调用 `AuditService.log` 记录生成事件的操作未包装在同一个数据库事务（`db.transaction`）内执行。这可能导致在异常打断时发生 token 被创建但丢失安全审计日志。

---

## ✅ 表现良好项（无需修复）

- **D3 isPlatformAdmin 独立标志**：不依赖 Session role 字段，而是查库验证 `isPlatformAdmin`，防止 role 字段被伪造
- **D3 状态机保护**：`approveTenant`、`rejectTenant`、`activateTenant` 均前置校验 `tenant.status` 状态合法性，防止重复审批
- **D3 事务原子性**：租户状态变更 + 用户状态变更在单个事务内完成
- **D3 Magic Link 旧 Token 撤销**：生成新 Magic Link 前撤销旧的未使用 token
- **D7 拒绝原因强制校验**：`rejectReasonSchema` 要求拒绝原因必填且最多 500 字符
- **D8 完整审计日志**：审批通过、驳回、暂停、恢复、Magic Link 生成均记录 AuditService
