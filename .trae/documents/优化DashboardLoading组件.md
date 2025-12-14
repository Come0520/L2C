## 优化计划

### 1. 优化目标
- 提高代码复用性和可维护性
- 遵循Tailwind CSS v4的最佳实践
- 改进组件结构，减少重复代码
- 增强视觉体验，符合SaaS业务场景

### 2. 具体优化措施

#### 2.1 提取重复组件
- 将表格行骨架提取为`TableRowSkeleton`组件
- 将统计卡片骨架提取为`StatCardSkeleton`组件
- 将最近活动项骨架提取为`ActivityItemSkeleton`组件

#### 2.2 样式优化
- 将所有硬编码的`width/height`属性替换为Tailwind className
- 统一使用Tailwind的原子化类名（如`h-10`代替`height="2.5rem"`）
- 保持与系统设计语言的一致性

#### 2.3 视觉体验增强
- 为最近活动项添加产品图片占位符
- 优化骨架屏的视觉层次

#### 2.4 移除待办事项骨架
- 从DashboardLoading中移除TodoItemSkeleton相关内容
- 待办事项骨架将单独放在待办页面中

### 3. 优化后的代码结构
```
DashboardLoading
├── StatCardSkeleton
├── ActivityItemSkeleton
└── TableRowSkeleton
```

### 4. 技术实现细节
- 使用Tailwind CSS v4的原子化类名
- 保持React组件的单一职责原则
- 确保代码符合Next.js 15 App Router的规范

### 5. 预期效果
- 代码行数减少30%以上
- 提高组件的可维护性和复用性
- 更好地遵循Tailwind CSS v4的最佳实践
- 增强用户体验，使骨架屏更贴近真实内容结构