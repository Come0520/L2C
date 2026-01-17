# 版本管理技术设计文档

> **文档版本**: v1.0  
> **创建日期**: 2026-01-16  
> **优先级**: P0 (核心业务逻辑)  
> **预估工时**: 2天  
> **依赖**: 数据库迁移

---

## 📋 概述

版本管理是报价模块的核心功能之一,允许用户创建报价单的多个版本,并在不同版本间切换。本文档详细说明版本管理的业务逻辑、状态机设计和实现方案。

---

## 🎯 业务需求

### 核心规则

1. **唯一ACTIVE版本**: 同一报价单号链中,同一时间只能有一个 `isActive=true` 的版本
2. **版本号递增**: 版本号从1开始,每次创建新版本时递增
3. **版本链结构**: 通过 `parentQuoteId` 形成版本链
4. **ACTIVE版本不可编辑**: 只有非ACTIVE版本可以编辑
5. **版本切换**: 可以将任意版本设置为ACTIVE,自动降级原ACTIVE版本
6. **版本克隆**: 创建新版本时深度克隆所有数据(items和rooms)

### 版本状态

| 状态 | 说明 | 可编辑 | 可激活 |
|------|------|--------|--------|
| `DRAFT` | 草稿 | ✅ | ✅ |
| `ACTIVE` | 激活(当前版本) | ❌ | - |
| `ARCHIVED` | 归档 | ❌ | ❌ |

---

## 🏗️ 数据结构

### 版本链示例

```
QuoteNo: Q20260116-001

┌─────────────────────────────────────────────────────────┐
│ Version 1 (DRAFT)                                   │
│ id: uuid-1                                          │
│ quoteNo: Q20260116-001                              │
│ version: 1                                          │
│ parentQuoteId: null                                  │
│ isActive: false                                     │
│ └─ Items: [item-1, item-2, item-3]                │
│ └─ Rooms: [room-1, room-2]                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Version 2 (ACTIVE) ◀── 当前版本                      │
│ id: uuid-2                                          │
│ quoteNo: Q20260116-001                              │
│ version: 2                                          │
│ parentQuoteId: uuid-1                               │
│ isActive: true                                      │
│ └─ Items: [item-4, item-5, item-6]                │
│ └─ Rooms: [room-3, room-4]                        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Version 3 (DRAFT)                                   │
│ id: uuid-3                                          │
│ quoteNo: Q20260116-001                              │
│ version: 3                                          │
│ parentQuoteId: uuid-2                               │
│ isActive: false                                     │
│ └─ Items: [item-7, item-8, item-9]                │
│ └─ Rooms: [room-5, room-6]                        │
└─────────────────────────────────────────────────────────┘
```

### 数据库Schema

```sql
-- quotes 表关键字段
CREATE TABLE quotes (
  id UUID PRIMARY KEY,
  quote_no VARCHAR(50) UNIQUE NOT NULL,
  version INTEGER NOT NULL,
  parent_quote_id UUID REFERENCES quotes(id),
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'DRAFT',
  -- ... 其他字段
);

-- 唯一约束:同一quoteNo链中只能有一个isActive=true
CREATE UNIQUE INDEX idx_quotes_active_version
ON quotes (quote_no, is_active)
WHERE is_active = true;
```

---

## 🔄 状态机设计

### 状态转换图

```
                    ┌──────────┐
                    │  DRAFT   │
                    └────┬─────┘
                         │
                         │ 创建新版本
                         ▼
                    ┌──────────┐
                    │  DRAFT   │
                    └────┬─────┘
                         │
                         │ 激活
                         ▼
                    ┌──────────┐
                    │  ACTIVE  │
                    └────┬─────┘
                         │
                         │ 创建新版本
                         ▼
                    ┌──────────┐
                    │  DRAFT   │
                    └──────────┘

                    ┌──────────┐
                    │  ACTIVE  │
                    └────┬─────┘
                         │
                         │ 归档
                         ▼
                    ┌──────────┐
                    │ ARCHIVED │
                    └──────────┘
```

### 状态转换规则

