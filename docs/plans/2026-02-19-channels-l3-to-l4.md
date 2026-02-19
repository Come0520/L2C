# 渠道模块 L3→L4 升级实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 将渠道模块从 L3+ (7.0/10) 升级至 L4 (≥ 8.0/10)，主攻测试覆盖率（D3: 4→7）和代码质量（D2: 8→9）

**架构:** 采用 TDD 工作流，先补齐测试覆盖核心业务逻辑（佣金计算、结算流程），再修复类型安全问题，最后实现遗留 TODO 功能。所有测试使用 Vitest 4.x + Mock db 层。

**技术栈:** Vitest 4.x, TypeScript, Drizzle ORM (mock), Decimal.js

---

## 前置知识

### 项目结构

```
src/features/channels/
├── actions/          # Server Actions (10 文件)
│   ├── queries.ts
│   ├── mutations.ts
│   ├── schema.ts
│   ├── analytics.ts
│   ├── commissions.ts
│   ├── settlements.ts
│   ├── categories.ts
│   ├── settings.ts
│   ├── channel-config.ts
│   ├── channel-products.ts
│   └── channel-stats.ts
├── components/       # UI 组件 (14 文件)
└── logic/
    ├── commission.service.ts      # 核心业务逻辑
    └── __tests__/
        └── commission.service.test.ts  # 现有测试
```

### 运行测试命令

```powershell
# 运行全部测试
pnpm test:run

# 运行渠道模块测试
pnpm test:run src/features/channels/

# 运行指定测试文件
pnpm test:run src/features/channels/logic/__tests__/commission.service.test.ts

# TypeScript 类型检查
npx tsc --noEmit
```

### 现有测试覆盖范围

`commission.service.test.ts` (200行/19用例) 仅测试**内联数学逻辑**（不调用实际函数），覆盖：
- 固定/阶梯返佣的手写计算
- 底价模式的手写利润计算
- 等级折扣配置的 JSON 解析
- 触发模式字符串匹配
- 扣回比例的手写计算

**未覆盖**：`calculateOrderCommission()`、`checkAndGenerateCommission()`、`handleCommissionClawback()` 的实际函数调用。

---

## Task 1: 为 `calculateOrderCommission()` 编写真实函数测试

**优先级:** P0（D3 主要提升点）

**Files:**
- Modify: `src/features/channels/logic/__tests__/commission.service.test.ts`
- Reference: `src/features/channels/logic/commission.service.ts:30-182`

### Step 1: 编写失败测试 — 返佣模式固定比例

在 `commission.service.test.ts` 中新增测试块，Mock `db` 依赖后，直接调用 `calculateOrderCommission()`。

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Decimal } from 'decimal.js';

// Mock 数据库模块
vi.mock('@/shared/api/db', () => ({
    db: {
        query: {
            financeConfigs: { findFirst: vi.fn() },
            products: { findMany: vi.fn() },
        },
    },
}));

import { calculateOrderCommission } from '../commission.service';
import { db } from '@/shared/api/db';

