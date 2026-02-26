# 售后模块 L4→L5 升级实施方案

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标：** 将售后模块从 L4（6.56/10）提升至 L5（≥8.0/10），解决性能瓶颈、测试缺口、占位组件和文档过时四大问题。

**架构：** 采用四阶段渐进式升级。阶段一修复性能瓶颈（D8 4→7），阶段二补全测试覆盖（D3 6→8），阶段三实现占位功能（D1/D5 6.5→8），阶段四同步文档（D4 6→8）。每阶段完成后运行验证。

**技术栈：** Next.js 16 / Drizzle ORM / Zod / Vitest / React

---

## 阶段一：性能优化 (D8: 4→7)

> 预计工作量：1.5 天

### Task 1: 为分析查询添加 `unstable_cache`

**文件：**

- 修改: `src/features/after-sales/actions/analytics.ts`
- 测试: `src/features/after-sales/__tests__/analytics-cache.test.ts`

**Step 1: 在 `analytics.ts` 中包裹缓存**

在 `analytics.ts` 顶部添加 `unstable_cache` 导入，将 `getAfterSalesQualityAnalyticsAction` 内的三个数据库查询（liabilityByParty / ticketsByType / ticketsByStatus）包裹在 `unstable_cache` 中。

```typescript
import { unstable_cache } from 'next/cache';

// 在 action 内部为每个聚合查询添加缓存
const getCachedLiabilityByParty = unstable_cache(
  async (tenantId: string, startDate?: string, endDate?: string) => {
    const dateConditions: SQL[] = [];
    if (startDate)
      dateConditions.push(sql`${liabilityNotices.confirmedAt} >= ${new Date(startDate)}`);
    if (endDate) dateConditions.push(sql`${liabilityNotices.confirmedAt} <= ${new Date(endDate)}`);

    return db
      .select({
        liablePartyType: liabilityNotices.liablePartyType,
        count: count(liabilityNotices.id),
        totalAmount: sum(sql`CAST(${liabilityNotices.amount} AS DECIMAL)`),
      })
      .from(liabilityNotices)
      .where(
        and(
          eq(liabilityNotices.tenantId, tenantId),
          eq(liabilityNotices.status, 'CONFIRMED'),
          ...dateConditions
        )
      )
      .groupBy(liabilityNotices.liablePartyType);
  },
  ['after-sales-liability-by-party'],
  { revalidate: 300, tags: ['after-sales-analytics'] }
);
```

同理对 `ticketsByType` 和 `ticketsByStatus` 查询做同样处理。

**Step 2: 在写操作中添加缓存失效**

在 `ticket.ts` 的 `createAfterSalesTicketAction` 和 `updateTicketStatusAction` 的 `revalidatePath` 之后添加：

```typescript
import { revalidateTag } from 'next/cache';
// ...在 revalidatePath 之后：
revalidateTag('after-sales-analytics');
```

在 `liability.ts` 的 `confirmLiabilityNoticeAction` 中同样添加。

**Step 3: 验证**

运行: `npx tsc --noEmit --project tsconfig.json 2>&1 | Select-String "after-sales"`
期望: 无编译错误

**Step 4: 提交**

```bash
git add src/features/after-sales/actions/
git commit -m "perf(after-sales): 为分析查询添加 unstable_cache 缓存"
```

---

### Task 2: 修复 `deduction-safety.ts` 中的 N+1 查询

**文件：**

- 修改: `src/features/after-sales/logic/deduction-safety.ts:63-183`
- 测试: `src/features/after-sales/__tests__/deduction-safety.test.ts`

**Step 1: 用聚合查询替换内存循环**

当前代码（第76-100行）先 `findMany` 拉取所有 notices，然后在内存中 for 循环求和。应改为数据库层聚合：

