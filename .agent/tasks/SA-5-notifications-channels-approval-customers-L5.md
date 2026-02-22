# SA-5: Notifications + Channels + Approval + Customers 模块升级（L2→L5）

> [Subagent 5 - Operations Support L5] 请在每次回复开头标注此身份。

## 目标

将 4 个运营支撑模块从 L2 升级到 L5。

## 当前状态

### channels（渠道）— L2 ⚠️降级
- 31 文件，1 any，14 UI 组件
- **0 测试用例**❌（有 3 个测试文件但全是空壳），19 Zod，17 tenantId，7 审计
- 安全优秀但测试为零

### customers（客户）— L2 ⚠️降级
- 25 文件，14 UI 组件
- **4 测试用例**⚠️，9 Zod，10 tenantId
- 测试覆盖极低

### notifications（通知）— L2
- 15 文件，**2 UI 组件**，4 service
- 42 测试用例，6 Zod，5 tenantId
- **短板**：UI 极少（D5=3）

### approval（审批）— L2
- 30 文件，8 UI 组件，2 ts-ignore
- 21 测试用例，17 Zod，12 tenantId，6 logger
- **短板**：UI 偏少（D5=3）

## 任务清单

### 1. D3 测试覆盖（**最高优先**）
- **channels**：从 **0 → 20+** 测试用例（从零开始！）
  - 渠道 CRUD 操作测试
  - 权限/租户隔离测试
  - 状态切换测试
- **customers**：从 **4 → 20+** 测试用例
  - 客户创建/更新/查询测试
  - 客户搜索/过滤测试
  - 合并客户逻辑测试

### 2. D2 代码质量
- **channels**：清理 1 个 `any`
- **approval**：清理 2 个 `ts-ignore`
- 所有模块消除 `console.log/warn` → logger

### 3. D6 安全加固
- **customers**：Zod 校验从 9 → 15+，tenantId 过滤扩展
- 确保所有 action 有 auth guard

### 4. D7 可运维性
- 四个模块统一使用 logger
- 写操作全部补充审计日志

### 5. D5 UI/UX
- **notifications**：增加 UI 组件（偏好设置、通知列表等）
- **approval**：增加 UI 组件，完善审批流程界面
- 全部模块三态处理

## 约束

- **只修改** `src/features/notifications/`、`src/features/channels/`、`src/features/approval/`、`src/features/customers/`
- 不修改共享组件或其他模块

## 验收标准

```powershell
pnpm type-check
pnpm test:run src/features/notifications  # 全通过
pnpm test:run src/features/channels       # ≥ 20 用例
pnpm test:run src/features/approval       # 全通过
pnpm test:run src/features/customers      # ≥ 20 用例
```

## 返回要求

完成后请返回：修改文件清单、维度改进对比、测试覆盖变化（特别是 channels 和 customers 从零/低起点的增长）、问题与方案。