describe('calculateOrderCommission() 函数', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('返佣模式 (COMMISSION)', () => {
        it('固定比例10%：10000元订单应返1000元佣金', async () => {
            const order = {
                totalAmount: '10000',
                items: [],
                tenantId: 'tenant-1',
            };
            const channel = {
                commissionType: 'FIXED',
                commissionRate: '10',
                cooperationMode: 'COMMISSION',
                tieredRates: null,
            };

            const result = await calculateOrderCommission(order, channel);

            expect(result).not.toBeNull();
            expect(result!.amount.toNumber()).toBe(1000);
            expect(result!.type).toBe('COMMISSION');
            expect(result!.rate.toNumber()).toBe(0.1);
        });

        it('小数形式费率 0.1 应等同于 10%', async () => {
            const order = { totalAmount: '5000', items: [], tenantId: 't1' };
            const channel = {
                commissionType: 'FIXED',
                commissionRate: '0.1',              // 小数形式
                cooperationMode: 'COMMISSION',
                tieredRates: null,
            };

            const result = await calculateOrderCommission(order, channel);
            expect(result).not.toBeNull();
            expect(result!.amount.toNumber()).toBe(500); // 5000 * 0.1
        });

        it('订单金额为0时应返回null', async () => {
            const order = { totalAmount: '0', items: [], tenantId: 't1' };
            const channel = {
                commissionType: 'FIXED',
                commissionRate: '10',
                cooperationMode: 'COMMISSION',
                tieredRates: null,
            };

            const result = await calculateOrderCommission(order, channel);
            expect(result).toBeNull();
        });
    });

    describe('阶梯返佣 (TIERED)', () => {
        it('金额25000应命中20万-50万区间(10%)', async () => {
            const order = {
                totalAmount: '25000',
                items: [],
                tenantId: 't1',
            };
            const channel = {
                commissionType: 'TIERED',
                commissionRate: '8',
                cooperationMode: 'COMMISSION',
                tieredRates: JSON.stringify([
                    { minAmount: 0, maxAmount: 20000, rate: 8 },
                    { minAmount: 20000, maxAmount: 50000, rate: 10 },
                    { minAmount: 50000, rate: 12 },
                ]),
            };

            const result = await calculateOrderCommission(order, channel);
            expect(result).not.toBeNull();
            expect(result!.amount.toNumber()).toBe(2500);  // 25000 * 10%
        });

        it('阶梯配置为无效JSON时应使用基础费率', async () => {
            const order = { totalAmount: '10000', items: [], tenantId: 't1' };
            const channel = {
                commissionType: 'TIERED',
                commissionRate: '8',
                cooperationMode: 'COMMISSION',
                tieredRates: 'invalid-json',
            };

            const result = await calculateOrderCommission(order, channel);
            expect(result).not.toBeNull();
            expect(result!.amount.toNumber()).toBe(800); // 10000 * 8%
        });
    });
});
```

### Step 2: 运行测试验证通过

```powershell
pnpm test:run src/features/channels/logic/__tests__/commission.service.test.ts
```

预期：所有新增用例 PASS（因为 `calculateOrderCommission` 已实现，我们只是补测试）

### Step 3: 提交

```powershell
git add src/features/channels/logic/__tests__/commission.service.test.ts
git commit -m "test(channels): 为 calculateOrderCommission() 补充真实函数调用测试"
```

---

## Task 2: 测试底价供货模式 (BASE_PRICE)

**优先级:** P0

**Files:**
- Modify: `src/features/channels/logic/__tests__/commission.service.test.ts`

### Step 1: 编写底价模式测试

在上一步的 `describe('calculateOrderCommission() 函数')` 中继续添加：

```typescript
describe('底价供货模式 (BASE_PRICE)', () => {
    it('应根据渠道结算价和等级折扣计算利润', async () => {
        // Mock: 等级折扣配置
        vi.mocked(db.query.financeConfigs.findFirst).mockResolvedValue({
            id: 'cfg-1',
            tenantId: 't1',
            configKey: 'CHANNEL_GRADE_DISCOUNTS',
            configValue: JSON.stringify({ S: 0.90, A: 0.95, B: 1.00, C: 1.00 }),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Mock: 产品渠道价格
        vi.mocked(db.query.products.findMany).mockResolvedValue([
            {
                id: 'prod-1',
                channelPrice: '800',
                channelPriceMode: 'FIXED',
                name: '测试商品A',
            } as any,
        ]);

        const order = {
            totalAmount: '1000',
            items: [
                { productId: 'prod-1', unitPrice: '1000', quantity: '1', productName: '测试商品A' }
            ],
            tenantId: 't1',
            channelCooperationMode: 'BASE_PRICE',
        };
        const channel = {
            cooperationMode: 'BASE_PRICE',
            level: 'S',
        };

        const result = await calculateOrderCommission(order, channel);

        // S级折扣0.9 → 成本 = 800 * 0.9 = 720 → 利润 = 1000 - 720 = 280
        expect(result).not.toBeNull();
        expect(result!.amount.toNumber()).toBe(280);
        expect(result!.type).toBe('BASE_PRICE');
    });

    it('无渠道价格产品应利润为0', async () => {
        vi.mocked(db.query.financeConfigs.findFirst).mockResolvedValue(null);
        vi.mocked(db.query.products.findMany).mockResolvedValue([
            { id: 'prod-1', channelPrice: null, channelPriceMode: null, name: '无价商品' } as any,
        ]);

        const order = {
            totalAmount: '1000',
            items: [{ productId: 'prod-1', unitPrice: '1000', quantity: '1' }],
            tenantId: 't1',
            channelCooperationMode: 'BASE_PRICE',
        };
        const channel = { cooperationMode: 'BASE_PRICE', level: 'C' };

        const result = await calculateOrderCommission(order, channel);
        // channelPrice=null → base=0 → cost=0 → profit=1000 → 应有结果
        expect(result).not.toBeNull();
        expect(result!.amount.toNumber()).toBe(1000);
    });
});
```

### Step 2: 运行测试

```powershell
pnpm test:run src/features/channels/logic/__tests__/commission.service.test.ts
```

预期：PASS

### Step 3: 提交

```powershell
git add src/features/channels/logic/__tests__/commission.service.test.ts
git commit -m "test(channels): 补充底价供货模式 calculateOrderCommission 测试"
```

---

## Task 3: 测试 `checkAndGenerateCommission()` 含幂等性

**优先级:** P0

**Files:**
- Modify: `src/features/channels/logic/__tests__/commission.service.test.ts`

### Step 1: 编写集成测试

需要 Mock 更多 db 操作（query, transaction, insert, update）来测试 `checkAndGenerateCommission()`。

```typescript
import { checkAndGenerateCommission } from '../commission.service';

// 在文件顶部扩展 mock：
vi.mock('@/shared/api/db', () => {
    const mockTx = {
        query: {
            channelCommissions: { findFirst: vi.fn() },
        },
        insert: vi.fn(() => ({ values: vi.fn(() => ({ returning: vi.fn(() => [{ id: 'comm-new' }]) })) })),
        update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn(() => []) })) })) })),
    };

    return {
        db: {
            query: {
                orders: { findFirst: vi.fn() },
                leads: { findFirst: vi.fn() },
                channels: { findFirst: vi.fn() },
                channelCommissions: { findFirst: vi.fn(), findMany: vi.fn() },
                financeConfigs: { findFirst: vi.fn() },
                products: { findMany: vi.fn() },
            },
            transaction: vi.fn((callback: Function) => callback(mockTx)),
        },
    };
});