```typescript
export async function getDeductionLedger(
  partyType: LiablePartyType,
  partyId: string
): Promise<DeductionLedger | null> {
  const session = await auth();
  if (!session?.user?.tenantId) return null;
  const tenantId = session.user.tenantId;

  // 用聚合查询替代全量拉取 + 内存循环（消除 N+1）
  const [summary] = await db
    .select({
      totalDeducted: sum(
        sql`CASE WHEN ${liabilityNotices.status} = 'CONFIRMED' THEN CAST(${liabilityNotices.amount} AS DECIMAL) ELSE 0 END`
      ),
      totalSettled: sum(
        sql`CASE WHEN ${liabilityNotices.status} = 'CONFIRMED' AND ${liabilityNotices.financeStatus} = 'SYNCED' THEN CAST(${liabilityNotices.amount} AS DECIMAL) ELSE 0 END`
      ),
      noticeCount: count(liabilityNotices.id),
    })
    .from(liabilityNotices)
    .where(
      and(
        eq(liabilityNotices.tenantId, tenantId),
        eq(liabilityNotices.liablePartyType, partyType),
        eq(liabilityNotices.liablePartyId, partyId)
      )
    );

  if (!summary || Number(summary.noticeCount) === 0) return null;

  const totalDeducted = Number(summary.totalDeducted || 0);
  const totalSettled = Number(summary.totalSettled || 0);
  const pendingAmount = totalDeducted - totalSettled;

  // ...后续 partyName / maxAllowed 查询保持不变
}
```

**Step 2: 对 `getAllDeductionLedgers` 同样处理**

`getAllDeductionLedgers`（第259-286行）也存在拉取全部 notices 的问题，改为分组聚合查询。

**Step 3: 运行现有测试确保不回归**

运行: `npx vitest run src/features/after-sales/__tests__/deduction-safety.test.ts`
期望: 所有测试通过

**Step 4: 提交**

```bash
git add src/features/after-sales/logic/deduction-safety.ts
git commit -m "perf(after-sales): 用数据库聚合替代内存循环消除 N+1"
```

---

### Task 3: 为核心表添加复合索引

**文件：**

- 修改: `src/shared/api/schema/after-sales.ts`（在表定义后添加索引）

**Step 1: 添加索引声明**

在 `afterSalesTickets` 表定义后添加：

```typescript
import { index } from 'drizzle-orm/pg-core';

// 在表对象导出后追加
export const afterSalesTicketsIndexes = {
  tenantStatusIdx: index('idx_as_tickets_tenant_status').on(
    afterSalesTickets.tenantId,
    afterSalesTickets.status
  ),
  tenantCreatedIdx: index('idx_as_tickets_tenant_created').on(
    afterSalesTickets.tenantId,
    afterSalesTickets.createdAt
  ),
};

export const liabilityNoticesIndexes = {
  tenantPartyIdx: index('idx_liability_tenant_party').on(
    liabilityNotices.tenantId,
    liabilityNotices.liablePartyType,
    liabilityNotices.liablePartyId
  ),
};
```

**Step 2: 验证编译**

运行: `npx tsc --noEmit`
期望: 无编译错误

**Step 3: 提交**

```bash
git add src/shared/api/schema/after-sales.ts
git commit -m "perf(after-sales): 添加复合索引定义"
```

---

### Task 4: 组件懒加载

**文件：**

- 修改: `src/features/after-sales/components/after-sales-detail.tsx`

**Step 1: 动态导入重量级组件**

将 `SLAStatus`、`TraceabilityView` 等大组件改为动态导入：

```typescript
import dynamic from 'next/dynamic';

const SLAStatus = dynamic(() => import('./sla-status').then(m => ({ default: m.SLAStatus })), {
    loading: () => <div className="h-24 animate-pulse bg-muted rounded" />,
});

const TraceabilityView = dynamic(() => import('./traceability-view').then(m => ({ default: m.TraceabilityView })), {
    loading: () => <div className="h-48 animate-pulse bg-muted rounded" />,
});
```

**Step 2: 验证编译**

运行: `npx tsc --noEmit`
期望: 无编译错误

**Step 3: 提交**

```bash
git add src/features/after-sales/components/after-sales-detail.tsx
git commit -m "perf(after-sales): 对 SLA 监控和溯源视图实施懒加载"
```