| 当前状态 | 目标状态 | 条件 | 操作 |
|----------|----------|------|------|
| `DRAFT` | `ACTIVE` | - | 设置 `isActive=true`,降级其他ACTIVE版本 |
| `DRAFT` | `ARCHIVED` | - | 设置 `status='ARCHIVED'` |
| `ACTIVE` | `DRAFT` | 创建新版本 | 创建新版本,原版本保持 `isActive=false` |
| `ACTIVE` | `ARCHIVED` | - | 设置 `status='ARCHIVED'`, `isActive=false` |
| `ARCHIVED` | - | - | 不可转换 |

---

## 🔧 核心功能实现

### 1. 创建新版本 (Create Next Version)

#### 业务逻辑

1. 查询原版本及其关联数据(items, rooms)
2. 在同一事务中:
   - 降级原版本(设置 `isActive=false`)
   - 创建新版本(递增版本号,设置 `isActive=true`)
   - 深度克隆items
   - 深度克隆rooms
3. 返回新版本

#### 实现代码

```typescript
// src/services/quote.service.ts

import { db } from '@/shared/api/db';
import { quotes, quoteItems, quoteRooms } from '@/shared/api/schema';
import { eq, and, desc } from 'drizzle-orm';

export class QuoteService {
  /**
   * 创建新版本
   * @param quoteId 原版本ID
   * @param userId 创建用户ID
   * @param tenantId 租户ID
   * @returns 新版本
   */
  static async createNextVersion(quoteId: string, userId: string, tenantId: string) {
    return await db.transaction(async (tx) => {
      // 步骤1: 查询原版本
      const originalQuote = await tx.query.quotes.findFirst({
        where: eq(quotes.id, quoteId),
        with: {
          items: true,
          rooms: true,
          customer: true,
        }
      });

      if (!originalQuote) {
        throw new Error('Quote not found');
      }

      // 步骤2: 降级原版本
      await tx.update(quotes)
        .set({ 
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, quoteId));

      // 步骤3: 创建新版本
      const newVersion = originalQuote.version + 1;
      const baseQuoteNo = originalQuote.quoteNo.replace(/-V\d+$/, '');
      const newQuoteNo = `${baseQuoteNo}-V${newVersion}`;

      const [newQuote] = await tx.insert(quotes).values({
        tenantId: originalQuote.tenantId,
        quoteNo: newQuoteNo,
        customerId: originalQuote.customerId,
        leadId: originalQuote.leadId,
        measureVariantId: originalQuote.measureVariantId,
        parentQuoteId: originalQuote.id,
        title: originalQuote.title,
        totalAmount: originalQuote.totalAmount,
        discountRate: originalQuote.discountRate,
        discountAmount: originalQuote.discountAmount,
        finalAmount: originalQuote.finalAmount,
        status: 'DRAFT',
        version: newVersion,
        isActive: true,
        validUntil: originalQuote.validUntil,
        notes: originalQuote.notes,
        lockedAt: null,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // 步骤4: 克隆rooms
      if (originalQuote.rooms.length > 0) {
        const roomMap = new Map<string, string>();
        
        for (const room of originalQuote.rooms) {
          const [newRoom] = await tx.insert(quoteRooms).values({
            tenantId: originalQuote.tenantId,
            quoteId: newQuote.id,
            name: room.name,
            measureRoomId: room.measureRoomId,
            sortOrder: room.sortOrder,
            createdAt: new Date(),
          }).returning();
          
          roomMap.set(room.id, newRoom.id);
        }
        
        // 步骤5: 克隆items(更新roomId)
        if (originalQuote.items.length > 0) {
          const itemMap = new Map<string, string>();
          
          for (const item of originalQuote.items) {
            const [newItem] = await tx.insert(quoteItems).values({
              tenantId: originalQuote.tenantId,
              quoteId: newQuote.id,
              parentId: null, // 顶级项
              roomId: item.roomId ? roomMap.get(item.roomId) : null,
              roomName: item.roomName,
              category: item.category,
              productId: item.productId,
              productName: item.productName,
              productSku: item.productSku,
              unit: item.unit,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              width: item.width,
              height: item.height,
              foldRatio: item.foldRatio,
              processFee: item.processFee,
              subtotal: item.subtotal,
              attributes: item.attributes,
              calculationParams: item.calculationParams,
              remark: item.remark,
              sortOrder: item.sortOrder,
              createdAt: new Date(),
            }).returning();
            
            itemMap.set(item.id, newItem.id);
          }
          
          // 步骤6: 克隆附件项(更新parentId)
          for (const item of originalQuote.items) {
            if (item.parentId) {
              const newParentId = itemMap.get(item.parentId);
              if (newParentId) {
                await tx.insert(quoteItems).values({
                  tenantId: originalQuote.tenantId,
                  quoteId: newQuote.id,
                  parentId: newParentId,
                  roomId: item.roomId ? roomMap.get(item.roomId) : null,
                  roomName: item.roomName,
                  category: item.category,
                  productId: item.productId,
                  productName: item.productName,
                  productSku: item.productSku,
                  unit: item.unit,
                  unitPrice: item.unitPrice,
                  quantity: item.quantity,
                  width: item.width,
                  height: item.height,
                  foldRatio: item.foldRatio,
                  processFee: item.processFee,
                  subtotal: item.subtotal,
                  attributes: item.attributes,
                  calculationParams: item.calculationParams,
                  remark: item.remark,
                  sortOrder: item.sortOrder,
                  createdAt: new Date(),
                });
              }
            }
          }
        }
      }

      return newQuote;
    });
  }
}
```

