# 从depcheck迁移到Knip的解决方案

## 问题分析
项目使用了Next.js 15 + Sentry + TypeScript，当前package.json中的`clean:unused`命令使用`npx depcheck`，但由于next.config.js被`withSentryConfig`包装，depcheck无法正确解析，导致执行失败。

## 解决方案
我将实施以下步骤来解决这个问题：

### 步骤1：临时修复depcheck命令
修改package.json中的`clean:unused`命令，添加`--no-parsers=webpack --no-detectors=webpack`参数，禁用Webpack探测器，快速解决当前失败问题。

### 步骤2：安装Knip
安装Knip作为替代依赖检查工具，它对现代框架（Next.js, Sentry）有更好的支持。
```bash
npm install -D knip
```

### 步骤3：配置Knip
创建基础的knip.json配置文件，针对Next.js + Sentry项目进行优化。

### 步骤4：更新package.json脚本
将`clean:unused`命令改为使用Knip，并添加新的`clean:unused:knip`命令用于对比测试。

### 步骤5：测试验证
运行Knip命令，确保它能正确识别项目依赖，不出现解析错误。

### 步骤6：清理旧依赖（可选）
如果Knip运行正常，考虑移除depcheck依赖，简化项目配置。

## 预期效果
- 解决depcheck解析next.config.js失败的问题
- 使用更现代、更可靠的依赖检查工具Knip
- 保持项目的依赖清洁和精简

## 实施顺序
1. 临时修复depcheck命令
2. 安装并配置Knip
3. 更新package.json脚本
4. 测试验证
5. 清理旧依赖（可选）