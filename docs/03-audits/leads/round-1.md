# 线索模块 (Leads) 审计报告 - Round 1

**审计时间**: 2026-02-16
**审计范围**:
- `src/features/leads/` (actions, logic, components, config, schemas)
- `src/app/api/mobile/leads/` (移动端 API 路由)
- `src/app/api/cron/leads/` (Cron 定时任务)
- `src/app/api/v1/leads/` (Webhook 路由)

**需求文档**: `docs/02-requirements/modules/线索/2026-01-14-lead-module-architecture-design.md`
**差距分析**: `docs/02-requirements/modules/leads-gap-analysis.md`

---

## 1. 需求一致性 (Requirement Consistency)

| ID | 问题 | 类型 | 位置 | 建议操作 | 决策 |
|:---|:---|:---|:---|:---|:---|
| 1.1 | `addFollowup` 的 Schema 定义了 `quoteId`, `purchaseIntention`, `customerLevel` 字段，但 `mutations.ts` 的 `addFollowup` 函数只传递了 `type`, `content`, `nextFollowupAt` 三个字段给 Service，其余字段被静默丢弃 | CodeMissing | `actions/mutations.ts:122-126` / `schemas.ts:72-74` | 将 `quoteId`, `purchaseIntention`, `customerLevel` 传递给 `LeadService.addActivity` | |
| 1.2 | 差距分析文档指出 `LeadsFilterBar` 和 `LeadsAdvancedFilter` 是空组件，当前文件大小表明仍未实质性实现（分别 91B 和 7.5KB） | CodeMissing | `components/lead-filters.tsx`, `components/leads-advanced-filter.tsx` | 确认是否为当前迭代的必须项 | |
| 1.3 | 架构文档定义了乐观锁 (Optimistic Locking) 机制（`version` 字段），但 `mutations.ts` 中的 `updateLead` 未传递或校验 `version` 字段 | Mismatch | `actions/mutations.ts:71-91` | 在更新操作中增加 `version` 校验，防止并发覆盖 | |
| 1.4 | 需求要求"特定权限可查看全号并触发审计日志"，但移动端 GET 详情 API 直接返回完整的 `lead` 对象，未做手机号脱敏处理 | Mismatch | `api/mobile/leads/[id]/route.ts:37` | 详情 API 应对 `customerPhone` 进行脱敏（同列表页一致） | |

## 2. 业务逻辑 (Business Logic)

| ID | 观察 | 建议 | 价值 | 决策 |
|:---|:---|:---|:---|:---|
| 2.1 | **死代码 (Dead Code)**：`pool-recycle-job.ts:91-92` 有重复的 `return recycledIds;`，第二个永远不会执行 | 删除死代码 | 代码质量 | |
| 2.2 | **性能问题**：`recycleNoDealLeads` 使用 `for...of` 循环逐条事务处理，而 `recycleNoContactLeads` 使用批量事务。应保持一致使用批量操作 | 将 `recycleNoDealLeads` 改为批量事务处理（同 `recycleNoContactLeads` 的模式） | 性能优化 | |
| 2.3 | **导入并发控制无效**：`importLeads` 设置 `CONCURRENCY_LIMIT = 5`，但使用 `Promise.all` 在 chunk 内并发执行。如果 chunk 较大或数据库连接池有限，可能导致连接耗尽 | 确认连接池大小兼容并发策略；或改用 `Promise.allSettled` 防止一个失败导致整批崩溃 | 稳定性 | |
| 2.4 | **评分模型简化过度**：`scoring.ts:48` 来源分数的计算逻辑被简化为 `channelId ? UNKNOWN_CHANNEL_SCORE : DEFAULT_SOURCE_SCORE`，完全忽视了 `SOURCE_WEIGHTS` 配置，未关联查询实际渠道类型 | 关联查询 channel 表以获取真实渠道信息，使用 `SOURCE_WEIGHTS` 配置得到正确的来源分数 | 业务准确性 | |
| 2.5 | **跟进类型映射不一致**：移动端 `followup/route.ts` 的 `FollowupBody.type` 使用 `PHONE/VISIT/WECHAT/OTHER`，而后端 Schema 使用 `PHONE_CALL/STORE_VISIT/HOME_VISIT` 等。映射函数 `mapFollowupType` 存在但 `VISIT -> HOME_VISIT` 的映射可能不准确（VISIT 可能是到店也可能是上门） | 区分 `STORE_VISIT` 和 `HOME_VISIT`，或在移动端增加更精细的类型选项 | UX 准确性 | |
| 2.6 | **缺失 `updatedAt` 字段更新**：`restore.ts:106-111` 恢复线索时 `set` 操作未更新 `updatedAt`，导致恢复后 `updatedAt` 仍为作废时间 | 在 `.set()` 中添加 `updatedAt: new Date()` | 数据一致性 | |

## 3. 安全 (Military-Grade)

