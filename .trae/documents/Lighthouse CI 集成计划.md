# Lighthouse CI 集成计划

## 1. 现状分析

项目已经有了基本的 Lighthouse CI 配置：
- 存在 `lighthouserc.json` 配置文件
- GitHub Actions 中有 `performance-tests` 作业使用 `treosh/lighthouse-ci-action@v10`
- 但 Lighthouse CI 只在主分支部署后运行，无法在开发过程中及早发现性能问题

## 2. 改进目标

1. **在开发过程中及早发现性能问题**：在 PR 和推送到 develop 分支时运行 Lighthouse CI
2. **集成到 PR 检查中**：将 Lighthouse 结果作为 PR 检查的一部分
3. **提供详细的性能报告**：让开发者能够查看具体的性能问题
4. **配置合适的性能阈值**：确保代码符合基本的性能要求

## 3. 实施步骤

### 步骤 1：添加 Lighthouse CI 依赖

在前端 `package.json` 中添加 Lighthouse CI 依赖：

```json
"devDependencies": {
  "@lhci/cli": "^0.13.0"
}
```

### 步骤 2：添加 Lighthouse CI 脚本

在前端 `package.json` 中添加 Lighthouse CI 相关脚本：

```json
"scripts": {
  "lhci:collect": "lhci collect",
  "lhci:assert": "lhci assert",
  "lhci:upload": "lhci upload",
  "lhci:autorun": "lhci autorun"
}
```

### 步骤 3：修改 GitHub Actions 配置

修改 `.github/workflows/ci-cd.yml`，将 Lighthouse CI 集成到 CI 流程中：

1. **添加新的 Lighthouse CI 作业**：在 PR 和推送到 develop 分支时运行
2. **调整作业依赖**：在前端构建后运行 Lighthouse CI
3. **配置 PR 检查**：将 Lighthouse 结果作为 PR 检查的一部分
4. **优化运行条件**：确保只在必要时运行

### 步骤 4：优化 Lighthouse CI 配置

更新 `lighthouserc.json` 配置：

1. **优化服务器启动配置**：确保能够正确启动和检测开发服务器
2. **调整性能阈值**：根据项目实际情况调整合适的性能阈值
3. **配置合适的上传目标**：考虑使用 GitHub 存储或其他持久化存储
4. **添加更多测试页面**：确保覆盖主要的用户路径

### 步骤 5：测试和验证

1. **本地测试**：在本地运行 Lighthouse CI，确保配置正确
2. **CI 测试**：推送测试代码，验证 GitHub Actions 中的 Lighthouse CI 能够正常运行
3. **PR 测试**：创建测试 PR，验证 Lighthouse 结果能够正确显示在 PR 检查中

## 4. 预期效果

1. **更早发现性能问题**：在开发过程中就能发现和解决性能问题
2. **自动化性能检查**：不需要手动运行 Lighthouse，CI 会自动处理
3. **透明的性能报告**：开发者可以在 GitHub 上直接查看性能报告
4. **一致的性能标准**：确保所有代码都符合基本的性能要求
5. **持续改进**：通过持续的性能监控，推动代码质量的持续改进

## 5. 风险和注意事项

1. **构建时间增加**：Lighthouse CI 会增加 CI 构建时间，需要平衡性能检查和构建速度
2. **环境差异**：CI 环境与生产环境可能存在差异，需要确保测试结果的准确性
3. **阈值调整**：初始的性能阈值可能需要根据实际情况进行调整
4. **资源消耗**：Lighthouse CI 会消耗一定的资源，需要确保 CI 服务器能够处理

## 6. 后续优化

1. **添加性能预算**：配置性能预算，限制资源使用
2. **集成到开发工作流**：在本地开发环境中集成 Lighthouse 检查
3. **添加历史性能对比**：查看性能随时间的变化情况
4. **优化特定页面**：根据 Lighthouse 报告，针对性地优化特定页面的性能
5. **添加移动端性能检查**：确保在移动设备上也有良好的性能表现