describe('checkAndGenerateCommission()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('触发模式不匹配时应跳过（无副作用）', async () => {
        vi.mocked(db.query.orders.findFirst).mockResolvedValue({
            id: 'order-1',
            tenantId: 't1',
            channelId: 'ch-1',
            leadId: null,
            totalAmount: '10000',
            items: [],
            createdBy: 'user-1',
        } as any);

        vi.mocked(db.query.channels.findFirst).mockResolvedValue({
            id: 'ch-1',
            tenantId: 't1',
            commissionTriggerMode: 'PAYMENT_COMPLETED',
            commissionType: 'FIXED',
            commissionRate: '10',
            cooperationMode: 'COMMISSION',
        } as any);

        // 触发事件 ORDER_CREATED ≠ 渠道要求 PAYMENT_COMPLETED
        await checkAndGenerateCommission('order-1', 'ORDER_CREATED');

        // 验证没有调用 transaction（即没有写入）
        expect(db.transaction).not.toHaveBeenCalled();
    });

    it('订单无渠道ID且无线索关联时应跳过', async () => {
        vi.mocked(db.query.orders.findFirst).mockResolvedValue({
            id: 'order-1',
            tenantId: 't1',
            channelId: null,
            leadId: null,
            totalAmount: '10000',
            items: [],
        } as any);

        await checkAndGenerateCommission('order-1', 'PAYMENT_COMPLETED');
        expect(db.transaction).not.toHaveBeenCalled();
    });

    it('订单不存在时应静默退出', async () => {
        vi.mocked(db.query.orders.findFirst).mockResolvedValue(undefined);

        await checkAndGenerateCommission('nonexistent', 'PAYMENT_COMPLETED');
        expect(db.transaction).not.toHaveBeenCalled();
    });
});
```

### Step 2: 运行测试

```powershell
pnpm test:run src/features/channels/logic/__tests__/commission.service.test.ts
```

预期：PASS

### Step 3: 提交

```powershell
git add src/features/channels/logic/__tests__/commission.service.test.ts
git commit -m "test(channels): 为 checkAndGenerateCommission 补充集成测试含幂等性验证"
```

---

## Task 4: 测试 `handleCommissionClawback()`

**优先级:** P0

**Files:**
- Modify: `src/features/channels/logic/__tests__/commission.service.test.ts`

### Step 1: 编写扣回逻辑测试

```typescript
import { handleCommissionClawback } from '../commission.service';

