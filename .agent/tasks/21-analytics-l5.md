# 任务指示：升级 Analytics 模块至 L5 成熟度

## 当前状态与目标
- **模块名称**：`analytics`（数据分析）
- **当前等级**：L4 (6.8分)
- **目标等级**：L5 (全维度稳定 ≥9分)
- **短板分析**：可运维性 D7(5分)，测试覆盖 D3(7分)，文档 D4(6分)，UI/UX D5(6分)

## 具体任务分解

### 1. 提升可运维性 (D7 目标: 9)
根据报告，当前模块仅有 1 个日志，0 审计。
- 在 `src/features/analytics/actions/` 目录下的所有关键业务操作（查询较多，也可能包含导出等操作）中，引入 `logger.info` / `logger.error`。
- 确保所有的查询异常都被 `try-catch` 正确捕获并记录日志，而不是静默失败。

### 2. 提升测试覆盖率 (D3 目标: 9)
当前 12 个文件、35 个用例，但覆盖率极低（44%）。作为分析模块，包含了排行榜、趋势、定价、漏洞等十多个 actions。
- 为这些 actions（如 `src/features/analytics/actions/*.ts`）补充单元测试。
- 采用有效格式校验逻辑（Zod），使用业务合法模拟数据，测试通过 `vitest`。

### 3. 补全开发文档与 JSDoc (D4 目标: 9)
当前有 58 个 JSDoc，需要进一步补充。
- 为所有导出的 `actions/queries.ts` 和其他工具函数添加标准的 JSDoc 中文注释，写明用途、参数和返回数据结构含义。
- 补齐或者修复模块级别的架构文档，说明业务概念（报表种类）。

### 4. 消除 Any 风险与 UI 优化 (D2 & D5 目标: 9)
虽然目前 0 any，但务必在添加测试和补充文档时维护严格的 TS 环境，不要引入任何的 `as any`。
- UI/UX 方面：目前有 10 个组件，检查这些图表和数据看板组件（`components/`）是否遵循了统一规范。如果缺少错误兜底展示或者骨架屏，请为其添加 Suspense 和 ErrorBoundary。

## 验收标准
1. `pnpm test src/features/analytics` 测试全部稳定通过。
2. `pnpm tsc --noEmit` 不能有新的类型错误。
3. `pnpm run lint` 没有报错。
4. **必须使用中文**进行代码注释、提交记录和进度反馈。

完成上述所有修改后，使用 `verification-before-completion` 验证。