---

## 阶段二：测试补全 (D3: 6→8)

> 预计工作量：1.5 天

### Task 5: 编写 `ticket.ts` Server Actions 集成测试

**文件：**

- 创建: `src/features/after-sales/__tests__/ticket-actions.test.ts`

**Step 1: 编写测试用例**

覆盖以下场景（≥ 8 个用例）：

| #   | 用例                      | 断言                                    |
| --- | ------------------------- | --------------------------------------- |
| 1   | 获取工单列表 - 正常分页   | 返回 success=true，data 含 tickets 数组 |
| 2   | 获取工单列表 - 状态筛选   | 仅返回对应状态工单                      |
| 3   | 获取工单列表 - 搜索过滤   | 按工单号模糊匹配                        |
| 4   | 创建工单 - 正常流程       | 返回 success=true + 工单数据            |
| 5   | 创建工单 - 无效 orderId   | 返回 success=false                      |
| 6   | 获取工单详情 - 存在       | 返回完整工单含关联数据                  |
| 7   | 获取工单详情 - 手机号脱敏 | phone 格式为 `138****1234`              |
| 8   | 更新状态 - 合法转换       | PENDING→INVESTIGATING 成功              |
| 9   | 更新状态 - 非法转换       | CLOSED→PENDING 失败                     |
| 10  | 更新状态 - 跨租户         | 返回工单不存在                          |

Mock 策略：

- `vi.mock('@/shared/api/db')` 返回模拟的 Drizzle 查询对象
- `vi.mock('@/shared/lib/server-action')` 使 `createSafeAction` 直接调用 handler
- `vi.mock('@/shared/lib/audit-service')` 返回空 mock

**Step 2: 运行测试验证失败**

运行: `npx vitest run src/features/after-sales/__tests__/ticket-actions.test.ts`
期望: 所有测试按预期通过或有预期内的失败

**Step 3: 提交**

```bash
git add src/features/after-sales/__tests__/ticket-actions.test.ts
git commit -m "test(after-sales): 添加 ticket actions 集成测试（10 用例）"
```

---

### Task 6: 编写 `liability.ts` Server Actions 集成测试

**文件：**

- 创建: `src/features/after-sales/__tests__/liability-actions.test.ts`

**Step 1: 编写测试用例**

覆盖以下场景（≥ 6 个用例）：

| #   | 用例                                   | 断言                           |
| --- | -------------------------------------- | ------------------------------ |
| 1   | 创建定责单 - 正常                      | 返回 success=true + 定责单数据 |
| 2   | 创建定责单 - 已关闭工单                | 返回 success=false             |
| 3   | 提交定责单 - DRAFT→PENDING_CONFIRM     | 状态正确更新                   |
| 4   | 确认定责单 - 事务完整性                | 扣款金额同步且审计日志记录     |
| 5   | 提起争议 - PENDING_CONFIRM→DISPUTED    | 状态正确且原因保存             |
| 6   | 仲裁裁决 - DISPUTED→CONFIRMED/REJECTED | 按仲裁结果更新                 |
| 7   | 跨租户访问 - 定责单隔离                | 返回定责单不存在               |

**Step 2: 运行测试**

运行: `npx vitest run src/features/after-sales/__tests__/liability-actions.test.ts`
期望: 通过

**Step 3: 提交**

```bash
git add src/features/after-sales/__tests__/liability-actions.test.ts
git commit -m "test(after-sales): 添加 liability actions 集成测试（7 用例）"
```

---

### Task 7: 补充 `analytics.ts` 测试

**文件：**

- 创建: `src/features/after-sales/__tests__/analytics-actions.test.ts`

**Step 1: 编写快照测试**

```typescript
describe('getAfterSalesQualityAnalytics', () => {
  it('应返回标准格式的统计报表', async () => {
    const result = await getAfterSalesQualityAnalytics({});
    expect(result).toMatchObject({
      liabilityByParty: expect.any(Array),
      ticketsByType: expect.any(Array),
      ticketsByStatus: expect.any(Array),
      summary: expect.objectContaining({
        totalLiabilityAmount: expect.any(Number),
        totalLiabilityCount: expect.any(Number),
      }),
    });
  });

  it('应按日期范围过滤', async () => {
    const result = await getAfterSalesQualityAnalytics({
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
    expect(result.liabilityByParty).toBeDefined();
  });
});
```

