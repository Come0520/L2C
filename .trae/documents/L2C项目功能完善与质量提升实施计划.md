# L2C项目功能完善与质量提升实施计划

## 4.1 代码质量与清理 (P0)

### 4.1.1 修复类型安全问题
- **目标**：移除 `orders/status/[status]/page.tsx` 中的 `any` 类型转换
- **措施**：
  - 将第138行的 `const response = rawResponse as any` 替换为自动生成的 Supabase 类型
  - 将第174行的 `(ordersData as unknown as Array<OrderWithMeasurement>)` 替换为正确的类型转换
  - 将第239行、246行、256行、262行、276行、295行的 `any` 类型转换替换为正确的类型
  - 检查并修复其他文件中的 FIXME 标记

### 4.1.2 代码库清洁
- **目标**：清理冗余文件和目录
- **措施**：
  - 检查根目录和项目中是否存在 `node_modules_backup` 等冗余目录
  - 使用 `depcheck` 或 `knip` 检查并清理未使用的依赖和文件

## 4.2 核心功能补全 (P1)

### 4.2.1 报价单号映射逻辑修复
- **目标**：修复 `quote_no` 映射逻辑
- **措施**：
  - 修改 `quotes.client.ts` 中 `mapDbToQuoteVersion` 函数第88行
  - 确保报价单号正确从父级quote传递到版本，而不是使用 `Q${row.quote_id.substring(0, 8)}` 这样的降级方案

### 4.2.2 通知中心"标记已读"功能
- **目标**：实现通知的单条和批量标记已读功能
- **措施**：
  - 完善 `NotificationsView.tsx` 中的 `handleMarkAsRead` 函数
  - 添加批量标记已读按钮和逻辑
  - 实现通知状态的更新机制

### 4.2.3 测量任务重新分配逻辑
- **目标**：完善测量任务的重新分配功能
- **措施**：
  - 检查 `measuring-pending-visit-view.tsx` 中的重新分配逻辑
  - 确保 `measurementService.requestReassign` 函数正确实现
  - 测试重新分配流程是否能正常工作

## 4.3 架构优化 (P2)

### 4.3.1 Auth服务重构
- **目标**：将 `auth-context.tsx` 中的分散逻辑迁移至 `authService` 统一管理
- **措施**：
  - 检查 `auth-context.tsx` 中的逻辑
  - 创建或完善 `authService` 服务
  - 将认证相关逻辑迁移到 `authService` 中
  - 更新 `auth-context.tsx` 以使用 `authService`

### 4.3.2 性能监控
- **目标**：监控关键资源大小，防止首屏Payload过大
- **措施**：
  - 实现 `zh-CN.json` 文件大小监控脚本
  - 在CI流程中添加资源大小检查
  - 优化 `orders/route.ts` 中的 RPC 调用，减少瀑布流请求

## 实施顺序

1. **修复类型安全问题** (1天)
2. **修复报价单号映射逻辑** (半天)
3. **实现通知中心标记已读功能** (半天)
4. **完善测量任务重新分配逻辑** (半天)
5. **Auth服务重构** (1天)
6. **实现性能监控** (1天)
7. **代码库清洁** (半天)

## 预期成果

- 代码中不再存在 `any` 类型强制转换
- 核心功能完整，包括报价单号映射、通知标记已读和测量任务重新分配
- 架构更清晰，认证逻辑统一管理
- 性能监控到位，防止首屏Payload过大
- 代码库清洁，无冗余文件和依赖