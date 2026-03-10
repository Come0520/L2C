# leads 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/leads

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 0 |
| 🟠 P1 — 质量/性能（应当修复） | 2 |
| 🟡 P2 — 规范/UX（建议改进） | 1 |
| **合计** | **3** |

---

## 🔴 P0 — 必须立即修复

- (无)

## 🟠 P1 — 应当修复

### 1. `pool-recycle-job` 定时任务查询缺少 LIMIT (D4-002: 无 LIMIT 保护)
**路径：** `src/features/leads/logic/pool-recycle-job.ts`
**审计问题：**
在执行 `staleNoContactLeads` 和 `staleNoDealLeads` 查询时，使用了 `db.query.leads.findMany` 但没有使用 `limit` 和 `offset`，如果单个租户由于某些原因积压了数万条超期线索，会导致内存溢出 OOM，或者阻断任务的继续执行。
**修复建议：**
为 `findMany` 增加 `limit: 500`（或 1000），使用分页或分批获取的逻辑来处理超期线索。由于 `recycleLeadBatch` 内部会流转状态使它们不再满足查询条件，可以使用一个简单的 `while` 循环直到查不到超期线索为止。

### 2. 渠道 ROI 统计缺失最大时间跨度限制 (D4-003: 缺失时间防线)
**路径：** `src/features/leads/actions/analytics.ts`
**审计问题：**
`getLeadChannelROIStats` 方法的入参 `input: z.infer<typeof analyticsDateRangeSchema>` 是可选的，并且在其内部并未对日期范围进行不超过 1 年（如 365 天）的强制校验。由于该查询涉及 `leads`、`quotes`、`orders` 的三表联合 `groupBy` 和 `SUM` 聚合计算，如果遭到长达数年的全量数据查寻，将非常消耗数据库性能。
**修复建议：**
在进行 `analyticsDateRangeSchema.parse` 之后，检查是否存在 `from` 且跨度 `(to - from)` 超过 365天，如果没有传入日期或是超过最大跨度，应强制抛出错误或截断至最近的 365 天。

---

## 🟡 P2 — 建议改进

### 1. 废弃且未使用的安全验证函数
**路径：** `src/features/leads/logic/webhook-handler.ts`
**审计问题：**
文件中定义导出了 `export async function verifyAccessToken()` 旨在提供带有 `timingSafeEqual` 的令牌验证。但是在实际的 `src/app/api/v1/leads/webhook/route.ts` API 路由中并未调用该函数，而是使用了 `sql\`settings->>'webhookAccessToken' = ${accessToken}\`` 进行数据库比对，导致此安全函数变成了“死代码(Dead Code)”。
**修复建议：**
如果决定在数据库层进行令牌校验以获取匹配的 Tenant 不再使用内存比对，则应删除 `verifyAccessToken` 并在代码中添加相关注释说明安全策略改变。或者在 API 路由中结合使用此函数，以满足对防止时序攻击的严格诉求。

---

## 🔖 错题本命中记录

> ✅ 成功命中：D4-002 无 LIMIT 保护
> 描述：在全表扫描或未过滤的集合中未使用 `.limit()` 导致数据膨胀压垮节点。
>
> ✅ 成功命中：D4-003 缺失时间防线
> 描述：在报表统计中未使用强行时间跨度校验。

---

## ✅ 表现良好项（无需修复）

- D1: 带有 `isDuplicate` 的复杂插入业务具有高度清晰的冲突处理；同时记录了非常完整的审计数据 `importBatchId`。
- D3: 更新和分配逻辑都普遍加入了 `version` 进行乐观锁防护，杜绝了并发 TOCTOU 问题。
