# 安装管理模块 (Installation Module)

## 模块概述
本模块负责管理所有订单的安装任务流程，包括派单、上门预约、现场安装、项目核销及费率计算。

## 核心流程状态机
```mermaid
state_chart
    [*] --> PENDING_DISPATCH : 订单确认
    PENDING_DISPATCH --> DISPATCHING : 开始指派
    DISPATCHING --> PENDING_VISIT : 师傅接单
    PENDING_VISIT --> PENDING_CONFIRM : 现场签到/完工转交
    PENDING_CONFIRM --> COMPLETED : 客户验收
    PENDING_CONFIRM --> PENDING_VISIT : 验收驳回
    COMPLETED --> [*]
    PENDING_DISPATCH --> CANCELLED : 订单取消
```

## 技术特性 (L5 级)
- **高性能查询**：利用 `(tenantId, status)` 复合索引实现高效分页。
- **稳健性设计**：前端采用 `InstallTaskSkeleton` 与全局错误边界。
- **自动化计算**：基于 `pricing-actions.ts` 实现师傅与租户级的费率分级计算。

## 核心目录
- `actions.ts`: 核心安装任务操作。
- `actions/pricing-actions.ts`: 费率逻辑管理。
- `components/`: UI 组件库 (表格、骨架屏等)。