### 2. 激活版本 (Set Active Version)

#### 业务逻辑

1. 查询目标版本
2. 在同一事务中:
   - 查询当前ACTIVE版本
   - 降级当前ACTIVE版本
   - 激活目标版本
3. 返回目标版本

#### 实现代码

```typescript
// src/services/quote.service.ts

export class QuoteService {
  /**
   * 激活版本
   * @param quoteId 目标版本ID
   * @returns 激活的版本
   */
  static async setActiveVersion(quoteId: string) {
    return await db.transaction(async (tx) => {
      // 步骤1: 查询目标版本
      const targetQuote = await tx.query.quotes.findFirst({
        where: eq(quotes.id, quoteId),
      });

      if (!targetQuote) {
        throw new Error('Quote not found');
      }

      // 步骤2: 查询当前ACTIVE版本(同一quoteNo链)
      const currentActive = await tx.query.quotes.findFirst({
        where: and(
          eq(quotes.quoteNo, targetQuote.quoteNo),
          eq(quotes.isActive, true)
        ),
      });

      // 步骤3: 降级当前ACTIVE版本
      if (currentActive && currentActive.id !== quoteId) {
        await tx.update(quotes)
          .set({ 
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(quotes.id, currentActive.id));
      }

      // 步骤4: 激活目标版本
      const [updatedQuote] = await tx.update(quotes)
        .set({ 
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, quoteId))
        .returning();

      return updatedQuote;
    });
  }
}
```

### 3. 归档版本 (Archive Version)

#### 业务逻辑

1. 查询目标版本
2. 设置状态为 `ARCHIVED`
3. 如果是ACTIVE版本,自动降级

#### 实现代码

```typescript
// src/services/quote.service.ts

export class QuoteService {
  /**
   * 归档版本
   * @param quoteId 目标版本ID
   * @returns 归档的版本
   */
  static async archiveVersion(quoteId: string) {
    return await db.transaction(async (tx) => {
      // 步骤1: 查询目标版本
      const targetQuote = await tx.query.quotes.findFirst({
        where: eq(quotes.id, quoteId),
      });

      if (!targetQuote) {
        throw new Error('Quote not found');
      }

      // 步骤2: 如果是ACTIVE版本,需要先降级
      if (targetQuote.isActive) {
        // 查找最新版本作为新的ACTIVE版本
        const latestVersion = await tx.query.quotes.findFirst({
          where: and(
            eq(quotes.quoteNo, targetQuote.quoteNo),
            eq(quotes.id, quoteId) // 排除当前版本
          ),
          orderBy: [desc(quotes.version)],
        });

        if (latestVersion) {
          await tx.update(quotes)
            .set({ 
              isActive: true,
              updatedAt: new Date(),
            })
            .where(eq(quotes.id, latestVersion.id));
        }
      }

      // 步骤3: 归档目标版本
      const [archivedQuote] = await tx.update(quotes)
        .set({ 
          status: 'ARCHIVED',
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, quoteId))
        .returning();

      return archivedQuote;
    });
  }
}
```

### 4. 查询版本历史 (Get Version History)

#### 业务逻辑

1. 查询同一 `quoteNo` 链的所有版本
2. 按版本号降序排列
3. 返回版本列表

#### 实现代码

