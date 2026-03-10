# Customers 模块审计报告

## 审计基本信息
- **审计模块**: customers (客户管理)
- **审计时间**: 2026-03-10
- **审计人**: AI Agent
- **总体评价**: 优秀 (0 缺陷)

## 审计通过亮点 (Good Practices)

1. **严格的租户隔离机制 (D3)**:
   - 所有查询和更新操作 (`getCustomers`, `getCustomerDetail`, `CustomerService` 等) 都严格要求传入并检查 `tenantId`，确保零越权。
   - `mergeCustomers` 合并逻辑中不仅检查了合并请求者的 `tenantId`，甚至过滤了被合并的 ID 是否都属于当前租户 (`where: and(inArray(customers.id, mergedIds), eq(customers.tenantId, tenantId))`)，极大地保证了隔离安全。

2. **完善的高并发与 TOCTOU 防护 (D5/D6)**:
   - 在所有的更新操作 (`updateCustomer`, `addCustomerAddress`, `updateCustomerAddress`, `setDefaultAddress`) 都贯彻了传入 `version` 的乐观锁机制，有效防止用户重复提交和并发修改数据冲突。
   - 在数据合并迁移等大型事务中不仅使用了 `version` 检查，合并前还检查了 `isMerged` 和 `deletedAt` 标志位，确保状态一致性。

3. **分页与性能治理 (D4)**:
   - 客户列表接口使用了 `Math.min(pageSize, 100)` 来防止任意大量拉取数据的攻击。
   - 涉及到关联数据的子查询（如转介绍记录 `referrals` 和活动记录 `customerActivities`）都主动加上了 `limit: 50` 限制。
   - `getCustomerProfile` 中的订单统计优化了并发请求，缩短了响应时间。

4. **审计与合规 (D3/D7)**:
   - 对敏感信息（手机号）单独记录访问日志 `logPhoneView`。
   - 日常的所有更新 (`UPDATE`, `CREATE`, `DELETE`, `MERGE`) 均调用 `AuditService.log` 进行留痕。
   - 所有接口权限配置正确，细化到了 `CUSTOMER.OWN_EDIT`, `CUSTOMER.MERGE`，逻辑严密。

## 缺陷记录 (Problems)

**暂无发现任何 P0 / P1 / P2 级别缺陷。**

模块状态健康，可以直接进入发布验证环节。
