# 客户模块 (Customers) 审计报告 - Round 1

**日期**: 2026-02-16
**审计人**: Antigravity Agent
**模块路径**: `src/features/customers/`, `src/services/customer.service.ts`, `src/services/customer-status.service.ts`
**需求文档**: `docs/02-requirements/modules/客户&渠道/2026-01-14-customer-channel-architecture-design.md`

---

## 1. 需求一致性 (Requirement-Code Consistency)

| ID | 问题 | 类型 | 位置 | 建议操作 | 决策 |
|:---|:---|:---|:---|:---|:---|
| 1.1 | **已合并客户未过滤** — 需求明确 `is_merged=true` 的客户不再在列表中显示，但 `getCustomers()` 查询中完全没有过滤 `isMerged` 或 `deletedAt` | Mismatch | `queries.ts:50` | 在 WHERE 条件中添加 `eq(customers.isMerged, false)` 和 `isNull(customers.deletedAt)` | |
| 1.2 | **客户等级只升不降未实现** — 需求规定"等级只升不降（除非手动调整）"，但 `updateCustomer()` 允许对 `level` 字段进行任意修改，无降级检查 | CodeMissing | `mutations.ts:89-113` | 在更新逻辑中加入等级降级校验，若非管理员调低等级则报错 | |
| 1.3 | **客户画像增量更新未闭环** — 需求要求"订单完成时自动更新画像指标"，`customer-status.service.ts` 中 `onOrderCompleted` 仅更新 `lifecycleStage`/`pipelineStatus`，未更新 `totalOrders`/`totalAmount`/`avgOrderAmount`/`lastOrderAt` 等统计字段 | CodeMissing | `customer-status.service.ts:81-107` | 在 `onOrderCompleted` 中触发画像指标重新计算 | |
| 1.4 | **数据范围权限 (OWN_VIEW/ALL_VIEW) 未实现** — 权限配置中定义了 `customer.own.view`/`customer.all.view` 粒度，但 `getCustomers()` 和 `getCustomerDetail()` 均无数据范围过滤，所有已登录用户可查看全部客户 | CodeMissing | `queries.ts:15-87` | 在查询中根据用户权限判断：有 `ALL_VIEW` 返回全部，仅有 `OWN_VIEW` 时过滤 `assignedSalesId = userId` | |
| 1.5 | **`lifecycleStage`/`pipelineStatus` 过滤未实现** — Schema 中解析了这两个字段，但 `getCustomers()` 查询中没有使用它们进行过滤 | CodeMissing | `queries.ts:30-44` | 添加 `lifecycleStage` 和 `pipelineStatus` 的过滤条件 | |
| 1.6 | **客户删除功能缺失** — 权限中定义了 `customer.delete`，但无对应 `deleteCustomer` 或 `softDeleteCustomer` 的 action | CodeMissing | `mutations.ts` | 实现软删除 action，设置 `deletedAt` 字段 | |

---

## 2. 业务逻辑 (Business Logic Optimization)

| ID | 观察 | 建议 | 价值 | 决策 |
|:---|:---|:---|:---|:---|
| 2.1 | **客户编号碰撞风险** — `generateCustomerNo()` 使用 4 位随机 HEX (65536 种组合)，在同一天高并发下存在碰撞风险，且无唯一性重试机制 | 添加重试循环 + DB 唯一约束保护，或升级为更长随机数 | 避免生产环境数据插入失败 | |
| 2.2 | **`createCustomer` 接收外部 userId/tenantId 参数** — `createCustomer(input, userId, tenantId)` 的 `userId` 和 `tenantId` 由前端传入而非从 session 获取，存在伪造风险。其他 mutation 已正确从 session 获取 | 改为完全从 `auth()` session 获取，移除外部参数 | 一致性+安全 | |
| 2.3 | **合并操作 `mergeCustomersAction` 同样接收外部 userId** — 与 2.2 同理，`userId` 应从 session 获取 | 同上 | 安全 | |
| 2.4 | **`previewMerge` 的关联数据统计缺少租户隔离** — 查询订单/报价/线索数量时只过滤了 `customerId`，没有过滤 `tenantId` | 添加 `eq(orders.tenantId, tenantId)` 等条件 | 数据隔离 | |
| 2.5 | **`mergeCustomers` 中主档案 update 缺少 tenantId 过滤** — 第 261 行 `where(eq(customers.id, primaryId))` 没有加 tenantId 条件 | 添加 `and(eq(customers.id, primaryId), eq(customers.tenantId, tenantId))` | 安全 | |
| 2.6 | **`mergeCustomers` 被合并档案 update 缺少 tenantId 过滤** — 第 270 行 `where(inArray(customers.id, mergedIds))` 没有加 tenantId | 同上 | 安全 | |
| 2.7 | **`createActivity` 缺少输入校验** — 直接接受前端 `data` 对象，无 Zod schema 验证 `type`/`description`/`images` 的内容和长度 | 添加 Zod schema 校验 | 防止 XSS/存储滥用 | |
| 2.8 | **`createActivity` 缺少权限检查** — 没有 `checkPermission()` 调用，任何已登录用户均可为任意客户添加活动 | 添加 CUSTOMER.EDIT 权限检查 + 客户归属租户验证 | 安全 | |
| 2.9 | **`getActivities` 缺少权限检查** — 没有验证当前用户是否有权查看该客户的活动记录 | 添加权限检查 | 安全 | |
| 2.10 | **`pageSize` 无上限验证** — `getCustomersSchema` 中 `pageSize` 使用 `z.coerce.number().default(10)` 但无 `.max()` 限制，攻击者可传 `pageSize=999999` 拉取全表 | 添加 `.max(100)` 或 `.max(50)` | 防 DoS | |

