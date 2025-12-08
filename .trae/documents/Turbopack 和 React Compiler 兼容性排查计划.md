# Turbopack 和 React Compiler 兼容性排查计划

## 1. 项目现状分析

- **Next.js 版本**：^15.0.0
- **React Compiler**：已在 `next.config.js` 中启用 `experimental: { reactCompiler: true }`
- **Turbopack**：已在 `package.json` dev 脚本中使用 `--turbo` 标志
- **React 版本**：^19.0.0
- **主要依赖**：使用了 App Router、TanStack Query、Framer Motion 等

## 2. 潜在兼容性问题排查

### 2.1 React Compiler 兼容性检查

**重点检查以下代码模式**：

- ✅ `React.forwardRef` - 已在多个 UI 组件中使用
- ✅ `React.cloneElement` - 已在 `paper-tabs.tsx` 中使用
- ✅ `React.Children` - 已在 `paper-tabs.tsx` 中使用
- ✅ `useMemo`/`useCallback` - 广泛使用
- ✅ 自定义 Hooks - 多个自定义 Hooks
- ✅ 第三方库集成 - 特别是 Framer Motion、TanStack Query

### 2.2 Turbopack 兼容性检查

**重点检查以下配置**：

- ✅ 没有自定义 Webpack 配置
- ✅ 使用了标准的 Next.js App Router
- ✅ 依赖项版本较新

## 3. 实施步骤

### 3.1 运行现有测试

```bash
npm run test:ci  # 运行所有单元测试
npm run build    # 测试构建过程
npm run dev      # 测试开发服务器
```

### 3.2 检查控制台警告和错误

- 启动开发服务器后检查浏览器控制台
- 检查构建过程中的警告和错误
- 检查 React Compiler 特定的警告

### 3.3 优化代码以充分利用 React Compiler

**优化建议**：

1. **移除不必要的 `useMemo`/`useCallback`**：React Compiler 会自动优化，手动使用可能反而影响性能
2. **优化自定义 Hooks**：确保 Hooks 遵循 React 规则，避免复杂的依赖关系
3. **简化组件结构**：减少组件嵌套层级，提高 React Compiler 优化效率
4. **检查第三方库兼容性**：特别是 Framer Motion，确保使用兼容版本

### 3.4 测试核心功能

**重点测试页面**：

- 仪表板 (`/dashboard`)
- 编辑器 (`/editor/[id]`)
- 订单管理 (`/orders`)
- 客户管理 (`/customers`)
- 演示页面 (`/demo`)

### 3.5 性能测试

**使用 Lighthouse 进行性能测试**：

```bash
npm run lhci:autorun
```

## 4. 预期结果

- ✅ 开发服务器正常启动，无严重错误
- ✅ 构建过程成功，无严重错误
- ✅ 所有单元测试通过
- ✅ 核心功能正常工作
- ✅ 性能指标不低于当前水平

## 5. 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| React Compiler 兼容性问题 | 构建失败或运行时错误 | 逐步迁移，先在非核心页面测试 |
| Turbopack 构建问题 | 开发体验下降 | 保留回退到 Webpack 的选项 |
| 第三方库不兼容 | 功能失效 | 检查库的兼容性，考虑替代方案 |
| 性能回归 | 用户体验下降 | 进行详细的性能测试，优化代码 |

## 6. 后续优化建议

1. **逐步迁移**：先在非核心页面启用 React Compiler，验证后再全面推广
2. **更新依赖**：确保所有依赖项都兼容 React Compiler 和 Turbopack
3. **优化代码结构**：遵循 React Compiler 最佳实践，提高代码可优化性
4. **监控性能**：定期进行性能测试，确保 React Compiler 带来的性能提升
5. **培训团队**：让开发团队了解 React Compiler 最佳实践，编写可优化的代码