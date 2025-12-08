# Knip完整落地实施计划

## 项目分析

* **框架**：Next.js 15（App Router）

* **监控**：Sentry（使用withSentryConfig包装配置）

* **配置文件**：next.config.js、sentry.client.config.ts

* **当前状态**：已安装Knip，初步测试运行成功

## 实施步骤

### 第一步：针对性配置 (Handle the "Magic")

1. 在项目根目录创建`knip.ts`配置文件
2. 配置关键入口文件，包括：

   * App Router路由（src/app/\*\*/\*.{js,jsx,ts,tsx}）

   * Next.js配置文件（next.config.js）

   * Sentry配置文件（sentry.client.config.ts）

   * 中间件文件（src/middleware.ts）
3. 忽略特定的误报，如类型定义文件、静态资源等
4. 配置Next.js插件支持

### 第二步：运行并解读“三种死代码”

1. 运行`npx knip`，分析输出结果
2. 分类整理问题：

   * Unused dependencies（未使用的依赖）

   * Unused files（未使用的文件）

   * Unused exports（未使用的导出）
3. 优先处理误报，标记需要保留的依赖和文件

### 第三步：清理与验证 (The Cleanup Strategy)

1. **先删未使用的文件**：

   * 删除Knip报告的未使用文件

   * 运行`npm run build`验证构建通过
2. **再删未使用的导出**：

   * 使用`npx knip --fix`自动修复（实验性）

   * 手动清理大的模块导出

   * 运行测试确保没有破坏逻辑
3. **最后删依赖**：

   * 执行`npm uninstall <package-name>`删除未使用的依赖

   * 特别注意Sentry相关包的处理

   * 运行`npm run build`和测试确保项目正常

### 第四步：守门员机制 (CI/CD Integration)

1. 更新package.json脚本，添加knip命令
2. 在CI/CD流程中添加Knip步骤
3. 配置适当的警告/错误级别
4. 确保团队成员了解Knip的使用方法

## 配置文件设计

将创建`knip.ts`配置文件，包含：

* 明确的入口文件定义

* Next.js和Sentry特定配置

* 合理的忽略规则

* 插件配置

## 预期效果

* 解决depcheck解析失败问题

* 获得更全面的代码健康检查

* 精简代码库，减少不必要的依赖和代码

* 建立自动化的代码质量保障机制

## 实施顺序

1. 创建针对性配置文件
2. 运行并分析Knip结果
3. 按优先级清理代码
4. 集成到CI/CD流程中

