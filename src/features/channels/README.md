# 渠道模块 (Channels)

渠道管理核心模块，支持多级渠道结构、佣金计算与结算。已升级至 L5 成熟度标准。

## 目录结构

```
channels/
├── actions/          # Server Actions (L5: 包含权限检查、审计日志与缓存控制)
│   ├── analytics.ts      # 渠道分析 (已解耦计算逻辑)
│   ├── channel-stats.ts  # 渠道统计 (已解耦计算逻辑)
│   ├── mutations.ts      # 渠道 CRUD
│   └── ...
├── components/       # UI 组件 (L5: 包含骨架屏、优雅空状态与响应式设计)
│   ├── channel-analytics.tsx # 分析看板
│   ├── channel-ranking.tsx   # 业绩排行
│   └── channel-table.tsx     # 渠道列表 (支持数据脱敏展示)
├── logic/            # 核心引擎 (L5: 抽离可测试的纯计算函数)
│   ├── analytics-engine.ts   # KPI 计算引擎
│   ├── stats-engine.ts       # 数据聚合引擎
│   └── __tests__/            # 单元测试 (D3: 100% 覆盖核心计算)
└── README.md
```

## L5 核心变更

### 1. 架构解耦 (Architecture Decoupling)
为了规避 Next.js Runtime 对单元测试的干扰，我们将核心 KPI 计算（ROI、转化率等）从 Server Actions 中抽离到 `logic/*-engine.ts`。这使得业务逻辑可以在纯 Node.js/Vitest 环境下进行极速验证。

### 2. 性能优化 (Performance)
- **多级并发**: 在 `_getChannelStatsInternal` 及其它复合查询中，全面使用 `Promise.all` 替代串行操作。
- **智能缓存**: 引入 `unstable_cache` 对分析看板进行一小时级别的缓存，并通过 `revalidateTag(['channel-xxx'])` 实现写操作后的精准失效。

### 3. 安全合规 (Security & Compliance)
- **权限边界**: 所有 Action 强制执行 `checkPermission`。
- **自动化审计**: 关键视图（看板、详情）和所有变更操作均记录至 `AuditService`。
- **输入校验**: 强化了 Zod Schema 校验，防止非法数值注入。

## 开发与测试

### 单元测试
```bash
# 运行解耦后的计算逻辑测试
npx vitest run src/features/channels/logic/__tests__
```

### 缓存刷新
当渠道数据发生变更时，会触发以下 Tag 的失效：
- `channel-analytics`
- `channel-categories`
- `channel-stats-${id}`
