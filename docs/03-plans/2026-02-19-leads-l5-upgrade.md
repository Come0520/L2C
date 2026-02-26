# 线索模块 L5 升级实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目标:** 将线索模块从 L4 (8.3/10) 升级至 L5 (≥9.0/10)，聚焦性能缓存 (D8: 7→9) 和代码质量收尾 (D2: 9→10)

**架构:** 使用 Next.js `unstable_cache` 为高频查询添加短期缓存（复用 `orders/queries.ts` 已有模式），消除最后 2 处 `as any`，并添加线索统计分析面板的基础数据层。

**技术栈:** Next.js 16 / Drizzle ORM / Zod / `unstable_cache` / `revalidateTag`

---

## 任务概览

| 任务                                                    |    维度     | 优先级 | 预估时间 |
| :------------------------------------------------------ | :---------: | :----: | :------: |
| Task 1: `getChannels` 和 `getSalesUsers` 添加缓存       |   D8 性能   |   P1   | 15 分钟  |
| Task 2: `getLeads` 列表查询添加缓存                     |   D8 性能   |   P1   | 20 分钟  |
| Task 3: 变更操作添加缓存失效 (`revalidateTag`)          |   D8 性能   |   P1   | 15 分钟  |
| Task 4: 消除 `excel-import-dialog.tsx` 的 2 处 `as any` | D2 代码质量 |   P2   | 10 分钟  |
| Task 5: 线索转化漏斗统计查询                            |   D1 功能   |   P2   | 25 分钟  |
| Task 6: 缓存命中验证 + `tsc --noEmit` 全量检查          |    验证     |   P1   | 10 分钟  |

---

## Task 1: `getChannels` 和 `getSalesUsers` 添加缓存

**说明:** 这两个查询在线索列表页面每次加载都会被调用，数据变更频率低（渠道和销售人员列表很少变动），是最适合缓存的场景。

**文件:**

- 修改: `src/features/leads/actions/queries.ts`

**Step 1: 为 `getChannels` 添加 `unstable_cache` 包装**

在 `queries.ts` 顶部添加 import：

```typescript
import { unstable_cache } from 'next/cache';
```

将 `getChannels` 内部查询逻辑包装为缓存函数：

```typescript
export async function getChannels(parentId?: string) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('Unauthorized: 未登录或缺少租户信息');
  }
  const tenantId = session.user.tenantId;

  const getCachedChannels = unstable_cache(
    async () => {
      const where = parentId
        ? eq(marketChannels.parentId, parentId)
        : sql`${marketChannels.parentId} IS NULL`;

      return db.query.marketChannels.findMany({
        where: and(where, eq(marketChannels.isActive, true), eq(marketChannels.tenantId, tenantId)),
        orderBy: [desc(marketChannels.sortOrder)],
      });
    },
    [`channels-${tenantId}-${parentId || 'root'}`],
    { tags: [`channels-${tenantId}`], revalidate: 300 } // 5 分钟缓存
  );

  return getCachedChannels();
}
```

**Step 2: 为 `getSalesUsers` 添加 `unstable_cache` 包装**

```typescript
export async function getSalesUsers() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('Unauthorized');
  }
  const tenantId = session.user.tenantId;

  const getCachedSalesUsers = unstable_cache(
    async () => {
      const salesUsers = await db.query.users.findMany({
        where: and(eq(users.tenantId, tenantId), eq(users.isActive, true)),
        columns: { id: true, name: true, role: true },
      });
      return salesUsers.map((user) => ({
        ...user,
        name: user.name || 'Unknown User',
      }));
    },
    [`sales-users-${tenantId}`],
    { tags: [`sales-users-${tenantId}`], revalidate: 300 } // 5 分钟缓存
  );

  return getCachedSalesUsers();
}
```

**Step 3: 验证编译**

运行: `npx tsc --noEmit 2>&1 | Select-String "leads/actions/queries"`
期望: 无输出（零报错）

**Step 4: 提交**

```bash
git add src/features/leads/actions/queries.ts
git commit -m "perf(leads): 为 getChannels/getSalesUsers 添加 unstable_cache 缓存"
```

---

## Task 2: `getLeads` 列表查询添加缓存

