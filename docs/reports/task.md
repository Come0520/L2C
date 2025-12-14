# L2C 功能模块完善任务清单

> **当前阶段**: 订单管理完善 (95% → 98%)  
> **优先级**: P0  
> **预计工作量**: 3-5天

---

## ✅ Day 1: 状态流转完善 (已完成)

### [x] 任务 1.1: 补充订单状态流转边界情况处理
- [x] 创建数据库迁移 `20251212000005_orders_status_edge_cases.sql`
  - [x] 乐观锁机制（version字段）
  - [x] update_order_status_v2（字段验证）
  - [x] cancel_order（自动回滚）
  - [x] batch_update_order_status_v2（事务保护）
  - [x] 异常恢复路径增强
  - [x] 辅助函数（is_valid_status_transition, get_allowed_next_statuses）
- [x] 更新 `salesOrders.client.ts`
  - [x] 新增5个增强方法

### [x] 任务 1.2: 添加状态流转审计日志
- [x] 创建数据库迁移 `20251212000006_orders_audit_log_enhanced.sql`
  - [x] 审计表增强（新增4字段）
  - [x] 增强审计trigger
  - [x] 4个审计查询函数
  - [x] 审计日志视图
- [x] 更新 `salesOrders.client.ts`
  - [x] 新增4个审计查询方法

### [ ] TODO: 单元测试
- [ ] approval.client.test.ts（已修改，待运行）
- [ ] assignment.client.test.ts（已修改，待运行）
- [ ] 编写 salesOrders status 相关测试

**Day 1 完成时间**: 2025-12-12 22:40  
**总代码量**: ~700行（SQL + TypeScript）

---

## 🔄 Day 2-3: 批量操作功能 (进行中 67%)

### [x] 任务 2.1: 批量分配销售人员
- [x] 数据库函数: `batch_assign_sales_person`
  - 验证用户权限
  - 批量更新订单的销售人员
  - 记录分配历史
- [x] 前端服务: `batchAssignSalesPerson`
- [ ] UI组件: `BulkAssignSalesModal`

### [ ] 任务 2.2: 批量修改订单状态（增强）
- [ ] UI组件: `BulkStatusChangeModal`
  - 显示允许的状态选项
  - 实时验证转换规则
  - 显示预计影响的订单数

### [x] 任务 2.3: 批量导出订单数据
- [x] Edge Function: `export-orders`
  - CSV格式导出 (支持UTF-8 BOM)
  - 上传到Supabase Storage
  - 生成签名下载URL
  - [ ] Excel格式 (TODO)
  - [ ] PDF格式 (TODO)
- [x] 前端服务: `exportOrders`
- [ ] UI组件: `BulkExportModal`

### [ ] 任务 2.4: 批量操作进度提示
- [ ] UI组件: `BulkOperationProgress`
  - 进度条显示
  - 成功/失败统计
  - 详细错误列表
  - 取消操作支持
  - 失败重试功能
  - 设计方案已完成 (基于shadcn/ui + Aceternity UI)

---

## 📅 Day 4-5: 审批超时处理

### [ ] 任务 3.1: 配置审批超时时间
- [ ] 数据库表: `approval_timeout_config`
- [ ] 审批类型超时配置UI

### [ ] 任务 3.2: 超时自动升级机制
- [ ] Edge Function: `approval-timeout-handler`
- [ ] 超时检测定时任务
- [ ] 自动升级逻辑

### [ ] 任务 3.3: 超时通知提醒
- [ ] 通知模板配置
- [ ] 邮件/站内信发送

---

## 📊 进度追踪

- [x] Day 1: 状态流转完善 (100%)
- [ ] Day 2-3: 批量操作功能 (0%)  
- [ ] Day 4-5: 审批超时处理 (0%)

**总体完成度**: 33% (1/3 阶段)
`installation-team.client.test.ts` (团队管理测试，26.4KB)
- [ ] 创建 `installation.client.test.ts` (安装客户端测试)

### 其他核心服务
- [ ] 创建 `permissions.client.test.ts` (权限服务测试)
- [ ] 创建 `reconciliation.client.test.ts` (对账服务测试，6.0KB)

### 用户与团队服务
- [ ] 创建 `users.client.test.ts` (用户服务测试)
- [ ] 创建 `teams.client.test.ts` (团队管理测试)
- [ ] 创建 `slides.client.test.ts` (幻灯片测试)

## 阶段二: Server-side 服务测试 (2天)

### 核心Server服务
- [ ] 创建 `customers.server.test.ts` (客户服务端测试，3.7KB)
- [ ] 创建 `products.server.test.ts` (产品服务端测试，3.3KB)
- [ ] 创建 `salesOrders.server.test.ts` (订单服务端测试，5.0KB)

### 服务管理Server
- [ ] 创建 `installation.server.test.ts` (安装服务端测试，2.4KB)
- [ ] 创建 `measurement.server.test.ts` (测量服务端测试，2.3KB)
- [ ] 创建 `teams.server.test.ts` (团队服务端测试，3.0KB)

## 阶段三: E2E测试与工具优化 (3-4天)

### 核心业务流程E2E
- [ ] 创建 `e2e/lead-to-quote.spec.ts` (线索→报价流程)
- [ ] 创建 `e2e/quote-to-order.spec.ts` (报价→订单流程)
- [ ] 创建 `e2e/order-to-measurement.spec.ts` (订单→测量流程)
- [ ] 创建 `e2e/measurement-to-installation.spec.ts` (测量→安装流程)
- [ ] 创建 `e2e/installation-to-reconciliation.spec.ts` (安装→对账流程)
- [ ] 创建 `e2e/user-permissions.spec.ts` (权限测试)
- [ ] 创建 `e2e/points-system.spec.ts` (积分系统测试)
- [ ] 创建 `e2e/share-workflow.spec.ts` (分享流程测试)
- [ ] 创建 `e2e/approval-workflow.spec.ts` (审批流程测试)
- [ ] 创建 `e2e/batch-operations.spec.ts` (批量操作测试)

### 测试工具优化
- [ ] 优化 `vitest.config.ts` (添加覆盖率阈值)
- [ ] 创建 `src/test-utils/mockSupabase.ts` (Mock工具)
- [ ] 创建 `src/test-utils/testFixtures.ts` (测试数据)
- [ ] 创建 `src/test-utils/testHelpers.ts` (辅助函数)

### 测试数据生成器
- [ ] 创建 `src/test-utils/factories/leadFactory.ts`
- [ ] 创建 `src/test-utils/factories/orderFactory.ts`
- [ ] 创建 `src/test-utils/factories/userFactory.ts`

### CI/CD与文档
- [ ] 配置 `.github/workflows/test.yml`
- [ ] README添加测试徽章
- [ ] 创建 `docs/testing-guide.md`

## 验收标准
- [ ] 总体覆盖率 ≥ 80%
- [ ] 核心服务(P0)覆盖率 ≥ 85%
- [ ] 所有测试通过 `npm run test`
- [ ] E2E测试通过 `npm run e2e`
- [ ] CI测试流水线正常运行
