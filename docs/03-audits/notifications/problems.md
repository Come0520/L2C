# notifications 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/notifications

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 0 |
| 🟠 P1 — 质量/性能（应当修复） | 3 |
| 🟡 P2 — 规范/UX（建议改进） | 3 |
| **合计** | **6** |

> ⚠️ 本模块**无 P0 安全问题**，整体安全质量良好。

---

## 🟠 P1 — 应当修复

- [x] [D3-P1-1] `actions.ts:256-258` — `runSLACheck` 权限校验使用**硬编码角色字符串** `role !== 'ADMIN' && role !== 'MANAGER'`，未使用 `checkPermission` 系统。与其他模块标准不一致，且未能支持未来可能的基于 Permission 的权限扩展 ✅ 已修复(2026-03-10)

- [x] [D3-P1-2] `notification-service.ts:396-402` — `createAnnouncement` 的权限校验逻辑为 `!hasPermission && role !== 'ADMIN' && role !== 'MANAGER'`，等价于"有 MANAGE 权限 **或** 是 ADMIN/MANAGER 都放行"。与 `upsertNotificationTemplate`（第501行，仅用 `ADMIN` 作为兜底）不一致，且 MANAGER 角色判断绕过了权限体系。建议统一为 `checkPermission(session, PERMISSIONS.NOTIFICATION.MANAGE)` 并在权限配置中包含 ADMIN/MANAGER ✅ 已修复(2026-03-10)

- [x] [D4-P1-3] `notification-service.ts:282-348` — `processNotificationQueue` 的 Step 2 中，逐条调用三方适配器（SMS/WeChat/Lark）后单条 UPDATE 状态，属于串行处理。高并发场景下（如 SLA 批量告警产生 100+ 条队列），处理单批 50 条将串行调用 50 次外部 API。建议改为按渠道分组后并发批量发送 ✅ 已修复(2026-03-10)

---

## 🟡 P2 — 建议改进

- [x] [D5-P2-1] `notification-service.ts:135-137` — 幂等 Token 的生成粒度为**日级别**（按日期去重），同一天内发送两次相同事件的通知（如同一天订单状态变更两次）会被幂等机制阻止，导致第二次状态变更通知丢失。对于订单状态等高频变更场景，建议将 `params` 中的事件标识（如订单 ID + 状态）引入 Token 生成逻辑，而非仅依赖日期 ✅ 已修复(2026-03-10)

- [x] [D6-P2-2] 5 个测试文件中，缺少幂等 Token 去重场景（同日重复发送）和 processNotificationQueue 的集成测试 ✅ 已修复(2026-03-10)

- [x] [D8-P2-3] `notification-service.ts` — `createAnnouncement` 和 `upsertNotificationTemplate` 函数中，对业务表的插入/更新操作与 `AuditService.log` 的记录**没有包裹在同一个 `db.transaction` 事务中**。若审计记录写入失败抛出异常，会导致业务数据已落库但没有审计留存，破坏数据一致性。✅ 已修复(2026-03-10)

---

## ✅ 表现良好项（无需修复）

- **D3 XSS 防护**：`renderTemplate` 函数对所有用户传入变量进行 HTML 转义（`escapeHtml`），防止模板注入 XSS 攻击
- **D3 通知读取隔离**：所有查询均双重过滤 `eq(notifications.tenantId, tenantId)` + `eq(notifications.userId, userId)`，无跨用户/跨租户读取
- **D3 IN_APP 强制开启**：保存偏好设置时强制保留 `IN_APP` 渠道，不可被用户完全关闭
- **D4 队列并发安全**：`processNotificationQueue` 使用 `SELECT ... FOR UPDATE SKIP LOCKED`，多实例部署时不会重复处理同一条记录
- **D4 幂等防重**：通知入队前检查同一天相同模板+用户+渠道的记录，防止 SLA Cron 任务频繁触发导致同一天重复通知
- **D4 批量 upsert**：`batchUpdateNotificationPreferences` 使用 `onConflictDoUpdate` 批量 upsert，无 N+1 查询
- **D4 优先级排序**：队列处理根据 URGENT > HIGH > NORMAL 优先级排序，高优先级通知优先发送
- **D8 高优审计**：仅对 HIGH/URGENT 优先级消息记录审计日志，合理控制审计量