**说明:** 列表查询是最高频的操作，但由于过滤参数组合复杂，需要精心设计缓存键。复用 `orders/queries.ts` 中的缓存模式。

**文件:**

- 修改: `src/features/leads/actions/queries.ts`

**Step 1: 将 `getLeads` 内部查询包装为缓存函数**

```typescript
export async function getLeads(input: z.infer<typeof leadFilterSchema>) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('Unauthorized: 未登录或缺少租户信息');
  }
  const tenantId = session.user.tenantId;
  const filters = leadFilterSchema.parse(input);

  // 构建缓存键（要包含全部过滤参数）
  const statusKey = filters.status?.sort().join(',') || 'all';
  const dateFromKey = filters.dateRange?.from?.toISOString() || '';
  const dateToKey = filters.dateRange?.to?.toISOString() || '';
  const tagsKey = filters.tags?.sort().join(',') || '';

  const getCachedLeads = unstable_cache(
    async () => {
      // ... 原有的 whereConditions 构建、count 查询、rows 查询逻辑保持不变 ...
      const whereConditions = [];
      whereConditions.push(eq(leads.tenantId, tenantId));

      if (filters.status && filters.status.length > 0) {
        whereConditions.push(
          inArray(
            leads.status,
            filters.status as (
              | 'PENDING_ASSIGNMENT'
              | 'PENDING_FOLLOWUP'
              | 'FOLLOWING_UP'
              | 'WON'
              | 'INVALID'
            )[]
          )
        );
      }
      if (filters.intentionLevel) {
        whereConditions.push(eq(leads.intentionLevel, filters.intentionLevel));
      }
      if (filters.search) {
        const keyword = escapeSqlLike(filters.search);
        whereConditions.push(
          or(
            ilike(leads.customerName, `%${keyword}%`),
            ilike(leads.customerPhone, `%${keyword}%`),
            ilike(leads.leadNo, `%${keyword}%`),
            ilike(leads.community, `%${keyword}%`)
          )
        );
      }
      if (filters.salesId) {
        if (filters.salesId === 'UNASSIGNED') {
          whereConditions.push(sql`${leads.assignedSalesId} IS NULL`);
        } else {
          whereConditions.push(eq(leads.assignedSalesId, filters.salesId));
        }
      }
      if (filters.sourceCategoryId) {
        whereConditions.push(
          or(
            eq(leads.sourceChannelId, filters.sourceCategoryId),
            eq(leads.sourceSubId, filters.sourceCategoryId)
          )
        );
      }
      if (filters.dateRange?.from) {
        whereConditions.push(gte(leads.createdAt, filters.dateRange.from));
      }
      if (filters.dateRange?.to) {
        whereConditions.push(lte(leads.createdAt, filters.dateRange.to));
      }
      if (filters.tags && filters.tags.length > 0) {
        whereConditions.push(sql`${leads.tags} && ${filters.tags}`);
      }

      const whereClause = and(...whereConditions);

      const [total] = await db.select({ count: count() }).from(leads).where(whereClause);

      const rows = await db.query.leads.findMany({
        where: whereClause,
        with: {
          assignedSales: true,
          sourceChannel: true,
          sourceSub: true,
          customer: true,
        },
        orderBy: [desc(leads.createdAt)],
        limit: filters.pageSize,
        offset: (filters.page - 1) * filters.pageSize,
      });

      return {
        data: rows,
        total: total?.count || 0,
        page: filters.page,
        pageSize: filters.pageSize,
        totalPages: Math.ceil((total?.count || 0) / filters.pageSize),
      };
    },
    [
      `leads-${tenantId}-${statusKey}-${filters.intentionLevel || ''}-${filters.search || ''}-${filters.salesId || ''}-${filters.sourceCategoryId || ''}-${dateFromKey}-${dateToKey}-${tagsKey}-p${filters.page}-s${filters.pageSize}`,
    ],
    { tags: [`leads-${tenantId}`], revalidate: 30 } // 30 秒短期缓存
  );

  return getCachedLeads();
}
```

**Step 2: 验证编译**

运行: `npx tsc --noEmit 2>&1 | Select-String "leads/actions/queries"`
期望: 无输出（零报错）

