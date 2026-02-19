# 渠道模块 (Channels) 审计报告 - Round 1

**日期**: 2026-02-16
**审计范围**: `src/features/channels/` 全部代码 + `src/app/api/miniprogram/channels/route.ts`
**需求文档**: `docs/02-requirements/modules/客户&渠道/2026-01-14-customer-channel-architecture-design.md`
**审计员**: Antigravity

---

## 1. 需求一致性 (Requirement-Code Consistency)

| ID | 问题 | 类型 | 位置 | 建议操作 | 决策 |
|:---|:---|:---|:---|:---|:---|
| 1.1 | **缺少审计日志**：所有写操作（创建、更新、删除渠道/佣金/结算单）均未调用 `AuditService.log()`，违反系统级审计要求 | CodeMissing | `mutations.ts`, `commissions.ts`, `settlements.ts`, `categories.ts`, `channel-config.ts`, `channel-products.ts`, `settings.ts` | 所有变更操作添加审计日志调用 | |
| 1.2 | **渠道等级定时更新未实现**：需求文档 §3.1 要求"每日凌晨定时计算渠道年度成交额并更新 level"，代码中无任何 cron/scheduled job 实现 | CodeMissing | 需求文档 §3.1 | 新增定时任务或将此功能标注为 Phase 2 | |
| 1.3 | **佣金触发模式默认值不一致**：需求文档默认 `ORDER_CREATED`（§3.2），但 `commission.service.ts:68` 默认使用 `PAYMENT_COMPLETED` | Mismatch | `commission.service.ts:68` | 统一默认值为需求文档规定的 `ORDER_CREATED` 或明确文档更新 | |
| 1.4 | **`deleteChannel` 使用硬删除**：直接 `DELETE FROM channels`，无软删除支持，已删除数据无法恢复，且关联的佣金和统计数据可能被破坏 | CodeMissing | `mutations.ts:227` | 改为软删除（`is_deleted` 标记），或在文档中明确要求硬删除 | |
| 1.5 | **`updateChannelCategory` 未校验输入**：直接使用 `input.name` 等未经 Zod 验证的原始输入，虽然重复检查时使用了原始值，但更新数据也未经 schema 验证 | Mismatch | `categories.ts:125-133` | 使用 `channelCategorySchema.partial().parse(input)` 验证 | |

---

## 2. 业务逻辑 (Business Logic Optimization)

| ID | 观察 | 建议 | 价值 | 决策 |
|:---|:---|:---|:---|:---|
| 2.1 | **佣金计算使用 IEEE 浮点运算**：`commissionAmount = calculationBase * effectiveRateDecimal`（`commission.service.ts:140`）使用 JS 原生浮点乘法，金额计算可能出现精度误差（如 `0.1 + 0.2 !== 0.3`） | 使用 `Decimal.js` 进行金额计算，保持与财务模块一致 | **Critical**：防止财务级精度错误 | |
| 2.2 | **结算单金额也使用浮点**：`settlements.ts:70-74` 中 `totalCommission` 使用 `parseFloat + reduce` 累加，存在同样的精度风险 | 同上：改用 `Decimal.js`，ROUND_HALF_UP | **Critical**：防止结算金额偏差 | |
| 2.3 | **`batchUpdateChannelPrices` 无批量大小限制**：理论上允许无限 UPDATE 操作在单个事务中执行（`channel-products.ts:150-162`），大批量可能导致长事务锁表 | 添加最大批量限制（如 100 条/批），超过则拒绝或分批 | 防止 DB 性能劣化 | |
| 2.4 | **渠道排行榜 N+1 查询**：`getChannelRanking`（`channel-stats.ts:255-267`）对每个顶级渠道及其子渠道逐个调用 `_getChannelStatsInternal`，每次内部执行 4-5 个 SQL 查询。假设 10 个顶级渠道各有 5 个子渠道，需要 `(10 + 50) × 5 = 300` 个查询 | 重构为单次聚合 SQL 查询，或使用 CTE 批量统计 | 查询性能提升 10-50 倍 | |
| 2.5 | **佣金费率检测逻辑脆弱**：`commission.service.ts:134-138` 使用 `rawRate <= 1` 判断是否为小数格式，但 1% 的费率（`rawRate = 1`）会被错误地当作 100% 处理 | 统一存储格式为百分比值（如 10 代表 10%），废弃自动检测逻辑 | 消除歧义性 Bug | |
| 2.6 | **Miniprogram API 仅支持 2 层树**：`route.ts:61-68` 仅过滤 `!c.parentId`（一级）和 `c.parentId === parent.id`（二级），忽略三级及以下渠道 | 如需多层级，改用递归构建；如业务限定 2 层，在文档中明确 | 数据完整性 | |
| 2.7 | **`toggleChannelCategoryActive` 存在 TOCTOU**：先读当前状态再更新（`categories.ts:234-263`），并发时可能导致状态不一致 | 在 UPDATE WHERE 中加 `isActive = current.isActive` 条件做乐观锁，或使用事务 | 并发安全 | |

