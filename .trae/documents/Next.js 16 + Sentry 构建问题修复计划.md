## Next.js 16 + Sentry 构建问题修复计划

### 问题分析

构建失败的原因是 Next.js 16 的 Turbopack 构建系统试图打包 `import-in-the-middle` 模块，但该模块依赖于 Node.js 的原生路径查找机制，一旦被打包，路径就会混乱，导致找不到模块。

### 解决方案

#### 方案 1：修改 next.config.js（推荐）

1. **修改配置文件**：
   - 打开 `next.config.js` 文件
   - 在 `serverExternalPackages` 数组中添加以下包：
     - `import-in-the-middle`
     - `@opentelemetry/instrumentation`
     - `@sentry/profiling-node`

2. **配置变更**：
   ```javascript
   // 服务器组件外部包配置
   serverExternalPackages: [
     '@supabase/supabase-js',
     'import-in-the-middle',
     '@opentelemetry/instrumentation',
     '@sentry/profiling-node',
   ],
   ```

3. **重启开发服务器**：
   - 停止当前运行的开发服务器
   - 重新运行 `pnpm dev`

#### 方案 2：强制更新 Sentry（如果方案 1 无效）

如果方案 1 无效，尝试更新到最新版本的 Sentry：

1. 删除依赖锁文件和 node_modules
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   ```

2. 强制安装最新版 Sentry 和依赖
   ```bash
   pnpm add @sentry/nextjs@latest --legacy-peer-deps
   ```

### 验证步骤

1. **运行类型检查**：
   ```bash
   pnpm typecheck
   ```

2. **运行构建测试**：
   ```bash
   pnpm build
   ```

3. **启动开发服务器**：
   ```bash
   pnpm dev
   ```

### 预期结果

- ✅ 构建成功完成
- ✅ 开发服务器正常启动
- ✅ 销售单功能正常访问
- ✅ 没有与 Sentry/OpenTelemetry 相关的错误

### 技术背景

- **Turbopack 的严格性**：Next.js 16 的 Turbopack 构建速度极快，因为它会尝试静态分析所有 import
- **动态 Require**：`import-in-the-middle` 库使用了非常动态的 require() 写法，Turbopack 分析不出来这个路径
- **serverExternalPackages 的作用**：告诉 Turbopack 遇到这些包时不要打包，直接保留 require() 语句，等 Node.js 运行时去 node_modules 里找

### 风险评估

- **低风险**：该修复只涉及配置变更，不修改核心业务逻辑
- **向后兼容**：配置变更不会影响现有功能
- **可回滚**：如果出现问题，可直接从 git 中恢复配置文件

### 执行顺序

1. 执行方案 1：修改 next.config.js
2. 重启开发服务器
3. 运行构建测试
4. 如果构建失败，执行方案 2：更新 Sentry
5. 再次运行构建测试

这个修复计划可以解决 Next.js 16 + Sentry 构建失败的问题，确保销售单功能能够正常运行。