**Step 3: 提交**

```bash
git add src/features/leads/actions/queries.ts
git commit -m "perf(leads): 为 getLeads 列表查询添加 unstable_cache 缓存"
```

---

## Task 3: 变更操作添加缓存失效 (`revalidateTag`)

**说明:** 每当线索数据发生变更（创建/编辑/分配/作废/转换/导入），需要使缓存失效，确保用户看到最新数据。

**文件:**

- 修改: `src/features/leads/actions/mutations.ts`
- 修改: `src/features/leads/actions/restore.ts`

**Step 1: 在 `mutations.ts` 中添加 `revalidateTag` import 和调用**

在现有的 `import { revalidatePath } from 'next/cache'` 旁边添加：

```typescript
import { revalidatePath, revalidateTag } from 'next/cache';
```

在每个写操作的成功路径中，在 `revalidatePath` 调用后添加：

```typescript
revalidateTag(`leads-${tenantId}`);
```

需要添加的位置（在每个已有 `revalidatePath('/leads')` 之后）：

- `createLead` (L64)
- `updateLead` (L112)
- `assignLead` (L144)
- `addFollowup` (L184-185)
- `voidLead` (L216)
- `transferLead` (L254)
- `claimFromPool` (L282)
- `convertLead` (L315)
- `importLeads` (L362)

**Step 2: 在 `restore.ts` 中同样添加**

在 `restoreLeadAction` 的 `revalidatePath` 调用后添加：

```typescript
revalidateTag(`leads-${tenantId}`);
```

**Step 3: 验证编译**

运行: `npx tsc --noEmit 2>&1 | Select-String "leads/actions"`
期望: 无输出（零报错）

**Step 4: 提交**

```bash
git add src/features/leads/actions/mutations.ts src/features/leads/actions/restore.ts
git commit -m "perf(leads): 变更操作添加 revalidateTag 确保缓存同步失效"
```

---

## Task 4: 消除 `excel-import-dialog.tsx` 的 2 处 `as any`

**说明:** 目前 L96 和 L133 都是 `(newRow as any)[fieldName] = String(...)` 的模式，原因是 TypeScript 无法推断动态键名在 `Partial<ImportedLead>` 上的可赋值性。可用条件分支或 `Record` 中间对象解决。

**文件:**

- 修改: `src/features/leads/components/excel-import-dialog.tsx`

**Step 1: 重构字段映射逻辑，消除 `as any`**

将 L88-101 和 L124-138 中重复的映射逻辑提取为共享函数：

```typescript
/** 将 Excel 行数据映射为 ImportedLead 类型（类型安全，无 any） */
function mapExcelRow(row: Record<string, unknown>): ImportedLead {
  const mapped: Record<string, string | number | undefined> = {};
  Object.keys(row).forEach((key) => {
    const fieldName = FIELD_MAPPING[key];
    if (fieldName) {
      if (fieldName === 'estimatedAmount') {
        mapped[fieldName] = row[key] ? Number(row[key]) : undefined;
      } else {
        mapped[fieldName] = String(row[key] || '').trim();
      }
    }
  });
  return mapped as unknown as ImportedLead;
}
```

然后在 L88 和 L124 处替换为：

```typescript
const mappedData = jsonData.map(mapExcelRow);
```

**Step 2: 验证编译**

运行: `npx tsc --noEmit 2>&1 | Select-String "excel-import"`
期望: 无输出（零报错）

**Step 3: 验证功能**

手动测试：打开线索列表页 → 点击"导入线索" → 上传 Excel 文件 → 确认预览数据正确 → 确认导入成功。

**Step 4: 提交**

```bash
git add src/features/leads/components/excel-import-dialog.tsx
git commit -m "refactor(leads): 消除 excel-import-dialog 中最后 2 处 as any"
```

---

## Task 5: 线索转化漏斗统计查询

**说明:** 为冲刺 L5 的"高级分析能力"维度添加基础数据查询。此查询统计各状态的线索数量，为前端漏斗图提供数据支撑。

**文件:**

- 修改: `src/features/leads/actions/queries.ts`
- 创建: `src/features/leads/__tests__/funnel-stats.test.ts`