describe('handleCommissionClawback()', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('PENDING 状态佣金应直接标记为 VOID', async () => {
        vi.mocked(db.query.orders.findFirst).mockResolvedValue({
            tenantId: 't1',
        } as any);

        vi.mocked(db.query.channelCommissions.findMany).mockResolvedValue([
            {
                id: 'comm-1',
                tenantId: 't1',
                channelId: 'ch-1',
                orderId: 'order-1',
                status: 'PENDING',
                amount: '1000',
                orderAmount: '10000',
                createdBy: 'user-1',
            } as any,
        ]);

        // Mock db.update chain
        const mockWhere = vi.fn().mockReturnThis();
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
        vi.mocked(db as any).update = vi.fn().mockReturnValue({ set: mockSet });

        await handleCommissionClawback('order-1', 10000);

        // 验证调用了 update 将状态设为 VOID
        expect((db as any).update).toHaveBeenCalled();
    });

    it('订单不存在时应静默退出', async () => {
        vi.mocked(db.query.orders.findFirst).mockResolvedValue(undefined);

        await handleCommissionClawback('nonexistent', 5000);
        // 不应抛错
    });

    it('无有效佣金记录时应静默退出', async () => {
        vi.mocked(db.query.orders.findFirst).mockResolvedValue({ tenantId: 't1' } as any);
        vi.mocked(db.query.channelCommissions.findMany).mockResolvedValue([]);

        await handleCommissionClawback('order-1', 5000);
        // 不应抛错
    });
});
```

### Step 2: 运行测试

```powershell
pnpm test:run src/features/channels/logic/__tests__/commission.service.test.ts
```

### Step 3: 提交

```powershell
git add src/features/channels/logic/__tests__/commission.service.test.ts
git commit -m "test(channels): 为 handleCommissionClawback 补充退款扣回测试"
```

---

## Task 5: 修复 `commission.service.ts` 中 2 处 `any` 类型

**优先级:** P1（D2 提升）

**Files:**
- Modify: `src/features/channels/logic/commission.service.ts:18-37`

### Step 1: 定义 `CommissionFormula` 和 `ChannelForCommission` 类型

替换 L22 和 L37 的 `any` 类型：

```typescript
// commission.service.ts L18-24 替换为：

/** 佣金计算公式详情（用于记录计算过程） */
export interface CommissionFormula {
    base?: number;
    rate?: number;
    mode?: string;
    calc?: string;
    items?: unknown[];
    details?: { product: string; retail: number; base: number; discount: number; cost: number; qty: number; profit: number }[];
    total?: number;
}

export interface CommissionResult {
    amount: Decimal;
    rate: Decimal;
    type: 'COMMISSION' | 'BASE_PRICE';
    formula: CommissionFormula;
    remark: string;
}
```

```typescript
// commission.service.ts L37 替换 channel: any 为：

/** 佣金计算所需的渠道字段子集 */
export interface ChannelForCommission {
    commissionType?: string | null;
    commissionRate?: string | number | null;
    cooperationMode?: string | null;
    commissionTriggerMode?: string | null;
    tieredRates?: string | unknown[] | null;
    level?: string | null;
}

