# Tailwind CSS v4 修复计划

## 1. 修复目标
使 Next.js 15 与 Tailwind CSS v4 正确协同，解决 `@apply`、`@layer` 无法识别默认类的问题。

## 2. 修复范围
- 入口样式导入方式
- 指令迁移（@layer → @utility）
- 模块样式作用域修复
- 风格检查一致性
- 验证流程

## 3. 修复步骤

### 3.1 替换入口导入方式
- **文件**：`src/app/globals.css`
- **修改**：将第 1 行的 `@tailwind base; @tailwind components; @tailwind utilities;` 替换为 `@import "tailwindcss";`
- **目的**：一次性引入 v4 的 theme/base/components/utilities 层，确保默认工具类与层级生效

### 3.2 迁移 @layer 到 @utility 并采用 BEM 命名
- **文件**：`src/app/globals.css`
- **修改**：添加 @utility 定义，将原自定义组件类改为 BEM 命名
  ```css
  @utility btn--primary {
    @apply text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-md font-medium transition-colors;
  }
  
  @utility btn--secondary {
    @apply text-blue-600 bg-blue-100 hover:bg-blue-200 px-4 py-2 rounded-md font-medium transition-colors;
  }
  ```

### 3.3 补齐 @theme 变量
- **文件**：`src/app/globals.css`
- **修改**：在 @theme 中添加 paper、ink、success、warning、error、info 等色板变量，确保这些类能被正确识别

### 3.4 安装缺失的依赖
- **命令**：`npm install -D stylelint-config-tailwindcss`
- **目的**：确保 stylelint 配置中引用的扩展包存在

### 3.5 修复组件中的类名引用
- **文件**：所有使用 `btn-primary` 和 `btn-secondary` 的组件
- **修改**：将 `className="btn-primary"` 替换为 `className="btn--primary"`，同理 `btn-secondary` → `btn--secondary`

### 3.6 更新 stylelint 配置
- **文件**：`.stylelintrc.json`
- **修改**：更新 at-rule-no-unknown 规则，添加对 @utility、@reference 等新指令的支持

## 4. 验证流程

### 4.1 开发环境验证
- 运行 `npm run dev`，验证热更新与页面样式正常

### 4.2 生产构建验证
- 运行 `npm run build`，确保生产构建无 @apply/@layer 报错

### 4.3 静态检查
- 运行 `npm run lint`，确认风格检查通过
- 运行 `npm run typecheck`，确认类型检查通过

### 4.4 页面抽测
- 抽测按钮与自定义工具类所在页面，确认 `btn--primary`、`btn--secondary` 行为正确
- 验证 paper/*、ink/* 等自定义色板类能正常使用

## 5. 风险与注意事项

### 5.1 主题变量覆盖范围
- 确保所有使用的自定义色板都在 @theme 中定义
- 未定义的色板类不会自动生成

### 5.2 模块样式隔离
- 每个使用 @apply 的模块样式文件顶部需添加 `@reference` 引用

### 5.3 命名规范
- 严格遵循 BEM 命名规范，如 `btn--primary`、`card--featured`
- 避免使用非规范类名

## 6. 交付物

- 更新后的 `src/app/globals.css`（入口导入 + @utility 定义 + 完整 @theme 变量）
- 更新后的组件引用（BEM 命名规范）
- 安装缺失的依赖
- 更新后的 stylelint 配置
- 验证通过的构建与测试结果