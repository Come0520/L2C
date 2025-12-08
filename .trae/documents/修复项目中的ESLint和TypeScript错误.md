## 修复计划

### 1. 修复构建错误
- **问题**：API路由类型错误 `src/app/api/slides/[id]/route.ts`
- **修复方案**：修正GET函数的参数类型，确保符合Next.js 15的要求

### 2. 修复TypeScript类型错误
- **问题**：缺少supabase导出 `src/hooks/useRealtimeMeasurement.ts` 等多个文件
- **修复方案**：检查并修复 `@/lib/supabase/client` 的导出配置

- **问题**：对象属性访问错误 `src/services/installation-customer-feedback.client.ts`
- **修复方案**：修正属性访问路径，确保访问正确的对象属性

- **问题**：缺少类型参数 `src/hooks/useRealtimeMeasurement.ts`
- **修复方案**：为useRef添加初始值参数

- **问题**：未定义的属性 `src/services/installation-quality-check.client.ts`
- **修复方案**：修正方法调用，使用正确的方法名

### 3. 修复ESLint错误
- **问题**：未使用的变量和导入
  - `src/hooks/useMeasurementTemplates.ts` 中的 `MeasurementTemplateFilters`
  - `src/middleware.ts` 中的 `requiredPermissions`
  - 多个服务文件中的未使用变量
- **修复方案**：删除或注释掉未使用的变量和导入

- **问题**：缺少依赖项的useEffect
  - 多个组件中的useEffect依赖项缺失
- **修复方案**：添加缺失的依赖项或使用eslint-disable注释

- **问题**：不允许使用require()
  - `src/features/orders/components/survey-pending-visit-view.tsx`
- **修复方案**：将require()替换为import语句

- **问题**：在非React组件中使用React Hook
  - `src/hooks/useMeasurementTemplates.ts`
- **修复方案**：修正函数命名或重构代码结构

### 4. 修复其他常见问题
- **问题**：意外的console语句
  - 多个文件中存在console.log
- **修复方案**：删除或替换为正式的日志记录

- **问题**：未指定类型的any
  - 大量文件中使用了any类型
- **修复方案**：为any类型添加具体的类型定义

### 修复策略
1. 优先修复导致构建失败的错误
2. 按模块逐个修复，确保每个模块的TypeScript类型正确
3. 最后修复ESLint代码质量问题
4. 重点关注核心功能模块，如hooks、services和关键组件
5. 对于大量重复的错误，考虑使用批量修复工具或脚本

### 预期结果
- 项目能够成功构建
- TypeScript类型检查通过
- ESLint错误数量显著减少
- 代码质量得到提升，符合项目规范