**Step 2: 运行测试**

运行: `npx vitest run src/features/after-sales/__tests__/analytics-actions.test.ts`

**Step 3: 提交**

```bash
git add src/features/after-sales/__tests__/analytics-actions.test.ts
git commit -m "test(after-sales): 添加 analytics 统计报表测试"
```

---

## 阶段三：功能补全 (D1/D5: 6→8)

> 预计工作量：1 天

### Task 8: 实现 `FiltersBar` 组件

**文件：**

- 修改: `src/features/after-sales/components/filters-bar.tsx`

**Step 1: 实现筛选条件栏**

实现基于工单状态、类型、优先级的筛选条件栏，使用 URL SearchParams 驱动。

```tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Button } from '@/shared/components/ui/button';
import { X } from 'lucide-react';

interface FiltersBarProps {
  statusOptions: { value: string; label: string }[];
  typeOptions: { value: string; label: string }[];
}

export function FiltersBar({ statusOptions, typeOptions }: FiltersBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1'); // 重置分页
    router.push(`?${params.toString()}`);
  };

  const clearAll = () => router.push('?');

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={searchParams.get('status') || ''}
        onValueChange={(v) => updateFilter('status', v || null)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="工单状态" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('type') || ''}
        onValueChange={(v) => updateFilter('type', v || null)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="工单类型" />
        </SelectTrigger>
        <SelectContent>
          {typeOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {(searchParams.get('status') || searchParams.get('type')) && (
        <Button variant="ghost" size="sm" onClick={clearAll}>
          <X className="mr-1 h-4 w-4" /> 清除筛选
        </Button>
      )}
    </div>
  );
}
```

**Step 2: 验证编译**

运行: `npx tsc --noEmit`

**Step 3: 提交**

```bash
git add src/features/after-sales/components/filters-bar.tsx
git commit -m "feat(after-sales): 实现 FiltersBar 筛选条件栏组件"
```

---

### Task 9: 实现 `ResolutionTimeline` 组件

**文件：**

- 修改: `src/features/after-sales/components/resolution-timeline.tsx`

**Step 1: 实现处理方案时间线**

展示工单从创建到关闭的完整处理历程。

```tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { formatDate } from '@/shared/utils/format';

interface TimelineEvent {
  id: string;
  timestamp: Date | string;
  action: string;
  actor: string;
  details?: string;
}

interface ResolutionTimelineProps {
  events: TimelineEvent[];
}

export function ResolutionTimeline({ events }: ResolutionTimelineProps) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">暂无处理记录</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">处理时间线</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative ml-3 border-l border-muted-foreground/20">
          {events.map((event) => (
            <li key={event.id} className="mb-6 ml-6">
              <span className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-background" />
              <div className="mb-1 flex items-center gap-2">
                <time className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</time>
                <Badge variant="outline" className="text-xs">
                  {event.action}
                </Badge>
              </div>
              <p className="text-sm font-medium">{event.actor}</p>
              {event.details && (
                <p className="mt-1 text-sm text-muted-foreground">{event.details}</p>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
```

**Step 2: 验证 → 提交**

---

### Task 10: 实现 `AddResolutionDialog` 组件

**文件：**

- 修改: `src/features/after-sales/components/add-resolution-dialog.tsx`

**Step 1: 实现处理方案录入对话框**

表单含：处理方案文字描述 + 照片上传 + 提交按钮。表单校验使用 Zod。提交后调用 `updateTicketStatus` 更新工单。

**Step 2: 验证 → 提交**

---

### Task 11: 实现其余占位组件

**文件：**

- 修改: `src/features/after-sales/components/liability-drawer.tsx`
- 修改: `src/features/after-sales/components/partial-return-dialog.tsx`
- 修改: `src/features/after-sales/components/advanced-filters-dialog.tsx`

