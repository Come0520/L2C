# SA-7: 10 个 L1 模块升级到 L3 安全健康基线

> [Subagent 7 - L3 Baseline] 请在每次回复开头标注此身份。

## 目标

将 10 个 L1 模块升级到 **L3 安全健康基线**（不要求 L5 卓越）。

## 模块清单

| 模块 | 当前文件数 | Zod | tenantId | 测试 | 备注 |
|:---|:---:|:---:|:---:|:---:|:---|
| analytics | 13 | 1 | 1 | 0 用例 | 有 10 个 UI 组件 |
| monitoring | 3 | 2 | 2 | 0 | 仅基础框架 |
| platform | 3 | 2 | 2 | 0 | 仅基础框架 |
| admin | 1 | 1 | 1 | 0 | 仅 1 个 actions 文件 |
| auth | 1 | 0 | 0 | 0 | 无任何安全机制 |
| dispatch | 1 | 0 | 0 | 0 | 仅 1 个空壳文件 |
| pricing | 2 | 1 | 1 | 0 | 仅基础骨架 |
| sales | 2 | 2 | 2 | 0 | 有 logger |
| search | 2 | 1 | 0 | 0 | 无租户隔离❌ |
| upload | 3 | 0 | 0 | 0 | 无任何安全/测试 |

## L3 基线标准

| 维度 | 最低分 | 具体要求 |
|:---|:---:|:---|
| D2 代码质量 | 5 | 无 `as any`，架构分层正确（actions/schema 分离） |
| D3 测试覆盖 | 5 | 核心 action 有测试，每模块 ≥ 3 用例 |
| D6 安全规范 | 5 | 全部 action 有 auth + Zod 校验 + tenantId 过滤 |
| D7 可运维性 | 4 | 写操作有审计日志 |

## 精简 4 项任务

### 1. D6 安全基线（最高优先）

每个模块的每个 action 必须：
- `auth()` 权限检查
- Zod schema 输入校验
- `tenantId` 查询过滤（数据隔离）

**重点模块**：
- **auth**：当前 0 Zod、0 tenantId — 需确认主认证逻辑位置
- **upload**：0 Zod、0 tenantId — 文件上传必须有类型/大小校验
- **search**：0 tenantId — 搜索必须有租户隔离
- **dispatch**：0 Zod、0 tenantId — 空壳需填充

### 2. D2 代码基线

- 清除所有 `as any`、`@ts-ignore`
- 确认架构分层正确（actions 目录、schema 文件分离）
- 使用 logger 替代 console.*

### 3. D3 基础测试

- 每个模块核心路径 **≥ 3 个测试用例**
- 内容：正常创建、权限拒绝、输入校验失败
- 测试文件放在 `__tests__/` 目录

### 4. D7 基础运维

- 所有写操作（create/update/delete）增加审计日志
- 使用 `import { logger } from '@/lib/logger'`

## 约束

- **只修改** 以下 10 个目录：
  - `src/features/analytics/`
  - `src/features/monitoring/`
  - `src/features/platform/`
  - `src/features/admin/`
  - `src/features/auth/`
  - `src/features/dispatch/`
  - `src/features/pricing/`
  - `src/features/sales/`
  - `src/features/search/`
  - `src/features/upload/`
- 不修改共享组件或其他模块
- 模块体量小（1-13 文件），重点是**安全基线达标**而非功能扩展

## 验收标准

```powershell
pnpm type-check

# 每个模块 ≥ 3 测试用例且全通过
pnpm test:run src/features/analytics
pnpm test:run src/features/monitoring
pnpm test:run src/features/platform
pnpm test:run src/features/admin
pnpm test:run src/features/auth
pnpm test:run src/features/dispatch
pnpm test:run src/features/pricing
pnpm test:run src/features/sales
pnpm test:run src/features/search
pnpm test:run src/features/upload

# 全部模块零 any
Get-ChildItem -Path src/features/analytics,src/features/monitoring,src/features/platform,src/features/admin,src/features/auth,src/features/dispatch,src/features/pricing,src/features/sales,src/features/search,src/features/upload -Recurse -Include *.ts,*.tsx | Select-String -Pattern 'as any|@ts-ignore' | Measure-Object
# 期望 Count = 0
```

## 返回要求

完成后请返回：
1. 每个模块的修改文件清单
2. 安全基线达标情况（Zod/tenantId/auth 新增数量）
3. 测试覆盖统计（新增用例数）
4. 问题与方案（特别是 auth/dispatch 等空壳模块的处理决策）
