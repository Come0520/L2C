# SA-2: Settings + Supply-Chain 模块升级（L3+→L5）

> [Subagent 2 - Settings & Supply-Chain L5] 请在每次回复开头标注此身份。

## 目标

将 `src/features/settings/` 和 `src/features/supply-chain/` 从 L3+ 升级到 L5 卓越级。

## 当前状态

### settings（系统设置）
- 85 文件，50 UI 组件，**0 any/0 ts-ignore**（质量标杆✅）
- 97 测试用例（最多✅），27 Zod，16 tenantId，15 审计日志
- **短板**：D8 性能=5（分页仅 3 处）

### supply-chain（供应链）
- 73 文件，30 UI 组件，**0 any/0 ts-ignore**✅
- 47 测试用例，23 Zod，12 tenantId，12 审计日志
- **短板**：D3 需扩展边界测试，D5 UI 需完善

## 任务清单

### 1. D8 性能优化
- **settings**：审查所有查询操作，分页从 3 处扩展到全覆盖
- **supply-chain**：审查查询性能，确保 N+1 查询已消除
- 在 service 层添加合理的缓存策略

### 2. D3 测试扩展
- settings：从 97 → 120+ 用例（补充边界场景和 E2E）
- supply-chain：从 47 → 70+ 用例（补充边界场景）
- 确保每个 action 至少 3 个用例

### 3. D5 UI/UX 完善
- 确保所有列表页面有加载态/空态/错误态三态处理
- 表单校验反馈完整（错误消息、Toast 通知）
- 响应式布局检查

### 4. D4 文档
- 所有导出函数 JSDoc 覆盖
- Schema 字段 `.describe()` 完善
- API 文档更新

## 约束

- **只修改** `src/features/settings/` 和 `src/features/supply-chain/` 目录
- 不修改共享组件、数据库 schema 或其他模块
- 不修改 ESLint/TypeScript 配置

## 验收标准

```powershell
pnpm type-check
pnpm test:run src/features/settings    # ≥ 120 用例
pnpm test:run src/features/supply-chain # ≥ 70 用例
```

## 返回要求

完成后请返回：修改文件清单、维度改进对比、测试覆盖变化、问题与方案。
