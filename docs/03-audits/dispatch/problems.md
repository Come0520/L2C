# dispatch 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/dispatch

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 0 |
| 🟠 P1 — 质量/性能（应当修复） | 1 |
| 🟡 P2 — 规范/UX（建议改进） | 2 |
| **合计** | **3** |

> ⚠️ 本模块**无 P0 安全问题**，tenant 隔离实现为全项目最佳水准。

---

## 🟠 P1 — 应当修复

- [x] [D3-P1-1] `actions/dispatch-actions.ts:87-152` — `assignMeasureWorker` 和 `assignInstallWorker` 均无 `checkPermission` 权限校验，任意已登录用户（包括 WORKER 角色）均可调用指派接口，将任务指派给其他工人。建议增加 `checkPermission(session, PERMISSIONS.DISPATCH.ASSIGN)` 或限制只有 ADMIN/MANAGER 角色可指派

---

## 🟡 P2 — 建议改进

- [x] [D6-P2-1] 5 个测试文件中，缺少越权指派测试（WORKER 角色不得调用 assignMeasureWorker）

- [x] [D5-P2-2] `actions/dispatch-actions.ts` 中所有的状态流转与人员指派操作（`assignMeasureWorker`, `updateMeasureTaskStatus`, `assignInstallWorker`, `updateInstallTaskStatus`）均未在同一个数据库事务（`db.transaction`）内执行写入操作与 `AuditService.record` 的写入记录。这使得系统无法保证业务数据流转与操作审计日志记录的绝对原子性，在极端异常时可能导致日志截断或丢失。

---

## ✅ 表现良好项（无需修复）

- **D3 tenantId 隔离完整**：所有 UPDATE 操作的 WHERE 均包含 `and(eq(table.id, taskId), eq(table.tenantId, tenantId))`，无 D3-006 问题
- **D3 工人归属验证**：指派前先查询 `users.tenantId === tenantId` 确认工人属于本租户，防止跨租户工人指派
- **D8 越权审计日志**：当 UPDATE 返回空（`updatedTask === null`，即 taskId 不属于当前 tenantId）时，额外记录 `ILLEGAL_ACCESS_ATTEMPT` 审计日志，是全项目唯一具备越权检测告警能力的模块
- **D8 操作审计完整**：每次指派和状态流转均记录完整 AuditService.record，含 changedFields
