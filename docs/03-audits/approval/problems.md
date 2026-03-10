# approval 模块审计问题报告

> 审计时间：2026-03-10
> 审计人：Agent
> 模块路径：src/features/approval

---

## 📊 总览

| 级别 | 数量 |
|:---:|:---:|
| 🔴 P0 — 安全/数据（必须立即修复） | 3 |
| 🟠 P1 — 质量/性能（应当修复） | 3 |
| 🟡 P2 — 规范/UX（建议改进） | 3 |
| **合计** | **9** |

---

## 🔴 P0 — 必须立即修复

- [x] [D3-P0-1] `actions/flow.ts:14-43` — `createApprovalFlow`（以及 `saveFlowDefinition`、`publishApprovalFlow`）使用 `createSafeAction` 包裹，里面**没有 `checkPermission` 权限校验**，仅校验了登录状态（session 存在）。任何已登录用户均可创建/修改/发布审批流程，绕过 SETTINGS.MANAGE 权限控制

- [x] [D3-006-R3] `actions/processing.ts:119` — `_processApprovalLogic` 中更新 `approvalTasks` 状态的 UPDATE 语句 **WHERE 子句只用 `eq(approvalTasks.id, payload.taskId)`**，缺少 `tenantId` 过滤（TOCTOU D3-006 第 3 次复现） ✅ 已修复(2026-03-10)。前置 findFirst（第58-70行）已通过 `and(eq, eq tenantId)` 验证，但实际写库时无 tenantId 防护

- [x] [D3-P0-3] `actions/submission.ts:67-68` — `submitApproval` **接受外部传入的 `tenantId` 和 `requesterId`**：`const tenantId = payload.tenantId || session?.user?.tenantId`。当此函数被内部（跨模块组合调用，如 `leads/restore.ts`）以 `externalTx` 形式调用时，调用方可注入任意 tenantId，使审批实例创建在非当前用户所属租户下，导致跨租户审批实例污染

---

## 🟠 P1 — 应当修复

- [x] [D4-P1-1] `actions/processing.ts:263-264` — 确定后续节点的审批人时，`allTenantUsers` 查询**加载全租户所有活跃用户**（无 LIMIT），然后在 JS 层做角色过滤（`findApproversByRole`）。大租户（500+ 用户）下会造成单次查询大量数据传输，建议改为 DB 层过滤（在 SQL WHERE 中加角色条件）

- [x] [D4-P1-2] `actions/flow.ts:141` — `publishApprovalFlow` 中 `UPDATE approvalFlows` 的 WHERE 子句为 `eq(approvalFlows.id, flowId)`，**缺少 tenantId**（D3-006 同类，但因有前置校验降为 P1）；`DELETE approvalNodes` 已正确使用 `and(flowId, tenantId)`，两条语句不一致，形成漏洞

- [x] [D4-P1-3] `actions/revoke.ts:88` — 发起人撤回时，`UPDATE approvals SET status=CANCELED` 的 WHERE 子句为 `eq(approvals.id, approvalId)`，**缺少 tenantId 防护**（D3-006 同类），同 flow.ts 的问题

---

## 🟡 P2 — 建议改进

- [x] [D2-P2-1] `actions/flow.ts:101` — 发布前校验 `nodes.length < 2` 的注释说"至少需要 Start 和 End"，**逻辑理解有歧义**：图中 Start/End 是画板节点，扁平化后不一定产生 approvalNode 记录；建议改为验证 `flatNodes.length < 1`（至少需要1个真实审批节点）

- [x] [D6-P2-1] 5个测试文件，但测试用例**未覆盖跨租户注入场景**（D3-P0-1/3），也无测试覆盖审批人 MAJORITY 模式的平局场景（total 为偶数时 `Math.ceil(total/2)` 边界值）

- [x] [D8-P2-2] `actions/flow.ts` — `createApprovalFlow`、`saveFlowDefinition` 和 `publishApprovalFlow` 操作都**缺少 AuditService.log 审计日志记录**。作为核心的审批流定义管理操作，其变更必须被完整审计追踪，且相关操作及审计应包含在同一个 DB 事务内。


---

## 🔖 收尾检查单 C-1~C-4

### C-1 复现记录
- D3-006（TOCTOU）在 `processing.ts:119`、`flow.ts:141`、`revoke.ts:88` 均复现 → 追加 `approval (2026-03-10)` 到 D3-006 复现记录

### C-2 新类型
- 无新类型

---

## ✅ 表现良好项（无需修复）

- **D3 并发安全**：`_processApprovalLogic` 使用 `SELECT id FOR UPDATE` 行级锁防并发，是全项目唯一使用数据库锁的场景，架构先进
- **D3 递归保护**：`MAX_AUTO_APPROVE_DEPTH = 10` 限制自动审批递归层数，防止死循环
- **D8 通知解耦**：审批通知在事务提交后异步发送（`import(...).then`），避免通知失败导致事务回滚
- **D5 撤回时效**：发起人 24 小时 + 审批人 30 分钟双重撤回时效控制，业务逻辑严谨
- **D6 撤回安全**：审批人撤回前检查后续节点是否已产生操作，防止撕裂审批链
- **D2 代理委托**：`ApprovalDelegationService.getEffectiveApprover` 完整支持审批代理（请假委托给他人），架构设计优秀
- **D7 Zod 全覆盖**：`submitApprovalSchema`、`processApprovalSchema`、`addApproverSchema`、`revokeApprovalSchema` 全部有 Zod 校验
- **D8 审计链路**：每个操作（提交、通过、拒绝、流程通过/驳回、撤回、加签）均有独立 `AuditService.log` 记录