---

## 3. 安全 (Military-Grade Security)

| ID | 漏洞 | 严重度 | 位置 | 修复建议 | 决策 |
|:---|:---|:---|:---|:---|:---|
| 3.1 | **`updateChannel` 的 `id` 参数未校验格式**：传入非 UUID 字符串可直接到达 DB 查询层 | Med | `mutations.ts:86` | 添加 `z.string().uuid()` 校验 `id` 参数 | |
| 3.2 | **`deleteChannel` 的 `id` 参数同样未校验** | Med | `mutations.ts:197` | 同上 | |
| 3.3 | **`toggleContactMain` 未验证 `contactId` 归属渠道**：虽有 `tenantId` 过滤，但 `contactId` 可能属于同一租户的另一渠道，会导致跨渠道操作 | High | `mutations.ts:254-257` | 在 SET 时添加 `channelId` 条件 | |
| 3.4 | **`voidCommission` 缺少 `reason` 输入校验**：`reason` 字符串无长度限制，可存入超大内容导致 DB 性能问题 | Med | `commissions.ts:207` | 添加最大长度校验（如 500 字符） | |
| 3.5 | **`getChannelAnalytics` 未检查权限**：仅检查 `tenantId` 存在，未使用 `checkPermission` 调用，任何登录用户都可查看分析数据 | High | `analytics.ts:33` | 添加 `checkPermission(session, PERMISSIONS.CHANNEL.VIEW)` | |
| 3.6 | **`getChannelProducts` / `getAvailableProducts` 未检查权限**：同上，缺少权限校验 | Med | `channel-products.ts:14-41` | 添加权限校验 | |
| 3.7 | **`handleCommissionClawback` 无调用权限约束**：非 `'use server'` 函数，但也缺少调用者身份验证逻辑，任何导入该函数的代码都可触发佣金扣回 | High | `commission.service.ts:284` | 确保调用方已验证权限，或在函数内增加 tenantId 校验逻辑 | |
| 3.8 | **`createCommissionRecord` 佣金金额由前端传入可被篡改**：前端直接传入 `orderAmount` 和 `commissionRate`，攻击者可伪造高额佣金 | Critical | `commissions.ts:18-25` | 从服务端重新查询订单金额和渠道费率，不信任客户端输入 | |
| 3.9 | **结算单编号碰撞风险**：`generateSettlementNo()` 使用 `YYYYMMDD + 6位随机数`，同一天内理论上有 10^6 个可能值，高并发下存在碰撞风险 | Med | `settlements.ts:20-26` | 使用 DB 序列或 UUID 前缀，或在插入时 catch 唯一约束冲突并重试 | |
| 3.10 | **`approveSettlement` 审批人可以是创建人**：缺少"自审自批"禁止逻辑，同一用户可以创建结算单后自行审批 | High | `settlements.ts:230-303` | 添加 `session.user.id !== settlement.createdBy` 检查 | |

---

## 4. 总结

### 按严重等级分类

| 等级 | 数量 | 代表问题 |
|:---|:---|:---|
| **P0 (Critical)** | 2 | 3.8 佣金金额可被篡改；2.1/2.2 浮点精度 |
| **P1 (High)** | 5 | 1.1 审计日志缺失；3.3 跨渠道联系人操作；3.5 分析接口无权限；3.7 佣金扣回无权限；3.10 自审自批 |
| **P2 (Medium)** | 8 | UUID 校验、输入长度、结算号碰撞、批量限制、N+1 查询等 |
| **P3 (Low/Info)** | 3 | 费率检测歧义、API 层级限制、TOCTOU |

### 建议优先级

1. **立即修复 (P0)**: 3.8, 2.1, 2.2
2. **尽快修复 (P1)**: 1.1, 3.3, 3.5, 3.7, 3.10
3. **计划内修复 (P2)**: 3.1, 3.2, 3.4, 3.9, 2.3, 2.4, 2.5, 1.5
4. **评估决策 (P3)**: 1.2, 1.3, 1.4, 2.6, 2.7
