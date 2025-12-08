## 目标与范围
- 目标：修复 `@apply`、`@layer` 在 Tailwind v4 下无法识别默认类的问题，使与 Next.js 15 正常协同。
- 范围：入口样式导入、指令迁移、模块样式作用域、风格检查一致性、验证流程。
- 规范：CSS 类名采用 BEM（如 `btn--primary`），遵循项目命名规范。

## 变更项
- 替换入口导入方式为 v4 推荐：`@import "tailwindcss"`。
- 将 `@layer` 迁移为 `@utility`，并统一类名为 BEM。
- 在模块样式使用 `@apply` 时添加 `@reference` 指向主样式。
- 安装并对齐 `stylelint-config-tailwindcss` 与现有 `.stylelintrc.json`。
- 保持 `postcss.config.js` 使用 `@tailwindcss/postcss`。

## 实施步骤
- 入口样式导入替换
  - 在 `src/app/globals.css:1` 将 `@tailwind base; @tailwind components; @tailwind utilities;` 替换为 `@import "tailwindcss"`。
  - 目的：一次性引入 v4 的 theme/base/components/utilities 层，确保默认工具类与层级生效。
- 迁移 `@layer` 到 `@utility`
  - 在主样式（建议仍使用 `src/app/globals.css` 或集中样式文件）定义自定义按钮工具类：
    - `@utility btn--primary { @apply text-white bg-blue-500 hover:bg-blue-600; }`
    - `@utility btn--secondary { @apply text-blue-600 bg-blue-100 hover:bg-blue-200; }`
  - 在组件中将 `className="btn-primary"` 替换为 `className="btn--primary"`；`btn-secondary` → `btn--secondary`。
- 模块样式作用域修复
  - 在每个 `*.module.css` 或单独打包的样式文件顶部添加：`@reference "../../../src/app/globals.css";`。
  - 目的：使模块样式可访问 `@theme` 变量与 `@utility` 自定义工具。
- 风格检查一致性
  - 安装 `stylelint-config-tailwindcss` 以匹配 `.stylelintrc.json`：`npm i -D stylelint-config-tailwindcss`。
  - 保持 `postcss.config.js:3` 使用 `@tailwindcss/postcss`，无需添加 `tailwindcss`、`autoprefixer` 旧式插件配置。

## 代码定位
- 入口 CSS：`src/app/globals.css:1` 改为 `@import "tailwindcss"`；`src/app/globals.css:5–41` 保留并可扩充 `@theme` 变量（补齐 `paper/*`、`ink/*`、`success/*` 等）。
- 测试页面引用：
  - `src/app/special-features-test/page.tsx:48` 将 `className="btn-primary"` 改为 `className="btn--primary"`。
  - `src/app/tailwind-test/page.tsx:152` 涉及 `@layer` 场景统一迁移到 `@utility`，并使用 BEM。
- 配置与插件：
  - `postcss.config.js:3` 保持 `@tailwindcss/postcss`。
  - `.stylelintrc.json:1–21` 引用 `stylelint-config-tailwindcss`，需安装对应依赖。

## 验证与回归
- 开发与构建
  - 运行 `npm run dev` 验证热更新与页面样式正常。
  - 运行 `npm run build` 确认生产构建无 `@apply/@layer` 报错。
- 静态检查
  - 运行 `npm run lint` 确认风格检查通过。
  - 运行 `npm run typecheck` 确认类型检查通过。
- 页面抽测
  - 抽测按钮与自定义工具类所在页面，确认 `btn--primary`、`btn--secondary` 行为正确。
  - 如存在 `paper/*`、`ink/*` 等类名，需在 `@theme` 补齐变量，否则不会生成对应工具类。

## 风险与注意
- 主题变量覆盖范围
  - v4 `@theme` 基于 CSS 变量，未定义的色板（如 `paper-*`、`ink-*`、`success-*`）不会生成工具类；需在 `src/app/globals.css` 补齐或调整引用为已定义色板。
- 模块样式隔离
  - 未添加 `@reference` 的模块样式中使用 `@apply` 将无法识别默认类。
- 命名规范
  - 统一采用 BEM：`btn--primary`、`btn--secondary`，避免非规范类名导致合并失败。

## 交付物
- 更新后的 `src/app/globals.css`（入口导入 + `@utility` 定义，保留并扩充 `@theme`）。
- 更新后的组件引用（将 `btn-primary/btn-secondary` 替换为 BEM）。
- 为涉及模块样式的文件添加 `@reference`。
- `devDependencies` 中新增 `stylelint-config-tailwindcss`，风格检查通过。

## 后续扩展（可选）
- 将现有色板（`paper`、`ink`、`success`、`warning`、`error` 等）完整迁移到 `@theme`，生成与 v3 等价的工具类映射，减少历史代码改动量。
- 建立 `styles/utilities.css` 统一维护 `@utility` 定义，并在 `globals.css` 中 `@import` 以便管理。