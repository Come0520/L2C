# 实施计划

## 1. 统一ESLint规则入口

### 目标
将 `npm run lint` 切换为 ESLint CLI，统一规则入口，保留 `lint:eslint` 作为主脚本。

### 实施步骤
1. 修改 `package.json` 中的 `lint` 脚本，将其指向 `lint:eslint`
2. 确保 `.eslintrc.js` 配置正确，包含所有必要的规则
3. 运行 `npm run lint` 验证配置是否正常工作

## 2. 提升测试覆盖率至关键路径 ≥30%

### 目标
新增认证流、线索标签 API 路由与订单状态管理的单元与集成测试，提升测试覆盖率。

### 实施步骤

#### 2.1 认证流测试
- 创建 `src/features/auth/__tests__/auth-context.test.tsx` - 测试认证上下文
- 创建 `src/services/__tests__/auth-client.test.ts` - 测试认证服务
- 创建 `src/contexts/__tests__/auth-context.test.tsx` - 测试认证上下文

#### 2.2 线索标签 API 路由测试
- 创建 `src/services/__tests__/leads-tags.test.ts` - 测试线索标签服务
- 创建 `src/features/leads/components/__tests__/tags-input.test.tsx` - 测试标签输入组件

#### 2.3 订单状态管理测试
- 创建 `src/features/orders/__tests__/actions.test.ts` - 测试订单操作
- 创建 `src/features/orders/components/__tests__/status-badge.test.tsx` - 测试状态徽章组件
- 创建 `src/features/orders/components/__tests__/status-timeline.test.tsx` - 测试状态时间线组件

#### 2.4 其他关键路径测试
- 创建 `src/middleware.test.ts` - 测试中间件
- 创建 `src/hooks/__tests__/useLeads.test.ts` - 测试线索 hooks
- 创建 `src/hooks/__tests__/useSalesOrders.test.ts` - 测试销售订单 hooks

## 3. 引入关键页面的渲染测试与可访问性检查

### 目标
引入关键页面的渲染测试与可访问性检查，配合 `lhci:autorun` 本地校验。

### 实施步骤

#### 3.1 关键页面渲染测试
- 创建 `src/app/__tests__/dashboard.test.tsx` - 测试仪表板页面
- 创建 `src/app/__tests__/login.test.tsx` - 测试登录页面
- 创建 `src/app/__tests__/leads.test.tsx` - 测试线索页面
- 创建 `src/app/__tests__/orders.test.tsx` - 测试订单页面

#### 3.2 可访问性检查配置
- 安装 `@testing-library/jest-dom` 扩展，支持可访问性断言
- 在测试文件中添加可访问性检查
- 配置 `lhci:autorun` 脚本，确保在本地开发时运行可访问性检查

#### 3.3 配置文件更新
- 更新 `vitest.config.ts`，确保测试覆盖率统计包含关键路径
- 更新 `.eslintrc.js`，添加可访问性相关规则

## 4. 验证与优化

### 目标
验证所有配置和测试是否正常工作，并进行必要的优化。

### 实施步骤
1. 运行 `npm run test:coverage` 检查测试覆盖率
2. 运行 `npm run lint` 检查代码质量
3. 运行 `npm run lhci:autorun` 检查可访问性
4. 根据测试结果，优化测试用例和代码
5. 确保测试覆盖率达到关键路径 ≥30% 的目标

## 预期结果

1. **ESLint 统一**：`npm run lint` 使用 ESLint CLI，规则统一
2. **测试覆盖率提升**：关键路径测试覆盖率达到 ≥30%
3. **可访问性检查**：关键页面通过可访问性检查
4. **代码质量提升**：通过统一的 ESLint 规则和测试，提升代码质量

## 风险评估

1. **测试复杂度**：新增测试用例可能增加维护成本
2. **覆盖率目标**：部分关键路径可能难以测试，需要优先覆盖核心功能
3. **可访问性问题**：现有页面可能存在可访问性问题，需要逐步修复

## 实施顺序

1. 统一 ESLint 规则入口
2. 配置测试环境和覆盖率统计
3. 新增认证流测试
4. 新增线索标签 API 路由测试
5. 新增订单状态管理测试
6. 新增关键页面渲染测试
7. 引入可访问性检查
8. 验证与优化

## 工具和依赖

- **测试框架**：Vitest + React Testing Library
- **可访问性工具**：Lighthouse CI + jest-axe
- **代码质量工具**：ESLint + Prettier + Stylelint

## 成功指标

1. **ESLint 运行正常**：`npm run lint` 无错误
2. **测试覆盖率**：关键路径测试覆盖率 ≥30%
3. **可访问性得分**：关键页面 Lighthouse 可访问性得分 ≥90
4. **测试通过率**：所有测试用例通过
5. **构建成功**：`npm run build` 成功