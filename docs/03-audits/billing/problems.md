# billing 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/billing

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 1 |
| 🟠 P1 — 质量/性能（应当修复） | 3 |
| 🟡 P2 — 规范/UX（建议改进） | 2 |
| **合计** | **6** |

---

## 🔴 P0 — 必须立即修复

- [x] [D3-P0-1] `actions/subscription-actions.ts:108-118` — `initiatePayment` 函数在调用第三方支付 API **之前**，使用 `status: 'ACTIVE'` 创建了订阅记录。若用户发起支付后不付款（或支付失败），数据库中将保留一条 `ACTIVE` 状态的订阅记录，该租户将获得**未付款的套餐权限**。应改为先以 `status: 'PENDING'` 创建，Webhook 回调激活后再更新为 `ACTIVE` ✅ 已修复(2026-03-10)

---

## 🟠 P1 — 应当修复

- [x] [D3-P1-2] `actions/subscription-actions.ts:161-170` — `activateSubscriptionByPayment` 从 Webhook 回调的 `attach` 字段解析 `tenantId`，但**未验证 `attach` 中的 tenantId 与其他来源（如订单号归属）是否一致**。若攻击者伪造 Webhook 回调并篡改 `attach` 字段，可越权激活任意租户的订阅。应在幂等检查后验证 `outTradeNo` 对应的订单号归属 `tenantId` 与 `attach` 中的一致 ✅ 已修复(2026-03-10)

- [x] [D3-P1-3] `actions/subscription-actions.ts:302-312` — `cancelSubscription` 函数接受 `tenantId` 作为参数，**函数本身无认证（无 `await auth()`）**，属于内部调用函数。若该函数被意外暴露为 Server Action 入口，则任意用户可通过传入 `tenantId` 取消任意租户的订阅。建议添加防御性认证检查，或重命名为 `cancelSubscriptionInternal` 并加上防护 ✅ 已修复(2026-03-10)

- [ ] [D3-P1-4] `actions/subscription-actions.ts:182-191` — **Webhook 幂等检查 TOCTOU 并发漏洞**：在 `activateSubscriptionByPayment` 中，通过查询 `externalPaymentId` 判断是否处理过回调的操作处于事务之外。若第三方支付网关并发推送两次相同的 Webhook 异常事件，两者会同时通过 `existingPayment.length > 0` 检查并向下执行，造成数据库并发插入多条相同的 `billingPaymentRecords` 流水记录。建议依赖数据库针对 `externalPaymentId` 的唯一索引冲突处理（`ON CONFLICT DO NOTHING`）来实现绝对幂等。

---

## 🟡 P2 — 建议改进

- [x] [D2-P2-1] `actions/subscription-actions.ts:181` — 幂等跳过日志使用 `console.log()` 而非项目统一的 `logger.info()`，不符合日志规范 ✅ 已修复(2026-03-10)

- [ ] [D8-P2-2] `actions/subscription-actions.ts` — 订阅状态的核心流转方法（`initiatePayment`, `activateSubscriptionByPayment`, `cancelSubscriptionInternal`）全程未调用 `AuditService.log`，导致租户侧的付款操作、取消订阅等缺少审计追踪能力，不符合 D8 规范。

---

## ✅ 表现良好项（无需修复）

- **D4 幂等防重**：`activateSubscriptionByPayment` 在激活前检查 `externalPaymentId` 是否已存在，防止 Webhook 重复触发导致重复激活
- **D4 事务原子性**：激活订阅时在事务内同时更新 `tenants`、`subscriptions` 和 `billingPaymentRecords` 三张表
- **D4 商户订单号格式化**：`generateOutTradeNo` 含前缀、租户 ID 片段、时间戳和随机码，碰撞概率极低
