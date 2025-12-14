## 修复计划

### 1. 修复Tailwind动态类名问题（Critical Fix）
- **问题**：动态构建类名字符串，导致Tailwind编译器无法识别样式
- **解决方案**：创建颜色映射常量，将状态映射到完整类名
- **涉及组件**：
  - `LinearStatsCard`：修复`text-${stat.color}-500`
  - `LinearActivityItem`：修复`text-${activity.status}-500`

### 2. 语义化标签优化
- **问题**：使用div堆砌列表，不利于SEO和无障碍访问
- **解决方案**：将活动列表和任务列表改为使用`ul`和`li`标签
- **涉及组件**：
  - 活动列表容器：从`div`改为`ul`
  - `LinearActivityItem`：从`div`改为`li`
  - 任务列表容器：从`div`改为`ul`
  - `LinearTaskItem`：从`div`改为`li`

### 3. 移动端适配优化
- **问题**：`MovingBorderCard`在平板模式下占据2列，导致比例失调
- **解决方案**：调整为在所有屏幕尺寸下都占据1列
- **修改位置**：将`sm:col-span-2 lg:col-span-1`改为`col-span-1 sm:col-span-1 lg:col-span-1`

### 4. 代码组织优化
- **问题**：优先级颜色逻辑直接嵌在JSX中，代码冗长
- **解决方案**：提取`getPriorityStyles`函数，统一处理优先级样式
- **涉及组件**：`LinearTaskItem`

## 修复后的代码结构

1. **新增常量**：
   ```javascript
   const COLOR_MAP = {
     success: "text-emerald-500",
     warning: "text-amber-500",
     error: "text-rose-500",
     info: "text-blue-500"
   };
   ```

2. **新增辅助函数**：
   ```javascript
   const getPriorityStyles = (priority: string) => {
     switch (priority) {
       case 'high':
         return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]';
       case 'medium':
         return 'bg-amber-500';
       default:
         return 'bg-blue-500';
     }
   };
   ```

3. **组件修改**：
   - 使用映射常量替代动态类名拼接
   - 使用语义化列表标签
   - 优化移动端布局
   - 使用辅助函数简化JSX

## 预期效果

- ✅ 修复Tailwind样式丢失问题
- ✅ 提高代码可维护性和可读性
- ✅ 增强SEO和无障碍访问支持
- ✅ 优化移动端显示效果
- ✅ 保持原有的Linear风格视觉效果

这个修复计划将确保代码符合最佳实践，同时保持原有的优秀视觉设计。