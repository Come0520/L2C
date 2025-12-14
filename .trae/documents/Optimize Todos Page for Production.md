## 优化计划：实现类型强校验和 TanStack Query 数据获取

### 1. 类型强校验 (TypeScript Hardening)
- 从 `PaperBadge` 组件导入 `PaperBadgeProps` 类型
- 为 `STATUS_CONFIG` 和 `PRIORITY_CONFIG` 添加显式类型注解，确保 `variant` 属性只能是组件支持的值
- 利用 TypeScript 的类型检查和自动补全功能，避免拼写错误

### 2. 数据获取策略 (Data Fetching with TanStack Query)
- 创建一个模拟的 API 调用函数 `fetchTodos`
- 使用 `useQuery` 替代静态 `MOCK_TODOS` 数据
- 实现数据获取、缓存和更新逻辑
- 添加加载状态和错误处理

### 3. 代码结构优化
- 保持组件内部逻辑清晰
- 分离数据获取和 UI 渲染
- 遵循 Next.js 15 最佳实践

### 实施步骤
1. 修改 `todos/page.tsx` 文件，添加 `PaperBadgeProps` 导入
2. 为配置对象添加显式类型注解
3. 创建模拟 API 调用函数
4. 集成 `useQuery` 进行数据获取
5. 添加加载状态和错误处理
6. 测试代码功能和类型检查

### 预期成果
- 类型安全的配置对象，避免 variant 属性的拼写错误
- 基于 TanStack Query 的高效数据获取，支持缓存和自动更新
- 良好的用户体验，包括加载状态和错误处理
- 符合 Next.js 15 最佳实践的代码结构

### 依赖情况
- 项目已安装 `@tanstack/react-query` (v5.0.0) 和 `@tanstack/react-query-devtools` (v5.0.0)
- 无需额外安装依赖

### 文件修改
- `/Users/laichangcheng/Documents/文稿 - 来长城的MacBook Air/trae/L2C/slideboard-frontend/src/app/dashboard/todos/page.tsx`