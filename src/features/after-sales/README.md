# After-Sales (售后管理) 模块

## 模块概述
售后管理模块负责处理客户订单完成后的退换货、维修及投诉流程。该模块处于系统的核心交付链路末端，直接影响客户满意度和公司成本控制。

## 核心业务流程
1. **工单创建**: 支持按订单发起售后申请（退货、维修、投诉等）。
2. **保修判定**: 自动根据订单完成时间和租户配置判定是否在保修期。
3. **现场处理**: 记录调查、预约、回访及处理过程。
4. **定责管理**:
   - 发起定责：针对工厂、安装工、物流等责任方。
   - 业务闭环：草稿 -> 提交待确认 -> (确认 / 争议 -> 仲裁) -> 财务同步。
5. **财务同步**: 确认后的定责单自动生成供应商扣款对账单（仅限工厂/外部供应商）。

## 关键技术点
- **状态机控制**: 通过 `logic/state-machine.ts` 严格限制工单状态流转。
- **扣款安全控制**: 集成 `logic/deduction-safety.ts` 实时校验责任方信用额度，防止欠款流失。
- **虚拟成本核算**: 使用 `logic/virtual-cost-accounting.ts` 按照科目代码和归属部门进行多维度的成本分摊和报表统计。
- **审计日志**: 所有核心修改操作通过 `AuditService` 记录详细的变更前/后快照。

## 状态机定义
| 状态 | 说明 |
| :--- | :--- |
| PENDING | 待处理 |
| INVESTIGATING | 调查中 |
| PROCESSING | 处理中 |
| PENDING_VISIT | 待上门 |
| PENDING_CALLBACK | 待回访 |
| PENDING_VERIFY | 待核销/验收 |
| CLOSED | 已关闭 (终态) |
| REJECTED | 已驳回 (终态) |

## 目录结构
- `actions/`: Server Actions 处理前端请求。
  - `ticket.ts`: 工单管理（增删改查、流程控制）。
  - `liability.ts`: 定责单管理。
  - `analytics.ts`: 统计分析。
- `components/`: UI 组件。
  - `after-sales-list.tsx`: 售后列表容器。
  - `after-sales-detail.tsx`: 售后详情容器。
  - `ticket-list-table.tsx`: 工单数据表格。
  - `filters-bar.tsx`: 列表筛选栏。
  - `advanced-filters-dialog.tsx`: 高级筛选对话框。
  - `resolution-timeline.tsx`: 售后处理时间轴。
  - `liability-notice-list.tsx`: 定责单列表。
  - `liability-drawer.tsx`: 定责单详情抽屉。
- `logic/`: 核心业务逻辑。
  - `state-machine.ts`: 工单状态流转控制。
  - `deduction-safety.ts`: 扣款安全控制。
  - `virtual-cost-accounting.ts`: 虚拟成本核算。
- `__tests__/`: 自动化测试用例。
- `utils.ts`: 通用工具函数。
- `types.ts`: 数据类型定义。

## 测试标准
- **核心逻辑 (`logic/`)**: 必须保证 100% 单元测试覆盖。
- **Server Actions**: 关键流程（创建、状态变更、定责）必须包含多场景（常规、边界值、异常路径）集成测试。
- **快照测试**: 分析报表等复杂数据结构需进行快照测试。

## L5 成熟度升级记录
- [x] **性能优化**: 引入 `unstable_cache` 优化统计查询；添加复合索引提升检索效率。
- [x] **安全性**: 强化 Server Actions 的租户隔离与权限校验；实现关键操作的完全审计。
- [x] **可维护性**: 完成 UI 组件原子化重构；补全缺失的业务闭环 Action（结案、换货）。
- [x] **测试覆盖**: 集成测试用例 > 30 个，核心覆盖率 > 80%。
