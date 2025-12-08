# Tailwind CSS v4 升级指南

## 1. 概述

本指南旨在帮助团队顺利将项目从 Tailwind CSS v3 升级到 v4。Tailwind CSS v4 带来了许多新特性和改进，但也包含一些破坏性改动，需要仔细规划和测试。

## 2. 新特性

### 2.1 增强的 JIT 引擎
- 默认启用，无需手动配置 `mode: 'jit'`
- 更快的编译速度
- 更智能的类名生成

### 2.2 改进的暗黑模式支持
- 支持 `class`、`media` 和 `selector` 三种模式
- 更灵活的配置选项

### 2.3 全新的 @reference 指令
- 用于引用外部样式表
- 简化了外部样式的集成

### 2.4 更智能的类名推导机制
- 更好的类名冲突解决
- 无需手动配置 `prefix` 即可获得良好的隔离

### 2.5 简化的配置语法
- 更直观的主题配置
- 简化的插件配置

## 3. 破坏性改动

### 3.1 配置选项变化
- 移除了 `purge` 选项，使用 `content` 替代（已在 v3 中支持）
- 移除了 `variants` 选项，使用插件或 `theme.extend` 替代
- `corePlugins` 配置方式有所变化

### 3.2 工具类名称变化
- `text-opacity-*` → `text-*/opacity`
- `bg-opacity-*` → `bg-*/opacity`
- `border-opacity-*` → `border-*/opacity`
- 其他一些工具类名称可能发生变化

### 3.3 插件 API 变化
- 插件需要更新到兼容 v4 的版本
- 一些内置插件可能被移除或重构

### 3.4 PostCSS 配置变化
- PostCSS 插件配置方式有所变化
- 可能需要更新 PostCSS 版本

## 4. 升级步骤

### 4.1 准备工作
1. 备份当前项目
2. 确保项目使用的是最新的 Tailwind CSS v3 版本
3. 检查并更新所有 Tailwind CSS 插件
4. 运行 `npm run build` 确保当前项目构建正常

### 4.2 安装 Tailwind CSS v4
```bash
npm install tailwindcss@next postcss@latest autoprefixer@latest --legacy-peer-deps
```

### 4.3 更新配置文件
1. 参考 `tailwind.config.v4.example.js` 更新 `tailwind.config.js`
2. 更新 `postcss.config.js` 以兼容 v4
3. 检查并更新所有使用 Tailwind CSS 配置的文件

### 4.4 更新代码中的工具类
1. 使用 `npx tailwindcss migrate` 命令自动迁移大部分工具类
2. 手动检查并修复剩余的工具类
3. 测试所有页面和组件的样式

### 4.5 测试和验证
1. 运行 `npm run dev` 测试开发环境
2. 运行 `npm run build` 测试生产构建
3. 检查所有页面和组件的样式是否正常
4. 测试响应式设计和暗黑模式
5. 测试所有交互功能

## 5. 测试环境

已创建 `tailwind.config.v4.example.js` 作为 v4 配置示例，用于参考和测试。

## 6. 注意事项

1. Tailwind CSS v4 尚未正式发布，可能存在不稳定因素
2. 建议在分支中进行升级测试，不要直接在主分支上操作
3. 确保所有依赖包都兼容 v4
4. 测试过程中注意备份重要文件
5. 升级后需要全面测试所有功能

## 7. 资源链接

- [Tailwind CSS v4 官方文档](https://tailwindcss.com/docs/upgrade-guide#tailwind-css-v4)
- [Tailwind CSS v4 迁移指南](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind CSS 插件兼容性列表](https://tailwindcss.com/docs/plugins#official-plugins)

## 8. 进度跟踪

- [ ] 安装 Tailwind CSS v4 测试版本
- [ ] 更新配置文件
- [ ] 迁移工具类
- [ ] 测试开发环境
- [ ] 测试生产构建
- [ ] 全面测试功能
- [ ] 修复所有问题
- [ ] 准备正式升级
