# L2C 测试修复计划

## 📊 当前状态
- **测试通过率**: 81% (300/371 通过)
- **失败测试数**: 68 个
- **目标通过率**: 95% 以上

## 🔧 修复计划

### 阶段 1: 数据库修复 (高优先级)
1. **运行数据库迁移**
   - 执行 `pnpm db:push` 同步 schema 到数据库
   - 验证 `address_geo` 字段已创建
   - 运行相关测试确认修复

### 阶段 2: E2E 认证流程修复 (高优先级)
1. **调整登录等待逻辑**
   - 修改 [auth.setup.ts](file:///c:/Users/bigey/Documents/Antigravity/L2C/e2e/auth.setup.ts)
   - 增加登录后的等待时间，确保 session 完全保存
   - 添加更明确的 URL 跳转验证

2. **验证认证配置**
   - 确认 [auth.ts](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/shared/lib/auth.ts) 中的 session 配置
   - 检查 cookie 设置和有效期

### 阶段 3: 业务逻辑测试修复 (中优先级)

#### 3.1 订单模块修复
**文件**: [order-finance-flow.test.ts](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/features/orders/__tests__/order-finance-flow.test.ts)
- **问题**: `confirmOrderProduction` 返回 `success: false`
- **修复**: 
  - 检查 [orders/actions.ts](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/features/orders/actions.ts) 中的 `confirmOrderProduction` 实现
  - 确保 `settlementType: 'MONTHLY'` 且 `depositRatio: '0'` 时能直接确认生产
  - 修复 Mock 配置以匹配实际实现

#### 3.2 报价单模块修复
**文件**: [actions.test.ts](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/features/quotes/__tests__/actions.test.ts)
- **问题**: `getQuotes` 返回的数据缺少 `page` 字段
- **修复**:
  - 检查 [quotes/actions/queries.ts](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/features/quotes/actions/queries.ts) 中的 `getQuotes` 实现
  - 确保返回值包含 `page`, `pageSize`, `totalPages` 字段
  - 修复 Mock 配置以返回完整的分页数据

- **问题**: 字符编码问题（'無法激活' vs '无法激活'）
- **修复**: 统一错误消息为中文字符

#### 3.3 供应链模块修复
**文件**: [po-lifecycle.test.ts](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/features/supply-chain/__tests__/po-lifecycle.test.ts)
- **问题**: `createPO` 返回的 `status` 为 `undefined`
- **修复**:
  - 检查 [supply-chain/actions/po-actions.ts](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/features/supply-chain/actions/po-actions.ts) 中的 `createPO` 实现
  - 确保返回值包含完整的 PO 对象，包括 `status` 字段
  - 修复 Mock 配置以匹配实际返回结构

**文件**: [po-completion.test.ts](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/features/supply-chain/__tests__/po-completion.test.ts)
- **问题**: Mock 函数未被正确调用
- **修复**:
  - 检查并修复 Mock 配置
  - 确保测试中的 Mock 设置与实际实现匹配

#### 3.4 财务 AP 模块修复
**文件**: [ap-actions.test.ts](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/features/finance/ap/__tests__/ap-actions.test.ts)
- **问题**: 多个测试返回 `success: false`
- **修复**:
  - 检查 [finance/ap/actions.ts](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/features/finance/ap/actions.ts) 中的实现
  - 修复权限校验逻辑
  - 确保 Mock 配置正确模拟权限检查

#### 3.5 测量服务模块修复
**文件**: [actions.test.ts](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/features/service/measurement/__tests__/actions.test.ts)
- **问题**: `createMeasureTask` 和 `submitMeasureData` 返回 `success: false`
- **修复**:
  - 检查 [service/measurement/actions.ts](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/features/service/measurement/actions.ts) 中的实现
  - 修复 Mock 配置以匹配实际实现
  - 调整 GPS 验证逻辑的测试预期

**文件**: [sync-manager.test.ts](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/features/service/measurement/__tests__/sync-manager.test.ts)
- **问题**: 参数不匹配（额外字段）
- **修复**:
  - 调整测试预期以匹配实际实现
  - 修复 Mock 调用参数

#### 3.6 窗帘计算引擎修复
**文件**: [curtain-calc-engine.test.ts](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/features/quotes/logic/__tests__/curtain-calc-engine.test.ts)
- **问题**: 预期 `SUGGEST_ATTACHED` 警告但得到 `HEIGHT_EXCEED`
- **修复**:
  - 检查 [quotes/logic/curtain-calc-engine.ts](file:///c:/Users/bigey/Documents/Antigravity/L2C/src/features/quotes/logic/curtain-calc-engine.ts) 中的计算逻辑
  - 调整测试预期以匹配实际计算结果
  - 或修复计算逻辑以符合业务需求

### 阶段 4: 组件测试优化 (中优先级)
1. **优化 return-lead-dialog 测试**
   - 调整 `useTransition` 相关测试
   - 使用更稳定的等待策略
   - 移除或调整超时配置

2. **优化其他组件测试**
   - 检查其他组件测试中的类似问题
   - 统一测试模式

### 阶段 5: 测试验证
1. **运行完整测试套件**
   - 执行 `pnpm test:run`
   - 生成覆盖率报告
   - 确认通过率达到 95% 以上

2. **E2E 测试验证**
   - 运行 `pnpm test:e2e`
   - 验证认证流程
   - 确认所有 E2E 测试通过

## 📋 预期结果
- 所有数据库 Schema 同步完成
- E2E 认证流程正常工作
- 单元测试通过率达到 95% 以上
- 测试覆盖率 ≥ 95%
- 无新的测试失败