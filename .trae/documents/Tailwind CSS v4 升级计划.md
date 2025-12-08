# Tailwind CSS v4 升级计划

## 1. 准备工作

### 1.1 备份当前项目和配置文件
- 备份整个项目目录
- 备份关键配置文件：
  - tailwind.config.js
  - postcss.config.js
  - package.json
  - package-lock.json

### 1.2 确保项目使用最新的Tailwind CSS v3版本
```bash
npm install tailwindcss@latest --legacy-peer-deps
```

### 1.3 更新所有Tailwind CSS插件
- 检查项目中使用的所有Tailwind CSS插件
- 更新到兼容v4的版本（如果可用）

### 1.4 运行当前构建，确保基线正常
```bash
npm run build
```

## 2. 安装和配置

### 2.1 安装Tailwind CSS v4
```bash
npm install tailwindcss@next postcss@latest autoprefixer@latest --legacy-peer-deps
```

### 2.2 更新tailwind.config.js
- 参考 `tailwind.config.v4.example.js`
- 简化配置，移除v4不再支持的选项
- 更新主题配置到v4格式
- 配置新的v4特性

### 2.3 更新postcss.config.js
- v4中PostCSS插件配置方式有所变化
- 更新为v4兼容格式

## 3. 工具类迁移

### 3.1 自动迁移
```bash
npx tailwindcss migrate
```

### 3.2 手动检查和修复
- 检查所有页面和组件的样式
- 修复自动迁移未处理的工具类
- 特别注意：
  - opacity工具类变化：`text-opacity-*` → `text-*/opacity`
  - 其他可能的工具类名称变化

## 4. 测试和验证

### 4.1 开发环境测试
```bash
npm run dev
```
- 检查所有页面和组件的样式
- 测试响应式设计
- 测试暗黑模式
- 测试所有交互功能

### 4.2 生产构建测试
```bash
npm run build
```
- 确保构建成功
- 检查构建输出

### 4.3 功能测试
- 测试核心业务功能
- 测试表单提交
- 测试导航和路由
- 测试API调用

## 5. 回滚方案

### 5.1 准备回滚脚本
```bash
# 回滚到v3
npm install tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0 --legacy-peer-deps
# 恢复配置文件
cp tailwind.config.js.backup tailwind.config.js
cp postcss.config.js.backup postcss.config.js
```

### 5.2 监控和回滚条件
- 如果构建失败且无法修复
- 如果核心功能受到影响
- 如果样式问题过多

## 6. 后续优化

### 6.1 利用v4新特性
- 增强的JIT引擎
- 改进的暗黑模式
- 全新的@reference指令
- 更智能的类名推导

### 6.2 代码优化
- 根据VibeCoding敏捷5S规则优化代码
- 移除未使用的工具类
- 优化样式结构

## 7. 升级风险评估

### 7.1 高风险
- 构建失败
- 核心功能样式问题
- 插件不兼容

### 7.2 中风险
- 部分页面样式异常
- 工具类迁移不完整

### 7.3 低风险
- 次要组件样式问题
- 性能影响

## 8. 升级时间表

| 阶段 | 时间 | 负责人 |
|------|------|--------|
| 准备工作 | 1天 | 开发团队 |
| 安装和配置 | 1天 | 开发团队 |
| 工具类迁移 | 2天 | 开发团队 |
| 测试和验证 | 2天 | 测试团队 |
| 后续优化 | 持续 | 开发团队 |

## 9. 升级成功标准

- 开发环境正常运行
- 生产构建成功
- 核心功能样式正常
- 响应式设计正常
- 暗黑模式正常
- 所有交互功能正常

## 10. 参考资源

- [Tailwind CSS v4 官方文档](https://tailwindcss.com/docs/upgrade-guide#tailwind-css-v4)
- [Tailwind CSS v4 迁移指南](https://tailwindcss.com/docs/upgrade-guide)
- [项目内部迁移指南](TailwindCSS-v4-Upgrade-Guide.md)
- [v4配置示例](tailwind.config.v4.example.js)