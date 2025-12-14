## Dashboard 重构计划

### **问题 1: 组件复用性低**
- **现状**: `LinearStatsCard`, `LinearActivityItem`, `LinearTaskItem` 都定义在 `page.tsx` 文件内部
- **影响**: `page.tsx` 文件臃肿，组件无法在其他页面复用
- **解决方案**: 将这些组件提取到独立的 `features/dashboard/components/` 文件夹

### **问题 2: SpotlightCard 组件使用问题**
- **现状**: 使用了 `<SpotlightCard.Header>` 和 `<SpotlightCard.Content>`，但可能不支持这种复合组件模式
- **解决方案**: 检查并调整 SpotlightCard 组件的使用方式

### **问题 3: use client 滥用**
- **现状**: 整个页面都标记为客户端组件
- **影响**: 增加客户端 bundle 体积，影响性能
- **解决方案**: 仅将交互性组件标记为客户端组件，优化性能

### **问题 4: 图标映射的类型安全性**
- **现状**: `IconMap[stat.icon]` 写法在 TypeScript 中不安全
- **解决方案**: 定义明确的 `IconName` 类型，提高类型安全性

### **实施步骤**
1. **创建组件文件**：
   - `stats-card.tsx` - 提取 LinearStatsCard 组件
   - `activity-item.tsx` - 提取 LinearActivityItem 组件
   - `activity-list.tsx` - 活动列表组件
   - `task-item.tsx` - 提取 LinearTaskItem 组件
   - `task-list.tsx` - 任务列表组件

2. **更新 useDashboard Hook**：
   - 确保 stats、activities 和 tasks 的类型正确
   - 改进图标类型安全性

3. **重构 Dashboard 页面**：
   - 移除内联组件定义
   - 导入并使用提取的组件
   - 优化客户端/服务器组件边界
   - 修复 SpotlightCard 使用方式

4. **验证类型安全性**：
   - 运行类型检查确保所有 TypeScript 错误已解决
   - 改进图标映射的类型安全性

### **预期结果**
- 减小 `page.tsx` 文件大小
- 提高组件复用性
- 通过优化客户端组件提升性能
- 增强 TypeScript 类型安全性
- 遵循功能驱动架构，代码组织更清晰

### **修改文件**
- `src/app/dashboard/page.tsx` - 主仪表板页面
- `src/features/dashboard/hooks/useDashboard.ts` - 仪表板数据钩子

### **创建文件**
- `src/features/dashboard/components/stats-card.tsx`
- `src/features/dashboard/components/activity-item.tsx`
- `src/features/dashboard/components/activity-list.tsx`
- `src/features/dashboard/components/task-item.tsx`
- `src/features/dashboard/components/task-list.tsx`