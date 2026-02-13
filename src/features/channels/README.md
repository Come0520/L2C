# 渠道模块 (Channels)

渠道管理核心模块，支持多级渠道结构、佣金计算与结算。

## 目录结构

```
channels/
├── actions/          # Server Actions
│   ├── mutations.ts      # 渠道 CRUD
│   ├── queries.ts        # 渠道查询
│   ├── commissions.ts    # 佣金管理
│   ├── settlements.ts    # 结算单管理
│   ├── analytics.ts      # 数据分析
│   ├── settings.ts       # 归因设置
│   ├── categories.ts     # 分类管理
│   ├── channel-config.ts # 等级折扣配置
│   ├── channel-products.ts # 选品池管理
│   └── schema.ts         # Zod schemas
├── components/       # UI 组件
│   ├── channel-tree.tsx      # 渠道树
│   ├── channel-form-dialog.tsx
│   ├── channel-detail.tsx
│   └── ...
└── logic/            # 业务逻辑
    ├── commission.service.ts # 佣金核心服务
    └── __tests__/            # 单元测试
```

## 核心功能

### 渠道管理
- 三级渠道结构 (一级/二级/三级)
- 联系人管理
- 状态管理 (活跃/暂停/终止)

### 佣金结算
- **返佣模式**: 按订单金额比例计算
- **底价模式**: 按销售价与底价差额计算
- 三种触发时机: 订单创建/完成/收款

### 结算流程
1. 创建结算单 (汇总周期佣金)
2. 提交审批
3. 审批通过 → 自动生成付款单
4. 确认付款

## 权限要求

| 操作 | 权限 |
|------|------|
| 创建渠道 | `CHANNEL.CREATE` |
| 编辑渠道 | `CHANNEL.EDIT` |
| 删除渠道 | `CHANNEL.DELETE` |
| 佣金管理 | `CHANNEL.MANAGE_COMMISSION` |
| 结算管理 | `CHANNEL.MANAGE_SETTLEMENT` |
| 审批结算 | `FINANCE.APPROVE` |

## 测试

```bash
# 运行单元测试
pnpm vitest run src/features/channels

# 运行 E2E 测试
pnpm playwright test e2e/flows/channel*.spec.ts
```