| ID | 漏洞 | 严重度 | 位置 | 修复方案 | 决策 |
|:---|:---|:---|:---|:---|:---|
| 3.1 | **SQL 注入风险**：`queries.ts:39` 的搜索功能使用 `ilike(leads.customerName, \`%${filters.search}%\`)` 直接拼接用户输入，虽然 Drizzle ORM 的 `ilike` 函数应会参数化，但 `%` 和 `_` 是 `LIKE` 的通配符，用户可以通过输入这些字符进行 Like 注入（如输入 `%` 匹配所有记录），泄露大量数据 | 中 (Med) | `actions/queries.ts:38-43` | 对 `filters.search` 转义 `%` 和 `_` 字符：`search.replace(/[%_]/g, '\\$&')` | |
| 3.2 | **SQL 注入风险 (Webhook)**：`scoring.ts:120` 的地址模糊匹配 `ilike(leads.address, \`%${address.slice(0, 20)}%\`)` 存在同样的 LIKE 通配符注入风险。对比 `webhook-handler.ts:104` 已正确实现了转义 | 中 (Med) | `actions/scoring.ts:120` | 与 `webhook-handler.ts:104` 一致，添加 `.replace(/[%_]/g, '\\\\$&')` 转义 | |
| 3.3 | **分页参数未限制上界**：`queries.ts` 的 `getLeads` 函数直接使用 `filters.pageSize` 作为 `limit`，而 `leadFilterSchema` 默认值为 10，但无 `.max()` 约束。攻击者可以传入 `pageSize=100000` 导致内存溢出 (OOM) 或拒绝服务 (DoS) | 高 (High) | `schemas.ts:95` / `actions/queries.ts:92` | 在 `leadFilterSchema` 中添加 `pageSize: z.number().min(1).max(100).default(10)` | |
| 3.4 | **`page` 参数缺失下界校验**：`leadFilterSchema` 中 `page: z.number().default(1)` 未限制最小值，传入 `page=0` 或负数会导致 `offset` 计算为负数，可能触发数据库错误或意外行为 | 中 (Med) | `schemas.ts:94` | 改为 `page: z.number().min(1).default(1)` | |
| 3.5 | **缺少权限检查**：`releaseToPool` 和 `claimFromPool` 函数不验证操作者与线索的归属关系。例如，用户 A 可以将用户 B 的线索释放到公海 | 高 (High) | `actions/mutations.ts:147-171` | 在 `releaseToPool` 中验证 `lead.assignedSalesId === userId` 或要求管理员权限 | |
| 3.6 | **Cron 路由认证逻辑缺陷**：`pool-recycle/route.ts:34` 先做字符串比较 `authHeader !== Bearer ${cronSecret}`，如果不匹配再做 `timingSafeEqual`。前者的字符串比较已经泄露了时序信息（因为 `!==` 不是恒定时间的），使第二个安全比较失效 | 中 (Med) | `api/cron/leads/pool-recycle/route.ts:34-46` | 移除第一个 `!==` 快速比较，只使用 `timingSafeEqual` 路径 | |
| 3.7 | **`console.log` 泄露用户 ID**：`claim/route.ts:37` 在生产日志中打印完整的 `session.userId`。敏感信息不应出现在标准日志流中 | 低 (Low) | `api/mobile/leads/[id]/claim/route.ts:37` | 移除或改为结构化审计日志 | |
| 3.8 | **`leadId` 参数未校验 UUID 格式**：Mobile API 路由中 `id` 直接从 URL params 获取并传递给 Service，未校验是否为合法 UUID。异常输入可能导致数据库查询异常 | 低 (Low) | 多个移动端路由文件 | 添加 `z.string().uuid()` 校验 | |
| 3.9 | **恢复线索的审批结果缺乏回调处理**：`restore.ts` 提交审批后仅返回"审批中"状态，但无审批通过/拒绝后的回调实现，线索将永远停留在 INVALID 状态 | 高 (High) | `actions/restore.ts:67-87` | 确认审批模块的回调机制是否已实现；如未实现，需添加审批回调 Handler | |
| 3.10 | **批量检查去重缺少数量限制**：`batchCheckLeadDuplicates` 接受的 `items` 数组无长度上限，攻击者可传入数万条记录导致内存耗尽 | 高 (High) | `actions/scoring.ts:192-198` | 在 `batchCheckDuplicateSchema` 中添加 `.max(500)` 限制 | |

---

## 共发现 20 个问题

| 维度 | 严重 (Critical) | 高 (High) | 中 (Med) | 低 (Low) | 合计 |
|:---|:---|:---|:---|:---|:---|
| 需求一致性 | 0 | 1 (1.4) | 2 (1.1, 1.3) | 1 (1.2) | 4 |
| 业务逻辑 | 0 | 0 | 4 (2.2-2.5) | 2 (2.1, 2.6) | 6 |
| 安全 | 0 | 3 (3.3, 3.5, 3.9, 3.10) | 3 (3.1, 3.2, 3.6) | 3 (3.4, 3.7, 3.8) | 10 |
| **合计** | **0** | **4** | **9** | **6** | **20** |

---

## 下一步

请逐项审阅以上发现，并为每个问题标注决策：

- **Fix** — 在本轮修复
- **Doc** — 记录到文档，后续处理
- **Ignore** — 忽略（附原因）