```typescript
// src/services/quote.service.ts

export class QuoteService {
  /**
   * 查询版本历史
   * @param quoteNo 报价单号
   * @returns 版本列表
   */
  static async getVersionHistory(quoteNo: string) {
    const versions = await db.query.quotes.findMany({
      where: eq(quotes.quoteNo, quoteNo),
      orderBy: [desc(quotes.version)],
    });

    return versions;
  }

  /**
   * 查询版本链
   * @param quoteId 起始版本ID
   * @returns 版本链
   */
  static async getVersionChain(quoteId: string) {
    const chain: any[] = [];
    let currentId = quoteId;

    while (currentId) {
      const quote = await db.query.quotes.findFirst({
        where: eq(quotes.id, currentId),
      });

      if (!quote) {
        break;
      }

      chain.unshift(quote);
      currentId = quote.parentQuoteId;
    }

    return chain;
  }
}
```

---

## 🛡️ 编辑防护

### ACTIVE版本编辑防护

```typescript
// src/features/quotes/actions/item-mutations.ts

import { db } from '@/shared/api/db';
import { quotes, quoteItems } from '@/shared/api/schema';
import { eq } from 'drizzle-orm';

export async function updateQuoteItem(itemId: string, data: any) {
  // 步骤1: 查询报价项及其所属报价单
  const item = await db.query.quoteItems.findFirst({
    where: eq(quoteItems.id, itemId),
    with: {
      quote: true,
    }
  });

  if (!item) {
    throw new Error('Quote item not found');
  }

  // 步骤2: 检查是否为ACTIVE版本
  if (item.quote?.isActive) {
    throw new Error('Cannot edit ACTIVE version. Please create a new version first.');
  }

  // 步骤3: 执行更新
  await db.update(quoteItems)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(quoteItems.id, itemId));
}
```

### Server Action验证

```typescript
// src/features/quotes/actions/mutations.ts

import { createSafeAction } from '@/shared/lib/server-action';
import { z } from 'zod';
import { QuoteService } from '@/services/quote.service';

export const updateQuoteAction = createSafeAction(
  z.object({
    quoteId: z.string().uuid(),
    data: z.object({
      title: z.string().optional(),
      notes: z.string().optional(),
    }),
  }),
  async ({ quoteId, data }) => {
    // 检查是否为ACTIVE版本
    const quote = await db.query.quotes.findFirst({
      where: eq(quotes.id, quoteId),
    });

    if (quote?.isActive) {
      return {
        error: 'Cannot edit ACTIVE version. Please create a new version first.',
      };
    }

    // 执行更新
    await db.update(quotes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(quotes.id, quoteId));

    return { success: true };
  }
);
```

---

## 🧪 测试用例

### 单元测试