---

## 3. 安全 (Military-Grade)

| ID | 漏洞 | 严重性 | 位置 | 修复方案 | 决策 |
|:---|:---|:---|:---|:---|:---|
| 3.1 | **全模块无审计日志 (Audit Log)** — 客户创建、编辑、删除、合并、地址操作、活动创建均无 `AuditService.log()` 调用。其他模块（财务、订单等）已接入审计服务 | **Critical** | 全部 mutations | 在所有写操作后调用 `AuditService.log()` | |
| 3.2 | **搜索参数 SQL 注入风险** — `queries.ts:28` 使用 `ILIKE ${%${search}%}` 模板字符串，虽然 Drizzle 的 `sql` 模板会自动参数化，但搜索值中的 `%` 和 `_` 通配符未转义，可能被利用进行模式匹配攻击 | **Med** | `queries.ts:27-29` | 对 `search` 中的 `%` 和 `_` 进行手动转义 | |
| 3.3 | **客户合并操作无独立权限检查** — `mergeCustomersAction` 和 `previewMergeAction` 仅检查认证（tenantId 是否存在），未校验 `CUSTOMER.MANAGE` 或 `CUSTOMER.ALL_EDIT` 权限 | **High** | `mutations.ts:264-296` | 添加 `checkPermission(session, PERMISSIONS.CUSTOMER.MANAGE)` | |
| 3.4 | **`updateCustomer` 未限制可更新字段** — `data` 使用 `customerSchema.partial()`，理论上可以通过 API 修改 `lifecycleStage`、`pipelineStatus` 等应由系统自动管理的字段 | **High** | `mutations.ts:96-108` | 创建 `editableCustomerSchema` 排除系统管理字段 | |
| 3.5 | **`updateCustomerAddress` 缺少权限检查** — 该函数验证了地址归属租户，但缺少 `checkPermission(session, PERMISSIONS.CUSTOMER.EDIT)` 调用 | **Med** | `mutations.ts:169-206` | 添加权限检查 | |
| 3.6 | **合并事务中迁移数据缺少 tenantId 条件** — 订单/报价/线索/售后/测量/地址的迁移操作仅通过 `customerId` 过滤，未加 `tenantId` 条件。若存在 ID 碰撞（UUID 极低概率但防御性编程应考虑），可能跨租户迁移数据 | **Med** | `customer.service.ts:199-238` | 在所有迁移 update 中添加 `eq(table.tenantId, tenantId)` | |
| 3.7 | **页面传递 tenantId 给客户端组件** — `page.tsx:191` 将原始 `tenantId` 传递给 `CustomerAddressList` 客户端组件。虽然不直接暴露安全漏洞，但属于信息泄漏 | **Low** | `[id]/page.tsx:191` | 从客户端组件中移除 tenantId 参数，改为在 server action 中获取 | |
| 3.8 | **详情页权限检查形同虚设** — `[id]/page.tsx:51` 计算 `canViewFull` 但仅用于控制手机号显示，其他敏感信息（微信号、备注、统计数据、合并操作按钮）对所有已登录用户可见 | **Med** | `[id]/page.tsx:50-58` | 根据权限矩阵实现完整的数据范围控制 | |

---

## 4. 问题汇总

| 严重性 | 数量 |
|:---|:---|
| 🔴 Critical | 1 (3.1 审计日志缺失) |
| 🟠 High | 2 (3.3 合并无权限, 3.4 可更新字段不受限) |
| 🟡 Medium | 5 (3.2, 3.5, 3.6, 3.8, 2.10) |
| 🔵 Low | 1 (3.7) |
| 📋 需求缺口 | 6 (1.1-1.6) |
| 💡 优化建议 | 9 (2.1-2.9) |

**总计**: 24 项发现

---

## 5. 下一步

请逐项确认每个发现的决策（Fix / Doc / Ignore），确认后我将编制执行方案并开始修复。
