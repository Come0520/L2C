# Task 14: Quotes 模块测试与代码质量冲刺 (D2/D3: 8 → 9)

> **目标**：将 Quotes 报价单模块的测试覆盖（D3）和代码质量（D2）从 8 分提升至 9 分，同时补强可运维性（D7）以完成 L5 全维度达标。

## 背景与痛点
- **D3 测试（8→9）**：所有基础路径均已覆盖，但缺少**端到端业务链路测试**和**UI 组件测试**
- **D2 代码质量（8→9）**：`quote.service.ts` 1077 行过大，需考虑拆分；测试中约 13 处 `any` 可优化
- **D7 可运维性（8→9）**：缺少 `traceId` 链路追踪支持

## 工作目录范围
- `src/features/quotes/__tests__/` 和 `src/features/quotes/actions/__tests__/`
- `src/features/quotes/` 中的服务层（**仅重构拆分，保持逻辑不变**）

> ⚠️ **禁止改动**生产路线逻辑，重构后必须所有测试全量通过。

## 任务清单

### 任务 1：扩展 E2E 业务链路测试（D3 核心提升）
在 `src/features/quotes/actions/__tests__/` 或 `__tests__/` 下新增以下全链路测试场景：

**场景 A：模板全流程**
```typescript
it('应完成模板创建→加载→删除全流程', async () => {
  // 1. 创建报价单
  // 2. 保存为模板
  // 3. 新建另一报价单并从模板加载
  // 4. 删除模板
  // 5. 验证每步的审计记录
})
```

**场景 B：版本管理全流程**
```typescript
it('应完成版本创建→激活→历史查看全流程', async () => {
  // 1. 创建报价单 v1
  // 2. 创建 v2 并激活
  // 3. 验证 v1 变为历史版本
  // 4. 验证版本对比接口返回正确 diff
})
```

**场景 C：完整报价单生命周期**
```typescript
it('应完成报价→风控审批→转订单全链路', async () => {
  // 1. 创建带折扣（触发风控）的报价单
  // 2. 风控触发 approval 流程
  // 3. 审批通过
  // 4. 转为订单
  // 5. 验证所有状态流转均有审计日志
})
```

### 任务 2：消除测试文件中的 `any` 类型（D2 提升）
搜索 `src/features/quotes/**/__tests__/**/*.ts` 中的 `any`，逐一替换：
- Mock 数据推荐用 `Partial<T>` 或 `DeepPartial<T>` 替代 `any`
- DB mock 推荐用 `vi.mocked()` 辅助类型推断

目标：将测试文件中的 `any` 从 ~13 处降至 ≤ 3 处。

### 任务 3：Service 层适度拆分（D2 提升）
对 `quote.service.ts`（1077 行）按职责进行模块拆分：
- 将版本相关方法抽取至 `quote-version.service.ts`（如果尚未独立）
- 将过期相关方法抽取至 `quote-expiration.service.ts`（如果尚未独立）
- 原文件保留核心 CRUD 与汇总逻辑

> 拆分后必须确保 `npx vitest run src/features/quotes` 全部通过，tsc 零错误。

### 任务 4：补充 logger 链路 traceId（D7 提升）
在 Quotes 的核心 actions 文件顶部，为关键操作的 logger 调用增加 `requestId` 或类似的链路标识：
```typescript
// 使用 crypto.randomUUID() 生成请求维度的 traceId
const traceId = crypto.randomUUID().slice(0, 8);
logger.info(`[${traceId}] 开始处理报价单提交`, { quoteId, tenantId });
```

## 验收标准
1. 新增 E2E 链路测试 ≥ 3 个场景，全部通过
2. 测试文件中 `any` ≤ 3 处
3. `quote.service.ts` 行数缩减至 ≤ 700 行（通过拆分）
4. `npx tsc --noEmit` 零错误
5. `npx vitest run src/features/quotes` **全部通过**

## 交付说明
完成后宣告"Task 14 完成"，汇报新增测试场景名称、any 减少数量、service 行数变化。
