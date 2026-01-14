---
name: strict-testing-standard
description: 定义项目的测试覆盖率要求与质量门禁
---

# 严格测试标准

1. **零失败容忍**：
   - 任何提交到 `main` 或交付给用户的代码，其相关测试必须 100% 通过。
   - 禁止注释掉失败的测试用例来“骗过”检查。

2. **测试覆盖要求**：
   - **新功能**：必须包含对应的 Unit Test 或 E2E Test。
   - **Bug 修复**：必须包含一个复现该 Bug 的测试用例（Regression Test）。

3. **测试类型规范**：
   - **Unit Tests (`vitest`)**：用于纯逻辑、工具函数、Hook 的测试。
   - **E2E Tests (`playwright`)**：用于关键用户流程（Sales Flow, Login, etc.）。

4. **调试心态**：
   - 遇到测试失败是常态。Agent 必须具备耐心，通过 Log 分析 -> 修复 -> 重测 的循环来解决问题，而不是请求用户跳过。