```typescript
// src/features/quotes/__tests__/version-management.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { QuoteService } from '@/services/quote.service';

describe('Quote Version Management', () => {
  let quoteId: string;

  beforeEach(async () => {
    // 创建测试报价单
    const quote = await createTestQuote();
    quoteId = quote.id;
  });

  describe('createNextVersion', () => {
    it('应该创建新版本并递增版本号', async () => {
      const newVersion = await QuoteService.createNextVersion(
        quoteId,
        'user-id',
        'tenant-id'
      );

      expect(newVersion.version).toBe(2);
      expect(newVersion.isActive).toBe(true);
      expect(newVersion.parentQuoteId).toBe(quoteId);
    });

    it('应该降级原版本', async () => {
      await QuoteService.createNextVersion(quoteId, 'user-id', 'tenant-id');

      const originalQuote = await db.query.quotes.findFirst({
        where: eq(quotes.id, quoteId),
      });

      expect(originalQuote?.isActive).toBe(false);
    });

    it('应该深度克隆items和rooms', async () => {
      // 添加测试数据
      await addTestItems(quoteId);
      await addTestRooms(quoteId);

      const newVersion = await QuoteService.createNextVersion(
        quoteId,
        'user-id',
        'tenant-id'
      );

      const newItems = await db.query.quoteItems.findMany({
        where: eq(quoteItems.quoteId, newVersion.id),
      });

      const newRooms = await db.query.quoteRooms.findMany({
        where: eq(quoteRooms.quoteId, newVersion.id),
      });

      expect(newItems.length).toBeGreaterThan(0);
      expect(newRooms.length).toBeGreaterThan(0);
    });
  });

  describe('setActiveVersion', () => {
    it('应该激活目标版本并降级原ACTIVE版本', async () => {
      // 创建两个版本
      const v2 = await QuoteService.createNextVersion(quoteId, 'user-id', 'tenant-id');
      const v3 = await QuoteService.createNextVersion(v2.id, 'user-id', 'tenant-id');

      // 激活v2
      const activated = await QuoteService.setActiveVersion(v2.id);

      expect(activated.isActive).toBe(true);

      const v3After = await db.query.quotes.findFirst({
        where: eq(quotes.id, v3.id),
      });

      expect(v3After?.isActive).toBe(false);
    });
  });

  describe('archiveVersion', () => {
    it('应该归档版本', async () => {
      const archived = await QuoteService.archiveVersion(quoteId);

      expect(archived.status).toBe('ARCHIVED');
      expect(archived.isActive).toBe(false);
    });

    it('归档ACTIVE版本时应自动降级', async () => {
      const v2 = await QuoteService.createNextVersion(quoteId, 'user-id', 'tenant-id');

      const archived = await QuoteService.archiveVersion(v2.id);

      expect(archived.status).toBe('ARCHIVED');
      expect(archived.isActive).toBe(false);

      const v1After = await db.query.quotes.findFirst({
        where: eq(quotes.id, quoteId),
      });

      expect(v1After?.isActive).toBe(true);
    });
  });

  describe('edit protection', () => {
    it('应该阻止编辑ACTIVE版本', async () => {
      await expect(
        updateQuoteItem('item-id', { productName: 'New Name' })
      ).rejects.toThrow('Cannot edit ACTIVE version');
    });

    it('应该允许编辑非ACTIVE版本', async () => {
      const v2 = await QuoteService.createNextVersion(quoteId, 'user-id', 'tenant-id');

      await expect(
        updateQuoteItem('item-id', { productName: 'New Name' })
      ).resolves.not.toThrow();
    });
  });
});
```

### 集成测试

```typescript
// e2e/flows/quote-version-lifecycle.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Quote Version Lifecycle', () => {
  test('完整版本管理流程', async ({ page }) => {
    // 步骤1: 创建报价单
    await page.goto('/quotes/new');
    await page.fill('[name="customerName"]', 'Test Customer');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/quotes\/[a-f0-9-]+/);

    // 步骤2: 添加报价项
    await page.click('button:has-text("Add Item")');
    await page.fill('[name="productName"]', 'Test Product');
    await page.fill('[name="quantity"]', '10');
    await page.click('button:has-text("Save")');

    // 步骤3: 创建新版本
    await page.click('button:has-text("Create Version")');
    await expect(page.locator('text="Version 2"')).toBeVisible();

    // 步骤4: 验证原版本不可编辑
    await page.click('button:has-text("Version 1")');
    await expect(page.locator('button:has-text("Add Item")')).toBeDisabled();

    // 步骤5: 切换到版本2
    await page.click('button:has-text("Version 2")');
    await expect(page.locator('button:has-text("Add Item")')).toBeEnabled();

    // 步骤6: 归档版本1
    await page.click('button:has-text("Version 1")');
    await page.click('button:has-text("Archive")');
    await expect(page.locator('text="ARCHIVED"')).toBeVisible();
  });
});
```

---

## ✅ 验收标准

### 功能验收

- [ ] 同一 `quoteNo` 链中只能有一个 `isActive=true` 的版本
- [ ] 版本号正确递增
- [ ] 创建新版本时深度克隆所有数据
- [ ] ACTIVE版本不可编辑
- [ ] 版本切换流畅,自动降级原ACTIVE版本
- [ ] 归档功能正常工作

### 性能验收

- [ ] 创建新版本响应时间<2s
- [ ] 版本切换响应时间<500ms
- [ ] 查询版本历史响应时间<300ms

### 数据一致性验收

- [ ] 事务保证原子性
- [ ] 并发场景下数据一致性
- [ ] 版本链结构正确

---

## 🔗 相关文档

- [数据库迁移计划](./database-migration-plan.md)
- [报价模块需求文档](../02-requirements/modules/报价单/报价单.md)

---

**最后更新**: 2026-01-16  
**维护者**: 开发团队