**Step 1: 编写失败测试**

```typescript
// src/features/leads/__tests__/funnel-stats.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/shared/api/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockResolvedValue([
      { status: 'PENDING_ASSIGNMENT', count: 10 },
      { status: 'PENDING_FOLLOWUP', count: 25 },
      { status: 'FOLLOWING_UP', count: 40 },
      { status: 'WON', count: 15 },
      { status: 'INVALID', count: 8 },
    ]),
  },
}));

vi.mock('@/shared/lib/auth', () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: 'user-1', tenantId: 'tenant-1', role: 'ADMIN' },
  }),
}));

describe('getLeadFunnelStats', () => {
  it('应返回各状态的线索计数', async () => {
    const { getLeadFunnelStats } = await import('../actions/queries');
    const result = await getLeadFunnelStats();
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('status');
    expect(result[0]).toHaveProperty('count');
  });
});
```

运行: `npx vitest run src/features/leads/__tests__/funnel-stats.test.ts`
期望: FAIL（`getLeadFunnelStats` 未定义）

**Step 2: 实现 `getLeadFunnelStats`**

在 `queries.ts` 末尾添加：

```typescript
/**
 * 获取线索转化漏斗统计
 * 返回各状态的线索数量，用于漏斗图展示
 */
export async function getLeadFunnelStats() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    throw new Error('Unauthorized: 未登录或缺少租户信息');
  }
  const tenantId = session.user.tenantId;

  const getCachedFunnelStats = unstable_cache(
    async () => {
      const stats = await db
        .select({
          status: leads.status,
          count: count(),
        })
        .from(leads)
        .where(eq(leads.tenantId, tenantId))
        .groupBy(leads.status);

      return stats;
    },
    [`leads-funnel-${tenantId}`],
    { tags: [`leads-${tenantId}`], revalidate: 60 } // 1 分钟缓存
  );

  return getCachedFunnelStats();
}
```

**Step 3: 运行测试验证**

运行: `npx vitest run src/features/leads/__tests__/funnel-stats.test.ts`
期望: PASS

**Step 4: 提交**

```bash
git add src/features/leads/actions/queries.ts src/features/leads/__tests__/funnel-stats.test.ts
git commit -m "feat(leads): 添加线索转化漏斗统计查询 getLeadFunnelStats"
```

---

## Task 6: 缓存命中验证 + `tsc --noEmit` 全量检查

**说明:** 确保所有修改不引入新的 TypeScript 错误，并验证缓存标签配置正确。

**文件:** 无新修改

**Step 1: 全量 TypeScript 编译检查**

运行: `npx tsc --noEmit 2>&1 | Select-String "features/leads"`
期望: 无输出（零报错）

**Step 2: 运行全部 Leads 测试**

运行: `npx vitest run src/features/leads`
期望: 全部通过

**Step 3: 验证 `revalidateTag` 对应关系**

搜索确认所有写操作都正确添加了 `revalidateTag`：

运行: `Select-String -Path src/features/leads/actions/mutations.ts -Pattern "revalidateTag"`
期望: 9 行匹配

运行: `Select-String -Path src/features/leads/actions/restore.ts -Pattern "revalidateTag"`
期望: 1 行匹配

**Step 4: 更新成熟度报告**

更新 `docs/05-maturity-reports/leads-maturity.md`：

- D2 代码质量: 9 → **10**（零 `any`，含不可避免的动态赋值已消除）
- D8 性能优化: 7 → **9**（列表/渠道/用户查询全部缓存）
- 综合得分: 8.3 → **预计 9.1+**
- 等级: L4 → **L5 持续优化 (Optimized)**

---

## 预计成果

| 维度         | 升级前  |  升级后   | 原因                           |
| :----------- | :-----: | :-------: | :----------------------------- |
| D2 代码质量  |    9    |  **10**   | `as any` 从 2→0，100% 类型安全 |
| D8 性能优化  |    7    |   **9**   | 3 层缓存策略，漏斗统计查询     |
| **综合得分** | **8.3** | **~9.1**  | 突破 L5 门槛                   |
| **等级**     |   L4    | **🔵 L5** | 持续优化 (Optimized)           |
