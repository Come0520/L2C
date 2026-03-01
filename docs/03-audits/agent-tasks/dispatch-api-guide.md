# 调度模块 (Dispatch) API 安全机制指南

调度引擎作为业务履约的核心中枢，负责处理测量、安装等履约任务的分派。为根治此前 `dispatch` 模块缺失 `tenantId` 导致的多租户数据越权风险，现已全系重构 `dispatch-actions`，严格强制执行硬隔离策略。

## 安全架构原则

1. **不可绕过的租户标识**
   在 `src/features/dispatch/actions/dispatch-actions.ts` 中导出的所有 API，无论查询还是变更动作，都**必须**传入 `tenantId` 参数。
   底层的 Drizzle 数据库操作已全面加入 `eq(table.tenantId, tenantId)`，确保操作仅在租户边界内生效。

2. **Server Action 层统一防线**
   API 在接受请求前不仅验证用户登录状态（`auth()`），而且自动解构并下发上下文中的 `tenantId` 到实际的 DB Proxy 层。不再允许上层调用方传递裸数据操作数据库。

3. **智能调度与隔离兼顾**
   即使是在 `smart-match` 使用的打分推荐算法中提取候选人，取数动作也已收束，避免拉取到异租户工人。

## API 概览

### 1. `getTasksByTenant`
- **功能**：分页获取当前租户下的调度任务。
- **强制约束**：返回的结果必定从属于给定的 `tenantId`。

### 2. `createDispatchTask`
- **功能**：由业务单（订单/测量单）转化为独立调度任务。
- **强制约束**：插入时主动附加并锁定 `tenantId`。

### 3. `assignWorker`
- **功能**：为指定调度单指派工人。
- **强制约束**：更新条件必须同时满足 `taskId` 及 `tenantId`，防止通过伪造 `taskId` 指派其他租户任务。同时会验证指定的 worker 是否归属于同一租户。

### 4. `updateTaskStatus`
- **功能**：更新调度任务流转状态（如 `PENDING_DISPATCH` -> `DISPATCHING`）。
- **强制约束**：同样基于 `id` AND `tenantId` 联合定位，附带 Audit Service 日志记录。

## 审计日志机制
所有的变更操作（`assignWorker`, `updateTaskStatus`）均已接入全局的 `AuditService`，操作者、动作类型及前后变更快照都将记录在案，便于后期排查与责任追溯。
