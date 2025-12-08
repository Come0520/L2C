## 计划概述
为网站所有交互元素（按钮、卡片）添加Framer Motion的`whileHover`和`whileTap`动画效果，提升用户体验和视觉吸引力。

## 实施步骤

### 1. 安装依赖
- 安装`framer-motion`包到项目中

### 2. 修改主要UI组件

#### 2.1 PaperButton组件 (`/src/components/ui/paper-button.tsx`)
- 引入Framer Motion的`motion`组件
- 将原生`button`替换为`motion.button`
- 添加`whileHover`效果：轻微缩放和阴影增强
- 添加`whileTap`效果：轻微按压效果

#### 2.2 PaperCard组件 (`/src/components/ui/paper-card.tsx`)
- 引入Framer Motion的`motion`组件
- 将原生`div`替换为`motion.div`
- 添加`whileHover`效果：轻微上浮和阴影增强
- 添加`whileTap`效果：轻微按压效果
- 确保所有卡片变体都能受益于动画

#### 2.3 SlideCard组件 (`/src/components/shared/slide-card.tsx`)
- 引入Framer Motion的`motion`组件
- 将卡片容器替换为`motion.div`
- 添加`whileHover`和`whileTap`效果
- 为卡片内的操作按钮也添加适当的动画效果

### 3. 动画效果设计

#### 按钮动画
- **whileHover**：scale: 1.02, boxShadow增强
- **whileTap**：scale: 0.98

#### 卡片动画
- **whileHover**：scale: 1.01, y: -2, boxShadow增强
- **whileTap**：scale: 0.99

## 预期效果
- 所有按钮在悬停时轻微放大，点击时轻微缩小
- 所有卡片在悬停时轻微上浮并增强阴影，点击时轻微缩小
- 整体网站交互更加生动，提升用户体验
- 保持动画效果的一致性和协调性

## 技术要点
- 使用Framer Motion的`motion`组件包裹现有元素
- 保持原有组件的所有功能和props不变
- 动画效果要自然、不突兀
- 确保动画性能良好，不影响页面加载速度