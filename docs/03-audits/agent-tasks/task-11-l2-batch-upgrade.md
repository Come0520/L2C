# Task 11: L2 模块批量消灭计划 (L2 → L3 × 6)

> **目标**：将 6 个处于 L2 可用期的辅助模块（sales / auth / search / upload / pricing / monitoring）全部最小化升级至 L3 基线。
> **注意**：dispatch 已在 Batch 2 (Task 9) 中独立完成安全补丁，本任务不再涉及。

## 背景与痛点
路线图中明确要求 Phase 2 结束时 **消灭全部 L2 模块**。这 6 个模块体量较小（多为 2-8 个源文件），其 L2 评级的共性问题是：
- 文档缺失或过于简陋
- 测试覆盖不足（通常 ≤ 2 个测试文件）
- 部分有残留的 TODO

由于每个模块所需的工作量不大（0.25~0.5 天），将它们打包为一个完整任务由单个 Agent 串行完成。

## 工作目录范围
你**只能**修改或添加以下路径下的文件：
- `src/features/sales/`
- `src/features/auth/`
- `src/features/search/`
- `src/features/upload/`
- `src/features/pricing/`
- `src/features/monitoring/`
- `docs/02-requirements/modules/` 下对应的文档文件

## 分模块任务清单

### 1. Sales（销售）— 目标 L3
| 行动 | 说明 |
|:---|:---|
| 补充需求文档 | 在 `docs` 下生成 `销售.md`，列出已实现的功能清单 |
| 补充 2 个核心测试 | 覆盖销售看板的核心 actions 或数据查询逻辑 |
| 验收 | `npx vitest run src/features/sales` 通过 |

### 2. Auth（认证）— 目标 L3
| 行动 | 说明 |
|:---|:---|
| 文档 AUTO-GEN | 读取 auth 源码，生成 `认证.md` 文档 |
| 登录边界测试 | 补充至少 1 个测试覆盖：空密码/无效令牌/过期 session 等边界 |
| 验收 | `npx vitest run src/features/auth` 通过 |

### 3. Search（搜索）— 目标 L3
| 行动 | 说明 |
|:---|:---|
| 文档补全 | 生成 `搜索.md`，说明当前支持的搜索范围和实现方式 |
| 搜索结果测试 | 补充至少 1 个测试验证搜索结果的正确性和空结果处理 |
| 验收 | `npx vitest run src/features/search` 通过 |

### 4. Upload（上传）— 目标 L3
| 行动 | 说明 |
|:---|:---|
| 文件类型验证测试 | 补充测试验证：允许/拒绝特定文件类型、文件大小限制 |
| 验收 | `npx vitest run src/features/upload` 通过 |

### 5. Pricing（定价）— 目标 L3
| 行动 | 说明 |
|:---|:---|
| 补充文档 | 生成 `定价.md`，说明定价引擎与报价模块的协同关系 |
| 基础测试 | 补充至少 1 个测试覆盖核心定价计算逻辑 |
| 验收 | `npx vitest run src/features/pricing` 通过 |

### 6. Monitoring（监控）— 目标 L3
| 行动 | 说明 |
|:---|:---|
| 清理 TODO | 搜索并处理目录中的 `// TODO` |
| 补充健康检查 | 如有健康检查 action，补充基本的端点可用性测试 |
| 验收 | `npx vitest run src/features/monitoring` 通过 |

## 全局验收标准
1. 以上 6 个模块的测试全部通过。
2. `npx tsc --noEmit` 不引入新的编译错误。
3. 至少生成 3 份新文档（sales / auth / search 的需求文档）。
4. monitoring 模块的 TODO 数清零或仅保留有详细说明的。

## 交付说明
完成后：
1. 运行 `npx tsc --noEmit` 确认无编译错误。
2. 分别运行 6 个模块的 vitest 确认通过。
3. 宣告"Task 11 完成"并逐模块汇报新增的测试数量和文档情况。
