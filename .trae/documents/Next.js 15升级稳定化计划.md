# Next.js 15升级稳定化计划

## 1. 计划概述

本计划旨在稳定当前Next.js 15升级，修复构建问题，确保核心功能正常工作，并为后续Tailwind CSS v4升级做准备。

## 2. 稳定Next.js 15升级

### 2.1 修复构建问题

#### 2.1.1 分析Server Components错误
- 定位错误源：`src/lib/supabase/server.ts`中使用了`next/headers`，但被Client Component调用
- 分析依赖链：`server.ts` → `salesOrders.ts` → `useOrderPersistence.ts` → `order-create-view.tsx` → `create/page.tsx`
- 确定问题类型：Server Component被Client Component错误引用

#### 2.1.2 修复方案
- 将`server.ts`中的Supabase客户端创建逻辑拆分为Server和Client两部分
- 确保Server-only功能只在Server Components中使用
- 为Client Components提供专门的Supabase客户端创建函数
- 调整组件结构，确保Server Components和Client Components的正确使用

#### 2.1.3 实施步骤
1. 创建`src/lib/supabase/client.ts`，专门用于Client Components
2. 修改`src/lib/supabase/server.ts`，确保只在Server Components中使用
3. 更新`src/services/salesOrders.ts`，根据使用场景选择合适的客户端
4. 修改`src/hooks/useOrderPersistence.ts`，使用Client端Supabase客户端
5. 测试修复后的构建过程

### 2.2 核心功能测试

#### 2.2.1 测试范围
- 首页访问
- 线索管理页面
- 订单管理页面
- 表单提交功能
- API路由
- 导航和路由功能
- 响应式设计

#### 2.2.2 测试方法
- 手动测试核心功能
- 运行现有测试脚本（如果有）
- 使用浏览器开发者工具检查性能
- 测试不同浏览器和设备

#### 2.2.3 测试标准
- 页面可以正常加载
- 功能可以正常使用
- 没有明显的性能问题
- 响应式设计正常工作

### 2.3 优化依赖配置

#### 2.3.1 依赖检查
- 检查所有依赖的版本兼容性
- 更新可能存在安全漏洞的依赖
- 确保依赖版本的一致性

#### 2.3.2 移除legacy标志
- 等待Next.js 15和React 19稳定后，移除`--legacy-peer-deps`标志
- 测试不使用该标志时的安装过程
- 确保依赖安装正常

## 3. 准备后续Tailwind CSS v4升级

### 3.1 收集信息和评估影响

#### 3.1.1 文档收集
- 收集Tailwind CSS v4的详细文档
- 收集迁移指南和最佳实践
- 收集配置示例

#### 3.1.2 影响评估
- 评估项目中Tailwind CSS的使用情况
- 分析升级可能带来的影响范围
- 确定需要修改的文件和组件

### 3.2 准备测试环境

#### 3.2.1 分支管理
- 创建专门的测试分支用于Tailwind CSS v4升级
- 确保测试分支与主分支保持同步

#### 3.2.2 测试用例准备
- 准备核心功能测试用例
- 准备样式测试用例
- 准备响应式设计测试用例

### 3.3 文档准备

#### 3.3.1 文档模板
- 准备Tailwind CSS v4升级的文档模板
- 收集需要更新的文档列表
- 准备升级后的配置示例

## 4. 项目日常维护和优化

### 4.1 常规bug修复
- 修复用户反馈的bug
- 解决升级过程中发现的问题
- 优化现有功能

### 4.2 安全更新
- 定期更新依赖，修复安全漏洞
- 检查并更新安全配置
- 确保项目符合安全最佳实践

### 4.3 性能监控和优化
- 监控生产环境的性能指标
- 定期进行性能分析和优化
- 优化数据库查询和API调用

## 5. 计划执行顺序

1. 修复Server Components构建问题（高优先级）
2. 验证构建修复效果（高优先级）
3. 核心功能测试（高优先级）
4. 优化依赖配置（中优先级）
5. 收集Tailwind CSS v4信息（中优先级）
6. 准备Tailwind CSS v4测试环境（中优先级）
7. 常规bug修复和安全更新（持续进行）
8. 性能监控和优化（持续进行）

## 6. 成功标准

- ✅ 生产构建可以正常进行
- ✅ 核心功能正常工作
- ✅ 没有明显的性能问题
- ✅ 依赖配置优化完成
- ✅ Tailwind CSS v4升级准备工作完成

## 7. 风险和应对措施

### 7.1 构建问题无法修复
- 应对措施：回滚到Next.js 14，重新评估升级方案

### 7.2 核心功能测试失败
- 应对措施：修复测试中发现的问题，确保功能正常

### 7.3 依赖兼容性问题
- 应对措施：使用兼容版本的依赖，或等待依赖更新

### 7.4 Tailwind CSS v4升级难度超出预期
- 应对措施：调整升级计划，分阶段进行升级

## 8. 后续计划

- 完成Next.js 15升级稳定化后，制定详细的Tailwind CSS v4升级计划
- 定期回顾和更新计划，确保符合项目需求
- 持续优化项目性能和代码质量