每个组件按实际业务需求实现最小可用版本。

---

### Task 12: 实现 3 个占位 Action

**文件：**

- 修改: `src/features/after-sales/actions/ticket.ts:254-279`（`closeResolutionCostClosure` + `checkTicketFinancialClosure`）
- 修改: `src/features/after-sales/actions/warranty.ts`（`createExchangeOrder`）

**Step 1: 实现 `checkTicketFinancialClosure`**

检查工单下所有定责单是否全部 CONFIRMED 且财务已同步，决定该工单是否可以关单。

```typescript
const checkTicketFinancialClosureAction = createSafeAction(
  z.object({ ticketId: z.string().uuid() }),
  async ({ ticketId }, { session }) => {
    const tenantId = session.user.tenantId;
    const notices = await db.query.liabilityNotices.findMany({
      where: and(
        eq(liabilityNotices.afterSalesId, ticketId),
        eq(liabilityNotices.tenantId, tenantId)
      ),
    });

    const allConfirmed = notices.every((n) => n.status === 'CONFIRMED');
    const allSynced = notices.every((n) => n.financeStatus === 'SYNCED');
    const canClose = notices.length > 0 && allConfirmed && allSynced;

    return {
      success: true,
      data: { canClose, totalNotices: notices.length, allConfirmed, allSynced },
    };
  }
);
```

**Step 2: 类似方式实现其余两个**

**Step 3: 移除 `_placeholderSchema` 的引用**

**Step 4: 验证 → 提交**

---

## 阶段四：文档同步 (D4: 6→8)

> 预计工作量：0.5 天

### Task 13: 更新 README.md

**文件：**

- 修改: `src/features/after-sales/README.md`

**Step 1: 修正目录结构描述**

将第36行的 `actions.ts` 改为 `actions/` 目录结构：

```diff
-  - `actions.ts`: Server Actions 处理前端请求。
-  - `utils.ts`: 通用工具函数。
+  - `actions/`: Server Actions (按职责拆分)
+    - `ticket.ts`: 工单 CRUD 及状态管理
+    - `liability.ts`: 定责通知单全生命周期
+    - `analytics.ts`: 质量分析报表
+    - `warranty.ts`: 保修判定及换货
+    - `schemas.ts`: Zod 校验 Schema
+    - `utils.ts`: 通用工具函数
```

**Step 2: 提交**

```bash
git add src/features/after-sales/README.md
git commit -m "docs(after-sales): 更新 README 目录结构为 actions/ 模块化"
```

---

### Task 14: 清理冗余文件

**文件：**

- 检查: `src/features/after-sales/components/ticket-list-table.tsx`

**Step 1: 检查是否有引用**

运行: `Select-String -Path "src/features/after-sales/**/*.tsx" -Pattern "ticket-list-table" -Recurse`

如果无引用，删除该文件。

**Step 2: 提交**

---

## 验证计划

### 自动化验证

```bash
# 1. 类型检查
npx tsc --noEmit

# 2. 全量测试
npx vitest run src/features/after-sales/

# 3. 构建验证
npm run build 2>&1 | Select-String "after-sales"
```

### 预期提升结果

| 维度          |  升级前  |  升级后  |   提升    |
| :------------ | :------: | :------: | :-------: |
| D1 功能完整性 |   6.5    |   8.5    |   +2.0    |
| D2 代码质量   |   8.5    |   9.0    |   +0.5    |
| D3 测试覆盖   |   6.0    |   8.0    |   +2.0    |
| D4 文档完整性 |   6.0    |   8.0    |   +2.0    |
| D5 UI/UX      |   6.0    |   8.0    |   +2.0    |
| D6 安全规范   |   8.5    |   8.5    |     —     |
| D7 可运维性   |   7.5    |   7.5    |     —     |
| D8 性能优化   |   4.0    |   7.5    |   +3.5    |
| **综合**      | **6.56** | **~8.2** | **+1.64** |
