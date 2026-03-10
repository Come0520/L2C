# monitoring 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/monitoring

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 1 |
| 🟠 P1 — 质量/性能（应当修复） | 1 |
| 🟡 P2 — 规范/UX（建议改进） | 2 |
| **合计** | **4** |

---

## 🔴 P0 — 必须立即修复

- [x] [D3-P0-1] `actions/alert-rules.ts:215,300,342,407` — 所有权限校验调用 `checkPermission(session, ...)` **缺少 `await`**，返回的是 Promise 对象（始终为真值），权限检查**完全失效**。任何已登录用户均可创建、删除、更新告警规则和发送批量通知。应改为 `const hasPermission = await checkPermission(session, PERMISSIONS.NOTIFICATION.MANAGE); if (!hasPermission) throw new Error('权限不足')`

---

## 🟠 P1 — 应当修复

- [x] [D4-P1-2] `actions/alert-rules.ts:170-194` — 内存速率限制器 `createRateLimiter` 的状态存储在进程内存中（`callTimestamps` 数组），多实例部署（如生产环境多 Pod）时各自独立计数，无法跨实例限流。建议改为基于 Redis 的原子计数器实现真正的分布式限流

---

## 🟡 P2 — 建议改进

- [x] [D2-P2-1] `actions/alert-rules.ts:429` — `sendBulkNotification` 当前实现为骨架版本（注释标注「仅记录审计日志」），未实际发送通知给目标用户（返回 `{ sentCount: 0 }`）。建议补充实际消息分发逻辑或在 UI 层标注此功能仍在开发中

- [x] [D5-P2-2] `actions/alert-rules.ts:199-354` — `createAlertRule`、`deleteAlertRule`、`updateAlertRule` 接口中，对 `riskAlerts` 表的数据库变更操作（insert/update/delete）与随后调用的 `AuditService.log` 审计记录函数未包装在同一个数据库事务（`db.transaction`）内执行。存在异常中断时数据状态与审计日志不一致（或丢失审计记录）的风险。

---

## ✅ 表现良好项（无需修复）

- **D3 tenantId 隔离**：所有查询、删除、更新操作均含 `eq(riskAlerts.tenantId, session.user.tenantId)`
- **D4 告警规则查询无 N+1**：`listAlertRules` 使用单次 SELECT 获取全部规则
- **D7 通知模板变量替换**：`renderTemplate` 使用预设模板定义，限制了可注入的内容范围
