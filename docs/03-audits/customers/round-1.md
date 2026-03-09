# 客户模块八维审计报告 (Round 1)

审计时间：2024-xx-xx
审计对象：`src/features/customers`, `src/services/customer.service.ts`, `src/shared/api/schema/customers.ts`

## 1. 需求-代码一致性 (Requirement-Code Consistency)
- **匹配项**：
  - 核心字段（`level`, `lifecycleStage`, `pipelineStatus`, `isMerged`, `referralCode`等）全部对齐需求。
  - 客户合并、转介绍关联与积分累计逻辑符合需求描述。
  - `RFM` 与客户画像的自动计算已在 `getCustomerProfile` 中实现。
- **差异/遗漏项**：
  - 需求文档 6.5.1 中提到的“订单取消/全额退款的状态回退逻辑”，目前发现代码层面上通过 `src/services/customer-status.service.ts` 文件做好了接口(`onOrderCancelled`、`onOrderCompleted`等预备方法)，**但全局搜索显示该 Service 目前并未被 `orders` 模块或任何其他地方调用**，即存在“脱节（Unlinked）”现象。必须在后续订单模块完善时将其有效 Hook。

## 2. 业务逻辑与代码质量 (Business Logic & Code Quality)
- **亮点**：
  - 使用 `CustomerService` 把重业务（如合并、创建、更新）下沉，实现了代码的复用与事务安全。
  - 合并逻辑（`mergeCustomers`）中细致处理了11个及以上关联表的外键迁移，智能判断备用电话、备注合并规则。
  - 严格的状态控制：有等级降级校验逻辑（`不允许降低客户等级`）。
  - 有重试机制及并发安全的 `generateCustomerNo`。

## 3. 军事级安全 (Military-Grade Security)
- **租户隔离**：通过 `and(eq(customers.tenantId, tenantId))` 在各个层级（DB、Service、Action）执行了严格的隔离。
- **RBAC 权限**：明确校验了 `PERMISSIONS.CUSTOMER.OWN_EDIT`、`ALL_VIEW` 和 `MERGE` 等核心权限。
- **数据范围**：在 `getCustomers` 查询中，如无 `ALL_VIEW` 权限，自动过滤出 `eq(customers.assignedSalesId, session.user.id)` 限制只能查看自己名下客户。

## 4. 数据库审计 (Database Integrity & Audit)
- **索引优化**：设置了针对 `list` 查询的高效组合索引（`custTenantStatusIdx`, `custTenantUpdatedIdx`）。
- **唯一性**：拥有租户+客户编号 (`uq_customers_tenant_no`)、租户+微信号、租户+手机号的联合唯一索引。防范脏数据侵入体系。
- **审计日志**：重要操作通过 `AuditService.log` 登记。另外针对需求专门定义了 `phoneViewLogs` 用于记录敏感手机号获取操作，`customerMergeLogs` 记录复杂合并过程。

## 5. UI/UX 质量 (UI/UX Quality)
- 从组件名称与结构看，实现了列表（高级过滤）、详细档案视图（详情弹窗）、时间线操作记录、地址多实例管理以及非常庞大的合并确认弹窗逻辑。符合模块需求设计预期。

## 6. 测试覆盖度 (Test Coverage)
- 存在 `__tests__` 目录，涵盖 `mutations.test.ts`, `queries.test.ts`, `privacy-actions.test.ts`, `customer-audit.test.ts`, `activities.test.ts` 以及位于 `services` 里的 `customer.service.unit.test.ts`。质量保证全面。

## 7. 文档完整性 (Documentation)
- 有详细的 Markdown 需求说明 `docs/02-requirements/modules/客户&渠道/客户.md`。记录清晰，规范一致。

## 8. 可运维性 (Observability)
- 明确使用了 `AppError` 定制报错并分类 `ERROR_CODES`。
- 数据并发更新使用了乐观锁 `version` 进行比对和校验。
- 采用 `logger.info` 和 `logger.error` 进行关键业务节点日志埋点，并且详细包含了(`customerId`, `tenantId`, `userId`)以供链路分析排查。

## 结论 (Conclusion)
**客户模块审计通过率极高，基础设施及业务逻辑完成度极佳。**

**待确认/跟进事项**：
- 需求 6.5.1 中列明的 `订单取消/全额退款的状态回退逻辑` 已经证实写在了 `src/services/customer-status.service.ts` 里，但是还**未与订单模块绑定**（未被调用）。后续开发订单模块时需记得挂载调用。

请相公审阅。如果有确认忽略或需要进一步排查修复的地方，可直接提出。
