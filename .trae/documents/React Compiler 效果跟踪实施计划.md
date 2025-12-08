# React Compiler 效果跟踪实施计划

## 1. 实施目标
- 以可重复的测试流程量化 React Compiler 的收益与风险
- 在典型页面与交互场景下比较开启/关闭 Compiler 的渲染次数与响应时间

## 2. 实施步骤

### 2.1 配置修改：支持 A/B 测试
**修改文件**：`next.config.js`

**实施内容**：
- 将 `experimental.reactCompiler` 配置改为通过环境变量控制
- 添加 `REACT_COMPILER` 环境变量支持
- 示例配置：
  ```javascript
  experimental: {
    reactCompiler: process.env.REACT_COMPILER === 'true',
  }
  ```

### 2.2 更新性能测试脚本
**修改文件**：`scripts/run-performance-test.js`

**实施内容**：
- 添加基准页 URL 到测试配置
- 新增仪表盘、订单状态页、线索看板、通知页的测试 URL
- 支持通过环境变量动态设置测试 URL

### 2.3 执行测试流程

**测试执行命令**：

#### 2.3.1 关闭 React Compiler 测试
```bash
# 设置环境变量并启动开发服务器
REACT_COMPILER=false npm run dev

# 在另一个终端运行性能测试
npm run performance:test
```

#### 2.3.2 开启 React Compiler 测试
```bash
# 设置环境变量并启动开发服务器
REACT_COMPILER=true npm run dev

# 在另一个终端运行性能测试
npm run performance:test
```

#### 2.3.3 运行 LHCI 测试
```bash
# 关闭 Compiler 运行 LHCI
REACT_COMPILER=false npm run dev
npm run lhci:autorun

# 开启 Compiler 运行 LHCI
REACT_COMPILER=true npm run dev
npm run lhci:autorun
```

### 2.4 交互场景测试

**使用 React DevTools Profiler 进行组件级测试**：

1. **仪表盘**：
   - 切换卡片筛选
   - 滚动虚拟列表 1000 项

2. **订单页**：
   - 筛选条件切换
   - 分页翻页

3. **线索看板**：
   - 拖拽 10 次跨列
   - 撤销一次（乐观更新回滚）

4. **通知页**：
   - Tab 切换
   - 列表滚动与“标记已读”一次

### 2.5 结果汇总与报告生成

**生成对比报告**：
- 对比开启/关闭 React Compiler 的性能指标
- 记录 Commit 次数与渲染耗时
- 分析 Lighthouse 关键指标（LCP/TBT/CLS/TTI）
- 生成可视化对比表

## 3. 验收标准

### 3.1 组件级
- 目标交互的 Commit 次数平均下降 ≥15%
- 或渲染耗时平均下降 ≥10%

### 3.2 页面级
- Lighthouse 的 TBT/LCP 至少一项有显著改善（≥5%）
- 且无显著退化

### 3.3 稳定性
- 无逻辑回归（事件处理、状态一致性、UI 不抖动）
- 错误日志无新增

## 4. 风险与回滚

### 4.1 行为差异风险
- Compiler 对副作用、可变对象、未声明依赖的闭包有约束
- 需重点回归交互场景

### 4.2 回滚策略
- 保留 A/B 配置切换
- 若发现问题，默认关闭 Compiler 并记录问题场景与修复建议

## 5. 预期输出

- 更新后的 `next.config.js` 支持环境变量控制 React Compiler
- 更新后的性能测试脚本包含所有基准页
- 完整的性能对比报告（开启 vs 关闭）
- 渲染次数与响应时间对比数据
- Lighthouse 指标差异分析
- 风险清单与建议