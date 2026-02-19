# 测量模块 (Measurement Module)

## 概述

测量模块负责管理从派单到完成的完整测量工作流程，包括任务分派、师傅签到、数据提交和审核确认。

## 目录结构

```
measurement/
├── actions/              # 服务端操作 (Server Actions)
│   ├── queries.ts        # 查询类操作（含缓存优化）
│   ├── mutations.ts      # 写操作（创建/分派/接单/拆单/费用减免）
│   ├── workflows.ts      # 工作流操作（提交/审核）
│   ├── check-in.ts       # GPS 签到
│   ├── reject.ts         # 多级驳回
│   └── __tests__/        # 单元测试
│       ├── queries.test.ts   # 查询测试 (5 用例)
│       └── check-in.test.ts  # 签到测试 (4 用例)
├── components/           # UI 组件
│   └── gps-check-in.tsx  # GPS 签到组件
└── README.md             # 本文件
```

## 核心功能

| 功能 | 入口函数 | 说明 |
|---|---|---|
| 任务列表查询 | `getMeasureTasks()` | 支持分页/筛选，React `cache()` 去重 |
| 任务详情 | `getMeasureTaskById()` | `unstable_cache` + 标签失效 |
| 可用师傅 | `getAvailableWorkers()` | `unstable_cache` + 租户隔离 |
| GPS 签到 | `checkInMeasureTask()` | 位置校验 + 迟到检测 |
| 多级驳回 | `rejectMeasureTask()` | 四级预警机制 (RC-03) |

## 缓存策略

- **查询缓存**：`unstable_cache` (1 小时 TTL) + `cache()` 请求去重
- **失效策略**：所有写操作调用 `revalidateTag('measure-task')` 自动失效
- **安全保障**：所有查询强制 `tenantId` 过滤（租户隔离）

## 测试

```bash
# 运行模块测试
npx vitest run src/features/service/measurement/actions/__tests__/
```