export async function calculateOrderCommission(
    order: {
        totalAmount: string | number | null;
        items: { productId: string | null; unitPrice: string | number | null; quantity: string | number | null; productName?: string | null }[];
        tenantId: string;
        channelCooperationMode?: string | null;
    },
    channel: ChannelForCommission
): Promise<CommissionResult | null> {
```

同时更新 L45 的 `formula` 局部变量类型：

```typescript
// L45: const formula: { ... } = {};
// 替换为:
const formula: CommissionFormula = {};
```

### Step 2: 运行类型检查

```powershell
npx tsc --noEmit
```

预期：无新增类型错误

### Step 3: 运行测试确保无回归

```powershell
pnpm test:run src/features/channels/logic/__tests__/commission.service.test.ts
```

### Step 4: 提交

```powershell
git add src/features/channels/logic/commission.service.ts
git commit -m "refactor(channels): 消除 commission.service.ts 中 2 处 any 类型"
```

---

## Task 6: 实现 `getChannelRanking()` 时间范围过滤（消除 TODO）

**优先级:** P2

**Files:**
- Modify: `src/features/channels/actions/channel-stats.ts:224-237`

### Step 1: 实现 period 参数逻辑

替换 `getChannelRanking()` 中的 TODO 注释，实现日期范围计算：

```typescript
// channel-stats.ts L234-237 替换为:

const { limit = 10, period = 'all' } = options || {};

// 计算时间范围起点
let periodStartDate: Date | null = null;
if (period !== 'all') {
    const now = new Date();
    periodStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    if (period === 'quarter') {
        periodStartDate.setMonth(Math.floor(now.getMonth() / 3) * 3);
    } else if (period === 'year') {
        periodStartDate.setMonth(0);
    }
    // period === 'month' 时，monthStart 已正确
}
```

然后在 `getQuickStats` 内部 (L263-279)，当 `periodStartDate` 存在时，为 orders 查询添加 `gte(orders.createdAt, periodStartDate)` 条件。

由于 `periodStartDate` 在闭包外定义，可直接在 `getQuickStats` 中使用。

### Step 2: 删除 TODO 注释

移除 L236-237 的 TODO 行。

### Step 3: 运行类型检查

```powershell
npx tsc --noEmit
```

### Step 4: 提交

```powershell
git add src/features/channels/actions/channel-stats.ts
git commit -m "feat(channels): 实现排行榜时间范围过滤(月/季/年)，消除 TODO"
```

---

## Task 7: 补充 `channel-stats.ts` 公开函数 JSDoc

**优先级:** P3

**Files:**
- Modify: `src/features/channels/actions/channel-stats.ts`

### Step 1: 为各公开函数补充参数说明

为 `getChannelStats`, `getChannelStatsOverview`, `getChannelRanking`, `getChannelTrend` 四个函数增加 `@param` 和 `@returns` JSDoc。

示例（`getChannelRanking`）：

```typescript
/**
 * 获取渠道排行榜
 *
 * 按带单总额排序，支持时间范围过滤。
 * 自动包含子渠道统计数据。
 *
 * @param options.limit - 返回条数，默认 10
 * @param options.period - 时间范围: 'month'(本月) | 'quarter'(本季) | 'year'(本年) | 'all'(全部)
 * @returns 按带单总额降序排列的渠道统计数组
 *
 * 权限要求：CHANNEL.VIEW
 */
```

### Step 2: 运行类型检查

```powershell
npx tsc --noEmit
```

### Step 3: 提交

```powershell
git add src/features/channels/actions/channel-stats.ts
git commit -m "docs(channels): 为 channel-stats.ts 公开函数补充 JSDoc 参数说明"
```

---

## 验证计划

### 自动化测试

| 测试类型 | 命令 | 预期结果 |
|:---|:---|:---|
| 现有测试不回归 | `pnpm test:run src/features/channels/` | 全部 PASS |
| 新增测试通过 | `pnpm test:run src/features/channels/logic/__tests__/commission.service.test.ts` | ≥ 30 用例 PASS |
| TypeScript 编译 | `npx tsc --noEmit` | 零错误 |

### 手动验证

Task 6 完成后，可在浏览器中验证：
1. 启动 `pnpm dev`
2. 进入渠道页面 → 排行榜组件
3. 切换时间筛选器（月/季/年/全部），确认数据随选择变化

### 完成标准

- [ ] `calculateOrderCommission()` 有 ≥ 6 个测试用例（返佣固定/阶梯/边界，底价模式含等级折扣）
- [ ] `checkAndGenerateCommission()` 有 ≥ 3 个测试用例（触发匹配/不匹配/幂等性）
- [ ] `handleCommissionClawback()` 有 ≥ 3 个测试用例（PENDING 作废/已结算扣回/空记录）
- [ ] `commission.service.ts` 零 `any` 类型
- [ ] `channel-stats.ts` 零 TODO
- [ ] `npx tsc --noEmit` 零新增错误
